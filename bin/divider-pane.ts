#!/usr/bin/env bun
import readline from 'node:readline';
import { createWorkspace, renameWorkspace, requireBun, SOURCE } from '../lib/herdr.ts';

requireBun();

// Popup editor: a single-line readline prompt on an alternate screen. The
// popup is session-modal and receives every key, including Escape.
const ESC = '\u001b';
const ALT_SCREEN_ON = `${ESC}[?1049h`;
const ALT_SCREEN_OFF = `${ESC}[?1049l`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

const wsId = process.env.WSPACE_ID ?? '';
const mode = process.env.MODE ?? 'create';
if (!wsId) {
  process.stderr.write(`${SOURCE}: WSPACE_ID not set\n`);
  process.exit(1);
}
const currentName = process.env.CURRENT_NAME ?? '';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

// Esc and Ctrl+C cancel without saving; the alt screen must be restored
// before the process exits or the terminal is left half-raw.
function quit(code: number) {
  process.stdout.write(CURSOR_SHOW + ALT_SCREEN_OFF);
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.exit(code);
}

rl.input.on('keypress', (str: string, key: { name?: string; ctrl?: boolean }) => {
  if (key.name === 'escape' || (key.ctrl && key.name === 'c')) quit(0);
});
rl.on('SIGINT', () => quit(0));
rl.on('close', () => quit(0));

// Enter applies; an empty line cancels (mirrors workspace-description's
// clear-on-empty semantics — a blank divider name is meaningless).
rl.on('line', (line) => {
  const value = line.trim();
  if (value === '') return quit(0);
  const res = mode === 'rename' ? renameWorkspace(wsId, value) : createWorkspace(value);
  if (!res.ok) {
    process.stderr.write(`${SOURCE}: ${res.error}\n`);
    return quit(1);
  }
  quit(0);
});

for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(sig, () => quit(0));

process.stdout.write(ALT_SCREEN_ON + CURSOR_HIDE);
rl.setPrompt('');
rl.prompt();
if (mode === 'rename') rl.write(currentName);
