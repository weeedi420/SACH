import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============ GROQ AI (free tier) ============
async function callAI(prompt: string, maxTokens = 1500): Promise<string | null> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return only the requested output in plain text or JSON. Never add markdown fences." },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });
    if (res.status === 429) { console.warn("Groq rate limited"); return null; }
    if (!res.ok) { console.error("Groq error:", res.status); return null; }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (e) { console.error("Groq call failed:", e); return null; }
}

async function generateSummaryPayload(title: string, coverageText: string): Promise<{ summary?: string; keyPoints?: string[]; key_points?: string[] } | null> {
  const text = await callAI(
    `You are a neutral news editor. Respond only with JSON.\n\nWrite a 2-3 paragraph summary and 4-6 key points for: "${title}"\n\nCoverage:\n${coverageText}\n\nJSON format: {"summary":"...","keyPoints":["...","..."]}`,
    1500
  );
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error("Summary parse failed:", e);
    return null;
  }
}

// ============ ENTITY + SIMILARITY ============
const IMPORTANT_ENTITIES = new Set([
  "iran", "trump", "israel", "gaza", "palestine", "india", "modi", "china", "russia", "ukraine",
  "nato", "imf", "un", "opec", "hormuz", "taliban", "afghanistan", "kabul", "tehran",
  "saudi", "oil", "nuclear", "missile", "airstrike", "sanctions", "ceasefire", "diplomacy",
  "inflation", "rupee", "dollar", "fuel", "petrol", "diesel", "gas",
  "nawaz", "imran", "bilawal", "maryam", "shahbaz", "zardari",
  "cricket", "psl", "icc", "fifa", "olympics",
]);

function getKeywords(text: string): Set<string> {
  const stopwords = new Set(["the","a","an","in","on","at","to","for","of","is","are","was","were","and","or","but","with","from","by","as","its","it","has","have","had","been","be","will","can","may","this","that","not","no","so","if","up","out","about","into","over","after","also","now","new","said","says","one","two","pakistan","pakistani","today","report","news"]);
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w)));
}

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

