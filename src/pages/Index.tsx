import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStories } from "@/lib/api";
import { StoryCard } from "@/components/news/StoryCard";
import { FilterBar } from "@/components/news/FilterBar";
import { Topic, Region, NewsStory } from "@/data/types";
import { Newspaper, RefreshCw, Zap, Globe, MapPin, Flag, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BiasIndicator } from "@/components/news/BiasIndicator";
import { timeAgo } from "@/data/utils";

const PAKISTAN_REGIONS = new Set(["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "National"]);
const REGIONAL_REGIONS = new Set(["South Asia", "Middle East", "Central Asia"]);
const WORLD_REGIONS = new Set(["Africa", "Europe", "Americas", "Asia", "Oceania", "Global"]);

function categorizeStory(story: NewsStory): "pakistan" | "regional" | "world" | "sports" {
  if (story.topic === "Sports") return "sports";
  if (PAKISTAN_REGIONS.has(story.region)) return "pakistan";
  if (REGIONAL_REGIONS.has(story.region)) return "regional";
  if (WORLD_REGIONS.has(story.region)) return "world";
  if (story.topic === "World") return "world";
  if (story.topic === "Regional") return "regional";
  const intlCount = story.coverages.filter(c => c.isInternational).length;
  if (intlCount > story.coverages.length / 2) return "world";
  return "pakistan";
}

type FeedSection = "all" | "pakistan" | "regional" | "world" | "sports";

const Index = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | "All">("All");
  const [selectedRegion, setSelectedRegion] = useState<Region | "All">("All");
  const [activeSection, setActiveSection] = useState<FeedSection>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const allStories = stories;

  const mainFeedStories = useMemo(() =>
    allStories.filter(s => categorizeStory(s) !== "sports"),
    [allStories]
  );

  const filtered = useMemo(() => {
    const base = activeSection === "sports"
      ? allStories.filter(s => categorizeStory(s) === "sports")
      : activeSection === "all"
        ? mainFeedStories
        : mainFeedStories.filter(s => categorizeStory(s) === activeSection);

    return base.filter(s => {
      if (selectedTopic !== "All" && s.topic !== selectedTopic) return false;
      if (selectedRegion !== "All" && s.region !== selectedRegion) return false;
      return true;
    });
  }, [allStories, mainFeedStories, selectedTopic, selectedRegion, activeSection]);

  const visibleStories = useMemo(() => {
    if (filtered.length > 0) return filtered;
    const filtersApplied = selectedTopic !== "All" || selectedRegion !== "All" || activeSection !== "all";
    if (!filtersApplied) return filtered;
    return mainFeedStories.length > 0 ? mainFeedStories : allStories;
  }, [filtered, selectedTopic, selectedRegion, activeSection, mainFeedStories, allStories]);

  const sectionCounts = useMemo(() => {
    const counts = { pakistan: 0, regional: 0, world: 0, sports: 0 };
    allStories.forEach(s => {
      const cat = categorizeStory(s);
      if (cat in counts) counts[cat as keyof typeof counts]++;
    });
    return counts;
  }, [allStories]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Fetching latest news...");
    const scrapePromise = supabase.functions.invoke("scrape-news").catch(() => null);
    const timeout = new Promise(resolve => setTimeout(resolve, 15000));
    await Promise.race([scrapePromise, timeout]);
    try {
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
      const freshStories = await queryClient.fetchQuery({ queryKey: ["stories"], queryFn: fetchStories });
      toast.success(`Feed updated (${freshStories.length} stories)`);
    } catch {
      toast.error("Could not load stories");
    } finally {
      setIsRefreshing(false);
    }
  };

  const sectionButtons: { key: FeedSection; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "all", label: "All", icon: <Newspaper className="h-3 w-3" /> },
    { key: "pakistan", label: "Pakistan", icon: <Flag className="h-3 w-3" />, count: sectionCounts.pakistan },
    { key: "regional", label: "Regional", icon: <MapPin className="h-3 w-3" />, count: sectionCounts.regional },
    { key: "world", label: "World", icon: <Globe className="h-3 w-3" />, count: sectionCounts.world },
    { key: "sports", label: "Sports", icon: <Trophy className="h-3 w-3" />, count: sectionCounts.sports },
  ];

  // Top stories for the hero section (only shown in "all" tab)
  const topStories = useMemo(() =>
    activeSection === "all" && !isLoading
      ? mainFeedStories.filter(s => (s.importanceScore || 0) >= 8 && s.coverages.length >= 2).slice(0, 5)
      : [],
    [mainFeedStories, activeSection, isLoading]
  );

  // Latest feed excludes stories already in top section
  const topStoryIds = useMemo(() => new Set(topStories.map(s => s.id)), [topStories]);
  const feedStories = useMemo(() =>
    activeSection === "all"
      ? visibleStories.filter(s => !topStoryIds.has(s.id))
      : visibleStories,
    [visibleStories, topStoryIds, activeSection]
  );

  return (
    <main className="container py-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">
          {activeSection === "sports" ? "Sports" : "News Feed"}
        </h1>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" disabled={isRefreshing} onClick={handleRefresh}>
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Updating..." : "Refresh"}
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {sectionButtons.map(({ key, label, icon, count }) => (
          <Button
            key={key}
            variant={activeSection === key ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1 shrink-0"
            onClick={() => setActiveSection(key)}
          >
            {icon} {label}
            {count !== undefined && <span className="text-[10px] opacity-70">({count})</span>}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        selectedTopic={selectedTopic}
        selectedRegion={selectedRegion}
        onTopicChange={setSelectedTopic}
        onRegionChange={setSelectedRegion}
      />

      {/* ── Top Stories ── */}
      {topStories.length > 0 && (() => {
        const [hero, ...rest] = topStories;
        return (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Top Stories</h2>
            </div>

            {/* Hero card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Link to={`/story/${hero.id}`}>
                <Card className="mb-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">{hero.topic}</span>
                      <span className="text-[11px] text-muted-foreground">{hero.region}</span>
                      {hero.isBreaking && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-0.5">
                          <Zap className="h-3 w-3" /> Breaking
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base leading-snug line-clamp-3">{hero.title}</h3>
                    {hero.aiSummary && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{hero.aiSummary}</p>
                    )}
                    <div className="flex items-center gap-3 pt-0.5">
                      <span className="text-xs text-muted-foreground font-medium">{hero.coverages.length} sources</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(hero.publishedAt)}</span>
                      <BiasIndicator distribution={hero.biasDistribution} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* 2-column grid for remaining top stories */}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {rest.map((story, i) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link to={`/story/${story.id}`}>
                      <Card className="h-full hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer">
                        <CardContent className="p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">{story.topic}</span>
                            <span className="text-[10px] text-muted-foreground">{story.region}</span>
                          </div>
                          <h3 className="font-semibold text-sm leading-snug line-clamp-3">{story.title}</h3>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                            <span>{story.coverages.length} sources</span>
                            <span>{timeAgo(story.publishedAt)}</span>
                          </div>
                          <BiasIndicator distribution={story.biasDistribution} />
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* ── Latest Feed ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          {activeSection === "sports"
            ? <Trophy className="h-4 w-4 text-muted-foreground" />
            : <Newspaper className="h-4 w-4 text-muted-foreground" />}
          <h2 className="font-semibold text-sm">
            {activeSection === "pakistan" ? "Pakistan News"
              : activeSection === "regional" ? "Regional News"
              : activeSection === "world" ? "World News"
              : activeSection === "sports" ? "Sports News"
              : "Latest Stories"}
          </h2>
          <span className="text-xs text-muted-foreground">({feedStories.length})</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2.5">
            {feedStories.map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} />
            ))}
            {feedStories.length === 0 && topStories.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-12 space-y-2">
                <p>No stories available yet.</p>
                <p className="text-xs">Try Refresh in a moment if a scrape is still finishing.</p>
              </div>
            )}
            {filtered.length === 0 && visibleStories.length > 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No stories matched the current filters — showing the latest feed instead.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Index;
