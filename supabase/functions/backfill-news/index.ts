// backfill-news: Fetches historical news from GDELT (free, no API key needed)
// Covers past N weeks for Pakistan + world topics relevant to Pakistani audiences
// Usage: POST /functions/v1/backfill-news?weeks=4&offset=0
//   weeks  = how many weeks of history per call (default 2, max 4 to avoid timeout)
//   offset = weeks to skip back from today (default 0 = start from most recent)
//   topic  = specific topic query to run (optional, runs all if not set)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Topics to backfill — ordered by importance
const BACKFILL_TOPICS = [
  "pakistan politics government military",
  "pakistan economy imf rupee inflation",
  "iran us ceasefire hormuz strait",
  "israel gaza ceasefire war",
  "pakistan india relations border",
  "pakistan floods disaster relief",
  "pakistan cricket team match",
  "middle east conflict diplomacy",
  "pakistan china cpec investment",
  "imran khan PTI arrest",
];

// Trusted domains to accept from GDELT results
const TRUSTED_DOMAINS = new Set([
  "dawn.com","geo.tv","tribune.com.pk","thenews.com.pk","arynews.tv",
  "samaaenglish.tv","nation.com.pk","dunyanews.tv","propakistani.pk",
  "bbc.com","bbc.co.uk","reuters.com","aljazeera.com","theguardian.com",
  "nytimes.com","apnews.com","france24.com","dw.com","ndtv.com",
  "thehindu.com","middleeasteye.net","arabnews.com","arabnews.pk",
  "ft.com","economist.com","foreignpolicy.com","bloomberg.com",
]);

// Source ID mapping from domain
function domainToSourceId(domain: string): string {
  const map: Record<string, string> = {
    "dawn.com": "dawn", "geo.tv": "geo", "tribune.com.pk": "express",
    "thenews.com.pk": "thenews", "arynews.tv": "ary", "samaaenglish.tv": "samaa",
    "nation.com.pk": "nation", "dunyanews.tv": "dunyanews",
    "bbc.com": "bbc", "bbc.co.uk": "bbc", "reuters.com": "reuters",
    "aljazeera.com": "aljazeera", "theguardian.com": "guardian",
    "nytimes.com": "nyt", "apnews.com": "ap", "france24.com": "france24",
    "dw.com": "dw", "ndtv.com": "ndtv", "thehindu.com": "thehindu",
    "middleeasteye.net": "middleeasteye", "arabnews.com": "arabnews",
  };
  for (const [d, id] of Object.entries(map)) {
    if (domain.includes(d)) return id;
  }
  return domain.replace(/\.(com|net|org|co\.uk|tv|pk)$/, "").replace(/^www\./, "");
}

function isInternational(domain: string): boolean {
  const pkDomains = ["dawn.com","geo.tv","tribune.com.pk","thenews.com.pk","arynews.tv","samaaenglish.tv","nation.com.pk","dunyanews.tv","propakistani.pk","arabnews.pk"];
  return !pkDomains.some(d => domain.includes(d));
}

// Format date for GDELT: YYYYMMDDHHMMSS
function gdeltDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string; // YYYYMMDDTHHMMSSZ
  domain: string;
  sourcecountry: string;
  language: string;
}

