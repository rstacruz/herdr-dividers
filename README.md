# Dividers — a herdr plugin

Sidebar section dividers for the herdr workspace list.

```
▼ work
●  rlab
●  command-centre
━━ projects ━━
●  acme-web
●  acme-api
━━ chores ━━
●  dotfiles
```

Dividers are plain herdr workspaces with a `━━ name ━━` label — no state file,
no startup hook, no persistence code. herdr already persists workspace order
and labels across restarts, and the sidebar mouse drag reorders them for free.

## Requirements

- **herdr ≥ 0.7.4**
- **Bun ≥ 1.0** — must be on PATH; no npm dependencies, no build step

## Install

```bash
herdr plugin install rstacruz/herdr-dividers
```

For development, link the repo instead:

```bash
herdr plugin link ~/Dev/herdr-dividers
herdr plugin action list --plugin rstacruz.dividers
```

Keybinds are config-side (manifests can't ship them) — add to
`~/.config/herdr/config.toml`:

```toml
[[keys.command]]
key = "prefix+d"
type = "plugin_action"
command = "rstacruz.dividers.create"
description = "create divider"

[[keys.command]]
key = "prefix+shift+d"
type = "plugin_action"
command = "rstacruz.dividers.rename"
description = "rename divider"
```

```bash
herdr config check
herdr server reload-config
```

## Usage

- **Create** — focus any workspace, press `prefix+d`. A popup asks for the
  divider name: Enter creates `━━ name ━━` appended at the end of the list
  (focus stays put), Esc cancels, an empty line cancels.
- **Reposition** — drag the divider up or down in the sidebar; herdr persists
  the order across restarts.
- **Rename** — focus a divider, press `prefix+Shift+D`. The popup is prefilled
  with the current name: Enter renames in place (order unchanged), Esc or an
  empty line cancels. Renaming a *non*-divider workspace shows an error and
  changes nothing.
- **Remove** — close it like any workspace (herdr's built-in close workspace).
  There is no plugin state to clean up.

## Scripting (the old `herdr-create-group` alias)

`herdr-create-group <name>` semantics are the `create` action's piped-name
form:

```bash
alias herdr-create-group='herdr plugin action invoke rstacruz.dividers.create --'
echo chores | herdr-create-group
```

Note: herdr 0.8.0 does not forward piped stdin to plugin actions, so the pipe
falls back to the popup — the alias keeps the *interface*, not the
non-interactive path. The popup is the supported way to create dividers.

## Limitations

- Dividers are real workspaces: they take a slot, get a number, appear in
  `prefix+w`/goto pickers, and are focusable. A true between-workspaces line
  needs a herdr change (out of scope).
- Focusing a divider shows an idle shell in `$HOME`; typing `exit` there
  closes the divider (same quirk as the old `herdr-create-group` hack). Use
  the rename/close keybinds instead.
- A workspace someone hand-names `━━ x ━━` is treated as a divider by the
  rename action — worst case is a confused error toast.

## Develop

```bash
bun test
```

No dependencies, so no install step.

## Licence

MIT