function shouldMergeStories(titleA: string, summaryA: string, titleB: string, summaryB: string): boolean {
  const titleKwA = getKeywords(titleA), titleKwB = getKeywords(titleB);
  const titleSim = jaccardSimilarity(titleKwA, titleKwB);
  const entA = extractEntities(titleA + " " + summaryA);
  const entB = extractEntities(titleB + " " + summaryB);
  const entSim = jaccardSimilarity(entA, entB);
  const entOverlap = entityOverlapCount(entA, entB);
  const sumKwA = getKeywords(summaryA), sumKwB = getKeywords(summaryB);
  const sumSim = jaccardSimilarity(sumKwA, sumKwB);
  const score = titleSim * 0.5 + entSim * 0.3 + sumSim * 0.2;
  return (score > 0.35 && entOverlap >= 2) || (score > 0.40 && (entOverlap >= 1 || titleSim > 0.45));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const actions: string[] = [];

    // 1. Delete stories with 0 coverages
    const { data: allStories } = await supabase.from("stories").select("id");
    const { data: allCoverages } = await supabase.from("coverages").select("story_id");
    const storiesWithCoverage = new Set((allCoverages || []).map((c: any) => c.story_id));
    const orphanStories = (allStories || []).filter((s: any) => !storiesWithCoverage.has(s.id));
    
    for (const s of orphanStories) {
      await supabase.from("stories").delete().eq("id", s.id);
    }
    actions.push(`Deleted ${orphanStories.length} orphan stories`);

    // 2. Delete old low-impact stories (>7 days, importance < 5)
    const { data: oldStories } = await supabase.from("stories").select("id")
      .lt("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt("importance_score", 5);
    
    for (const s of (oldStories || [])) {
      await supabase.from("coverages").delete().eq("story_id", s.id);
      await supabase.from("stories").delete().eq("id", s.id);
    }
    actions.push(`Deleted ${(oldStories || []).length} old low-impact stories`);

    // 3. Remove stale single-source stories (>24h, only 1 source, importance < 10)
    const { data: recentStories } = await supabase.from("stories").select("id, importance_score")
      .lt("published_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .gt("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt("importance_score", 10);

    let staleSingleRemoved = 0;
    for (const s of (recentStories || [])) {
      const { data: covs } = await supabase.from("coverages").select("id").eq("story_id", s.id);
      if ((covs || []).length <= 1) {
        await supabase.from("coverages").delete().eq("story_id", s.id);
        await supabase.from("stories").delete().eq("id", s.id);
        staleSingleRemoved++;
      }
    }
    actions.push(`Deleted ${staleSingleRemoved} stale single-source stories`);

    // 4. PAIRWISE STORY MERGING
    const { data: mergeStories } = await supabase.from("stories")
      .select("id, title, ai_summary, importance_score, published_at")
      .gte("published_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
      .order("importance_score", { ascending: false });

    let mergeCount = 0;
    const deletedIds = new Set<string>();
    const storyList = mergeStories || [];

    for (let i = 0; i < storyList.length; i++) {
      if (deletedIds.has(storyList[i].id)) continue;
      for (let j = i + 1; j < storyList.length; j++) {
        if (deletedIds.has(storyList[j].id)) continue;
        
        const a = storyList[i], b = storyList[j];
        if (shouldMergeStories(a.title, a.ai_summary || "", b.title, b.ai_summary || "")) {
          const keepId = a.id, deleteId = b.id;
          
          const { data: keepCovs } = await supabase.from("coverages").select("source_id").eq("story_id", keepId);
          const keepSources = new Set((keepCovs || []).map((c: any) => c.source_id));
          
          const { data: moveCovs } = await supabase.from("coverages").select("*").eq("story_id", deleteId);
          for (const cov of (moveCovs || [])) {
            if (keepSources.has(cov.source_id)) {
              await supabase.from("coverages").delete().eq("id", cov.id);
            } else {
              await supabase.from("coverages").update({ story_id: keepId }).eq("id", cov.id);
              keepSources.add(cov.source_id);
            }
          }
          
          // Update freshness of kept story to the newer timestamp
          const keptPub = new Date(a.published_at).getTime();
          const mergedPub = new Date(b.published_at).getTime();
          const newerPub = mergedPub > keptPub ? b.published_at : a.published_at;
          
          await supabase.from("stories").update({
            published_at: newerPub,
          }).eq("id", keepId);
          
          await supabase.from("stories").delete().eq("id", deleteId);
          deletedIds.add(deleteId);
          mergeCount++;
          console.log(`Merged: "${b.title.substring(0, 50)}" → "${a.title.substring(0, 50)}"`);
        }
      }
    }
    actions.push(`Merged ${mergeCount} duplicate stories`);

    // 5. Regenerate missing AI summaries (max 8, with rate-limit safety)
    const { data: noSummaryStories } = await supabase.from("stories").select("id, title")
      .is("ai_summary", null)
      .gt("published_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order("importance_score", { ascending: false })
      .limit(8);

    let summariesGenerated = 0;

    for (const s of (noSummaryStories || [])) {
      const { data: covs } = await supabase.from("coverages").select("headline, summary, full_content").eq("story_id", s.id);
      if (!covs || covs.length < 2) continue;

      const coverageText = covs.slice(0, 4).map((c: any, i: number) =>
        `Source ${i + 1}: "${c.headline}"\n${(c.full_content || c.summary || "").substring(0, 800)}`
      ).join("\n---\n");

      try {
        const parsed = await generateSummaryPayload(s.title, coverageText);
        if (parsed?.summary) {
          await supabase.from("stories").update({
            ai_summary: parsed.summary,
            key_points: parsed.keyPoints || parsed.key_points,
          }).eq("id", s.id);
          summariesGenerated++;
        }
      } catch (e) {
        console.error(`Summary gen failed for ${s.id}:`, e);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    actions.push(`Generated ${summariesGenerated} missing summaries`);

    // 6. Backfill published_at from latest coverage for stories that are stale
    const { data: staleStories } = await supabase.from("stories")
      .select("id, published_at")
      .gte("published_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
    
    let freshnessFixed = 0;
    for (const s of (staleStories || [])) {
      const { data: latestCov } = await supabase.from("coverages")
        .select("published_at")
        .eq("story_id", s.id)
        .order("published_at", { ascending: false })
        .limit(1);
      
      if (latestCov && latestCov.length > 0 && latestCov[0].published_at) {
        const covTime = new Date(latestCov[0].published_at).getTime();
        const storyTime = new Date(s.published_at).getTime();
        if (covTime > storyTime) {
          await supabase.from("stories").update({
            published_at: latestCov[0].published_at,
          }).eq("id", s.id);
          freshnessFixed++;
        }
      }
    }
    actions.push(`Fixed freshness for ${freshnessFixed} stories`);

    // 7. Clean boilerplate from existing coverages
    const { data: junkCoverages } = await supabase.from("coverages")
      .select("id, full_content, summary")
      .or("full_content.ilike.%Enable accessibility%,full_content.ilike.%Login or register%,full_content.ilike.%SECTIONS%,summary.ilike.%CDATA%")
      .limit(50);
    
    let contentCleaned = 0;
    for (const cov of (junkCoverages || [])) {
      const updates: any = {};
      if (cov.full_content) {
        const cleaned = cov.full_content
          .replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "")
          .replace(/<[^>]+>/g, "");
        // If after cleaning it's mostly boilerplate, null it out
        const navPatterns = /Enable accessibility|Login or register|SECTIONS\n|TOP STORIES|See All Newsletters|AP QUIZZES/i;
        if (navPatterns.test(cleaned) && cleaned.length > 500) {
          // Try to extract just the first meaningful paragraph
          const paragraphs = cleaned.split('\n\n').filter(p => p.trim().length > 50 && !navPatterns.test(p));
          updates.full_content = paragraphs.slice(0, 3).join('\n\n') || null;
        }
      }
      if (cov.summary && /<!\[CDATA\[/.test(cov.summary)) {
        updates.summary = cov.summary.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("coverages").update(updates).eq("id", cov.id);
        contentCleaned++;
      }
    }
    actions.push(`Cleaned ${contentCleaned} coverages with boilerplate/CDATA`);

    console.log("Self-healing complete:", actions);

    return new Response(JSON.stringify({ success: true, actions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Self-healing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
