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

  // Main feed EXCLUDES sports (sports has its own tab)
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
    
    // Fire scraper but don't wait forever
    const scrapePromise = supabase.functions.invoke("scrape-news").catch(() => null);
    const timeout = new Promise(resolve => setTimeout(resolve, 15000));
    
    // Wait max 15s for scraper, then refetch from DB regardless
    await Promise.race([scrapePromise, timeout]);
    
    try {
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
      const freshStories = await queryClient.fetchQuery({
        queryKey: ["stories"],
        queryFn: fetchStories,
      });
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

  return (
    <main className="container py-6 space-y-5 max-w-3xl mx-auto">
      {/* Header + Refresh */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">
          {activeSection === "sports" ? "Sports" : "News Feed"}
        </h1>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" disabled={isRefreshing} onClick={handleRefresh}>
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
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

      {/* Top Stories - only in "all" tab, excludes sports */}
      {activeSection === "all" && !isLoading && (() => {
        const topStories = mainFeedStories
          .filter(s => (s.importanceScore || 0) >= 8 && s.coverages.length >= 2)
          .slice(0, 5);
        if (topStories.length === 0) return null;
        return (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Top Stories</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {topStories.map((story, i) => (
                <motion.div key={story.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/story/${story.id}`}>
                    <Card className="border-primary/20 bg-primary/[0.03] hover:shadow-sm transition-all cursor-pointer">
                      <CardContent className="p-3 space-y-1.5">
                        <span className="text-[10px] font-medium text-primary">{story.topic} · {story.region}</span>
                        <h3 className="font-semibold text-xs leading-snug line-clamp-2">{story.title}</h3>
                        {story.aiSummary && <p className="text-[10px] text-muted-foreground line-clamp-2">{story.aiSummary}</p>}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{story.coverages.length} sources</span>
                          <BiasIndicator distribution={story.biasDistribution} />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Feed */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          {activeSection === "sports" ? <Trophy className="h-4 w-4 text-muted-foreground" /> : <Newspaper className="h-4 w-4 text-muted-foreground" />}
          <h2 className="font-semibold text-sm">
            {activeSection === "pakistan" ? "Pakistan News" 
              : activeSection === "regional" ? "Regional News" 
              : activeSection === "world" ? "World News"
              : activeSection === "sports" ? "Sports News"
              : "Latest Stories"}
          </h2>
          <span className="text-xs text-muted-foreground">({visibleStories.length})</span>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleStories.map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} />
            ))}
            {visibleStories.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-12 space-y-2">
                <p>No stories available yet.</p>
                <p className="text-xs">Try Refresh in a moment if a scrape is still finishing.</p>
              </div>
            )}
            {filtered.length === 0 && visibleStories.length > 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No stories matched the current filters, so showing the latest live feed instead.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Index;
