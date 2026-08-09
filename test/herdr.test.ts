import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorkspace, renameWorkspace, workspaceLabel } from '../lib/herdr.ts';
import { formatName } from '../lib/label.ts';

// Stub `herdr` records the args it would receive.
function withStubHerdr(fn: () => void): string {
  const stubDir = mkdtempSync(join(tmpdir(), 'herdr-dividers-stub-'));
  const log = join(stubDir, 'log');
  const stub = join(stubDir, 'herdr-stub');
  writeFileSync(stub, `#!/bin/sh\necho "$@" > "${log}"\nexit 0\n`, { mode: 0o755 });
  try {
    const oldBin = process.env.HERDR_BIN_PATH;
    process.env.HERDR_BIN_PATH = stub;
    try {
      fn();
    } finally {
      if (oldBin === undefined) delete process.env.HERDR_BIN_PATH;
      else process.env.HERDR_BIN_PATH = oldBin;
    }
    return readFileSync(log, 'utf8');
  } finally {
    rmSync(stubDir, { recursive: true, force: true });
  }
}

test('createWorkspace builds the divider create command', () => {
  const log = withStubHerdr(() => {
    const res = createWorkspace('acme');
    expect(res.ok).toBe(true);
  });
  expect(log).toContain('workspace create');
  expect(log).toContain('--no-focus');
  expect(log).toContain('--cwd');
  expect(log).toContain('--label ' + formatName('acme'));
});

test('renameWorkspace builds the rename command with the formatted label', () => {
  const log = withStubHerdr(() => {
    const res = renameWorkspace('w7W', 'parked');
    expect(res.ok).toBe(true);
  });
  expect(log).toContain('workspace rename w7W ' + formatName('parked'));
});

// A stub whose stdout is a canned `workspace list` envelope.
function withStubHerdrOutput(output: string, fn: () => void): void {
  const stubDir = mkdtempSync(join(tmpdir(), 'herdr-dividers-out-'));
  const out = join(stubDir, 'out');
  const stub = join(stubDir, 'herdr-stub');
  writeFileSync(out, output);
  writeFileSync(stub, `#!/bin/sh\ncat "${out}"\nexit 0\n`, { mode: 0o755 });
  try {
    const oldBin = process.env.HERDR_BIN_PATH;
    process.env.HERDR_BIN_PATH = stub;
    try {
      fn();
    } finally {
      if (oldBin === undefined) delete process.env.HERDR_BIN_PATH;
      else process.env.HERDR_BIN_PATH = oldBin;
    }
  } finally {
    rmSync(stubDir, { recursive: true, force: true });
  }
}

const LIST = JSON.stringify({
  id: 'cli:workspace:list',
  result: {
    type: 'workspace_list',
    workspaces: [
      { workspace_id: 'w7W', label: '== lol ================' },
      { workspace_id: 'w9N', label: '━━ test-divider ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
    ],
  },
});

test('workspaceLabel parses the list envelope', () => {
  withStubHerdrOutput(LIST, () => {
    expect(workspaceLabel('w7W')).toBe('== lol ================');
    expect(workspaceLabel('w9N')).toBe('━━ test-divider ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    expect(workspaceLabel('nope')).toBeNull();
  });
});

test('workspaceLabel returns null on unparsable output', () => {
  withStubHerdrOutput('{nope', () => {
    expect(workspaceLabel('w7W')).toBeNull();
  });
});
