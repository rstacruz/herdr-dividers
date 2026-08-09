// A divider workspace is a real workspace whose custom label is wrapped in
// box chars: `━━ name ━━`. No state file, no marker token — the label itself
// is the source of truth (herdr persists it across restarts).
export const PREFIX = '━━ ';

export const formatName = (name: string) => `━━ ${name.trim()} ━━`;

export const isDivider = (label: string) => label.startsWith(PREFIX);

// Strip box chars from either side; 1-or-more so legacy dividers with a
// single trailing `━` (the old 30-char bar hack, truncated) still parse.
export const nameFromLabel = (label: string) =>
  label.replace(/^\s*━+\s*/, '').replace(/\s*━+\s*$/, '').trim();
