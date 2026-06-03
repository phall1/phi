---
name: finder
description: Launch focused, evidence-backed research runs with pi-subagents. Use when the user wants to "find shit out", investigate companies/repos/tools, answer scattered landscape questions, or kick off background research they can check/resume later.
---

# Finder workflow

Use this skill when the user wants a background-capable research/fact-finding agent rather than normal chat exploration.

## Default behavior

1. Treat the parent session as the orchestrator, not the researcher.
2. Prefer `pi-subagents` with `async: true` so the user can keep chatting and later inspect/resume the run.
3. Use the builtin `researcher` agent for external/current-world questions.
4. If the question also depends on the current repo, run a `scout` in parallel with the `researcher` and synthesize both results.
5. Keep tasks narrow enough that the child can finish with evidence instead of wandering.

## Research contract

Ask the child for:

- a short answer up top
- cited evidence for every material claim
- primary sources first: official docs, source repos, code search, release notes, company posts, package metadata, issues/PRs, standards
- explicit labels for `public`, `inferred`, and `unknown/not found`
- confidence level and known gaps
- dead ends searched when they matter
- practical implications and suggested next rabbit holes

## Stop rules

- Stop when the key question is answered with enough primary evidence.
- Do not keep searching just because more commentary exists.
- Do not present private implementation details as fact unless there is public evidence.
- If sources conflict, report the conflict and confidence rather than flattening it.

## Useful launch shapes

Single external research run:

```ts
subagent({
  agent: "researcher",
  async: true,
  context: "fresh",
  task: "Research this question with primary sources, confidence, gaps, and links: <question>"
})
```

Mixed repo + web run:

```ts
subagent({
  async: true,
  context: "fresh",
  tasks: [
    { agent: "researcher", task: "External evidence for: <question>" },
    { agent: "scout", task: "Local repo evidence and relevant files for: <question>" }
  ],
  concurrency: 2
})
```

Follow up later with `subagent({ action: "status", id: "<run-id>" })` or resume with `subagent({ action: "resume", id: "<run-id>", message: "<follow-up>" })`.
