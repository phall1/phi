# oh-my-pi

Personal Pi package for ergonomic frontend experiments.

## What exists in Pi land

Useful public packages found on npm/gallery keywords:

- `osdy-pi` — themes, header, custom editor. Closest to frontend polish.
- `@tungthedev/pi-extensions` — broad bundle: editor, web, workspace, modes, extension manager.
- `pi-resource-center` — browses packages/resources from inside Pi.
- `pi-cmux` — terminal integration package.
- `pi-skillful`, `pi-subagentura`, `@cryptolibertus/pi-peer`, `@demigodmode/pi-web-agent` — capability/workflow packages rather than frontend shells.

Pi package discovery is still young. The platform is designed for exactly this: small packages that bundle `extensions/`, `themes/`, `prompts/`, and `skills/`.

## Current package contents

- `extensions/zen-shell.ts` — compact Pi UI shell:
  - hides the default footer
  - hides the inline working indicator
  - renders model/thinking/context/cwd/git branch into the editor border
  - adds `/zen [on|off]`
  - adds `ctrl+shift+z` toggle
- `themes/oh-my-pi-dark.json` — first-pass dark theme.

## Try it without installing

```sh
cd ../oh-my-pi
pi --extension ./extensions/zen-shell.ts --theme ./themes/oh-my-pi-dark.json
```

## Install as a local Pi package

```sh
pi install ./
```

Then select `oh-my-pi-dark` in `/settings`, or set:

```json
{
  "theme": "oh-my-pi-dark"
}
```

## Direction

There are two layers to build.

### Layer 1: Pi-native package

This works inside Pi's built-in interactive TUI:

- custom editor chrome
- custom footer/header/status
- custom message/tool renderers
- overlays and command palette
- cleaner tool output rendering
- model/thinking/session indicators
- prompt/theme/skill bundles

This package starts here.

### Layer 2: Separate frontend

The full ask — alternate-screen app, internal scrollback, mouse scroll, message virtualization, composer pinned hard to bottom — should be a separate frontend using either:

- `pi --mode rpc` JSONL subprocess protocol, or
- `@earendil-works/pi-coding-agent` SDK directly.

Extensions can polish Pi's own TUI. A separate frontend can own terminal behavior completely.
