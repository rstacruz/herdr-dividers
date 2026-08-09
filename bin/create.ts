#!/usr/bin/env bun
import { createWorkspace, focusedWorkspaceId, openPluginPane, requireBun, SOURCE } from '../lib/herdr.ts';

requireBun();

function fail(message: string): never {
  process.stderr.write(`${SOURCE}: ${message}\n`);
  process.exit(1);
}

// Pipe branch: documented contract; herdr 0.8.0 doesn't forward stdin.
async function readPipedInput(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  process.stdin.setEncoding('utf8');
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data === '' ? null : data;
}

// Focused id is context only; missing is not fatal.
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
