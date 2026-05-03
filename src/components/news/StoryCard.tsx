import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BiasIndicator } from "./BiasIndicator";
import { NewsStory } from "@/data/types";
import { getSource } from "@/data/sources";
import { getInternationalSource } from "@/data/international-sources";
import { timeAgo, getTopicColor, getBlindspotType } from "@/data/utils";
import { TrendingUp, EyeOff, Zap, Globe, Bookmark } from "lucide-react";
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
  if (unique.length === 0) return `${story.coverages.length} source${story.coverages.length !== 1 ? "s" : ""}`;
  if (unique.length <= 3) return unique.join(" · ");
  return `${unique.slice(0, 2).join(" · ")} +${unique.length - 2} more`;
}

export function StoryCard({ story, index }: StoryCardProps) {
  const blindspot = getBlindspotType(story.biasDistribution);
  const { user } = useAuth();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(story.id);

  const previewText = story.aiSummary || stripMarkdown(story.coverages[0]?.summary || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Link to={`/story/${story.id}`}>
        <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">

              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-2">

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getTopicColor(story.topic)}`}>
                    {story.topic}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{story.region}</span>
                  {story.isBreaking && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 uppercase tracking-wide">
                      <Zap className="h-3 w-3" /> Breaking
                    </span>
                  )}
                  {story.isTrending && !story.isBreaking && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                      <TrendingUp className="h-3 w-3" /> Trending
                    </span>
                  )}
                  {story.coverages.some(c => c.isInternational) && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Globe className="h-3 w-3" /> International
                    </span>
                  )}
                  {blindspot && (
                    <Badge variant="outline" className="text-[10px] gap-0.5 border-orange-300 text-orange-600">
                      <EyeOff className="h-3 w-3" /> {blindspot}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {story.title}
                </h3>

                {/* Preview text */}
                {previewText && (
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                    {previewText}
                  </p>
                )}

                {/* Source + time row */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                  <span className="font-medium text-foreground/70">{getOutletNames(story)}</span>
                  <span className="opacity-50">·</span>
                  <span>{timeAgo(story.publishedAt)}</span>
                </div>

                {/* Bias bar */}
                <BiasIndicator distribution={story.biasDistribution} />
              </div>

              {/* Bookmark */}
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
