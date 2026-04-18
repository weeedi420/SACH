import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { stories } from "@/data/stories";
import { getSource } from "@/data/sources";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight } from "lucide-react";
import { getTopicColor } from "@/data/utils";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [open]);

  const results = query.trim().length > 1
    ? stories.filter((s) => {
        const q = query.toLowerCase();
        const sourceMatch = s.coverages.some((c) => {
          const source = getSource(c.sourceId);
          return source?.name.toLowerCase().includes(q);
        });
        return (
          s.title.toLowerCase().includes(q) ||
          s.topic.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q) ||
          sourceMatch
        );
      }).slice(0, 6)
    : [];

  const goToSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToSearch()}
            placeholder="Search stories, sources, topics…"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((story) => (
                <button
                  key={story.id}
                  onClick={() => {
                    navigate(`/story/${story.id}`);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-start gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-snug">{story.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-[10px] ${getTopicColor(story.topic)}`}>
                        {story.topic}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{story.coverages.length} sources</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                </button>
              ))}
              {query.trim() && (
                <button
                  onClick={goToSearch}
                  className="w-full text-center p-2 text-xs text-primary hover:underline"
                >
                  See all results for "{query}"
                </button>
              )}
            </div>
          ) : query.trim().length > 1 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">Start typing to search…</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
