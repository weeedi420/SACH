import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last user message for context search
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";

    // Search recent stories for context
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: stories } = await supabase
      .from("stories")
      .select("id, title, topic, region, ai_summary, key_points, bias_distribution, importance_score, is_breaking, published_at")
      .gte("published_at", sevenDaysAgo)
      .order("importance_score", { ascending: false })
      .limit(30);

    // Get coverages for top stories
    const storyIds = (stories || []).map((s: any) => s.id);
    const { data: coverages } = await supabase
      .from("coverages")
      .select("story_id, source_id, headline, summary, is_international")
      .in("story_id", storyIds);

    // Build context
    const coverageMap: Record<string, any[]> = {};
    (coverages || []).forEach((c: any) => {
      if (!coverageMap[c.story_id]) coverageMap[c.story_id] = [];
      coverageMap[c.story_id].push(c);
    });

    const context = (stories || []).map((s: any) => {
      const cov = coverageMap[s.id] || [];
      const domestic = cov.filter((c: any) => !c.is_international);
      const intl = cov.filter((c: any) => c.is_international);
      return `**${s.title}** [${s.topic}, ${s.region}] ${s.is_breaking ? "🔴 BREAKING" : ""}
Importance: ${s.importance_score} | Sources: ${cov.length} (${domestic.length} domestic, ${intl.length} international)
Bias: Est=${s.bias_distribution?.establishment||0}, Gov=${s.bias_distribution?.government||0}, Opp=${s.bias_distribution?.opposition||0}, Ind=${s.bias_distribution?.independent||0}
${s.ai_summary ? `Summary: ${s.ai_summary.substring(0, 300)}` : ""}
Sources: ${cov.map((c: any) => `${c.source_id}${c.is_international ? " (intl)" : ""}: "${c.headline}"`).join(" | ")}`;
    }).join("\n\n---\n\n");

    const systemPrompt = `You are Sachhh's AI research assistant — an expert on Pakistani media and news analysis. You have access to the latest news data from Pakistani and international sources.

CURRENT NEWS DATA (last 7 days):
${context}

INSTRUCTIONS:
- Answer questions about Pakistani news coverage, media bias, and narratives
- Always cite specific source names and their bias labels when relevant
- Compare how different outlets cover the same story
- Highlight coverage blind spots (stories some outlets ignore)
- Use data: mention number of sources, bias distribution, importance scores
- Be analytical and evidence-based, not opinionated
- Format with markdown: headers, bullet points, bold for source names
- If asked about something not in the data, say so honestly
- Bias labels: establishment, government, opposition, independent`;

    // Build OpenAI-compatible conversation (Groq uses the same format)
    const groqMessages = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of messages) {
      groqMessages.push({ role: msg.role, content: msg.content });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI API error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Groq streams in OpenAI SSE format — pass it straight through with CORS headers
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("news-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
