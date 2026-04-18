import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NEWS_SOURCES = [
  { id: "dawn", name: "Dawn", url: "https://www.dawn.com", bias: "anti-establishment", international: false, tier: 2 },
  { id: "geo", name: "Geo News", url: "https://www.geo.tv", bias: "government", international: false, tier: 3 },
  { id: "ary", name: "ARY News", url: "https://arynews.tv", bias: "opposition", international: false, tier: 3 },
  { id: "express", name: "Express Tribune", url: "https://tribune.com.pk", bias: "independent", international: false, tier: 2 },
  { id: "thenews", name: "The News International", url: "https://www.thenews.com.pk", bias: "government", international: false, tier: 3 },
  { id: "samaa", name: "Samaa TV", url: "https://www.samaaenglish.tv", bias: "opposition", international: false, tier: 3 },
  { id: "propakistani", name: "ProPakistani", url: "https://propakistani.pk", bias: "independent", international: false, tier: 3 },
  { id: "bbc", name: "BBC News", url: "https://www.bbc.co.uk/news", bias: "independent", international: true, tier: 1 },
  { id: "reuters", name: "Reuters", url: "https://www.reuters.com", bias: "independent", international: true, tier: 1 },
  { id: "aljazeera", name: "Al Jazeera", url: "https://www.aljazeera.com", bias: "independent", international: true, tier: 1 },
  { id: "ap", name: "Associated Press", url: "https://apnews.com", bias: "independent", international: true, tier: 1 },
  { id: "guardian", name: "The Guardian", url: "https://www.theguardian.com", bias: "independent", international: true, tier: 2 },
];

const SOURCE_TIER: Record<string, number> = {};
NEWS_SOURCES.forEach(s => { SOURCE_TIER[s.id] = s.tier; });

const RSS_FEEDS: Record<string, string> = {
  dawn: "https://www.dawn.com/feed",
  geo: "https://www.geo.tv/rss/1/0",
  express: "https://tribune.com.pk/feed/home",
  bbc: "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
  aljazeera: "https://www.aljazeera.com/xml/rss/all.xml",
  guardian: "https://www.theguardian.com/world/pakistan/rss",
  reuters: "https://www.reuters.com/rssFeed/worldNews",
  ap: "https://rsshub.app/apnews/topics/world-news",
};

interface ScrapedArticle {
  sourceId: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  isInternational: boolean;
}

type StoryCategory = "geopolitics" | "economy" | "policy" | "security" | "conflict" | "sports" | "entertainment" | "other";

// ============ JUNK FILTERS ============
const JUNK_TITLE_PATTERNS = [
  /latest news updates/i, /photos\s*&\s*videos/i, /^breaking news$/i,
  /^business news\s*[-–]/i, /^latest top news/i, /prayer time/i,
  /pakistan\s*[-–]\s*latest/i, /around the world/i, /economy from pakistan/i,
  /^home\s*[-–|]/i, /subscribe to/i, /notification/i, /cookie/i,
  /sign\s*in/i, /log\s*in/i, /^archives$/i, /\/archives$/i,
  /^science\s*&\s*technology\s*[-–]/i, /^entertainment\s*[-–]/i,
  /[-–]\s*(?:ary news|geo news|geo tv|dawn news)\s*$/i,
  /^geo headlines/i, /tv shows?$/i, /drama\s*(?:list|serial|episode)/i,
  /rate in pakistan today/i, /price in pakistan today/i, /gold\s*rate\s*today/i,
  /^latest pakistan news$/i, /^pakistan news$/i, /^top stories$/i, /^trending\s*(?:news)?$/i,
  /here'?s everything to know/i, /here'?s what to know/i,
  /photos?\s*of\s*the\s*(day|week)/i, /week\s*in\s*pictures/i,
  /photo\s*gallery/i, /pictures?\s*of\s*the\s*(day|week)/i,
];

const CELEBRITY_PATTERNS = [
  /\b(?:kardashian|jenner|bieber|swift|beyonce|rihanna|drake|kanye|ye\b)/i,
  /\b(?:zendaya|tom holland|megan fox|mgk|machine gun kelly)/i,
  /\b(?:sabrina carpenter|olivia rodrigo|dua lipa|selena gomez)/i,
  /\b(?:howie mandel|kelly ripa|james mcavoy|eva longoria)/i,
  /\b(?:mrbeast|logan paul|jake paul|pewdiepie|ksi)/i,
  /\b(?:showbiz|bollywood|hollywood gossip|celebrity|red carpet)/i,
  /\b(?:cardi\s*b|ariana grande|miley cyrus|lady gaga|billie eilish)/i,
  /\b(?:johnny depp|amber heard|brad pitt|angelina jolie)/i,
  /\b(?:peaky blinders|xo kitty|squid game|stranger things|bridgerton)/i,
  /\b(?:netflix|hulu|disney\+|streaming|binge.?watch)/i,
  /\b(?:love island|bachelor(?:ette)?|big brother|survivor|reality tv)/i,
  /\b(?:duchess|meghan markle|prince harry|royal family|archie|lilibet)/i,
  /\b(?:dating rumou?r|celebrity split|relationship drama)/i,
  /\bmarriage rumou?rs?\b/i, /\bsecret birth\b/i, /\bfatherly moments?\b/i,
  /\bcan'?t stop gushing\b/i, /\bshares true feelings\b/i,
  /\bmakes? (?:major )?announcement after leaked/i,
  /\btakes? a dig at\b.*\bwife\b/i,
  /\bsparks? panic with.*exit announcement/i,
  /\brum brand\b/i, /\btattoo reveal/i, /\bwardrobe malfunction/i,
];

function isCelebrityJunk(title: string): boolean {
  return CELEBRITY_PATTERNS.some(p => p.test(title));
}

