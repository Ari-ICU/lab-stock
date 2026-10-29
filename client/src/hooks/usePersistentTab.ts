'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage active tab state that persists seamlessly across page refreshes
 * via URL query parameters (`?tab=...`), URL hashes, and localStorage.
 *
 * @param storageKey Unique key for localStorage caching
 * @param validTabs Array of supported tab keys
 * @param defaultTab Default tab if none specified in URL or storage
 */
export function usePersistentTab<T extends string>(
  storageKey: string,
  validTabs: readonly T[],
  defaultTab: T
) {
  const [activeTab, setActiveTab] = useState<T>(defaultTab);

  // Synchronize on mount from URL search param, hash, or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as T | null;
      const hashParam = window.location.hash.replace(/^#/, '') as T;
      const storedTab = localStorage.getItem(storageKey) as T | null;

      const candidate = tabParam || hashParam || storedTab;
      if (candidate && validTabs.includes(candidate)) {
        setActiveTab(candidate);
      }
    } catch {
      // ignore
    }
  }, [storageKey, validTabs]);

  // Handler to change tab, sync URL query param without full reload, and persist to localStorage
  const handleTabChange = useCallback(
    (tab: T) => {
      setActiveTab(tab);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, tab);
          const url = new URL(window.location.href);
          url.searchParams.set('tab', tab);
          window.history.replaceState(null, '', url.toString());
        } catch {
          // ignore
        }
      }
    },
    [storageKey]
  );

  return [activeTab, handleTabChange] as const;
}

