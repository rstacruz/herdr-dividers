#!/usr/bin/env bun
import readline from 'node:readline';
import { createWorkspace, renameWorkspace, requireBun, SOURCE } from '../lib/herdr.ts';

requireBun();

// Single-line prompt on an alternate screen; session-modal, gets every key.
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

// Esc/Ctrl+C cancel; restore alt screen or the terminal stays half-raw.
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

// Enter applies; empty cancels (mirrors workspace-description).
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