const VIDEO_URL_PATTERNS = [/\/shows\//i, /\/videos?\//i, /\/watch\//i, /\/live\//i, /\/programs?\//i, /\/episodes?\//i, /\/tv\//i];

function isVideoUrl(url: string): boolean { return VIDEO_URL_PATTERNS.some(p => p.test(url)); }
function isJunkTitle(title: string): boolean {
  if (!title || title.length < 20 || title.length > 300) return true;
  if (JUNK_TITLE_PATTERNS.some(p => p.test(title))) return true;
  if (isCelebrityJunk(title)) return true;
  return false;
}

function stripTitleSuffix(title: string): string {
  return title
    .replace(/\s*[-–|]\s*(?:Dawn|Geo|ARY|Express Tribune|The News|Samaa|ProPakistani|BBC|Reuters|Al Jazeera|AP News?|The Guardian|Associated Press|Dawn News|Geo News|ARY News)\s*$/i, "")
    .replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

// ============ BOILERPLATE CONTENT DETECTOR ============
const BOILERPLATE_PATTERNS = [
  /Enable accessibility/i,
  /Login or register to continue/i,
  /\nMenu\n/,
  /\nSECTIONS\n/,
  /\nTOP STORIES\n/,
  /\nNewsletters\n/,
  /\nSee All Newsletters\n/,
  /\nAP QUIZZES\n/,
  /Skip to main content/i,
  /Learn more aboutRefinitiv/i,
  /Purchase Licensing Rights/i,
  /Advertisement · Scroll to continue/i,
  /Sign up here\.\n\nAdvertisement/i,
  /Cookie\s*(?:policy|settings|notice)/i,
  /Subscribe\s*(?:now|to|for)\s/i,
  /\nRelated Articles?\n/i,
  /\nMore (?:Videos?|Stories|News)\n/i,
];

const GENERIC_NEWS_TITLE_PATTERNS = [
  /^international news today\b/i,
  /^breaking news(?:\s*[-:–|]|$)/i,
  /\bbreaking news\b.*\bworld news\b/i,
  /\bus news\b.*\bworld news\b/i,
  /\btop headlines\b/i,
  /\bnews bulletin\b/i,
  /\blive updates?\b/i,
  /\bminute by minute\b/i,
  /\broundup\b/i,
];

const LOW_SIGNAL_LEAD_PATTERNS = [
  /^(?:this|a|an|the)\s+(?:collage|photo|image|handout|file photo|satellite image)[^.]{0,220}(?:reuters|app|afp|ap)\b/i,
  /^(?:military vehicles|heavy machinery|international monetary fund logo|supporters|police officers|traders|people|smoke rises|rescue workers|palestinians|demonstrators)[^.]{0,220}(?:reuters|app|afp|ap)\b/i,
  /^\s*(?:by\s+)?(?:reuters|app|afp|ap)\b/i,
  /&mdash;\s*(?:Reuters|APP|AFP|AP)\b/i,
];

function isBoilerplateContent(text: string): boolean {
  if (!text || text.length < 50) return false;
  let matchCount = 0;
  for (const pattern of BOILERPLATE_PATTERNS) {
    if (pattern.test(text)) matchCount++;
    if (matchCount >= 2) return true;
  }
  // If the "article" is mostly navigation (many short lines with dashes/bullets)
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const bulletLines = lines.filter(l => /^\s*[-•·]\s/.test(l) || /^\s*\d+\.\s/.test(l));
  if (lines.length > 10 && bulletLines.length / lines.length > 0.5) return true;
  return false;
}

function cleanBoilerplate(text: string): string {
  if (!text) return "";
  let t = text;
  // Remove CDATA wrappers
  t = t.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "");
  // Remove HTML tags
  t = t.replace(/<[^>]+>/g, "");
  // Remove common boilerplate sections
  const cutMarkers = [
    /\n\s*(?:Enable accessibility|Login or register|Menu\n|SECTIONS\n|TOP STORIES|Newsletters|See All Newsletters|AP QUIZZES|Skip to main content|Advertisement|Related Articles?|More Videos?|More Stories|Cookie)/i,
  ];
  for (const p of cutMarkers) {
    const idx = t.search(p);
    if (idx > 100) t = t.substring(0, idx);
  }
  // Trim Reuters/AP boilerplate
  t = t.replace(/\n\s*(?:Our Standards|Thomson Reuters|Reporting by|Editing by|Writing by).*$/gms, "");
  // Remove excessive whitespace
  t = t.replace(/\n{3,}/g, "\n\n").replace(/\s{3,}/g, " ").trim();
  return t;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&mdash;/g, " — ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00a0/g, " ");
}

function stripLeadCaption(text: string): string {
  if (!text) return "";

  let t = decodeHtmlEntities(text)
    .replace(/\[\.\.\.\]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  t = t.replace(
    /^(?:this|a|an|the)\s+(?:collage|photo|image|handout|file photo|satellite image)[^.]{0,240}(?:—|-|–)\s*(?:Reuters|APP|AFP|AP)\s*/i,
    ""
  );
  t = t.replace(
    /^(?:military vehicles|heavy machinery|international monetary fund logo|supporters|police officers|traders|people|smoke rises|rescue workers|palestinians|demonstrators)[^.]{0,240}(?:—|-|–)\s*(?:Reuters|APP|AFP|AP)\s*/i,
    ""
  );
  t = t.replace(/^\s*(?:by\s+)?(?:Reuters|APP|AFP|AP)\s*/i, "");
  t = t.replace(/([.!?])([A-Z])/g, "$1 $2");

  return t.trim();
}

function hasGenericNewsTitle(title: string): boolean {
  return GENERIC_NEWS_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}

function hasLowSignalLead(text: string): boolean {
  return LOW_SIGNAL_LEAD_PATTERNS.some((pattern) => pattern.test(text));
}

function normalizeArticle(article: ScrapedArticle): void {
  article.title = stripTitleSuffix(decodeHtmlEntities(article.title || ""));
  article.summary = stripLeadCaption(cleanBoilerplate(article.summary || ""));
  article.content = stripLeadCaption(cleanBoilerplate(article.content || ""));

  if (!article.summary && article.content) {
    article.summary = article.content.substring(0, 500);
  }
}

function getArticleKey(article: ScrapedArticle): string {
  return `${article.sourceId}::${article.url || article.title}`;
}

function getEditorialRiskScore(article: ScrapedArticle): number {
  let score = 0;

  if (hasGenericNewsTitle(article.title)) score += 6;
  if (article.summary.length < 120) score += 2;
  if (article.content.length < 180) score += 2;
  if (hasLowSignalLead(article.summary) || hasLowSignalLead(article.content)) score += 3;
  if ((SOURCE_TIER[article.sourceId] || 3) >= 3) score += 1;
  if (!/[.!?]/.test(article.summary) && article.summary.length < 180) score += 1;

  return score;
}

function shouldForceAiReview(article: ScrapedArticle): boolean {
  return getEditorialRiskScore(article) >= 4;
}

// ============ BASIC CONTENT PRE-CLEAN ============
function preClean(text: string): string {
  if (!text) return "";
  let t = text;
  t = t.replace(/!\[.*?\]\(.*?\)/g, "");
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/\*{1,3}(.*?)\*{1,3}/g, "$1");
  t = t.replace(/_{1,3}(.*?)_{1,3}/g, "$1");
  t = t.replace(/^[-*_]{3,}\s*$/gm, "");
  t = t.replace(/^>\s?/gm, "");
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`([^`]+)`/g, "$1");
  const junkMarkers = [
    /\n\s*(?:More From|RECOMMENDED FOR YOU|Next Up|read more|most popular|latest stories|comments|related articles|trending now|you might also like|also read)\s*\n/i,
  ];
  for (const p of junkMarkers) {
    const idx = t.search(p);
    if (idx > 200) t = t.substring(0, idx);
  }
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t.substring(0, 5000);
}

// ============ GROQ AI (free tier — llama-3.3-70b-versatile) ============
async function callAI(prompt: string, maxTokens = 2000): Promise<string | null> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) {
    console.warn("GROQ_API_KEY not set, falling back to deterministic processing");
    return null;
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a news editor. Return only the requested output. No markdown fences." },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });
    if (res.status === 429) { console.warn("Groq rate limited, falling back to deterministic"); return null; }
    if (!res.ok) { console.error("Groq error:", res.status, await res.text()); return null; }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (e) {
    console.error("Groq call failed:", e);
    return null;
  }
}

// ============ DETERMINISTIC QUALITY FILTER (replaces AI gate for most articles) ============
function passesQualityFilter(article: ScrapedArticle): boolean {
  const { title, summary, content, url } = article;
  if (!title || title.length < 25) return false;
  if (isJunkTitle(title)) return false;
  if (hasGenericNewsTitle(title)) return false;
  if (url && isVideoUrl(url)) return false;
  const bestText = content.length >= summary.length ? content : summary;
  if (bestText.length < 90) return false;
  if (hasLowSignalLead(bestText) && bestText.length < 220) return false;
  if (!/[a-z]{3,}/i.test(bestText)) return false;
  // Check if content is mostly boilerplate
  if (content.length > 200 && isBoilerplateContent(content)) return false;
  // Check summary for CDATA / HTML junk
  if (/<!\[CDATA\[/.test(summary) || /<!\[CDATA\[/.test(title)) return false;
  return true;
}

// ============ AI HARD-GATE: Only for borderline articles ============
async function aiBatchVerify(articles: ScrapedArticle[]): Promise<ScrapedArticle[]> {
  if (articles.length === 0) return [];
  const verified: ScrapedArticle[] = [];
  
  for (let i = 0; i < articles.length; i += 6) {
    const batch = articles.slice(i, i + 6);
    const batchDesc = batch.map((a, idx) => 
      `[${idx}] Title: "${a.title}"\nText: "${(a.summary || a.content || "").substring(0, 300)}"`
    ).join("\n---\n");
    
    const result = await callAI(
      `You are a strict news content gate. For each article below, decide:
