import { Newspaper, Tv, Globe } from "lucide-react";

export function SourceIcon({ type, className = "h-4 w-4 text-muted-foreground" }: { type: string; className?: string }) {
  switch (type) {
    case "newspaper": return <Newspaper className={className} />;
    case "tv": return <Tv className={className} />;
    case "online": return <Globe className={className} />;
    default: return <Newspaper className={className} />;
  }
}
