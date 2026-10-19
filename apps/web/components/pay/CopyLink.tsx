'use client';

import { useEffect, useState } from 'react';

/**
 * Shows a pay link and copies it. The server knows only the path; the full address — this origin
 * plus the path — is filled in once the page runs in the browser.
 */
export function CopyLink({ path, label, done }: { path: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState(path);
  useEffect(() => setLink(`${window.location.origin}${path}`), [path]);
  return (
    <div className="space-y-3">
      <p className="select-all break-all border border-graphite/30 bg-white px-3 py-2.5 font-mono text-sm text-ink-900">{link}</p>
      <button type="button" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true); }}
        className="border border-graphite/40 bg-paper px-4 py-2 text-sm font-semibold text-ink-900 hover:border-graphite">
        {copied ? done : label}
      </button>
    </div>
  );
}
