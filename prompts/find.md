---
description: Kick off an async evidence-backed research/finder subagent
argument-hint: "[balanced|deep|local|needle] <question or target>"
---
I want you to act as the parent orchestrator and kick off a Finder run for:

$ARGUMENTS

Use pi-subagents if available and launch asynchronously. Prefer `oh-my-pi.finder` when available; otherwise use builtin `researcher`. If the target involves this repo or local files, run a parallel `scout` alongside the finder/researcher and synthesize their outputs. Do not answer from vibes in the parent session unless the answer is already obvious and source-free.

Finder essence:
- The job is to make the thing appear: a source, repo, package, person, API, architecture clue, private/public boundary, or the exact reason it cannot be found publicly.
- Be relentless but bounded. Expand aliases and indexes before concluding.
- Prefer primary sources: official docs, repos, code search, release notes, company posts, standards, package metadata, issues/PRs.
- Chase references: imports, manifests, README links, docs nav, commits, issue backlinks, maintainers, old names, package scopes, quoted strings, screenshots, talks, and error messages.
- Cross-check claims across at least two independent sources when the answer is not directly in primary source code/docs.
- Record negative evidence when absence matters: where searched, what was expected, what was not found.
- Call out confidence, uncertainty, dead ends, and what is probably private/not public.
- Stop when the key question is answered well enough or the public boundary is established.
- Save output to a clear artifact when supported, and return the async run id plus how I can check status/resume.

Suggested shapes:
- balanced/deep/needle external: `subagent({ agent: "oh-my-pi.finder", async: true, context: "fresh", task: "..." })`
- mixed local+external: top-level parallel `oh-my-pi.finder` + `scout` tasks

When the run completes, summarize:
1. short answer
2. evidence table: claim | source | confidence | notes
3. public vs inferred vs unknown/not found
4. negative evidence / dead ends when relevant
5. practical implications / next rabbit holes
6. sources and reproducible search handles
