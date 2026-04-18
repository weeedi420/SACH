import { supabase } from "@/integrations/supabase/client";
import type { NewsStory, ArticleCoverage, Claim } from "@/data/types";

interface DbStory {
  id: string;
  title: string;
  title_urdu: string | null;
  topic: string;
  region: string;
  is_trending: boolean;
  published_at: string;
  image_url: string | null;
  bias_distribution: any;
  created_at: string;
  ai_summary: string | null;
  key_points: any;
  importance_score: number;
  is_breaking: boolean;
}

interface DbCoverage {
  id: string;
  story_id: string;
  source_id: string;
  headline: string;
  summary: string | null;
  full_content?: string | null;
  url: string | null;
  published_at: string | null;
  is_international: boolean;
}

function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestDateString(values: Array<string | null | undefined>, fallback: string): string {
  let latest = fallback;
  let latestTimestamp = toTimestamp(fallback);

  values.forEach((value) => {
    const timestamp = toTimestamp(value);
    if (timestamp > latestTimestamp && value) {
      latest = value;
      latestTimestamp = timestamp;
    }
  });

  return latest;
}

function deduplicateCoverages(coverages: DbCoverage[]): DbCoverage[] {
  const bySource = new Map<string, DbCoverage>();

  coverages.forEach((coverage) => {
    const existing = bySource.get(coverage.source_id);
    if (!existing || toTimestamp(coverage.published_at) > toTimestamp(existing.published_at)) {
      bySource.set(coverage.source_id, coverage);
    }
  });

  return Array.from(bySource.values()).sort(
    (a, b) => toTimestamp(b.published_at) - toTimestamp(a.published_at)
  );
}

function mapDbToStory(row: DbStory, coverages: DbCoverage[]): NewsStory {
  const dedupedCoverages = deduplicateCoverages(coverages);
  const effectivePublishedAt = getLatestDateString(
    [row.published_at, ...dedupedCoverages.map((coverage) => coverage.published_at)],
    row.published_at
  );

  const cleanText = (t: string) =>
    t
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\r\n\s*\t+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

  return {
    id: row.id,
    title: row.title,
    titleUrdu: row.title_urdu || undefined,
    topic: row.topic as any,
    region: row.region as any,
    coverages: dedupedCoverages.map((coverage) => ({
      sourceId: coverage.source_id,
      headline: cleanText(coverage.headline),
      summary: cleanText(coverage.summary || ""),
      fullContent: coverage.full_content || undefined,
      url: coverage.url || "#",
      publishedAt: coverage.published_at || effectivePublishedAt,
      isInternational: coverage.is_international || false,
    })),
    biasDistribution: row.bias_distribution || { establishment: 0, government: 0, opposition: 0, independent: 0 },
    isTrending: row.is_trending,
    publishedAt: effectivePublishedAt,
    imageUrl: row.image_url || undefined,
    aiSummary: row.ai_summary || undefined,
    keyPoints: Array.isArray(row.key_points) ? row.key_points : undefined,
    importanceScore: row.importance_score || 0,
    isBreaking: row.is_breaking || false,
  };
}

