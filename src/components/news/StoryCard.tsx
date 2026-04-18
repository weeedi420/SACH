import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BiasIndicator } from "./BiasIndicator";
import { NewsStory } from "@/data/types";
import { getSource } from "@/data/sources";
import { timeAgo, getTopicColor, getBlindspotType } from "@/data/utils";
import { Users, TrendingUp, EyeOff, Zap, Globe, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { stripMarkdown } from "@/lib/markdown";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/contexts/AuthContext";

interface StoryCardProps {
  story: NewsStory;
  index: number;
}

export function StoryCard({ story, index }: StoryCardProps) {
  const sourceCount = story.coverages.length;
  const firstSource = getSource(story.coverages[0]?.sourceId);
  const blindspot = getBlindspotType(story.biasDistribution);
  const { user } = useAuth();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(story.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={`/story/${story.id}`}>
        <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={`text-[10px] ${getTopicColor(story.topic)}`}>
                    {story.topic}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{story.region}</span>
                  {story.isBreaking && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5">
                      <Zap className="h-3 w-3" /> BREAKING
                    </Badge>
                  )}
                  {story.isTrending && !story.isBreaking && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                      <TrendingUp className="h-3 w-3" /> Trending
                    </span>
                  )}
                  {story.coverages.some(c => c.isInternational) && (
                    <span className="flex items-center gap-0.5 text-[10px] text-accent-foreground font-medium">
                      <Globe className="h-3 w-3" /> Global
                    </span>
                  )}
                  {blindspot && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5">
                      <EyeOff className="h-3 w-3" /> {blindspot}
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {story.title}
                </h3>

                {story.coverages[0]?.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {stripMarkdown(story.coverages[0].summary)}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {sourceCount} sources
                  </span>
                  <span>{timeAgo(story.publishedAt)}</span>
                  {firstSource && <span>via {firstSource.name}</span>}
                </div>

                <BiasIndicator distribution={story.biasDistribution} />
              </div>
              {user && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(story.id); }}
                  className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark story"}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
