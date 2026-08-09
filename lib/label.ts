// Divider = box-char-wrapped workspace label; no state file, no tokens.
export const PREFIX = '━━ ';
export const BAR = '━'.repeat(30);

export const formatName = (name: string) => `━━ ${name.trim()} ${BAR}`;

export const isDivider = (label: string) => label.startsWith(PREFIX);

// Strip 1+ box chars so legacy truncated dividers still parse.
export const nameFromLabel = (label: string) =>
  label.replace(/^\s*━+\s*/, '').replace(/\s*━+\s*$/, '').trim();