export async function fetchStories(): Promise<NewsStory[]> {
  const { data: primaryStories, error: storiesErr } = await supabase
    .from("stories")
    .select("*")
    .gte("published_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .gte("importance_score", 3)
    .order("importance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(80);

  if (storiesErr) return [];

  let storiesData = primaryStories || [];

  if (storiesData.length < 8) {
    const { data: backupStories } = await supabase
      .from("stories")
      .select("*")
      .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .gte("importance_score", 1)
      .order("importance_score", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(120);

    const merged = new Map<string, any>();
    [...storiesData, ...(backupStories || [])].forEach((story: any) => {
      if (!merged.has(story.id)) merged.set(story.id, story);
    });
    storiesData = Array.from(merged.values());
  }

  if (storiesData.length === 0) return [];

  const storyIds = storiesData.map((story: any) => story.id);
  const { data: coveragesData } = await supabase
    .from("coverages")
    .select("id, story_id, source_id, headline, summary, url, published_at, is_international")
    .in("story_id", storyIds);

  const coveragesByStory: Record<string, DbCoverage[]> = {};
  (coveragesData || []).forEach((coverage: any) => {
    if (!coveragesByStory[coverage.story_id]) coveragesByStory[coverage.story_id] = [];
    coveragesByStory[coverage.story_id].push(coverage);
  });

  const stories = storiesData.map((story: any) => mapDbToStory(story, coveragesByStory[story.id] || []));

  // Always return stories — processFeedStories is for ranking, not hard gating
  const processedStories = processFeedStories(stories);
  if (processedStories.length > 0) return processedStories;

  // If processFeedStories filtered everything, return all stories sorted by freshness
  if (stories.length > 0) {
    return [...stories].sort(
      (a, b) => getStoryFreshnessTimestamp(b) - getStoryFreshnessTimestamp(a)
    );
  }

  return [];
}

const LOCAL_TIER1_IDS = new Set([
  "dawn",
  "geo",
  "ary",
  "express",
  "express-tribune",
  "jang",
  "thenews",
  "bol",
  "samaa",
  "propakistani",
  "nawaiwaqt",
  "dunya",
  "aaj",
  "ptv",
  "92news",
]);

function countTier1Sources(coverages: Array<{ sourceId: string }>): number {
  return coverages.filter((coverage) => LOCAL_TIER1_IDS.has((coverage.sourceId || "").toLowerCase())).length;
}

function isPakistanStory(story: NewsStory): boolean {
  const region = (story.region || "").toLowerCase();
  return ["pakistan", "national", "punjab", "sindh", "kpk", "balochistan", "islamabad", "regional"].some((token) =>
    region.includes(token)
  );
}

const GALLERY_PATTERNS = [
  /photos?\s*of\s*the\s*(day|week)/i,
  /week\s*in\s*pictures/i,
  /photo\s*gallery/i,
  /pictures?\s*of\s*the\s*(day|week)/i,
];

const ENTERTAINMENT_PATTERNS = [
  /\b(justin baldoni|blake lively|hailee steinfeld|josh allen|tiger woods|the weeknd|kristi noem)\b/i,
  /\b(hollywood|netflix|season \d|biopic|movie|film release)\b/i,
  /\b(queen elizabeth|king charles|royal family|stamp|commemorative)\b/i,
  /\b(storm dave|easter travel|weather forecast)\b/i,
  /\b(breaks silence|becomes parent|first child)\b/i,
  /\b(olivia attwood|johnny depp|peaky blinders|xo kitty)\b/i,
];

function normalizeTitleKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\b(pakistan|iran|us|trump|shehbaz|khawaja|dawn|express|geo|ary)\b/g, "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !["the", "and", "for", "with", "from", "has", "said", "that", "this", "been"].includes(word))
    .sort()
    .slice(0, 8);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = Array.from(setA).filter((value) => setB.has(value)).length;
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function getStoryFreshnessTimestamp(story: Pick<NewsStory, "publishedAt" | "coverages">): number {
  return Math.max(
    toTimestamp(story.publishedAt),
    ...story.coverages.map((coverage) => toTimestamp(coverage.publishedAt))
  );
}

function mergeStoryCoverages(stories: NewsStory[]): ArticleCoverage[] {
  const mergedBySource = new Map<string, ArticleCoverage>();

  stories.forEach((story) => {
    story.coverages.forEach((coverage) => {
      const existing = mergedBySource.get(coverage.sourceId);
      if (!existing || toTimestamp(coverage.publishedAt) > toTimestamp(existing.publishedAt)) {
        mergedBySource.set(coverage.sourceId, coverage);
      }
    });
  });

  return Array.from(mergedBySource.values()).sort(
    (a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt)
  );
}

function processFeedStories(stories: NewsStory[]): NewsStory[] {
  const now = Date.now();
  const freshnessHours = 72;

  const candidates = stories.filter((story) => {
    if ((story.importanceScore || 0) < 3) return false;
    if (GALLERY_PATTERNS.some((pattern) => pattern.test(story.title))) return false;
    if (ENTERTAINMENT_PATTERNS.some((pattern) => pattern.test(story.title))) return false;

    const ageHours = (now - getStoryFreshnessTimestamp(story)) / (1000 * 60 * 60);
    return ageHours <= freshnessHours;
  });

  const groups: Array<{ primary: NewsStory; keywords: string[]; members: NewsStory[] }> = [];

  for (const story of candidates) {
    const keywords = normalizeTitleKeywords(story.title);
    let merged = false;

    for (const group of groups) {
      const similarity = jaccardSimilarity(keywords, group.keywords);
      const timeDiffHours = Math.abs(getStoryFreshnessTimestamp(story) - getStoryFreshnessTimestamp(group.primary)) / (1000 * 60 * 60);

      if (similarity > 0.65 && timeDiffHours < 72) {
        group.members.push(story);

        const currentTier1 = countTier1Sources(group.primary.coverages);
        const nextTier1 = countTier1Sources(story.coverages);
        if (nextTier1 > currentTier1 || (nextTier1 === currentTier1 && story.coverages.length > group.primary.coverages.length)) {
          group.primary = story;
        }

        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push({ primary: story, keywords, members: [story] });
    }
  }

  const mergedStories = groups.map((group) => {
    const mergedCoverages = mergeStoryCoverages(group.members);
    const mergedPublishedAt = getLatestDateString(
      [
        ...group.members.map((story) => story.publishedAt),
        ...mergedCoverages.map((coverage) => coverage.publishedAt),
      ],
      group.primary.publishedAt
    );

    return {
      ...group.primary,
      coverages: mergedCoverages,
      publishedAt: mergedPublishedAt,
    };
  });

  mergedStories.sort((a, b) => {
    const hoursA = (now - getStoryFreshnessTimestamp(a)) / (1000 * 60 * 60);
    const hoursB = (now - getStoryFreshnessTimestamp(b)) / (1000 * 60 * 60);

    const breakingA = a.isBreaking ? 50 : 0;
    const breakingB = b.isBreaking ? 50 : 0;

    const recencyA = hoursA < 6 ? 10 : hoursA < 12 ? 7 : hoursA < 24 ? 4 : hoursA < 48 ? 1 : 0;
    const recencyB = hoursB < 6 ? 10 : hoursB < 12 ? 7 : hoursB < 24 ? 4 : hoursB < 48 ? 1 : 0;

    const coverageA = Math.log2(a.coverages.length + 1) * 5;
    const coverageB = Math.log2(b.coverages.length + 1) * 5;

    const tierBonusA = isPakistanStory(a) ? countTier1Sources(a.coverages) * 3.5 : countTier1Sources(a.coverages);
    const tierBonusB = isPakistanStory(b) ? countTier1Sources(b.coverages) * 3.5 : countTier1Sources(b.coverages);

    const scoreA = ((a.importanceScore || 0) * 6) + coverageA + recencyA + breakingA + tierBonusA;
    const scoreB = ((b.importanceScore || 0) * 6) + coverageB + recencyB + breakingB + tierBonusB;

    return scoreB - scoreA;
  });

  return mergedStories;
}

export async function fetchStory(id: string): Promise<NewsStory | null> {
  const { data: storyData, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !storyData) return null;

  const { data: coveragesData } = await supabase
    .from("coverages")
    .select("*")
    .eq("story_id", id);

  return mapDbToStory(storyData as any, (coveragesData || []) as any);
}

export async function fetchClaims(storyId: string): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("story_id", storyId)
    .order("confidence", { ascending: false });

  if (error || !data) return [];

  return data.map((claim: any) => ({
    id: claim.id,
    storyId: claim.story_id,
    text: claim.text,
    supportingSources: Array.isArray(claim.supporting_sources) ? claim.supporting_sources : [],
    contradictingSources: Array.isArray(claim.contradicting_sources) ? claim.contradicting_sources : [],
    confidence: claim.confidence,
    explanation: claim.explanation,
    category: claim.category as any,
  }));
}

export async function searchStories(query: string): Promise<NewsStory[]> {
  const q = `%${query}%`;
  const { data: storiesData } = await supabase
    .from("stories")
    .select("*")
    .or(`title.ilike.${q},topic.ilike.${q},region.ilike.${q}`)
    .order("importance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(20);

  if (!storiesData || storiesData.length === 0) return [];

  const storyIds = storiesData.map((story: any) => story.id);
  const { data: coveragesData } = await supabase
    .from("coverages")
    .select("*")
    .in("story_id", storyIds);

  const coveragesByStory: Record<string, DbCoverage[]> = {};
  (coveragesData || []).forEach((coverage: any) => {
    if (!coveragesByStory[coverage.story_id]) coveragesByStory[coverage.story_id] = [];
    coveragesByStory[coverage.story_id].push(coverage);
  });

  return storiesData.map((story: any) => mapDbToStory(story, coveragesByStory[story.id] || []));
}
