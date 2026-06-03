import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type FinderMode = "balanced" | "deep" | "local" | "needle";

type ParsedFinderArgs = {
	mode: FinderMode;
	query: string;
};

const MODE_ALIASES: Record<string, FinderMode> = {
	"--deep": "deep",
	deep: "deep",
	"--local": "local",
	local: "local",
	"--repo": "local",
	repo: "local",
	"--balanced": "balanced",
	balanced: "balanced",
	"--needle": "needle",
	needle: "needle",
	"--hunt": "needle",
	hunt: "needle",
};

function parseFinderArgs(args: string): ParsedFinderArgs | null {
	const parts = args.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return null;

	let mode: FinderMode = "balanced";
	const first = parts[0]?.toLowerCase();
	if (first && MODE_ALIASES[first]) {
		mode = MODE_ALIASES[first];
		parts.shift();
	}

	const query = parts.join(" ").trim();
	return query ? { mode, query } : null;
}

function finderKickoffPrompt({ mode, query }: ParsedFinderArgs): string {
	const modeContract = {
		balanced: "Run one focused async external research pass. Prefer `oh-my-pi.finder` if available; otherwise use builtin `researcher`.",
		deep: "Run a deeper async research pass. Prefer `oh-my-pi.finder`; use multiple searches/sources, primary-source verification, and explicit dead ends.",
		local: "Run mixed local+external async research. Use parallel `scout` for this repo and `researcher`/`oh-my-pi.finder` for external evidence, then synthesize.",
		needle: "Run the needle-in-a-haystack protocol: expand aliases and likely names, search primary indexes, inspect source/code/package metadata, chase references backward and forward, record negative evidence, and stop only when the best public answer or hard unknown boundary is established.",
	}[mode];

	return `Kick off a Finder run for this question:\n\n${query}\n\n${modeContract}\n\nUse pi-subagents if available and launch asynchronously. Return immediately after launch with the async run id and exactly how to check status/resume. Do not answer from vibes in this parent turn unless the answer is already trivial.\n\nFinder output contract for the child:\n1. Short answer\n2. Evidence table: claim | source | confidence\n3. Public vs inferred vs unknown/not found\n4. Practical implications / next rabbit holes\n5. Sources\n\nResearch rules:\n- Prefer primary sources: official docs, repositories, code search, release notes, company posts, standards, package metadata, issues/PRs.\n- Search by aliases, old names, package scopes, orgs, authors, commit messages, docs paths, error strings, and quoted phrases when direct search fails.\n- Triangulate important claims from source-of-truth evidence; include negative evidence when something appears not public.\n- Label inference as inference.\n- Say what appears private/not public instead of inventing.\n- Stop when the key question is answered well enough or the public boundary is proven.`;
}

function registerFinderCommand(pi: ExtensionAPI, name: string, mode: FinderMode, description: string) {
	pi.registerCommand(name, {
		description,
		handler: async (args, ctx) => {
			const query = args.trim();
			if (!query) {
				ctx.ui.notify(`Usage: /${name} <question>`, "warning");
				return;
			}

			ctx.ui.notify(`Launching ${mode} finder run...`, "info");
			pi.sendUserMessage(finderKickoffPrompt({ mode, query }), { deliverAs: "followUp" });
		},
	});
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("finder", {
		description: "Kick off async evidence-backed research. Modes: balanced, deep, local, needle.",
		handler: async (args, ctx) => {
			const parsed = parseFinderArgs(args);
			if (!parsed) {
				ctx.ui.notify("Usage: /finder [balanced|deep|local|needle] <question>", "warning");
				return;
			}

			ctx.ui.notify(`Launching ${parsed.mode} finder run...`, "info");
			pi.sendUserMessage(finderKickoffPrompt(parsed), { deliverAs: "followUp" });
		},
	});

	registerFinderCommand(pi, "finder-deep", "deep", "Kick off deeper async evidence-backed research.");
	registerFinderCommand(pi, "finder-local", "local", "Kick off parallel local+external finder research.");
	registerFinderCommand(pi, "finder-needle", "needle", "Kick off needle-in-a-haystack research with alias chasing and negative evidence.");
}
