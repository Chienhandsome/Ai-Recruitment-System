'use client';

import { useEffect, useRef, useState } from 'react';
import { emptyReviewDraft, parseReviewDraft, reviewDraftKey } from './interview-review-state';

export function useInterviewReviewDraft(token: string, sessionId: string, questionNumbers: number[], enabled: boolean) {
  const [draft, setDraft] = useState(emptyReviewDraft);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const cleared = useRef(false);
  const key = reviewDraftKey(token, sessionId);

  useEffect(() => {
    if (!enabled) return;
    try {
      // Restore browser storage after hydration; never render another reviewer's draft.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(parseReviewDraft(key ? localStorage.getItem(key) : null, questionNumbers));
      setStorageAvailable(!!key);
    } catch { setStorageAvailable(false); }
    setReady(true);
  }, [key, questionNumbers, enabled]);

  useEffect(() => {
    if (!ready || !key || !enabled || cleared.current) return;
    try {
      localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(true);
    } catch { setStorageAvailable(false); }
  }, [draft, enabled, key, ready]);

  const clearDraft = () => {
    cleared.current = true;
    try { if (key) localStorage.removeItem(key); } catch { /* Optional browser storage. */ }
  };

  return { draft, setDraft, ready: ready || !enabled, saved: saved && storageAvailable, clearDraft };
}
