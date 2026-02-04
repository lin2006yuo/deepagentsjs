import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "research-recent-inputs";
const MAX_ITEMS = 10;

export function useRecentInputs() {
  const [recentInputs, setRecentInputs] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentInputs(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const addRecentInput = useCallback((input: string) => {
    if (!input.trim()) return;

    try {
      setRecentInputs((prev) => {
        const filtered = prev.filter((item) => item !== input.trim());
        const updated = [input.trim(), ...filtered].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

  const clearRecentInputs = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentInputs([]);
    } catch {
      // ignore
    }
  }, []);

  return {
    recentInputs,
    addRecentInput,
    clearRecentInputs,
  };
}
