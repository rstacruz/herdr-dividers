import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { formatName } from './label.ts';

export const SOURCE = 'rstacruz.dividers';

export function herdrBin(env = process.env) {
  return env.HERDR_BIN_PATH || 'herdr';
}

// Plugin commands run with the user's PATH (reference plugin's proven bun-only
// pattern). A stray `node bin/…` invocation fails loudly instead of
// misbehaving: node has no `Bun`, so the guard exits with a clear message.
export function requireBun(): void {
  if (typeof globalThis.Bun === 'undefined') {
    process.stderr.write(`${SOURCE}: this plugin requires bun (https://bun.sh); run via 'bun bin/…' or install bun\n`);
    process.exit(1);
  }
}

function cli(args: string[], { env = process.env }: { env?: NodeJS.ProcessEnv } = {}) {
  const res = spawnSync(herdrBin(env), args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  });
  const status = res.status ?? 1;
  if (status !== 0) {
    return { ok: false, stdout: res.stdout ?? '', error: (res.stderr || res.stdout || '').trim() };
  }
  return { ok: true, stdout: res.stdout ?? '', error: null };
}

// Divider = workspace: `--no-focus` keeps the user's place, `--cwd $HOME`
// gives the implicit pane an inert home (same as the old herdr-create-group
// hack; no command param exists). herdr appends at the end; the user drags
// it into place with the sidebar mouse drag (persisted by herdr).
export function createWorkspace(name: string, { env }: { env?: NodeJS.ProcessEnv } = {}) {
  const args = ['workspace', 'create', '--no-focus', '--cwd', homedir(), '--label', formatName(name)];
  return cli(args, { env });
}

export function renameWorkspace(workspaceId: string, name: string, { env }: { env?: NodeJS.ProcessEnv } = {}) {
  const args = ['workspace', 'rename', workspaceId, formatName(name)];
  return cli(args, { env });
}

// Label of a workspace, or null when it can't be determined (herdr error,
// unknown id, unparsable output). `herdr workspace list` returns a JSON
// envelope: { id, result: { type: "workspace_list", workspaces: […] } }.
export function workspaceLabel(workspaceId: string, { env }: { env?: NodeJS.ProcessEnv } = {}) {
  const res = cli(['workspace', 'list'], { env });
  if (!res.ok) return null;
  try {
    const data = JSON.parse(res.stdout) as {
      result?: { workspaces?: { workspace_id: string; label: string }[] };
    };
    return data?.result?.workspaces?.find((w) => w.workspace_id === workspaceId)?.label ?? null;
  } catch {
    return null;
  }
}

// Omitting --placement lets the manifest's own placement apply, which matters
// for popup: the CLI's accepted values lag the manifest's and reject it.
export function openPluginPane(
  entrypoint: string,
  { envVars, env }: { envVars?: Record<string, string>; env?: NodeJS.ProcessEnv } = {},
) {
  const args = ['plugin', 'pane', 'open', '--plugin', SOURCE, '--entrypoint', entrypoint, '--focus'];
  for (const [key, value] of Object.entries(envVars ?? {})) args.push('--env', `${key}=${value}`);
  return cli(args, { env });
}

// The focused workspace id: herdr sets HERDR_WORKSPACE_ID for workspace-context
// actions, with HERDR_PLUGIN_CONTEXT_JSON as the fallback contract.
export function focusedWorkspaceId(env = process.env): string {
  const direct = env.HERDR_WORKSPACE_ID;
  if (direct) return direct;
  try {
    const ctx = JSON.parse(env.HERDR_PLUGIN_CONTEXT_JSON ?? '{}') as {
      workspace?: { workspace_id?: string };
    };
    return ctx?.workspace?.workspace_id ?? '';
  } catch {
    return '';
  }
}
