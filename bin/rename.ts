#!/usr/bin/env bun
import {
  focusedWorkspaceId,
  openPluginPane,
  renameWorkspace,
  requireBun,
  SOURCE,
  workspaceLabel,
} from '../lib/herdr.ts';
import { isDivider, nameFromLabel } from '../lib/label.ts';

requireBun();

function fail(message: string): never {
  process.stderr.write(`${SOURCE}: ${message}\n`);
  process.exit(1);
}

// Same stdin contract as create.ts: a pipe renames directly (no popup).
async function readPipedInput(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  process.stdin.setEncoding('utf8');
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data === '' ? null : data;
}

const wsId = focusedWorkspaceId();
if (!wsId) fail('could not determine the focused workspace (HERDR_WORKSPACE_ID not set)');

// Only divider workspaces are renameable here; renaming via herdr's built-in
// rename just makes it a normal workspace (graceful degradation, not a bug).
const label = workspaceLabel(wsId);
if (label === null) fail(`could not read the label of workspace ${wsId}`);
if (!isDivider(label)) fail(`workspace is not a divider: "${label}"`);

const piped = await readPipedInput();
if (piped !== null) {
  const res = renameWorkspace(wsId, piped.trim());
  if (!res.ok) fail(`could not rename divider: ${res.error}`);
  process.exit(0);
}

const res = openPluginPane('edit', {
  envVars: { WSPACE_ID: wsId, MODE: 'rename', CURRENT_NAME: nameFromLabel(label) },
});
if (!res.ok) {
  const hint = res.error.toLowerCase().includes('ui_busy') ? ' (close the open herdr modal first)' : '';
  fail(`could not open the editor: ${res.error}${hint}`);
}
process.exit(0);
