import { BiasLabel } from "./types";

export function getBiasColor(bias: BiasLabel): string {
  switch (bias) {
    case "establishment": return "bg-bias-establishment text-white";
    case "anti-establishment": return "bg-amber-700 text-white";
    case "government": return "bg-bias-government text-white";
    case "opposition": return "bg-bias-opposition text-white";
    case "independent": return "bg-bias-independent text-white";
    case "partisan": return "bg-bias-partisan text-white";
  }
}

export function getBiasLabel(bias: BiasLabel): string {
  switch (bias) {
    case "establishment": return "Establishment";
    case "anti-establishment": return "Anti-Establishment";
    case "government": return "Government";
    case "opposition": return "Opposition";
    case "independent": return "Independent";
    case "partisan": return "Partisan";
  }
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getTopicColor(topic: string): string {
  switch (topic) {
    case "Politics": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "Economy": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "Sports": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "Tech": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Regional": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "World": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
    case "Opinion": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    default: return "bg-muted text-muted-foreground";
  }
}

export type BlindspotType = "Establishment Blindspot" | "Government Blindspot" | "Opposition Blindspot" | "Independent Blindspot" | null;

export function getBlindspotType(distribution: { establishment: number; government: number; opposition: number; independent: number }): BlindspotType {
  const total = distribution.establishment + distribution.government + distribution.opposition + distribution.independent;
  if (total < 3) return null;

  const threshold = 0.6;
  if (distribution.establishment / total >= threshold && distribution.independent === 0) return "Establishment Blindspot";
  if (distribution.government / total >= threshold && distribution.independent === 0) return "Government Blindspot";
  if (distribution.opposition / total >= threshold && distribution.independent === 0) return "Opposition Blindspot";
  if (distribution.independent / total >= threshold && distribution.establishment === 0 && distribution.government === 0) return "Independent Blindspot";
  return null;
}
