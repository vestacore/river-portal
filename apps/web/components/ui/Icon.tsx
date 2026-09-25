const paths: Record<string, string> = {
  basket: 'M5 10h14l-1.5 9h-11zM8 10l4-6 4 6M9 14v2M15 14v2',
  pill: 'M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7zM8.5 8.5l7 7',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  home: 'M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  shirt: 'M8 4 4 6l1.5 4H8v10h8V10h2.5L20 6l-4-2c0 1.5-1.8 3-4 3S8 5.5 8 4z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  wheel: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 5v6M12 15v6M4 13h6M14 13h6',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h7',
  van: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12.5 10 17l9-10',
  quote: 'M7 17c-2 0-3-1.5-3-3.5C4 10 6.5 7.5 9 7M16 17c-2 0-3-1.5-3-3.5 0-3.5 2.5-6 5-6.5',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z',
  shield: 'M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  coins: 'M9 8c3.3 0 6-1.1 6-2.5S12.3 3 9 3 3 4.1 3 5.5 5.7 8 9 8zM3 5.5v5C3 11.9 5.7 13 9 13M3 10.5v5C3 16.9 5.7 18 9 18M15 11c3.3 0 6-1.1 6-2.5M15 11c-3.3 0-6-1.1-6-2.5s2.7-2.5 6-2.5 6 1.1 6 2.5v8c0 1.4-2.7 2.5-6 2.5s-6-1.1-6-2.5v-8',
  hand: 'M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14a1.6 1.6 0 0 1 2.6-1.8L7 13.5',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16',
  inbox: 'M3 13h5l1.5 3h5l1.5-3h5M5 5h14l2 8v6H3v-6z',
  close: 'M6 6l12 12M18 6 6 18',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
};

export type IconName = keyof typeof paths;

/** Stroke icons drawn for this portal (no icon library). Decorative unless `label` is given. */
export function Icon({ name, className = 'size-5', label }: { name: string; className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <path d={paths[name] ?? paths.dots} />
    </svg>
  );
}
