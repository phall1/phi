# Finder

Finder is the package's "go find shit out" workflow: launch a background research child, keep the parent session clean, and come back later with status/resume.

## Essence

A good finder run is not normal chat. It is a bounded evidence loop:

1. turn the question into a narrow research contract;
2. launch async work through `pi-subagents`;
3. prefer primary sources over commentary;
4. label public facts, inference, and unknown/private gaps;
5. return a run id immediately so the human can keep working;
6. summarize only after evidence exists.

## Commands

```text
/finder <question>                 # balanced default
/finder deep <question>            # deeper source sweep and dead ends
/finder local <question>           # repo scout + external research
/finder-deep <question>            # explicit alias
/finder-local <question>           # explicit alias
```

The commands do not implement a second agent runtime. They inject a follow-up prompt asking the parent Pi agent to launch the actual async subagent run with `pi-subagents`. That keeps orchestration in Pi's normal session/status/resume model.

## Why not Flue here?

Flue is a real TypeScript agent harness framework. It is useful if we want a standalone headless workflow service. This repo is a Pi package, so the native fit is:

- Pi package resources for commands, prompts, skills, tools, and themes;
- `pi-subagents` for actual child sessions, background runs, chains, and resume/status;
- an eventual package convention for `agents/` and `chains/` once `pi-subagents` supports discovering them from installed Pi packages.

Until then, packaged Finder is intentionally a thin Pi-native command/prompt layer over `pi-subagents`.