- PASS: It is real news with a clear headline and readable text
- FAIL: It is junk (gallery, nav page, cookie notice, video listing, gibberish, non-news, entertainment gossip)

Also clean the title: remove source suffixes like "- Dawn", "| Reuters", remove CDATA tags, HTML.

Respond ONLY with JSON array (no markdown):
[{"idx":0,"verdict":"PASS","cleanTitle":"..."},{"idx":1,"verdict":"FAIL","reason":"gallery page"}]

Articles:
${batchDesc}`,
      800
    );
    
    if (!result) {
      for (const a of batch) {
        if (!isJunkTitle(a.title) && !isVideoUrl(a.url) && (a.summary.length >= 40 || a.content.length >= 80)) {
          a.title = stripTitleSuffix(a.title);
          verified.push(a);
        }
      }
      continue;
    }
    
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        for (const a of batch) {
          if (a.title.length >= 25) { a.title = stripTitleSuffix(a.title); verified.push(a); }
        }
        continue;
      }
      const verdicts = JSON.parse(jsonMatch[0]);
      for (const v of verdicts) {
        if (v.verdict === "PASS" && batch[v.idx]) {
          const article = batch[v.idx];
          article.title = v.cleanTitle || stripTitleSuffix(article.title);
          verified.push(article);
        } else if (batch[v.idx]) {
          console.log(`AI REJECTED: "${batch[v.idx].title.substring(0, 60)}" — ${v.reason || "failed verification"}`);
        }
      }
    } catch {
      for (const a of batch) {
        if (a.title.length >= 25) { a.title = stripTitleSuffix(a.title); verified.push(a); }
      }
    }
    
    if (i + 6 < articles.length) await new Promise(r => setTimeout(r, 400));
  }
  
  return verified;
}

async function aiReviewPriorityArticles(articles: ScrapedArticle[]): Promise<{ approved: ScrapedArticle[]; rejected: { title: string; reason: string }[] }> {
  if (articles.length === 0) return { approved: [], rejected: [] };

  const approved: ScrapedArticle[] = [];
  const rejected: { title: string; reason: string }[] = [];

  for (let i = 0; i < articles.length; i += 4) {
    const batch = articles.slice(i, i + 4);
    const batchDesc = batch
      .map(
        (article, idx) =>
          `[${idx}] Source: ${article.sourceId}\nTitle: "${article.title}"\nSummary: "${(article.summary || "").substring(0, 240)}"\nContent: "${(article.content || "").substring(0, 320)}"`
      )
      .join("\n---\n");

    const result = await callAI(
      `You are the final editorial gate for a serious Pakistan/world news product.

For each article, return PASS only if it is a real, specific, newsworthy article with a clean headline and usable summary.
Return FAIL for generic roundup pages, vague aggregator titles, celebrity/showbiz, photo captions, image blurbs, thin snippets, or low-signal junk.

If passing, clean the title only (remove source suffix like "- Dawn", "| Reuters", fix CDATA tags). Keep the original summary unchanged.

Respond ONLY with JSON array:
[{"idx":0,"verdict":"PASS","cleanTitle":"..."},{"idx":1,"verdict":"FAIL","reason":"generic roundup"}]

