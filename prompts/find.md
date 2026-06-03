---
description: Kick off an async evidence-backed research/finder subagent
argument-hint: "<question or target>"
---
I want you to act as the parent orchestrator and kick off a focused async finder run for:

$ARGUMENTS

Use pi-subagents if available. Prefer an async `researcher` subagent for external/current-world questions. If the target also involves this repo or local files, run a parallel `scout` alongside the `researcher` and synthesize their outputs. Do not try to answer from vibes in the parent session unless the answer is already obvious and source-free.

Finder contract:
- Produce an evidence-backed brief with links or file paths for every important claim.
- Prefer primary sources: official docs, repos, code search, release notes, company posts, standards, package metadata, issues/PRs.
- Cross-check claims across at least two independent sources when the answer is not directly in primary source code/docs.
- Call out confidence, uncertainty, dead ends, and what is probably private/not public.
- Stop when the key question is answered well enough; do not browse endlessly.
- Save output to a clear artifact when supported, and return the async run id plus how I can check status/resume.

Suggested shape:
- `subagent({ agent: "researcher", async: true, context: "fresh", task: "..." })`
- For mixed local+external work, use top-level parallel researcher/scout tasks.

When the run completes, summarize:
1. short answer
2. evidence table
3. what is public vs inferred vs unknown
4. practical implications / next rabbit holes
5. sources
