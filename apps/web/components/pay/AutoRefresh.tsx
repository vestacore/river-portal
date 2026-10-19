'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Reads the page again every few seconds while the river is working on something the person waits for. */
export function AutoRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
