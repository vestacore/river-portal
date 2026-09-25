function mix(hex: string, target: number, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (target - c) * amount));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Tints and shades of an accent colour for the design tokens (100 lightest … 600 darker). */
export function accentShades(hex: string): { 100: string; 300: string; 500: string; 600: string } {
  const base = /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : '#f0962a';
  return { 100: mix(base, 255, 0.82), 300: mix(base, 255, 0.4), 500: base, 600: mix(base, 0, 0.14) };
}
