---
name: phux
description: Use phux persistent terminals from Pi. Prefer this skill when work should survive across turns, be inspectable with structured snapshots, or be shared with a human tmux-style attach.
---

# phux persistent terminal workflow

Use phux when terminal state matters. Normal `bash` is still right for quick one-shot commands. phux is for persistent panes that can be snapshotted, waited on, driven interactively, and shared with a human.

## Default loop

1. Discover sessions with `phux_ls`.
2. Create a named session with `phux_new` if needed.
3. Inspect before acting with `phux_snapshot`.
4. Use `phux_run` for shell commands where exit code/output matter.
5. Use `phux_send_keys` for REPLs, TUIs, dev servers, prompts, and interactive programs.
6. Use `phux_wait` after sending input; do not sleep blindly.
7. Snapshot again to inspect final state.

## Tool choice

- Use `phux_run` instead of `bash` when the command should execute inside a persistent terminal or leave state visible for human attach.
- Use `phux_send_keys` when driving an already-running interactive process.
- Use `phux_wait` with output-specific text; broad patterns may match shell echo too early.
- Use `phux_snapshot --scrollback` when diagnosing failures after lots of output.

## Example

```text
phux_new({ name: "build" })
phux_run({ target: "build", command: "cargo test", timeoutSecs: 120 })
phux_snapshot({ target: "build", scrollback: 200 })
```

## Co-presence rule

Assume a human may attach to the same session. Avoid destructive input unless asked. Prefer named sessions and explain what you are doing before taking over an existing pane.
