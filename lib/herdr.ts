import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { formatName } from './label.ts';

export const SOURCE = 'rstacruz.dividers';

export function herdrBin(env = process.env) {
  return env.HERDR_BIN_PATH || 'herdr';
}

// Guard: fail loudly when not run under bun.
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

// --no-focus keeps focus; --cwd $HOME = inert pane home.
export function createWorkspace(name: string, { env }: { env?: NodeJS.ProcessEnv } = {}) {
  const args = ['workspace', 'create', '--no-focus', '--cwd', homedir(), '--label', formatName(name)];
  return cli(args, { env });
}

export function renameWorkspace(workspaceId: string, name: string, { env }: { env?: NodeJS.ProcessEnv } = {}) {
  const args = ['workspace', 'rename', workspaceId, formatName(name)];
  return cli(args, { env });
}

// null when unknown; list shape: result.workspaces[].
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

// Omit --placement: the CLI rejects popup, the manifest applies it.
export function openPluginPane(
  entrypoint: string,
  { envVars, env }: { envVars?: Record<string, string>; env?: NodeJS.ProcessEnv } = {},
) {
  const args = ['plugin', 'pane', 'open', '--plugin', SOURCE, '--entrypoint', entrypoint, '--focus'];
  for (const [key, value] of Object.entries(envVars ?? {})) args.push('--env', `${key}=${value}`);
  return cli(args, { env });
}

// HERDR_WORKSPACE_ID, falling back to HERDR_PLUGIN_CONTEXT_JSON.
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
