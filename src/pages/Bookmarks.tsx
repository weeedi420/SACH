import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/data/utils";

export default function Bookmarks() {
  const { user } = useAuth();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["bookmarks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("story_id, created_at, stories(id, title, topic, region, published_at)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <main className="container py-12 max-w-md text-center space-y-4">
        <Bookmark className="h-8 w-8 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">Sign in to save stories</h1>
        <p className="text-sm text-muted-foreground">Bookmark stories to read later and build your personal library.</p>
        <Link to="/login"><Button className="gap-1"><LogIn className="h-4 w-4" /> Sign In</Button></Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container py-6 max-w-3xl space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </main>
    );
  }

  return (
    <main className="container py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" /> My Bookmarks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{bookmarks.length} saved stories</p>
      </div>
      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No bookmarks yet. Tap the bookmark icon on any story to save it.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((b: any) => {
            const story = b.stories;
            if (!story) return null;
            return (
              <Link key={b.story_id} to={`/story/${story.id}`}>
                <Card className="hover:shadow-sm hover:border-primary/30 transition-all">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-medium text-sm line-clamp-2">{story.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px]">{story.topic}</Badge>
                        <span>{story.region}</span>
                        <span>· {timeAgo(story.published_at)}</span>
                      </div>
                    </div>
                    <Bookmark className="h-4 w-4 text-primary shrink-0 fill-primary" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