Articles:
${batchDesc}`,
      900
    );

    if (!result) {
      for (const article of batch) {
        if (getEditorialRiskScore(article) >= 6 || hasGenericNewsTitle(article.title)) {
          rejected.push({ title: article.title, reason: "ai-unavailable-high-risk" });
        } else {
          approved.push(article);
        }
      }
      continue;
    }

    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array returned");

      const verdicts = JSON.parse(jsonMatch[0]);
      const seen = new Set<number>();

      for (const verdict of verdicts) {
        if (!batch[verdict.idx] || seen.has(verdict.idx)) continue;
        seen.add(verdict.idx);

        const article = batch[verdict.idx];
        if (verdict.verdict === "PASS") {
          article.title = stripTitleSuffix((verdict.cleanTitle || article.title).trim());
          // Keep original RSS summary — don't overwrite with AI-rewritten text
          approved.push(article);
        } else {
          rejected.push({ title: article.title, reason: verdict.reason || "ai-editorial-reject" });
        }
      }

      batch.forEach((article, idx) => {
        if (seen.has(idx)) return;
        if (getEditorialRiskScore(article) >= 6 || hasGenericNewsTitle(article.title)) {
          rejected.push({ title: article.title, reason: "ai-missing-verdict-high-risk" });
        } else {
          approved.push(article);
        }
      });
    } catch {
      for (const article of batch) {
        if (getEditorialRiskScore(article) >= 6 || hasGenericNewsTitle(article.title)) {
          rejected.push({ title: article.title, reason: "ai-parse-fallback-high-risk" });
        } else {
          approved.push(article);
        }
      }
    }

    if (i + 4 < articles.length) await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return { approved, rejected };
}

// ============ AI CONTENT CLEANER ============
async function aiCleanAndSummarize(title: string, rawText: string): Promise<{ cleaned: string; summary: string } | null> {
  if (!rawText || rawText.length < 200) return null;
  const result = await callAI(
    `Given this scraped news article titled "${title}", do TWO things:
1. CLEAN: Extract ONLY the actual news article paragraphs. Remove ALL: video player text, navigation, social buttons, cookie notices, "More Videos", photo credits, newsletters, category listings.
2. SUMMARIZE: Write a 3-5 sentence professional summary.
Respond in EXACT JSON (no markdown): {"cleaned":"[text]","summary":"[summary]"}
If no real content: {"cleaned":"","summary":""}
RAW TEXT:
${rawText.substring(0, 4000)}`,
    2500
  );
  if (!result) return null;
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.cleaned || parsed.cleaned.length < 100) return null;
    return { cleaned: parsed.cleaned, summary: parsed.summary || "" };
  } catch { return null; }
}

// ============ AI CATEGORY CLASSIFIER ============
function classifyCategoryFallback(title: string, summary: string): StoryCategory {
  const text = `${title} ${summary}`.toLowerCase();
  if (isCelebrityJunk(text) || /(movie|music|actor|actress|album|season|episode|concert|showbiz|tv show|streaming)/.test(text)) return "entertainment";
  if (/(cricket|football|soccer|match|tournament|goal|wicket|innings|fifa|icc|psl|league|cup|championship|medal|athlete)/.test(text)) return "sports";
  if (/(airstrike|missile|war|troops|killed|attack|bombing|ceasefire|battle|shelling|drone|offensive)/.test(text)) return "conflict";
  if (/(inflation|economy|trade|market|stocks|shares|fuel|petrol|diesel|oil|gas|imf|rupee|dollar|budget|tax|tariff)/.test(text)) return "economy";
  if (/(terror|security|military|army|police|border|militant|terrorist|defence|defense)/.test(text)) return "security";
  if (/(cabinet|court|law|policy|parliament|minister|regulation|ruling|bill|government decision)/.test(text)) return "policy";
  if (/(diplomacy|summit|sanction|ambassador|foreign minister|united nations|nato|china|india|iran|israel|palestine|afghanistan|russia|ukraine|usa|trump|biden)/.test(text)) return "geopolitics";
  return "other";
}

// Classification is now fully deterministic — no AI calls needed
function classifyCategory(title: string, summary: string): StoryCategory {
  return classifyCategoryFallback(title, summary);
}

// ============ AI STORY SUMMARIZER ============
async function summarizeStory(title: string, coverages: { headline: string; summary: string; content: string }[]): Promise<{ aiSummary: string; keyPoints: string[] } | null> {
  const coverageText = coverages.map((c, i) =>
    `Source ${i + 1}: "${c.headline}"\n${(c.content || c.summary || "").substring(0, 1200)}`
  ).join("\n---\n");

  const text = await callAI(
    `You are a neutral news editor for Sachhh. Be extremely concise.
