#!/usr/bin/env bun
import { createWorkspace, focusedWorkspaceId, openPluginPane, requireBun, SOURCE } from '../lib/herdr.ts';

requireBun();

function fail(message: string): never {
  process.stderr.write(`${SOURCE}: ${message}\n`);
  process.exit(1);
}

// herdr 0.8.0 spawns actions with the server's stdin (TTY or EOF-empty), so
// this branch cannot fire via the CLI — it does not forward pipes. It is the
// documented stdin contract for plugin commands, so keep it: the day herdr
// forwards stdin, a pipe creates a divider directly (the herdr-create-group
// alias path) instead of opening the popup.
async function readPipedInput(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  process.stdin.setEncoding('utf8');
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data === '' ? null : data;
}

// Focused workspace id is context only — create always appends at the end
// (positioning is herdr's mouse drag), so a missing id is not fatal here.
const wsId = focusedWorkspaceId();

const piped = await readPipedInput();
if (piped !== null) {
  const res = createWorkspace(piped.trim());
  if (!res.ok) fail(`could not create divider: ${res.error}`);
  process.exit(0);
}

const res = openPluginPane('edit', { envVars: { WSPACE_ID: wsId, MODE: 'create' } });
if (!res.ok) {
  const hint = res.error.toLowerCase().includes('ui_busy') ? ' (close the open herdr modal first)' : '';
  fail(`could not open the editor: ${res.error}${hint}`);
}
process.exit(0);
