import { useState, useEffect } from 'react';

export function useAdDismiss(key: string) {
  const storageKey = `compssa_ad_${key}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(storageKey) === '1'); } catch {}
  }, [storageKey]);

  const dismiss = () => {
    try { localStorage.setItem(storageKey, '1'); } catch {}
    setDismissed(true);
  };

  return { dismissed, dismiss };
}