import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type ExecResult = {
	stdout: string;
	stderr: string;
	code: number | null;
	killed?: boolean;
};

function jsonText(value: unknown): string {
	return JSON.stringify(value, null, 2);
}

function textResult(text: string, details: Record<string, unknown> = {}) {
	return {
		content: [{ type: "text" as const, text }],
		details,
	};
}

function parseJson(stdout: string): unknown {
	const trimmed = stdout.trim();
	if (!trimmed) return null;
	return JSON.parse(trimmed);
}

function socketArgs(socket?: string): string[] {
	return socket ? ["--socket", socket] : [];
}

async function runPhux(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	args: string[],
	signal?: AbortSignal,
	timeout = 600_000,
): Promise<ExecResult> {
	return pi.exec("phux", args, { cwd: ctx.cwd, signal, timeout });
}

function resultFromExec(result: ExecResult, command: string[], preferJson = true) {
	const payload = preferJson ? safeParse(result.stdout) : undefined;
	const body = payload !== undefined
		? jsonText(payload)
		: result.stdout.trim() || result.stderr.trim() || `(phux exited ${result.code ?? "unknown"})`;

	return {
		content: [{ type: "text" as const, text: body }],
		details: {
			command,
			code: result.code,
			killed: Boolean(result.killed),
			stdout: result.stdout,
			stderr: result.stderr,
			json: payload,
		},
		isError: result.code !== 0,
	};
}

function safeParse(stdout: string): unknown | undefined {
	try {
		return parseJson(stdout);
	} catch {
		return undefined;
	}
}