Story: ${title}
Coverage:
${coverageText}
Write:
1. A 3-4 sentence summary (max 70 words). State the core facts only. No filler, no padding, no repetition.
2. 3-4 key bullet points (each under 15 words).
Respond in EXACT JSON (no markdown):
{"summary":"3-4 sentences max","keyPoints":["fact 1","fact 2","fact 3"]}`,
    600
  );
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return { aiSummary: parsed.summary || "", keyPoints: parsed.keyPoints || parsed.key_points || [] };
  } catch { return null; }
}

// ============ RSS FETCHER ============
async function fetchRssArticles(sourceId: string, feedUrl: string, source: typeof NEWS_SOURCES[0]): Promise<ScrapedArticle[]> {
  try {
    const res = await fetch(feedUrl, { headers: { "User-Agent": "Sachhh/1.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: ScrapedArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const x = match[1];
      let title = (x.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "").trim();
      const link = (x.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || "").trim();
      const desc = (x.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s)?.[1] || "").trim();
      title = stripTitleSuffix(title);
      if (!title || title.length < 20 || isJunkTitle(title)) continue;
      if (link && isVideoUrl(link)) continue;
      const cleanDesc = desc.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\r\n\s*\t+/g, " ").replace(/\s{2,}/g, " ").trim();
      items.push({ sourceId, title, summary: cleanDesc.substring(0, 500) || title, content: cleanDesc, url: link, isInternational: source.international });
    }
    if (items.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      while ((match = entryRegex.exec(xml)) !== null && items.length < 20) {
        const x = match[1];
        let title = (x.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "").trim();
        const link = (x.match(/<link[^>]*href="([^"]*)"/) || x.match(/<link>([^<]*)<\/link>/))?.[1] || "";
        const summary = (x.match(/<summary[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/summary>/s)?.[1] || "").trim();
        const cleanSummary = summary.replace(/<[^>]+>/g, "").trim();
        title = stripTitleSuffix(title);
        if (!title || title.length < 20 || isJunkTitle(title)) continue;
        items.push({ sourceId, title, summary: cleanSummary.substring(0, 500) || title, content: cleanSummary, url: link, isInternational: source.international });
      }
    }
    console.log(`RSS ${sourceId}: ${items.length} articles`);
    return items;
  } catch (e) {
    console.error(`RSS ${sourceId} failed:`, e);
    return [];
  }
}

// ============ FIRECRAWL SCRAPER ============
async function scrapeSource(source: typeof NEWS_SOURCES[0], firecrawlKey: string): Promise<ScrapedArticle[]> {
  try {
    const query = source.international
      ? `site:${new URL(source.url).hostname} Pakistan OR Iran OR Afghanistan OR India`
      : `site:${new URL(source.url).hostname} latest news today`;
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query, limit: source.international ? 8 : 10, tbs: "qdr:d",
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      }),
    });
    if (!response.ok) { console.error(`Firecrawl ${source.name}: ${response.status}`); return []; }
    const data = await response.json();
    return (data.data || [])
      .filter((r: any) => r.title && !isJunkTitle(stripTitleSuffix(r.title)) && !(r.url && isVideoUrl(r.url)))
      .map((r: any) => {
        const content = preClean(r.markdown || r.description || "");
        return {
          sourceId: source.id, title: stripTitleSuffix(r.title.trim()),
          summary: (r.description || r.title).substring(0, 500),
          content: content.length >= 200 ? content : "",
          url: r.url || "", isInternational: source.international,
        };
      });
  } catch (err) {
    console.error(`Scrape ${source.name}:`, err);
    return [];
  }
}

// ============ TOPIC & REGION DETECTION ============
const TOPIC_KEYWORDS: Record<string, { words: string[]; strong: string[] }> = {
  Sports: { words: ["match", "team", "player", "tournament", "score", "league", "champion", "batting", "bowling", "wicket", "goal", "medal", "athlete", "coach", "stadium"], strong: ["cricket", "pcb", "psl", "hockey", "football", "icc", "babar", "shaheen", "t20", "odi", "world cup", "asia cup"] },
  Economy: { words: ["economy", "gdp", "trade", "export", "import", "investment", "loan", "fiscal", "business", "revenue", "market", "shares", "banking", "interest rate", "oil", "gas", "fuel", "petrol", "diesel"], strong: ["inflation", "rupee", "dollar", "imf", "tax", "budget", "sbp", "stock exchange", "forex", "debt", "world bank", "oil prices", "gas prices", "opec"] },
  Politics: { words: ["party", "vote", "parliament", "minister", "political", "opposition", "assembly", "senate", "cabinet", "judiciary", "law", "legislation", "rally", "protest", "arrest", "bail", "diplomat"], strong: ["election", "pti", "pmln", "ppp", "nawaz", "imran", "bilawal", "maryam", "supreme court", "ecp", "national assembly", "prime minister", "chief minister"] },
  Tech: { words: ["digital", "internet", "5g", "telecom", "startup", "app", "software", "cyber", "broadband"], strong: ["pta", "starlink", "fintech", "e-commerce"] },
  Regional: { words: ["local", "provincial", "cm", "governor", "municipality", "city", "district"], strong: ["karachi", "lahore", "peshawar", "quetta", "faisalabad", "rawalpindi", "multan", "hyderabad"] },
  World: { words: ["international", "global", "foreign", "embassy", "summit", "treaty", "conflict", "war", "airstrike", "missile", "bombing"], strong: ["us", "china", "india", "saudi", "iran", "afghanistan", "un", "nato", "russia", "israel", "palestine", "gaza", "middle east", "trump", "biden", "strait of hormuz"] },
  Opinion: { words: ["analysis", "commentary", "perspective", "viewpoint"], strong: ["editorial", "opinion", "column", "op-ed"] },
};

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  let best = "Politics", bestScore = 0;
  for (const [topic, { words, strong }] of Object.entries(TOPIC_KEYWORDS)) {
    let score = words.filter(k => lower.includes(k)).length + strong.filter(k => lower.includes(k)).length * 3;
    if (score > bestScore) { bestScore = score; best = topic; }
  }
  return best;
}

const REGION_KEYWORDS: Record<string, string[]> = {
  Punjab: ["punjab", "lahore", "rawalpindi", "faisalabad", "multan"],
  Sindh: ["sindh", "karachi", "hyderabad", "sukkur"],
  KPK: ["kpk", "khyber", "peshawar", "swat", "pakhtunkhwa"],
  Balochistan: ["balochistan", "quetta", "gwadar"],
  Islamabad: ["islamabad", "capital", "federal"],
  "South Asia": ["india", "modi", "delhi", "mumbai", "bangladesh", "dhaka", "sri lanka", "nepal", "bhutan"],
  "Middle East": ["saudi", "iran", "iraq", "yemen", "syria", "uae", "dubai", "qatar", "lebanon", "jordan", "gaza", "israel", "palestine", "hamas", "hezbollah", "tehran", "riyadh", "hormuz"],
  "Central Asia": ["afghanistan", "kabul", "taliban", "uzbekistan", "tajikistan", "turkmenistan", "kyrgyzstan", "kazakh"],
  Africa: ["africa", "nigeria", "egypt", "cairo", "kenya", "south africa", "ethiopia", "sudan", "libya"],
  Europe: ["europe", "eu", "uk", "britain", "france", "germany", "london", "paris", "berlin", "brussels", "nato", "ukraine", "russia", "moscow", "kyiv"],
  Americas: ["america", "usa", "trump", "biden", "washington", "congress", "white house", "canada", "mexico", "brazil", "latin america"],
  Asia: ["china", "beijing", "japan", "tokyo", "korea", "asean", "singapore", "malaysia", "indonesia", "thailand", "vietnam", "taiwan", "hong kong"],
  Oceania: ["australia", "new zealand", "pacific"],
};

function detectRegion(text: string, isInternational: boolean): string {
  const lower = text.toLowerCase();
  const pakRegions = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad"];
  for (const region of pakRegions) {
    if (REGION_KEYWORDS[region].some(k => lower.includes(k))) return region;
  }
  if (isInternational) {
    const worldRegions = ["South Asia", "Middle East", "Central Asia", "Africa", "Europe", "Americas", "Asia", "Oceania"];
    let bestRegion = "Global"; let bestScore = 0;
    for (const region of worldRegions) {
      const score = REGION_KEYWORDS[region].filter(k => lower.includes(k)).length;
      if (score > bestScore) { bestScore = score; bestRegion = region; }
    }
    if (bestScore > 0) return bestRegion;
    return "Global";
  }
  const worldRegions = ["South Asia", "Middle East", "Central Asia", "Africa", "Europe", "Americas", "Asia", "Oceania"];
  for (const region of worldRegions) {
    if (REGION_KEYWORDS[region].filter(k => lower.includes(k)).length >= 2) return region;
  }
  return "National";
}

function calculateBias(sourceIds: string[]): Record<string, number> {
  const biasMap: Record<string, string> = {};
  NEWS_SOURCES.forEach(s => biasMap[s.id] = s.bias);
  const dist = { establishment: 0, government: 0, opposition: 0, independent: 0 };
  sourceIds.forEach(id => {
    const b = biasMap[id];
    if (b === "anti-establishment" || b === "establishment") dist.establishment++;
    else if (b === "government") dist.government++;
    else if (b === "opposition") dist.opposition++;
    else dist.independent++;
  });
  return dist;
}

// ============ KEYWORD / ENTITY / SIMILARITY ============
function getKeywords(text: string): Set<string> {
  const stopwords = new Set(["the","a","an","in","on","at","to","for","of","is","are","was","were","and","or","but","with","from","by","as","its","it","has","have","had","been","be","will","can","may","this","that","not","no","so","if","up","out","about","into","over","after","also","now","new","said","says","one","two","pakistan","pakistani","today","report","news"]);
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w)));
}

const IMPORTANT_ENTITIES = new Set([
  "iran", "trump", "israel", "gaza", "palestine", "india", "modi", "china", "russia", "ukraine",
  "nato", "imf", "un", "opec", "hormuz", "taliban", "afghanistan", "kabul", "tehran",
  "saudi", "oil", "nuclear", "missile", "airstrike", "sanctions", "ceasefire", "diplomacy",
  "inflation", "rupee", "dollar", "fuel", "petrol", "diesel", "gas",
  "nawaz", "imran", "bilawal", "maryam", "shahbaz", "zardari",
  "cricket", "psl", "icc", "fifa", "olympics",
]);

function extractEntities(text: string): Set<string> {
  const ents = new Set<string>();
  (text.match(/\b[A-Z][a-z]{2,}\b/g) || []).forEach(w => ents.add(w.toLowerCase()));
  (text.match(/\b[A-Z]{2,6}\b/g) || []).forEach(w => ents.add(w.toLowerCase()));
  const lower = text.toLowerCase();
  IMPORTANT_ENTITIES.forEach(e => { if (lower.includes(e)) ents.add(e); });
  return ents;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let common = 0;
  a.forEach(w => { if (b.has(w)) common++; });
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : common / union;
}

function entityOverlapCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  a.forEach(e => { if (b.has(e)) count++; });
  return count;
}

function shouldMerge(titleA: string, summaryA: string, titleB: string, summaryB: string): boolean {
  const titleKwA = getKeywords(titleA), titleKwB = getKeywords(titleB);
  const titleSim = jaccardSimilarity(titleKwA, titleKwB);
  const entA = extractEntities(titleA + " " + summaryA);
  const entB = extractEntities(titleB + " " + summaryB);
  const entSim = jaccardSimilarity(entA, entB);
  const entOverlap = entityOverlapCount(entA, entB);
  const sumKwA = getKeywords(summaryA), sumKwB = getKeywords(summaryB);
  const sumSim = jaccardSimilarity(sumKwA, sumKwB);
  const score = titleSim * 0.5 + entSim * 0.3 + sumSim * 0.2;
  // Lowered thresholds — news outlets cover the same event with different wording
  return (score > 0.22 && entOverlap >= 1) || score > 0.32 || (titleSim > 0.35 && entOverlap >= 1);
}

// ============ IMPORTANCE SCORING ============
function getTopicWeight(category: StoryCategory): number {
  const weights: Record<StoryCategory, number> = {
    conflict: 10, geopolitics: 9, economy: 9, security: 8, policy: 8,
    sports: 5, entertainment: 3, other: 1,
  };
  return weights[category] || 1;
}

function getSourceTierScore(sourceIds: string[]): number {
  let score = 0;
  for (const id of sourceIds) {
    const tier = SOURCE_TIER[id] || 3;
    if (tier === 1) score += 2;
    else if (tier === 2) score += 1.5;
    else score += 1;
  }
  return Math.min(4, score);
}

function getRecencyScore(hoursOld: number): number {
  if (hoursOld < 6) return 3;
  if (hoursOld < 12) return 2.5;
  if (hoursOld < 24) return 2;
  if (hoursOld < 48) return 1;
  return 0.5;
}

function getGeoImpactScore(text: string): number {
  const lower = text.toLowerCase();
  const globalTerms = ["oil", "global", "world", "strait of hormuz", "opec", "nuclear", "world war", "pandemic", "climate"];
  const multiCountry = ["us", "china", "russia", "iran", "israel", "india", "eu", "nato", "un"];
  if (globalTerms.some(t => lower.includes(t))) return 3;
  const countries = multiCountry.filter(t => lower.includes(t));
  if (countries.length >= 2) return 2;
  if (countries.length === 1) return 1.5;
  return 0.5;
}

function getEntityImportanceScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  const leaders = ["trump", "biden", "modi", "xi jinping", "putin", "netanyahu", "khamenei", "shahbaz", "nawaz"];
  const orgs = ["un", "imf", "nato", "opec", "world bank", "who"];
  if (leaders.some(l => lower.includes(l))) score += 1;
  if (orgs.some(o => lower.includes(o))) score += 1;
  const majorCountries = ["united states", "china", "russia", "iran", "israel", "india", "pakistan"];
  if (majorCountries.some(c => lower.includes(c))) score += 1;
  return Math.min(3, score);
}

function calculateImportanceV2(
  category: StoryCategory, sourceIds: string[], coverageCount: number,
  hoursOld: number, combinedText: string,
): number {
  const topicWeight = getTopicWeight(category);
  const coverageScore = Math.log(coverageCount + 1) * 1.5;
  const sourceScore = getSourceTierScore(sourceIds);
  const recencyScore = getRecencyScore(hoursOld);
  const geoImpactScore = getGeoImpactScore(combinedText);
  const entityScore = getEntityImportanceScore(combinedText);
  const total = topicWeight + coverageScore + sourceScore + recencyScore + geoImpactScore + entityScore;
  let normalized = Math.min(10, total / 3);
  if (coverageCount === 1 && sourceIds.some(id => SOURCE_TIER[id] === 1) && hoursOld < 3) {
    normalized = Math.max(normalized, 8);
  }
  return Math.round(normalized * 10) / 10;
}

// ============ MAIN HANDLER ============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    // Firecrawl is optional — RSS-only mode runs without it

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Wipe existing data before a fresh scrape (triggered by ?wipe=true)
    const reqUrl = new URL(req.url);
    if (reqUrl.searchParams.get("wipe") === "true") {
      console.log("Wiping stories and coverages for fresh scrape...");
      await supabase.from("coverages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("stories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      console.log("Tables wiped.");
    }

    const errors: string[] = [];
    const rejections: { title: string; reason: string }[] = [];
    let allArticles: ScrapedArticle[] = [];

    // STEP 1: Fetch from RSS (always) + Firecrawl (only if key is set)
    const rssResults = await Promise.allSettled(
      Object.entries(RSS_FEEDS).map(([sourceId, feedUrl]) => {
        const source = NEWS_SOURCES.find(s => s.id === sourceId);
        return source ? fetchRssArticles(sourceId, feedUrl, source) : Promise.resolve([]);
      })
    );
    rssResults.forEach(r => { if (r.status === "fulfilled") allArticles = allArticles.concat(r.value); });

    if (firecrawlKey) {
      const scrapeResults = await Promise.allSettled(
        NEWS_SOURCES.map(source => scrapeSource(source, firecrawlKey))
      );
      scrapeResults.forEach((r, i) => {
        if (r.status === "fulfilled") allArticles = allArticles.concat(r.value);
        else errors.push(`${NEWS_SOURCES[i].name}: ${r.reason}`);
      });
    } else {
      console.log("FIRECRAWL_API_KEY not set — running RSS-only mode");
    }

    console.log(`Total fetched: ${allArticles.length}`);

    // STEP 2: URL dedup
    const articleUrls = allArticles.map(a => a.url).filter(Boolean);
    const { data: existingCoverages } = await supabase.from("coverages").select("url").in("url", articleUrls.slice(0, 500));
    const existingUrls = new Set((existingCoverages || []).map((c: any) => c.url));
    allArticles = allArticles.filter(a => a.url && !existingUrls.has(a.url));

    const seenUrls = new Set<string>();
    allArticles = allArticles.filter(a => {
      if (seenUrls.has(a.url)) return false;
      seenUrls.add(a.url);
      return true;
    });

    console.log(`After URL dedup: ${allArticles.length} new articles`);

    // STEP 2.5: DETERMINISTIC QUALITY FILTER ON ALL ARTICLES (no AI needed)
    // Clean content boilerplate before filtering
    allArticles.forEach((article) => normalizeArticle(article));

    const qualityPassed = allArticles.filter(passesQualityFilter);
    const borderline = allArticles.filter(a => !passesQualityFilter(a) && a.title.length >= 20);
    const priorityReviewTargets = [...qualityPassed]
      .filter(shouldForceAiReview)
      .sort((a, b) => getEditorialRiskScore(b) - getEditorialRiskScore(a))
      .slice(0, 8);
    const priorityReviewKeys = new Set(priorityReviewTargets.map(getArticleKey));
    const autoPassed = qualityPassed.filter((article) => !priorityReviewKeys.has(getArticleKey(article)));
    
    console.log(`Quality filter: ${qualityPassed.length} passed, ${borderline.length} borderline, ${allArticles.length - qualityPassed.length - borderline.length} rejected`);
    console.log(`Editorial AI review queued: ${priorityReviewTargets.length}`);

    // STEP 2.6: AI verify borderline articles in batches; if AI throttles, deterministic fallback keeps them flowing
    let aiVerified: ScrapedArticle[] = [];
    if (borderline.length > 0) {
      console.log(`AI verifying ${borderline.length} borderline articles...`);
      aiVerified = await aiBatchVerify(borderline);
      console.log(`AI passed: ${aiVerified.length}/${borderline.length}`);
    }

    let editorialApproved: ScrapedArticle[] = [];
    if (priorityReviewTargets.length > 0) {
      const editorialReview = await aiReviewPriorityArticles(priorityReviewTargets);
      editorialApproved = editorialReview.approved;
      rejections.push(...editorialReview.rejected.map((item) => ({ ...item, reason: `editorial-${item.reason}` })));
      console.log(`Editorial review approved: ${editorialApproved.length}/${priorityReviewTargets.length}`);
    }

    // Combine: all quality-passed + AI-verified borderline
    allArticles = [...autoPassed, ...editorialApproved, ...aiVerified];
    console.log(`Total after all gates: ${allArticles.length} articles`);

    // STEP 3: AI clean content for top articles only (save quota)
    const articlesWithContent = allArticles
      .filter(a => a.content.length >= 200)
      .sort((a, b) => {
        const scoreA = (SOURCE_TIER[a.sourceId] === 1 ? 3 : SOURCE_TIER[a.sourceId] === 2 ? 2 : 1) * 10000 + Math.min(a.content.length, 5000);
        const scoreB = (SOURCE_TIER[b.sourceId] === 1 ? 3 : SOURCE_TIER[b.sourceId] === 2 ? 2 : 1) * 10000 + Math.min(b.content.length, 5000);
        return scoreB - scoreA;
      });
    const aiCleanTargets = articlesWithContent.slice(0, 4);
    for (let i = 0; i < aiCleanTargets.length; i += 2) {
      const batch = aiCleanTargets.slice(i, i + 2);
      await Promise.allSettled(
        batch.map(async (article) => {
          const result = await aiCleanAndSummarize(article.title, article.content);
          if (result) {
            article.content = result.cleaned;
            // Keep original RSS summary — only use AI to clean full content boilerplate
          }
        })
      );
      if (i + 2 < aiCleanTargets.length) await new Promise(r => setTimeout(r, 2000));
    }

    if (allArticles.length === 0) {
      await supabase.from("scrape_log").insert({ sources_scraped: NEWS_SOURCES.length, stories_found: 0, errors });
      return new Response(JSON.stringify({ message: "No new articles", errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STEP 4: Match against recent stories so refreshed coverage can revive older feed items
    const { data: existingStories } = await supabase.from("stories").select("id, title, topic, ai_summary")
      .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("published_at", { ascending: false }).limit(300);

    const existingStoryList = (existingStories || []).map((s: any) => ({ 
      id: s.id, title: s.title, topic: s.topic, summary: s.ai_summary || "" 
    }));
    const matchedToExisting: { article: ScrapedArticle; storyId: string }[] = [];
    const unmatched: ScrapedArticle[] = [];

    for (const article of allArticles) {
      let matched = false;
      for (const existing of existingStoryList) {
        if (shouldMerge(article.title, article.summary, existing.title, existing.summary)) {
          matchedToExisting.push({ article, storyId: existing.id });
          matched = true;
          break;
        }
      }
      if (!matched) unmatched.push(article);
    }

    console.log(`Matched: ${matchedToExisting.length}, New: ${unmatched.length}`);

    // STEP 5: Insert coverages for matched stories + UPDATE published_at
    const matchedStoryIds = [...new Set(matchedToExisting.map(m => m.storyId))];
    const existingSourcesByStory: Record<string, Set<string>> = {};
    for (const storyId of matchedStoryIds) {
      const { data: existingCovs } = await supabase.from("coverages").select("source_id").eq("story_id", storyId);
      existingSourcesByStory[storyId] = new Set((existingCovs || []).map((c: any) => c.source_id));
    }

    const nowIso = new Date().toISOString();
    for (const { article, storyId } of matchedToExisting) {
      if (existingSourcesByStory[storyId]?.has(article.sourceId)) continue;
      existingSourcesByStory[storyId]?.add(article.sourceId);

      await supabase.from("coverages").insert({
        story_id: storyId, source_id: article.sourceId, headline: article.title,
        summary: article.summary.substring(0, 500), full_content: article.content.substring(0, 5000),
        url: article.url, published_at: nowIso, is_international: article.isInternational,
      });

      // *** KEY FIX: Update story published_at so it surfaces as fresh ***
      const { data: storyCoverages } = await supabase.from("coverages").select("source_id, is_international, headline, summary").eq("story_id", storyId);
      const sourceIds = [...new Set((storyCoverages || []).map((c: any) => c.source_id))];
      const combinedText = (storyCoverages || []).map((c: any) => c.headline + " " + (c.summary || "")).join(" ");
      
      const { data: storyData } = await supabase.from("stories").select("title, topic").eq("id", storyId).single();
      const category = classifyCategory(storyData?.title || "", combinedText.substring(0, 300));
      const importanceScore = calculateImportanceV2(category, sourceIds, sourceIds.length, 0, combinedText);
      
      await supabase.from("stories").update({
        published_at: nowIso, // <-- FRESHNESS FIX
        is_trending: sourceIds.length >= 3,
        bias_distribution: calculateBias(sourceIds),
        importance_score: Math.round(importanceScore),
        is_breaking: sourceIds.length >= 4 || importanceScore >= 9,
      }).eq("id", storyId);
    }

    // STEP 6: Cluster unmatched articles
    const grouped: number[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < unmatched.length; i++) {
      if (assigned.has(i)) continue;
      const group = [i];
      assigned.add(i);
      for (let j = i + 1; j < unmatched.length; j++) {
        if (assigned.has(j)) continue;
        if (shouldMerge(unmatched[i].title, unmatched[i].summary, unmatched[j].title, unmatched[j].summary)) {
          group.push(j);
          assigned.add(j);
        }
      }
      grouped.push(group);
    }

    let storiesCreated = 0;
    let storiesRejected = 0;

    for (const group of grouped) {
      const articles = group.map(i => unmatched[i]);
      const combinedText = articles.map(a => a.title + " " + a.summary).join(" ");
      const topic = detectTopic(combinedText);
      const region = detectRegion(combinedText, articles.some(a => a.isInternational));
      const sourceIds = [...new Set(articles.map(a => a.sourceId))];

      const category = classifyCategory(articles[0].title, articles[0].summary);

      if (category === "entertainment") {
        rejections.push({ title: articles[0].title, reason: "entertainment" });
        storiesRejected++;
        continue;
      }

      if (category === "other" && articles.length < 2) {
        rejections.push({ title: articles[0].title, reason: "other-single-source" });
        storiesRejected++;
        continue;
      }

      const importanceScore = calculateImportanceV2(category, sourceIds, articles.length, 0, combinedText);

      if (importanceScore < 4 && articles.length < 2) {
        rejections.push({ title: articles[0].title, reason: `low-score-${importanceScore}` });
        storiesRejected++;
        continue;
      }

      const maxContent = Math.max(...articles.map(a => a.content.length));
      if (maxContent < 100 && articles.length < 2) {
        rejections.push({ title: articles[0].title, reason: "no-content" });
        storiesRejected++;
        continue;
      }

      // Pick headline from the highest-tier source — preserves authentic outlet voice
      let headline = articles.reduce((a, b) => a.title.length > b.title.length ? a : b).title;
      if (articles.length >= 2) {
        const tieredArticle = articles
          .slice()
          .sort((a, b) => (SOURCE_TIER[a.sourceId] || 3) - (SOURCE_TIER[b.sourceId] || 3))[0];
        headline = tieredArticle.title;
      }

      const topicFromCategory = category === "geopolitics" || category === "conflict" ? "World"
        : category === "economy" ? "Economy"
        : category === "policy" || category === "security" ? "Politics"
        : category === "sports" ? "Sports"
        : topic;

      const { data: story, error: storyErr } = await supabase.from("stories").insert({
        title: headline, topic: topicFromCategory, region,
        is_trending: sourceIds.length >= 3,
        bias_distribution: calculateBias(sourceIds),
        published_at: nowIso,
        importance_score: Math.round(importanceScore),
        is_breaking: sourceIds.length >= 4 || importanceScore >= 9,
      }).select("id").single();

      if (storyErr) { errors.push(`Story: ${storyErr.message}`); continue; }

      await supabase.from("coverages").insert(
        articles.map(a => ({
          story_id: story.id, source_id: a.sourceId, headline: a.title,
          summary: a.summary.substring(0, 500), full_content: a.content.substring(0, 5000),
          url: a.url, published_at: nowIso, is_international: a.isInternational,
        }))
      );

      if (articles.length >= 2 || importanceScore >= 7) {
        const summaryData = await summarizeStory(
          headline,
          articles.map(a => ({ headline: a.title, summary: a.summary, content: a.content }))
        );
        if (summaryData) {
          await supabase.from("stories").update({
            ai_summary: summaryData.aiSummary, key_points: summaryData.keyPoints,
          }).eq("id", story.id);
        }
      }

      storiesCreated++;
    }

    console.log(`Rejections: ${storiesRejected}`, rejections.slice(0, 10));

    await supabase.from("scrape_log").insert({
      sources_scraped: NEWS_SOURCES.length, stories_found: storiesCreated,
      errors: errors.length > 0 ? errors : [],
    });

    console.log(`Done: ${storiesCreated} created, ${matchedToExisting.length} matched, ${storiesRejected} rejected`);

    return new Response(JSON.stringify({
      success: true, articles_fetched: qualityPassed.length + aiVerified.length,
      stories_created: storiesCreated, matched_to_existing: matchedToExisting.length,
      stories_rejected: storiesRejected, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
