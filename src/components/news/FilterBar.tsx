import { Button } from "@/components/ui/button";
import { Topic, Region } from "@/data/types";

const topics: (Topic | "All")[] = ["All", "Politics", "Economy", "Sports", "Tech", "Regional", "World", "Opinion"];
const regions: (Region | "All")[] = ["All", "National", "Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "South Asia", "Middle East", "Central Asia", "Africa", "Europe", "Americas", "Asia", "Oceania", "Global"];

interface FilterBarProps {
  selectedTopic: Topic | "All";
  selectedRegion: Region | "All";
  onTopicChange: (t: Topic | "All") => void;
  onRegionChange: (r: Region | "All") => void;
}

export function FilterBar({ selectedTopic, selectedRegion, onTopicChange, onRegionChange }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Topic:</span>
        {topics.map((t) => (
          <Button
            key={t}
            variant={selectedTopic === t ? "default" : "outline"}
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => onTopicChange(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Region:</span>
        {regions.map((r) => (
          <Button
            key={r}
            variant={selectedRegion === r ? "default" : "outline"}
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => onRegionChange(r)}
          >
            {r}
          </Button>
        ))}
      </div>
    </div>
  );
}
