import {
	CustomEditor,
	type ExtensionAPI,
	type ExtensionContext,
	type KeybindingsManager,
} from "@earendil-works/pi-coding-agent";
import type { Component, EditorTheme, TUI } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

class EmptyFooter implements Component {
	render(): string[] {
		return [];
	}

	invalidate(): void {}
}

function fitBorder(
	left: string,
	right: string,
	width: number,
	border: (text: string) => string,
	fill: (text: string) => string = border,
): string {
	if (width <= 0) return "";
	if (width === 1) return border("─");

	let leftText = left;
	let rightText = right;
	const fixedWidth = 2;
	const minimumGap = 3;

	while (
		fixedWidth + visibleWidth(leftText) + visibleWidth(rightText) + minimumGap > width &&
		visibleWidth(rightText) > 0
	) {
		rightText = truncateToWidth(rightText, Math.max(0, visibleWidth(rightText) - 1), "");
	}
	while (
		fixedWidth + visibleWidth(leftText) + visibleWidth(rightText) + minimumGap > width &&
		visibleWidth(leftText) > 0
	) {
		leftText = truncateToWidth(leftText, Math.max(0, visibleWidth(leftText) - 1), "");
	}

	const gapWidth = Math.max(0, width - fixedWidth - visibleWidth(leftText) - visibleWidth(rightText));
	return `${border("─")}${leftText}${fill("─".repeat(gapWidth))}${rightText}${border("─")}`;
}

function formatCwd(cwd: string): string {
	const home = process.env.HOME;
	if (home && cwd.startsWith(home)) return `~${cwd.slice(home.length)}`;
	return cwd;
}

function formatContext(ctx: ExtensionContext): string {
	const usage = ctx.getContextUsage();
	const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow;
	if (!contextWindow || !usage || usage.percent === null) return "ctx ?";
	return `ctx ${Math.round(usage.percent)}%/${Math.round(contextWindow / 1000)}k`;
}

function formatModel(ctx: ExtensionContext): string {
	if (!ctx.model) return "no model";
	return `${ctx.model.provider}/${ctx.model.id}`;
}

export default function (pi: ExtensionAPI) {
	let zenEnabled = true;
	let isWorking = false;
	let spinnerIndex = 0;
	let spinnerTimer: ReturnType<typeof setInterval> | undefined;
	let activeTui: TUI | undefined;
	let activeCtx: ExtensionContext | undefined;
	let branch: string | undefined;

	const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

	const stopSpinner = () => {
		if (spinnerTimer) clearInterval(spinnerTimer);
		spinnerTimer = undefined;
	};

	const refreshBranch = async (ctx: ExtensionContext) => {
		const result = await pi.exec("git", ["branch", "--show-current"], { cwd: ctx.cwd }).catch(() => undefined);
		const stdout = result?.stdout.trim();
		branch = stdout && stdout.length > 0 ? stdout : undefined;
		activeTui?.requestRender();
	};

	const installZenUi = (ctx: ExtensionContext) => {
		activeCtx = ctx;
		ctx.ui.setWorkingVisible(false);
		ctx.ui.setFooter(() => new EmptyFooter());
		void refreshBranch(ctx);

		class ZenShellEditor extends CustomEditor {
			constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager) {
				super(tui, theme, keybindings, { paddingX: 0 });
				activeTui = tui;
			}

			render(width: number): string[] {
				const lines = super.render(width);
				if (lines.length < 2) return lines;

				const thm = ctx.ui.theme;
				const thinking = pi.getThinkingLevel();
				const topLeft = isWorking ? thm.fg("accent", ` ${spinnerFrames[spinnerIndex]} working `) : thm.fg("dim", " oh-my-pi ");
				const topRight = thm.fg("muted", ` ${formatCwd(ctx.cwd)}${branch ? ` (${branch})` : ""} `);
				const bottomLeft = thm.fg("muted", ` ${formatModel(ctx)} · ${thinking} `);
				const bottomRight = thm.fg("muted", ` ${formatContext(ctx)} `);
				const borderColor = (text: string) => this.borderColor(text);

				lines[0] = fitBorder(topLeft, topRight, width, borderColor);
				lines[lines.length - 1] = fitBorder(bottomLeft, bottomRight, width, borderColor);
				return lines;
			}
		}

		ctx.ui.setEditorComponent((tui, theme, keybindings) => new ZenShellEditor(tui, theme, keybindings));
	};

	const uninstallZenUi = (ctx: ExtensionContext) => {
		ctx.ui.setWorkingVisible(true);
		ctx.ui.setFooter(undefined);
		ctx.ui.setEditorComponent(undefined);
	};

	pi.on("session_start", (_event, ctx) => {
		if (zenEnabled) installZenUi(ctx);
	});

	pi.on("agent_start", () => {
		isWorking = true;
		stopSpinner();
		spinnerTimer = setInterval(() => {
			spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
			activeTui?.requestRender();
		}, 80);
		activeTui?.requestRender();
	});

	pi.on("agent_end", () => {
		isWorking = false;
		stopSpinner();
		activeTui?.requestRender();
	});

	pi.on("session_shutdown", () => {
		stopSpinner();
		activeTui = undefined;
		activeCtx = undefined;
	});

	pi.on("model_select", () => activeTui?.requestRender());
	pi.on("thinking_level_select", () => activeTui?.requestRender());

	pi.registerCommand("zen", {
		description: "Toggle the oh-my-pi compact shell UI.",
		handler: async (args, ctx) => {
			const mode = args.trim().toLowerCase();
			zenEnabled = mode === "on" ? true : mode === "off" ? false : !zenEnabled;
			if (zenEnabled) installZenUi(ctx);
			else uninstallZenUi(ctx);
			ctx.ui.notify(`oh-my-pi zen ${zenEnabled ? "on" : "off"}`, "info");
		},
	});

	pi.registerShortcut("ctrl+shift+z", {
		description: "Toggle oh-my-pi zen UI",
		handler: async (ctx) => {
			zenEnabled = !zenEnabled;
			if (zenEnabled) installZenUi(ctx);
			else uninstallZenUi(ctx);
			ctx.ui.notify(`oh-my-pi zen ${zenEnabled ? "on" : "off"}`, "info");
		},
	});
}
