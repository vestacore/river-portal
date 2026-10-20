/**
 * A drawing that looks like a QR code: three finder squares and modules from a hash of the reference.
 * It encodes nothing — in the demo the scan is simulated — and says so to screen readers.
 */
export function FakeQr({ seed, size = 168 }: { seed: string; size?: number }) {
  const n = 25;
  let h = 2_166_136_261;
  const bits: boolean[] = [];
  for (let i = 0; i < n * n; i += 1) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16_777_619) >>> 0;
    bits.push((h & 0x10) !== 0);
  }
  const finder = (x: number, y: number) => x < 7 && y < 7 || x >= n - 7 && y < 7 || x < 7 && y >= n - 7;
  const cell = size / n;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Demo QR code (simulated scan)">
      <rect width={size} height={size} fill="#fff" />
      {bits.map((on, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        if (finder(x, y) || !on) return null;
        return <rect key={i} x={x * cell} y={y * cell} width={cell} height={cell} fill="#14181b" />;
      })}
      {[[0, 0], [n - 7, 0], [0, n - 7]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x! * cell} y={y! * cell} width={7 * cell} height={7 * cell} fill="#14181b" />
          <rect x={(x! + 1) * cell} y={(y! + 1) * cell} width={5 * cell} height={5 * cell} fill="#fff" />
          <rect x={(x! + 2) * cell} y={(y! + 2) * cell} width={3 * cell} height={3 * cell} fill="#14181b" />
        </g>
      ))}
    </svg>
  );
}
