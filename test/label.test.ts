import { expect, test } from 'bun:test';
import { PREFIX, formatName, isDivider, nameFromLabel } from '../lib/label.ts';

test('formatName trims and wraps in box chars', () => {
  expect(formatName('acme')).toBe('━━ acme ━━');
  expect(formatName('  acme  ')).toBe('━━ acme ━━');
  expect(formatName('parked')).toStartWith(PREFIX);
  expect(formatName('parked')).toEndWith(' ━━');
});

test('isDivider detects the box-char prefix only', () => {
  expect(isDivider('━━ acme ━━')).toBe(true);
  expect(isDivider('━━ test-divider ━')).toBe(true); // legacy asymmetric divider
  expect(isDivider('== parked ==')).toBe(false);
  expect(isDivider('== lol ================')).toBe(false);
  expect(isDivider('acme')).toBe(false);
});

test('nameFromLabel strips box chars symmetrically', () => {
  expect(nameFromLabel('━━ acme ━━')).toBe('acme');
  expect(nameFromLabel(' ━━  spaced  ━━ ')).toBe('spaced');
});

test('nameFromLabel strips legacy asymmetric dividers', () => {
  expect(nameFromLabel('━━ test-divider ━')).toBe('test-divider');
});

test('nameFromLabel leaves non-divider labels alone', () => {
  expect(nameFromLabel('== parked ==')).toBe('== parked ==');
});