const Socket = Type.Optional(Type.String({ description: "Override PHUX_SOCKET / default daemon socket." }));
const Target = Type.Optional(Type.String({ description: "phux target selector: '.', '=', session, session:window, session:window.pane, or @pane." }));

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "phux_ls",
		label: "phux ls",
		description: "List running phux sessions as JSON. Use before targeting panes by name/id.",
		promptSnippet: "List persistent phux terminal sessions.",
		promptGuidelines: [
			"Use phux_ls to discover existing persistent terminal sessions before using phux_snapshot, phux_run, phux_send_keys, or phux_wait.",
		],
		parameters: Type.Object({ socket: Socket }),
		async execute(_id, params: { socket?: string }, signal, _onUpdate, ctx) {
			const args = ["ls", "--json", ...socketArgs(params.socket)];
			const result = await runPhux(pi, ctx, args, signal, 30_000);
			return resultFromExec(result, ["phux", ...args]);
		},
	});

	pi.registerTool({
		name: "phux_new",
		label: "phux new",
		description: "Create a named phux session without attaching and return its seed pane id.",
		promptSnippet: "Create a persistent phux session for long-lived shell work.",
		promptGuidelines: [
			"Use phux_new when work should persist across turns or should be shared with a human via phux attach.",
		],
		parameters: Type.Object({
			name: Type.String({ description: "Session name to create. Must be unique." }),
			cwd: Type.Optional(Type.String({ description: "Working directory for the seed pane." })),
			command: Type.Optional(Type.Array(Type.String(), { description: "Optional argv for the seed process. Omit for the default shell." })),
			socket: Socket,
		}),
		async execute(_id, params: { name: string; cwd?: string; command?: string[]; socket?: string }, signal, _onUpdate, ctx) {
			const args = ["new", "--json", "-s", params.name, ...socketArgs(params.socket)];
			if (params.cwd) args.push("-c", params.cwd);
			if (params.command && params.command.length > 0) args.push("--", ...params.command);
			const result = await runPhux(pi, ctx, args, signal, 30_000);
			return resultFromExec(result, ["phux", ...args]);
		},
	});

	pi.registerTool({
		name: "phux_snapshot",
		label: "phux snapshot",
		description: "Read a phux pane without attaching/resizing. Returns viewport, optional scrollback, cursor, and optional cells.",
		promptSnippet: "Snapshot a persistent phux pane as structured JSON.",
		promptGuidelines: [
			"Use phux_snapshot before acting on an existing phux pane, and after phux_wait to inspect final state.",
		],
		parameters: Type.Object({
			target: Target,
			scrollback: Type.Optional(Type.Number({ description: "Absent = viewport only; 0 = all scrollback; N = most recent N rows." })),
			cells: Type.Optional(Type.Boolean({ description: "Include sparse per-cell style/semantic metadata." })),
			socket: Socket,
		}),
		async execute(_id, params: { target?: string; scrollback?: number; cells?: boolean; socket?: string }, signal, _onUpdate, ctx) {
			const args = ["snapshot", ...socketArgs(params.socket), "--json"];
			if (params.scrollback !== undefined) args.push(`--scrollback=${params.scrollback}`);
			if (params.cells) args.push("--cells");
			if (params.target) args.push(params.target);
			const result = await runPhux(pi, ctx, args, signal, 30_000);
			return resultFromExec(result, ["phux", ...args]);
		},
	});

	pi.registerTool({
		name: "phux_send_keys",
		label: "phux send-keys",
		description: "Send literal text or named keys to a phux pane. Use for interactive programs, REPLs, TUIs, and dev servers.",
		promptSnippet: "Send input to a persistent phux pane.",
		promptGuidelines: [
			"Use phux_send_keys for interactive programs in phux panes. Prefer phux_run when you need a shell command's exit code and output.",
		],
		parameters: Type.Object({
			target: Type.String({ description: "Required phux target selector." }),
			keys: Type.Array(Type.String(), { minItems: 1, description: "tmux-shaped keys or literal strings, e.g. ['cargo test', 'Enter'] or ['C-c']." }),
			socket: Socket,
		}),
		async execute(_id, params: { target: string; keys: string[]; socket?: string }, signal, _onUpdate, ctx) {
			const args = ["send-keys", ...socketArgs(params.socket), params.target, ...params.keys];
			const result = await runPhux(pi, ctx, args, signal, 30_000);
			return resultFromExec(result, ["phux", ...args], false);
		},
	});

	pi.registerTool({
		name: "phux_run",
		label: "phux run",
		description: "Run a shell command inside a persistent phux pane and return command, exit_code, output, duration_ms, and truncated.",
		promptSnippet: "Run a shell command in a persistent phux pane and capture output/exit code.",
		promptGuidelines: [
			"Use phux_run instead of bash when the command should run inside an existing persistent terminal session or preserve pane state for human attach.",
			"Use the exit_code field from phux_run; timeout is signaled by phux exit code 125 with no JSON body.",
		],
		parameters: Type.Object({
			target: Type.String({ description: "Required phux target selector." }),
			command: Type.String({ description: "Shell command line to run in the target pane." }),
			timeoutSecs: Type.Optional(Type.Number({ description: "Command timeout in seconds. Default phux behavior when omitted." })),
			socket: Socket,
		}),
		async execute(_id, params: { target: string; command: string; timeoutSecs?: number; socket?: string }, signal, _onUpdate, ctx) {
			const args = ["run", ...socketArgs(params.socket)];
			if (params.timeoutSecs !== undefined) args.push("--timeout", String(params.timeoutSecs));
			args.push("--json", params.target, params.command);
			const timeoutMs = params.timeoutSecs === 0 ? 0 : Math.max(30_000, (params.timeoutSecs ?? 600) * 1000 + 5_000);
			const result = await runPhux(pi, ctx, args, signal, timeoutMs);
			return resultFromExec(result, ["phux", ...args]);
		},
	});

	pi.registerTool({
		name: "phux_wait",
		label: "phux wait",
		description: "Wait for a phux pane condition: visible text or idle screen. Returns final screen JSON when --json succeeds.",
		promptSnippet: "Wait for a persistent phux pane to reach a condition.",
		promptGuidelines: [
			"Use phux_wait instead of sleeps after phux_send_keys or long-running phux activity.",
			"When using until text, match output-only text; shell echoes can satisfy broad patterns too early.",
		],
		parameters: Type.Object({
			target: Target,
			until: Type.Optional(Type.String({ description: "Substring to wait for in visible rows." })),
			idleMs: Type.Optional(Type.Number({ description: "Succeed after the screen is unchanged for this many milliseconds." })),
			timeoutSecs: Type.Optional(Type.Number({ description: "Give up after this many seconds." })),
			socket: Socket,
		}),
		async execute(_id, params: { target?: string; until?: string; idleMs?: number; timeoutSecs?: number; socket?: string }, signal, _onUpdate, ctx) {
			const args = ["wait", ...socketArgs(params.socket), "--json"];
			if (params.until) args.push("--until", params.until);
			if (params.idleMs !== undefined) args.push("--idle", String(params.idleMs));
			if (params.timeoutSecs !== undefined) args.push("--timeout", String(params.timeoutSecs));
			if (params.target) args.push(params.target);
			const timeoutMs = params.timeoutSecs === undefined ? 0 : Math.max(30_000, params.timeoutSecs * 1000 + 5_000);
			const result = await runPhux(pi, ctx, args, signal, timeoutMs);
			return resultFromExec(result, ["phux", ...args]);
		},
	});

	pi.registerCommand("phux", {
		description: "Show the oh-my-pi phux agent-tool cheat sheet.",
		handler: async (_args, ctx) => {
			ctx.ui.notify("Use phux_ls/new/snapshot/run/send_keys/wait tools for persistent terminal work.", "info");
		},
	});
}
