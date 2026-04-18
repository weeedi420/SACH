import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStory, fetchClaims } from "@/lib/api";
import { getSource, sources } from "@/data/sources";
import { getInternationalSource } from "@/data/international-sources";
import { BiasIndicator } from "@/components/news/BiasIndicator";
import { ClaimCard } from "@/components/news/ClaimCard";
import { getBiasColor, getBiasLabel, timeAgo, getTopicColor } from "@/data/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, Users, Shield, Building2, ExternalLink, Clock, CheckCircle2, BookOpen, ChevronDown, ChevronUp, Globe, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { stripMarkdown } from "@/lib/markdown";

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function StoryDetail() {
  const { id } = useParams();
  const [biasOpen, setBiasOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStory(id!),
    enabled: !!id,
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["claims", id],
    queryFn: () => fetchClaims(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (story) {
      const desc = story.aiSummary
        ? story.aiSummary.substring(0, 155)
        : `${story.coverages.length} sources covering: ${story.title}. Compare how Pakistani media reports this story.`;
      document.title = `${story.title} — Sachhh`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
      metaDesc.setAttribute("content", desc);

      const ogTags: Record<string, string> = {
        "og:title": story.title,
        "og:description": desc,
        "og:type": "article",
        "article:published_time": story.publishedAt,
        "article:section": story.topic,
        "article:tag": `${story.topic}, ${story.region}, Pakistan News`,
      };
      Object.entries(ogTags).forEach(([prop, content]) => {
        let tag = document.querySelector(`meta[property="${prop}"]`);
        if (!tag) { tag = document.createElement("meta"); tag.setAttribute("property", prop); document.head.appendChild(tag); }
        tag.setAttribute("content", content);
      });
    }
    return () => { document.title = "Sachhh — Pakistan News Transparency"; };
  }, [story]);

  const toggleCard = (i: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (isLoading) {
    return (
      <main className="container py-6 max-w-4xl space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </main>
    );
  }

  if (!story) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Story not found.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">← Back to feed</Link>
      </div>
    );
  }

  const uniqueSourceIds = [...new Set(story.coverages.map((c) => c.sourceId))];
  const coveredSourceIds = uniqueSourceIds;
  const missingSources = sources.filter((s) => !coveredSourceIds.includes(s.id));
  const allContent = story.coverages.map((c) => c.fullContent || c.summary).join(" ");
  const readTime = estimateReadingTime(allContent);

  const domesticCoverages = story.coverages.filter((c) => !c.isInternational);
  const internationalCoverages = story.coverages.filter((c) => c.isInternational);
  const hasGlobalComparison = domesticCoverages.length > 0 && internationalCoverages.length > 0;

  const sortedCoverages = [...story.coverages].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    datePublished: story.publishedAt,
    dateModified: story.publishedAt,
    publisher: { "@type": "Organization", name: "Sachhh", url: "https://sachhh.com" },
    description: story.aiSummary || `Multi-source coverage of: ${story.title}`,
    articleBody: story.aiSummary || story.coverages[0]?.summary || "",
    keywords: [story.topic, story.region, "Pakistan News", "Media Transparency"].join(", "),
    isAccessibleForFree: true,
    about: story.coverages.map((c) => {
      const src = getSource(c.sourceId);
      return { "@type": "Organization", name: src?.name || c.sourceId };
    }),
  };

  return (
    <main className="container py-6 max-w-4xl space-y-8 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {story.isBreaking && (
            <Badge variant="destructive" className="text-[10px] gap-0.5">
              <Zap className="h-3 w-3" /> BREAKING
            </Badge>
          )}
          <Badge variant="secondary" className={getTopicColor(story.topic)}>{story.topic}</Badge>
          <span className="text-xs text-muted-foreground">{story.region}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {story.coverages.length} sources
          </span>
          {internationalCoverages.length > 0 && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Globe className="h-3 w-3" /> {internationalCoverages.length} international
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {readTime} min read
          </span>
          <span className="text-xs text-muted-foreground">· {timeAgo(story.publishedAt)}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">{story.title}</h1>
        {story.titleUrdu && (
          <p className="font-urdu text-lg text-muted-foreground leading-relaxed" dir="rtl">{story.titleUrdu}</p>
        )}
      </header>

      {/* AI Summary */}
      {story.aiSummary && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">Story Overview</h2>
                  <p className="text-[11px] text-muted-foreground">AI synthesis · read source coverage below</p>
                </div>
              </div>
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {story.aiSummary}
              </div>
              {story.keyPoints && story.keyPoints.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h3 className="text-sm font-medium">Key Facts</h3>
                  <ul className="space-y-1.5">
                    {story.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Bias Meter */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-sm font-semibold">Bias Distribution</h2>
          <BiasIndicator distribution={story.biasDistribution} size="md" />
          <Collapsible open={biasOpen} onOpenChange={setBiasOpen}>
            <CollapsibleTrigger className="text-xs text-primary hover:underline cursor-pointer">
              {biasOpen ? "Hide explanation" : "Why this bias score?"}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                This distribution shows the editorial alignment of sources covering this story.
              </p>
              <div className="flex flex-wrap gap-2">
                {story.coverages.map((c) => {
                  const source = getSource(c.sourceId);
                  if (!source) return null;
                  return (
                    <Badge key={c.sourceId} variant="outline" className={`text-[10px] ${getBiasColor(source.bias)}`}>
                      {source.name}: {getBiasLabel(source.bias)}
                    </Badge>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Coverage Timeline */}
      {sortedCoverages.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Coverage Timeline
          </h2>
          <div className="relative pl-6 space-y-3 border-l-2 border-border">
            {sortedCoverages.map((c, i) => {
              const source = getSource(c.sourceId);
              return (
                <div key={i} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{source?.name || c.sourceId}</span>
                    <span className="text-muted-foreground">{timeAgo(c.publishedAt)}</span>
                    {i === 0 && <Badge variant="secondary" className="text-[9px]">First to report</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Claims */}
      {claims.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Extracted Claims & Fact-Check</h2>
            <Badge variant="secondary" className="text-[10px]">{claims.length} claims</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {claims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)}
          </div>
        </section>
      )}

      {/* Global vs Pakistan Comparison */}
      {hasGlobalComparison && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Global vs Pakistan Coverage</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🇵🇰 Pakistan Media</h3>
              {domesticCoverages.map((c, i) => {
                const src = getSource(c.sourceId);
                return (
                  <Card key={i} className="border-l-2 border-l-primary">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{src?.name || c.sourceId}</span>
                        {src && <Badge className={`text-[9px] ${getBiasColor(src.bias)}`}>{getBiasLabel(src.bias)}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.headline}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🌍 International Media</h3>
              {internationalCoverages.map((c, i) => {
                const src = getInternationalSource(c.sourceId);
                return (
                  <Card key={i} className="border-l-2 border-l-accent">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{src?.name || c.sourceId}</span>
                        <Badge variant="outline" className="text-[9px]">International</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.headline}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Source Comparison */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">How Different Sources Cover This</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {story.coverages.map((coverage, i) => {
            const source = getSource(coverage.sourceId) || getInternationalSource(coverage.sourceId);
            const isExpanded = expandedCards.has(i);
            const cleanedContent = coverage.fullContent ? stripMarkdown(coverage.fullContent) : "";
            const hasContent = cleanedContent.length > 100;
            const preview = cleanedContent.substring(0, 500);

            return (
              <motion.div
                key={coverage.sourceId + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{source?.name || coverage.sourceId}</span>
                        {source && (
                          <span className="text-[10px] text-muted-foreground">
                            {source.credibility}% credibility
                          </span>
                        )}
                      </div>
                      {source && (
                        <Badge className={`text-[10px] ${getBiasColor(source.bias)}`}>
                          {getBiasLabel(source.bias)}
                        </Badge>
                      )}
                    </div>
                    {'ownership' in (source || {}) && (source as any)?.ownership && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {(source as any).ownership}
                      </div>
                    )}
                    <h3 className="font-medium text-sm leading-snug">{coverage.headline}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{coverage.summary ? stripMarkdown(coverage.summary) : ""}</p>

                    {hasContent && (
                      <div>
                        {isExpanded ? (
                          <div className="text-xs text-foreground leading-relaxed whitespace-pre-line break-words border-t border-border pt-2 mt-2">
                            {cleanedContent}
                          </div>
                        ) : (
                          preview && (
                            <p className="text-xs text-muted-foreground/70 leading-relaxed border-t border-border pt-2 mt-2 line-clamp-4">
                              {preview}...
                            </p>
                          )
                        )}
                        <button
                          onClick={() => toggleCard(i)}
                          className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-1"
                        >
                          {isExpanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read full article</>}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{timeAgo(coverage.publishedAt)}</span>
                      {coverage.url && coverage.url !== "#" && (
                        <a href={coverage.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                          Original <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Coverage Blind Spots removed - adds noise, not value */}
    </main>
  );
}
