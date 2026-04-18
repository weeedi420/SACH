import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStories, fetchClaims } from "@/lib/api";
import { getSource } from "@/data/sources";
import { getBiasColor, getBiasLabel, timeAgo } from "@/data/utils";
import { EvidenceMatrix } from "@/components/news/EvidenceMatrix";
import { SourceIcon } from "@/components/news/SourceIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, MapPin, Grid3X3, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Transparency() {
  const { data: allStories = [], isLoading } = useQuery({
    queryKey: ["transparency-stories"],
    queryFn: fetchStories,
  });

  // Filter stories that have both local AND international coverages + decent coverage
  const transparentStories = allStories.filter((story) => {
    const coverages = story.coverages || [];
    const hasLocal = coverages.some((c) => !c.isInternational);
    const hasIntl = coverages.some((c) => c.isInternational === true);
    return hasLocal && hasIntl && coverages.length >= 2;
  });

  const [selectedStoryId, setSelectedStoryId] = useState<string>("");

  // Auto-select first available story
  const activeStoryId = selectedStoryId || transparentStories[0]?.id || "";
  const selectedStory = transparentStories.find((s) => s.id === activeStoryId);

  const { data: claims = [] } = useQuery({
    queryKey: ["claims", activeStoryId],
    queryFn: () => fetchClaims(activeStoryId),
    enabled: !!activeStoryId,
  });

  const localCoverages = selectedStory?.coverages?.filter((c) => !c.isInternational) || [];
  const intlCoverages = selectedStory?.coverages?.filter((c) => c.isInternational === true) || [];

  if (isLoading) {
    return (
      <main className="container py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full md:w-96" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-[500px]" />
          <Skeleton className="h-[500px]" />
          <Skeleton className="h-[500px]" />
        </div>
      </main>
    );
  }

  if (transparentStories.length === 0) {
    return (
      <main className="container py-6 space-y-6">
        <h1 className="text-xl font-bold">International Transparency</h1>
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No stories with both local and international coverage available right now.</p>
            <p className="text-xs text-muted-foreground">Check back soon — stories with mixed coverage will appear here automatically.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">International Transparency</h1>
        <p className="text-sm text-muted-foreground">Compare how local Pakistani sources and international outlets cover the same story. Stories shown automatically have both local and international coverage.</p>
      </div>

      <Select value={activeStoryId} onValueChange={setSelectedStoryId}>
        <SelectTrigger className="w-full md:w-[500px]">
          <SelectValue placeholder="Select a story" />
        </SelectTrigger>
        <SelectContent>
          {transparentStories.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px]">{s.topic}</Badge>
                <span className="text-sm truncate">{s.title}</span>
                <Badge variant="outline" className="text-[9px]">{s.coverages.length} sources</Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedStory && (
        <>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{selectedStory.title}</h2>
            {selectedStory.titleUrdu && <p className="font-urdu text-sm text-muted-foreground" dir="rtl">{selectedStory.titleUrdu}</p>}
          </div>

          {/* Three Rails */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Rail A: Local Coverage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Local Coverage</h3>
                <Badge variant="secondary" className="text-[10px]">{localCoverages.length}</Badge>
              </div>
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-3">
                  {localCoverages
                    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
                    .map((coverage, i) => {
                      const source = getSource(coverage.sourceId);
                      return (
                        <motion.div key={`local-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card>
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <SourceIcon type={source?.type || "online"} className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium">{source?.name || coverage.sourceId}</span>
                                </div>
                                {source && <Badge className={`text-[9px] ${getBiasColor(source.bias)}`}>{getBiasLabel(source.bias)}</Badge>}
                              </div>
                              <h4 className="text-xs font-medium leading-snug">{coverage.headline}</h4>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{coverage.summary}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timeAgo(coverage.publishedAt)}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>

            {/* Rail B: International Coverage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">International Coverage</h3>
                <Badge variant="secondary" className="text-[10px]">{intlCoverages.length}</Badge>
              </div>
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-3">
                  {intlCoverages
                    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
                    .map((coverage, i) => {
                      const source = getSource(coverage.sourceId);
                      return (
                        <motion.div key={`intl-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="border-primary/20">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium">{source?.name || coverage.sourceId}</span>
                                </div>
                                {source?.country && <Badge variant="outline" className="text-[9px]">{source.country}</Badge>}
                              </div>
                              <h4 className="text-xs font-medium leading-snug">{coverage.headline}</h4>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{coverage.summary}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timeAgo(coverage.publishedAt)}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>

            {/* Rail C: Evidence Matrix */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Evidence Matrix</h3>
                <Badge variant="secondary" className="text-[10px]">{claims.length} claims</Badge>
              </div>
              <ScrollArea className="h-[500px]">
                {claims.length > 0 ? (
                  <EvidenceMatrix claims={claims} />
                ) : (
                  <p className="text-xs text-muted-foreground p-4">No claims extracted for this story yet.</p>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Timeline */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Reporting Timeline</h3>
              <div className="space-y-2">
                {[...localCoverages, ...intlCoverages]
                  .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
                  .map((coverage, i) => {
                    const isIntl = coverage.isInternational;
                    const source = getSource(coverage.sourceId);
                    return (
                      <div key={`tl-${i}`} className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground w-24 shrink-0 text-[10px]">
                          {new Date(coverage.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${isIntl ? "bg-primary" : "bg-muted-foreground"}`} />
                        <SourceIcon type={source?.type || "online"} className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{source?.name || coverage.sourceId}</span>
                        {isIntl && <Badge variant="outline" className="text-[9px]">Intl</Badge>}
                        {i === 0 && <Badge className="text-[9px] bg-primary text-primary-foreground">First</Badge>}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