async function fetchGdelt(query: string, startDate: Date, endDate: Date): Promise<GdeltArticle[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=250&format=json&startdatetime=${gdeltDate(startDate)}&enddatetime=${gdeltDate(endDate)}&sort=DateDesc&sourcelang=english`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.warn(`GDELT ${res.status} for: ${query}`); return []; }
    const data = await res.json();
    return (data.articles || []).filter((a: GdeltArticle) =>
      a.url && a.title && a.title.length > 20 && a.language === "English"
    );
  } catch (e) { console.error("GDELT fetch failed:", e); return []; }
}

// Parse GDELT seendate: 20260101T120000Z → ISO string
function gdeltDateToIso(seendate: string): string {
  try {
    const s = seendate.replace("T","").replace("Z","");
    const y = s.substring(0,4), mo = s.substring(4,6), d = s.substring(6,8);
    const h = s.substring(8,10)||"00", mi = s.substring(10,12)||"00";
    return `${y}-${mo}-${d}T${h}:${mi}:00Z`;
  } catch { return new Date().toISOString(); }
}

// Simple similarity check to avoid merging unrelated stories
const IMPORTANT_ENTITIES = new Set([
  "trump","netanyahu","khamenei","putin","zelensky","modi","biden",
  "nawaz","bilawal","maryam","shahbaz","zardari","munir","imran",
  "iran","iranian","israel","israeli","ukraine","ukrainian","russia","russian",
  "afghanistan","taliban","hamas","hezbollah","hormuz","tehran","kabul",
  "ceasefire","nuclear","airstrike","sanctions","blockade","hostage",
  "rupee","petrol","imf","cricket","olympics","fifa",
]);

function extractEntities(text: string): Set<string> {
  const ents = new Set<string>();
  const lower = text.toLowerCase();
  IMPORTANT_ENTITIES.forEach(e => {
    if (new RegExp(`\\b${e}\\b`).test(lower)) ents.add(e);
  });
  return ents;
}

function entityOverlap(a: Set<string>, b: Set<string>): number {
  let count = 0; a.forEach(e => { if (b.has(e)) count++; }); return count;
}

function getKeywords(text: string): Set<string> {
  const stop = new Set(["the","a","an","in","on","at","to","for","of","is","are","was","were","and","or","but","with","from","by","as","its","it","has","have","had","been","be","will","can","may","this","that","not","no","so","if","up","out","about","into","over","after","also","now","new","said","says","report","news"]);
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(w => w.length > 2 && !stop.has(w)));
}

function jaccardSim(a: Set<string>, b: Set<string>): number {
  let common = 0; a.forEach(w => { if (b.has(w)) common++; });
  const union = new Set([...a,...b]).size;
  return union === 0 ? 0 : common / union;
}

function shouldMerge(tA: string, sA: string, tB: string, sB: string): boolean {
  const eA = extractEntities(tA + " " + sA), eB = extractEntities(tB + " " + sB);
  const overlap = entityOverlap(eA, eB);
  if (overlap >= 2) return true;
  if (overlap >= 1) {
    const tSim = jaccardSim(getKeywords(tA), getKeywords(tB));
    if (tSim > 0.20) return true;
  }
  return jaccardSim(getKeywords(tA), getKeywords(tB)) > 0.45;
}

type StoryCategory = "geopolitics"|"conflict"|"economy"|"policy"|"security"|"sports"|"entertainment"|"other";

function classifyCategory(title: string): StoryCategory {
  const t = title.toLowerCase();
  if (/war|attack|bomb|missile|airstrike|kill|killed|troops|ceasefire|nuclear|hostage|blockade/.test(t)) return "conflict";
  if (/iran|israel|nato|ukraine|russia|diplomat|summit|treaty|sanction|un |iaea/.test(t)) return "geopolitics";
  if (/economy|gdp|inflation|imf|rupee|dollar|oil|petrol|trade|budget|debt|fiscal/.test(t)) return "economy";
  if (/police|security|terror|arrest|court|jail|crime|isi|military/.test(t)) return "security";
  if (/parliament|election|minister|government|law|bill|policy|vote/.test(t)) return "policy";
  if (/cricket|football|match|psl|fifa|olympic|sport|team/.test(t)) return "sports";
  if (/film|celebrity|music|entertainment|tv show|drama/.test(t)) return "entertainment";
  return "other";
}

function detectTopic(text: string): string {
  const t = text.toLowerCase();
  if (/cricket|psl|icc|fifa|olympic|sport/.test(t)) return "Sports";
  if (/economy|imf|rupee|trade|budget|inflation/.test(t)) return "Economy";
  if (/parliament|election|government|minister|policy/.test(t)) return "Politics";
  if (/war|attack|conflict|iran|israel|ukraine/.test(t)) return "World";
  return "World";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const reqUrl = new URL(req.url);
    const weeksToFetch = Math.min(4, parseInt(reqUrl.searchParams.get("weeks") || "2"));
    const offsetWeeks = parseInt(reqUrl.searchParams.get("offset") || "0");
    const specificTopic = reqUrl.searchParams.get("topic");

    const now = new Date();
    const endDate = new Date(now.getTime() - offsetWeeks * 7 * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - weeksToFetch * 7 * 24 * 60 * 60 * 1000);

    console.log(`Backfilling: ${startDate.toISOString().slice(0,10)} → ${endDate.toISOString().slice(0,10)}`);

    const topics = specificTopic ? [specificTopic] : BACKFILL_TOPICS;

    // Fetch articles from GDELT for each topic
    let gdeltArticles: GdeltArticle[] = [];
    for (const topic of topics) {
      const articles = await fetchGdelt(topic, startDate, endDate);
      gdeltArticles = gdeltArticles.concat(articles);
      console.log(`  ${topic}: ${articles.length} articles`);
    }

    console.log(`Total GDELT articles: ${gdeltArticles.length}`);

    // Filter to trusted domains only
    gdeltArticles = gdeltArticles.filter(a => {
      try {
        const domain = new URL(a.url).hostname.replace("www.", "");
        return TRUSTED_DOMAINS.has(domain) || [...TRUSTED_DOMAINS].some(d => domain.includes(d));
      } catch { return false; }
    });
    console.log(`After domain filter: ${gdeltArticles.length}`);

    // Dedup by URL against existing coverages
    const urls = gdeltArticles.map(a => a.url).filter(Boolean);
    const { data: existingCovs } = await supabase.from("coverages").select("url").in("url", urls.slice(0, 500));
    const existingUrls = new Set((existingCovs || []).map((c: any) => c.url));

    const seenUrls = new Set<string>();
    const articles = gdeltArticles.filter(a => {
      if (existingUrls.has(a.url) || seenUrls.has(a.url)) return false;
      seenUrls.add(a.url);
      return true;
    });
    console.log(`After URL dedup: ${articles.length} new articles`);

    if (articles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No new articles to backfill" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Convert GDELT articles to ScrapedArticle format
    interface ScrapedArticle {
      sourceId: string; title: string; summary: string; content: string;
      url: string; isInternational: boolean; publishedAt: string;
    }

    const scraped: ScrapedArticle[] = articles.map(a => {
      let domain = "";
      try { domain = new URL(a.url).hostname.replace("www.",""); } catch {}
      return {
        sourceId: domainToSourceId(domain),
        title: a.title.trim(),
        summary: a.title.trim(), // GDELT doesn't provide summaries — use title
        content: a.title.trim(),
        url: a.url,
        isInternational: isInternational(domain),
        publishedAt: gdeltDateToIso(a.seendate),
      };
    });

    // Filter junk
    const filtered = scraped.filter(a =>
      a.title.length >= 20 && a.title.length <= 300 &&
      !/^\d+$/.test(a.title) &&
      classifyCategory(a.title) !== "entertainment"
    );

    // Cluster using complete-linkage
    const grouped: number[][] = [];
    const assigned = new Set<number>();
    for (let i = 0; i < filtered.length; i++) {
      if (assigned.has(i)) continue;
      const group = [i];
      assigned.add(i);
      for (let j = i + 1; j < filtered.length; j++) {
        if (assigned.has(j)) continue;
        const mergesWithAll = group.every(k =>
          shouldMerge(filtered[k].title, filtered[k].summary, filtered[j].title, filtered[j].summary)
        );
        if (mergesWithAll) { group.push(j); assigned.add(j); }
      }
      grouped.push(group);
    }

    let storiesCreated = 0;
    let storiesRejected = 0;

    for (const group of grouped) {
      const arts = group.map(i => filtered[i]);
      const sourceIds = [...new Set(arts.map(a => a.sourceId))];

      // Require 2+ distinct outlets
      if (sourceIds.length < 2) { storiesRejected++; continue; }

      const category = classifyCategory(arts[0].title);
      if (category === "entertainment") { storiesRejected++; continue; }

      const combinedText = arts.map(a => a.title).join(" ");
      const topic = detectTopic(combinedText);
      const pubDate = arts.map(a => a.publishedAt).sort()[0]; // oldest article date

      // Create story
      const { data: story, error: storyErr } = await supabase.from("stories").insert({
        title: arts[0].title,
        topic,
        region: arts.some(a => a.isInternational) ? "Global" : "National",
        is_trending: sourceIds.length >= 3,
        bias_distribution: { establishment: 0, government: 0, opposition: 0, independent: sourceIds.length },
        published_at: pubDate,
        importance_score: Math.min(10, sourceIds.length * 2 + 2),
        is_breaking: false,
      }).select("id").single();

      if (storyErr || !story) { console.error("Story insert error:", storyErr?.message); continue; }

      // Insert coverages
      for (const art of arts) {
        await supabase.from("coverages").insert({
          story_id: story.id,
          source_id: art.sourceId,
          headline: art.title,
          summary: art.summary.substring(0, 500),
          full_content: null,
          url: art.url,
          published_at: art.publishedAt,
          is_international: art.isInternational,
        }).then(() => {});
      }

      storiesCreated++;
    }

    console.log(`Backfill complete: ${storiesCreated} stories created, ${storiesRejected} rejected`);

    return new Response(JSON.stringify({
      success: true,
      period: `${startDate.toISOString().slice(0,10)} to ${endDate.toISOString().slice(0,10)}`,
      articles_found: gdeltArticles.length,
      articles_new: articles.length,
      stories_created: storiesCreated,
      stories_rejected: storiesRejected,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("Backfill error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
