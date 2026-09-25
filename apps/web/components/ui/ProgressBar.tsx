/**
 * Progress as a measuring scale: ticks every 10 % (taller at 25 %), received as a solid bar and
 * promised-but-not-yet-received as hatching.
 */
export function ProgressBar({ value, pending = 0, goal, label }: { value: number; pending?: number; goal: number; label: string }) {
  const pct = (n: number) => Math.max(0, Math.min(100, goal > 0 ? (n / goal) * 100 : 0));
  return (
    <div className="relative h-7" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value}>
      <div className="absolute inset-x-0 top-2 h-2.5 border border-graphite/40">
        <div className="hatch absolute inset-y-0 left-0 text-teal-500/70" style={{ width: `${pct(pending)}%` }} />
        <div className="absolute inset-y-0 left-0 bg-teal-500 transition-[width] duration-700" style={{ width: `${pct(value)}%` }} />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-2 text-graphite/50"
        style={{
          backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 10%), repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 25%)',
          backgroundSize: '100% 4px, 100% 8px',
          backgroundPosition: 'left top, left top',
          backgroundRepeat: 'no-repeat',
          borderRight: '1px solid currentColor',
        }}
      />
    </div>
  );
}
