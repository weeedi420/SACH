import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchStories } from "@/lib/api";
import { StoryCard } from "@/components/news/StoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search } from "lucide-react";

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchStories(query),
    enabled: query.trim().length > 0,
  });

  return (
    <main className="container py-6 max-w-3xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Search Results</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((story) => (
            <StoryCard key={story.id} story={story} index={0} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">No stories found matching your search.</p>
      )}
    </main>
  );
}
