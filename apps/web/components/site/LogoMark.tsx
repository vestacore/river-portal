/** The mark: a bevelled plate with a river crossed by a bridge and splitting into three streams. */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <polygon points="8,0 40,0 40,32 32,40 0,40 0,8" fill="var(--color-ink-900)" />
      <path d="M6,20 L18,20 L26,12 L34,12 M18,20 L34,20 M18,20 L26,28 L34,28" fill="none" stroke="var(--color-paper)" strokeWidth="2.2" />
      <path d="M12,13 L12,27" fill="none" stroke="var(--color-sunrise-500)" strokeWidth="2.6" />
    </svg>
  );
}
