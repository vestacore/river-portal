'use client';

import { useEffect } from 'react';

/**
 * "Leave this site quickly" for people who may be watched (spec: Safeguarding): replaces this page
 * in the history with a neutral site. Also triggered by pressing Escape twice.
 */
export function QuickExit({ url, label, hint }: { url: string; label: string; hint: string }) {
  useEffect(() => {
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      if (now - last < 800) window.location.replace(url);
      last = now;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url]);
  // Positioned by a wrapper: .chamfer sets position: relative for its bevelled fill.
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a href={url} onClick={(e) => { e.preventDefault(); window.location.replace(url); }} rel="noreferrer"
        className="chamfer flex flex-col items-end px-4 py-2.5 text-sm font-semibold text-paper [--cut:8px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-attention-500)]">
        <span>{label} ✕</span><span className="annot text-[0.62rem] text-ink-300">{hint}</span>
      </a>
    </div>
  );
}
