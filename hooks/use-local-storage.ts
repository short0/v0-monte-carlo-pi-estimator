"use client";

/**
 * useLocalStorage<T>
 * ─────────────────────────────────────────────────────────────────────────────
 * A thin React hook over localStorage with SSR safety.
 * Falls back to `defaultValue` when localStorage is not available (e.g., SSR)
 * or when the stored value cannot be parsed.
 */

import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    // Safe SSR guard — localStorage is only available client-side
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently ignore quota errors etc.
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue(next);
  }, []);

  return [value, set];
}
