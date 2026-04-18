import { useState, useEffect, useCallback } from "react";
import { getSource } from "@/data/sources";
import { BiasLabel } from "@/data/types";

interface ReadingEntry {
  storyId: string;
  biasBreakdown: Record<BiasLabel, number>;
  timestamp: number;
}

interface ReadingStats {
  total: number;
  byBias: Record<BiasLabel, number>;
  entries: ReadingEntry[];
}

const STORAGE_KEY = "sachh-reading-tracker";

function loadStats(): ReadingStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { total: 0, byBias: { establishment: 0, "anti-establishment": 0, government: 0, opposition: 0, independent: 0, partisan: 0 }, entries: [] };
}

function saveStats(stats: ReadingStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function useReadingTracker() {
  const [stats, setStats] = useState<ReadingStats>(loadStats);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const trackStory = useCallback((storyId: string, sourceIds: string[]) => {
    setStats((prev) => {
      // Don't double-count
      if (prev.entries.some((e) => e.storyId === storyId)) return prev;

      const biasBreakdown: Record<BiasLabel, number> = { establishment: 0, "anti-establishment": 0, government: 0, opposition: 0, independent: 0, partisan: 0 };
      sourceIds.forEach((id) => {
        const source = getSource(id);
        if (source) biasBreakdown[source.bias]++;
      });

      const newByBias = { ...prev.byBias };
      (Object.keys(biasBreakdown) as BiasLabel[]).forEach((key) => {
        newByBias[key] += biasBreakdown[key];
      });

      return {
        total: prev.total + 1,
        byBias: newByBias,
        entries: [...prev.entries, { storyId, biasBreakdown, timestamp: Date.now() }],
      };
    });
  }, []);

  const clearStats = useCallback(() => {
    const empty: ReadingStats = { total: 0, byBias: { establishment: 0, "anti-establishment": 0, government: 0, opposition: 0, independent: 0, partisan: 0 }, entries: [] };
    setStats(empty);
  }, []);

  return { stats, trackStory, clearStats };
}
