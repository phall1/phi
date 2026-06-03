# Finder

Finder is the package's "go find shit out" workflow: launch a background research child, keep the parent session clean, and come back later with status/resume.

## Essence

A good finder run is not normal chat. It is a bounded evidence loop with hunter energy:

1. turn the question into a narrow research contract;
2. expand the target into aliases, old names, package scopes, maintainers, domains, file names, commands, error strings, screenshots, and time windows;
3. launch async work through `pi-subagents`;
4. prefer primary sources over commentary;
5. chase references backward and forward through docs, repos, package metadata, commits, issues, examples, and backlinks;
6. label public facts, inference, and unknown/private gaps;
7. record negative evidence when absence matters;
8. return a run id immediately so the human can keep working;
9. summarize only after evidence exists.

The trick is to make the thing appear without lying. Finder should be maximally resourceful and maximally honest: "not publicly found after searching X/Y/Z" beats a confident hallucination.

## Commands

```text
/finder <question>                 # balanced default
/finder deep <question>            # deeper source sweep and dead ends
/finder local <question>           # repo scout + external research
/finder needle <question>          # alias chasing + hard negative evidence
/finder-deep <question>            # explicit alias
/finder-local <question>           # explicit alias
/finder-needle <question>          # explicit alias
```

The commands do not implement a second agent runtime. They inject a follow-up prompt asking the parent Pi agent to launch the actual async subagent run with `pi-subagents`. That keeps orchestration in Pi's normal session/status/resume model.

## Why not Flue here?

Flue is a real TypeScript agent harness framework. It is useful if we want a standalone headless workflow service. This repo is a Pi package, so the native fit is:

- Pi package resources for commands, prompts, skills, tools, and themes;
- `pi-subagents` for actual child sessions, background runs, chains, and resume/status;
- an eventual package convention for `agents/` and `chains/` once `pi-subagents` supports discovering them from installed Pi packages.

Until then, packaged Finder is intentionally a thin Pi-native command/prompt layer over `pi-subagents`.

## Needle protocol

Use needle mode when a normal search is likely to fail.

1. Frame the exact object sought and likely alternate names.
2. Search source-of-truth indexes first: official docs, GitHub/GitLab, npm/PyPI/crates/Homebrew, package manifests, docs sites, changelogs, issues/PRs, code search, and release notes.
3. Chase adjacent handles: maintainers, orgs, domains, import names, CLI commands, config keys, screenshots, talks, examples, and error strings.
4. Triangulate claims and mark confidence.
5. Preserve negative evidence: where searched and what was not found.
6. Return next handles: exact queries, URLs, package names, repo paths, issue IDs, files, or commands.
