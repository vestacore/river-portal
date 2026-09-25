'use client';

import { useState } from 'react';

/** Copies the current tracking link (without the ?new flag). */
export function CopyLink({ label, done }: { label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={async () => { await navigator.clipboard.writeText(window.location.href.split('?')[0] ?? ''); setCopied(true); }}
      className="border border-graphite/40 bg-paper px-4 py-2 text-sm font-semibold text-ink-900 hover:border-graphite">
      {copied ? done : label}
    </button>
  );
}
