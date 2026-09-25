/** The mark: a bevelled plate with a channel drawn in straight 45° lines. */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <polygon points="8,0 40,0 40,32 32,40 0,40 0,8" fill="var(--color-ink-900)" />
      <path d="M11,6 L11,15 L20,24 L20,34" fill="none" stroke="var(--color-paper)" strokeWidth="2.2" />
      <path d="M20,6 L20,15 L29,24 L29,34" fill="none" stroke="var(--color-sunrise-500)" strokeWidth="2.2" />
    </svg>
  );
}
