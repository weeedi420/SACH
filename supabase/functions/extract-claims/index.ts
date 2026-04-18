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
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { storyId } = await req.json();
    if (!storyId) throw new Error("storyId required");

    // Check if claims already exist
    const { data: existing } = await supabase.from("claims").select("id").eq("story_id", storyId).limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Claims already extracted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get story + coverages
    const { data: story } = await supabase.from("stories").select("title").eq("id", storyId).single();
    if (!story) throw new Error("Story not found");

    const { data: coverages } = await supabase
      .from("coverages")
      .select("source_id, headline, summary, full_content, is_international")
      .eq("story_id", storyId);

    if (!coverages || coverages.length === 0) throw new Error("No coverages");

    const coverageText = coverages.map((c: any) =>
      `Source: ${c.source_id}${c.is_international ? " (international)" : ""}\nHeadline: ${c.headline}\n${c.summary || ""}\n${(c.full_content || "").substring(0, 1500)}`
    ).join("\n---\n");

    const sourceIds = coverages.map((c: any) => c.source_id);

    const prompt = `You are a fact-checking AI for Sachhh, a Pakistani news transparency platform. Extract 3-8 distinct factual claims from the coverage provided. For each claim, determine which sources support it and which contradict it.

Story: ${story.title}
Available source IDs: ${sourceIds.join(", ")}

Coverage:
${coverageText}

Respond in this exact JSON format:
{"claims": [{"text": "claim statement", "category": "factual|assertion|opinion|prediction", "confidence": 75, "explanation": "why this confidence", "supporting_sources": ["source_id"], "contradicting_sources": ["source_id"]}]}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a fact-checking assistant. Return only the requested JSON output. No markdown fences." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error("Groq API error:", response.status, await response.text());
      throw new Error("Groq API error");
    }

    const aiData = await response.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    const claims = parsed.claims || [];

    // Insert claims
    for (const claim of claims) {
      await supabase.from("claims").insert({
        story_id: storyId,
        text: claim.text,
        category: claim.category,
        confidence: Math.min(100, Math.max(0, claim.confidence)),
        explanation: claim.explanation,
        supporting_sources: claim.supporting_sources,
        contradicting_sources: claim.contradicting_sources,
      });
    }

    console.log(`Extracted ${claims.length} claims for story ${storyId}`);

    return new Response(JSON.stringify({ success: true, claims_extracted: claims.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-claims error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
