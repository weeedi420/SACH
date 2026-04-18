import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BiasIndicator } from "./BiasIndicator";
import { NewsStory } from "@/data/types";
import { getSource } from "@/data/sources";
import { getInternationalSource } from "@/data/international-sources";
import { timeAgo, getTopicColor, getBlindspotType } from "@/data/utils";
import { TrendingUp, EyeOff, Zap, Globe, Bookmark, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { stripMarkdown } from "@/lib/markdown";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/contexts/AuthContext";

interface StoryCardProps {
  story: NewsStory;
  index: number;
}

function getOutletNames(story: NewsStory): string {
  const names = story.coverages
    .map(c => (getSource(c.sourceId) || getInternationalSource(c.sourceId))?.name)
    .filter(Boolean) as string[];
  const unique = [...new Set(names)];
  if (unique.length === 0) return `${story.coverages.length} sources`;
  if (unique.length <= 3) return unique.join(" · ");
  return `${unique.slice(0, 2).join(" · ")} +${unique.length - 2}`;
}

function getReadTime(story: NewsStory): string {
  const mins = Math.max(1, Math.round(story.coverages.length * 0.75));
  return `~${mins} min read`;
}

export function StoryCard({ story, index }: StoryCardProps) {
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
            <div className="flex items-start gap-3">
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
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stripMarkdown(story.coverages[0].summary)}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground/70">{getOutletNames(story)}</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />{getReadTime(story)}
                  </span>
                  <span>{timeAgo(story.publishedAt)}</span>
                </div>

                <BiasIndicator distribution={story.biasDistribution} />
              </div>
              {story.imageUrl && (
                <img
                  src={story.imageUrl}
                  alt=""
                  className="shrink-0 w-20 h-16 object-cover rounded-md bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
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
