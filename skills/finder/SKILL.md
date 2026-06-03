---
name: finder
description: Launch relentless, evidence-backed research runs with pi-subagents. Use when the user wants to "find shit out", locate needles in haystacks, investigate companies/repos/tools/people/APIs, answer scattered landscape questions, or kick off background research they can check/resume later.
---

# Finder workflow

Finder is the person you ask when you need the thing to magically appear. The magic is not vibes; it is disciplined search, source chasing, provenance, and refusal to confuse "not found yet" with "not real".

Use this skill when the user wants a background-capable research/fact-finding agent rather than normal chat exploration.

## Core posture

- Be relentless, not noisy.
- Expand the search space before concluding.
- Prefer primary evidence over summaries.
- Treat absence as a claim that needs evidence.
- Preserve provenance so the answer can be audited.
- Give the user the answer, the confidence, the gaps, and the next handle to pull.

## Default orchestration

1. Treat the parent session as the orchestrator, not the researcher.
2. Prefer `pi-subagents` with `async: true` so the user can keep chatting and later inspect/resume the run.
3. Prefer `oh-my-pi.finder` when available; otherwise use builtin `researcher` for external/current-world questions.
4. If the question depends on this repo or local files, run a `scout` in parallel with the researcher/finder and synthesize both results.
5. Pick the smallest mode that can win:
   - **balanced**: normal focused research.
   - **deep**: more sources, stronger cross-checking, dead-end tracking.
   - **local**: local repo + external evidence.
   - **needle**: alias chasing, source/code/package index spelunking, negative evidence, and hard-boundary proof.

## Needle protocol

Use this for "find the impossible thing" questions.

1. **Frame the target**: restate the exact object sought, likely synonyms, adjacent concepts, old names, misspellings, org/package scopes, authors, domains, and time window.
2. **Map the indexes**: search official sites, GitHub/GitLab, npm/PyPI/crates/Homebrew, docs, changelogs, issues/PRs, code search, release notes, blogs, standards, Discord/forum archives when accessible, and search-engine cached snippets where relevant.
3. **Chase references**: follow imports, package metadata, README links, maintainers, commit messages, issue backlinks, docs nav, examples, talks, screenshots, and error strings.
4. **Triangulate**: require source-of-truth evidence for important claims; use two independent sources when primary evidence is indirect.
5. **Record negative evidence**: say where searched and what was not found when the absence matters.
6. **Draw the boundary**: distinguish public fact, strong inference, weak inference, and likely-private/unknown.
7. **Return handles**: give exact URLs, file paths, search queries, package names, orgs, people, or next commands to continue.

## Research contract

Ask the child for:

- short answer up top
- evidence table: `claim | source | confidence | notes`
- primary sources first: official docs, source repos, code search, release notes, company posts, package metadata, issues/PRs, standards
- explicit labels for `public`, `inferred`, and `unknown/not found`
- confidence level and known gaps
- dead ends searched when they matter
- practical implications and suggested next rabbit holes
- reproducible search handles: queries, repo paths, package names, commit/issue IDs, commands, or local file paths

## Stop rules

- Stop when the key question is answered with enough primary evidence.
- Stop when a public/private boundary has been established and further search is unlikely to change the answer.
- Do not keep searching just because more commentary exists.
- Do not present private implementation details as fact unless there is public evidence.
- If sources conflict, report the conflict and confidence rather than flattening it.

## Useful launch shapes

Single external research run:

```ts
subagent({
  agent: "oh-my-pi.finder",
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
    { agent: "oh-my-pi.finder", task: "External evidence for: <question>" },
    { agent: "scout", task: "Local repo evidence and relevant files for: <question>" }
  ],
  concurrency: 2
})
```

Needle-in-a-haystack run:

```ts
subagent({
  agent: "oh-my-pi.finder",
  async: true,
  context: "fresh",
  task: "Run the needle protocol for: <question>. Expand aliases, chase package/source/docs indexes, record negative evidence, and return public/inferred/unknown boundaries."
})
```

Follow up later with `subagent({ action: "status", id: "<run-id>" })` or resume with `subagent({ action: "resume", id: "<run-id>", message: "<follow-up>" })`.
