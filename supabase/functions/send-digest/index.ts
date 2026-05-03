import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECIPIENT_EMAIL = "waleedmurtazamalil@gmail.com";
const SITE_URL = "https://sachhh.vercel.app";
// Fallback image when story has no image — a clean dark branded card
const DEFAULT_IMAGE = "https://sachhh.vercel.app/og-default.jpg";

const SOURCE_NAMES: Record<string, string> = {
  dawn: "Dawn", geo: "Geo News", ary: "ARY News", express: "Express Tribune",
  thenews: "The News", samaa: "Samaa TV", nation: "The Nation", dunyanews: "Dunya News",
  bbc: "BBC News", reuters: "Reuters", aljazeera: "Al Jazeera", ap: "AP News",
  guardian: "The Guardian", nyt: "New York Times", dw: "Deutsche Welle",
  france24: "France 24", ndtv: "NDTV", thehindu: "The Hindu",
  middleeasteye: "Middle East Eye", arabnews: "Arab News",
};

function sourceName(id: string): string {
  return SOURCE_NAMES[id?.toLowerCase()] || id;
}

const TOPIC_HASHTAGS: Record<string, string> = {
  Politics: "#Pakistan #PakistanPolitics #BreakingNews #PTI #PMLN #PPP #Sachhh #MediaBias",
  Economy:  "#Pakistan #PakistanEconomy #IMF #Rupee #Finance #Sachhh #MediaBias",
  World:    "#Pakistan #WorldNews #Geopolitics #PakistanForeignPolicy #Sachhh #MediaBias",
  Sports:   "#Pakistan #PakistanCricket #PCB #PSL #Cricket #Sachhh",
  Security: "#Pakistan #PakistanNews #Security #Sachhh #MediaBias",
  Regional: "#Pakistan #PakistanNews #Sachhh #MediaBias",
  Tech:     "#Pakistan #PakistanTech #Technology #Sachhh",
  Opinion:  "#Pakistan #PakistanNews #Analysis #Sachhh #MediaBias",
};

function getHashtags(topic: string): string {
  return TOPIC_HASHTAGS[topic] || "#Pakistan #PakistanNews #Sachhh #MediaBias #BreakingNews";
}

function formatCaption(story: any, coverages: any[]): string {
  const pakCoverages = coverages.filter((c: any) => !c.is_international);
  const intlCoverages = coverages.filter((c: any) => c.is_international);
  const allOrdered = [...pakCoverages, ...intlCoverages];

  const topSources = allOrdered.slice(0, 4).map((c: any) => `• ${sourceName(c.source_id)}`);
  const extra = allOrdered.length - topSources.length;
  const sourceBlock = topSources.join("\n") + (extra > 0 ? `\n• +${extra} more` : "");

  const bias = story.bias_distribution || {};
  const biasParts = [
    bias.establishment ? `Est. ${bias.establishment}` : "",
    bias.government    ? `Gov. ${bias.government}`    : "",
    bias.opposition    ? `Opp. ${bias.opposition}`    : "",
    bias.independent   ? `Ind. ${bias.independent}`   : "",
  ].filter(Boolean).join(" · ");

  const summary = story.ai_summary
    ? story.ai_summary.trim()
    : "";

  const storyUrl = `${SITE_URL}/story/${story.id}`;
  const hashtags = getHashtags(story.topic);

  return [
    `📰 ${story.title}`,
    "",
    summary,
    "",
    `Covered by ${coverages.length} source${coverages.length !== 1 ? "s" : ""}:`,
    sourceBlock,
    "",
    biasParts ? `📊 ${biasParts}` : "",
    "",
    `Read all perspectives 👉 ${storyUrl}`,
    "",
    hashtags,
  ].filter(l => l !== null && l !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function postCard(index: number, story: any, coverages: any[], imageUrl: string): string {
  const caption = formatCaption(story, coverages);
  const escapedCaption = caption
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const storyUrl = `${SITE_URL}/story/${story.id}`;
  const sourceCount = coverages.length;
  const importance = story.importance_score || 0;
  const stars = importance >= 8 ? "🔴 HIGH IMPACT" : importance >= 6 ? "🟡 IMPORTANT" : "🟢 NOTEWORTHY";

  return `
  <div style="margin-bottom:48px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <!-- Header -->
    <div style="background:#0f172a; padding:14px 20px; display:flex; justify-content:space-between; align-items:center;">
      <span style="color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Post ${index} of 5</span>
      <span style="color:#f1f5f9; font-size:12px;">${stars} &nbsp;·&nbsp; ${sourceCount} sources</span>
    </div>

    <!-- Image -->
    <div style="background:#1e293b; text-align:center;">
      <img src="${imageUrl}" alt="" style="width:100%; max-height:360px; object-fit:cover; display:block;"
        onerror="this.style.display='none'">
    </div>

    <!-- Caption block -->
    <div style="padding:20px 24px; background:#f8fafc;">
      <p style="margin:0 0 10px; font-size:13px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px;">
        📋 Caption — select all &amp; copy
      </p>
      <div style="background:#fff; border:1.5px solid #d1d5db; border-radius:8px; padding:16px; position:relative;">
        <pre style="margin:0; white-space:pre-wrap; word-break:break-word; font-family:'Courier New',monospace; font-size:13px; line-height:1.7; color:#111827;">${escapedCaption}</pre>
      </div>

      <!-- Download + View links -->
      <div style="margin-top:14px; display:flex; gap:12px; flex-wrap:wrap;">
        <a href="${imageUrl}" download style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:9px 18px; border-radius:7px; font-size:13px; font-weight:600;">
          ⬇️ Download Image
        </a>
        <a href="${storyUrl}" style="display:inline-block; background:#f1f5f9; color:#374151; text-decoration:none; padding:9px 18px; border-radius:7px; font-size:13px; font-weight:600; border:1px solid #d1d5db;">
          🔗 View Story
        </a>
      </div>

      <!-- Posting tip -->
      <p style="margin:14px 0 0; font-size:12px; color:#6b7280;">
        ⏰ <strong>Best time to post:</strong> 8:00 AM PKT &nbsp;·&nbsp; 12:30 PM PKT &nbsp;·&nbsp; 8:00 PM PKT
      </p>
    </div>
  </div>`;
}

function buildEmailHtml(stories: { story: any; coverages: any[]; imageUrl: string }[]): string {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const cards = stories.map((s, i) => postCard(i + 1, s.story, s.coverages, s.imageUrl)).join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0; padding:0; background:#f1f5f9;">
  <div style="max-width:680px; margin:0 auto; padding:24px 16px;">

    <!-- Header -->
    <div style="background:#0f172a; border-radius:12px; padding:28px 32px; margin-bottom:24px; text-align:center;">
      <h1 style="margin:0 0 6px; color:#f1f5f9; font-size:22px; font-weight:800; letter-spacing:-0.5px;">
        📱 Sachhh Post Kit
      </h1>
      <p style="margin:0; color:#94a3b8; font-size:14px;">${dateStr}</p>
      <p style="margin:12px 0 0; color:#64748b; font-size:13px;">
        ${stories.length} posts ready &nbsp;·&nbsp; Save image → paste caption → post
      </p>
    </div>

    <!-- Quick guide -->
    <div style="background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
      <p style="margin:0; font-size:13px; color:#374151; line-height:1.8;">
        <strong>How to post:</strong><br>
        1️⃣ Click <strong>Download Image</strong><br>
        2️⃣ Select all text in the caption box &amp; copy<br>
        3️⃣ Open Instagram / Facebook → New post → paste caption → done
      </p>
    </div>

    ${cards}

    <!-- Footer -->
    <div style="text-align:center; padding:20px; color:#9ca3af; font-size:12px;">
      <p style="margin:0 0 4px;">Sachhh — Pakistan News Transparency</p>
      <p style="margin:0;">
        <a href="${SITE_URL}" style="color:#6366f1; text-decoration:none;">sachhh.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY not set");
    return false;
  }

  // Resend free "from" address — works immediately, no domain verification needed
  const from = Deno.env.get("DIGEST_FROM_EMAIL") || "Sachhh <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [RECIPIENT_EMAIL],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Resend error:", JSON.stringify(data));
    return false;
  }

  console.log("Email sent:", data.id);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch top 5 stories from last 24 hours with importance >= 5
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: storiesData, error: storiesErr } = await supabase
      .from("stories")
      .select("*")
      .gte("published_at", since)
      .gte("importance_score", 5)
      .order("importance_score", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(5);

    if (storiesErr) throw storiesErr;

    // If fewer than 3 fresh stories, widen to 72 hours
    let stories = storiesData || [];
    if (stories.length < 3) {
      const wider = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const { data: more } = await supabase
        .from("stories")
        .select("*")
        .gte("published_at", wider)
        .gte("importance_score", 4)
        .order("importance_score", { ascending: false })
        .limit(5);
      stories = more || [];
    }

    if (stories.length === 0) {
      return new Response(JSON.stringify({ message: "No stories found for digest" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch coverages for all stories
    const storyIds = stories.map((s: any) => s.id);
    const { data: allCoverages } = await supabase
      .from("coverages")
      .select("story_id, source_id, headline, is_international, url")
      .in("story_id", storyIds);

    const coveragesByStory: Record<string, any[]> = {};
    (allCoverages || []).forEach((c: any) => {
      if (!coveragesByStory[c.story_id]) coveragesByStory[c.story_id] = [];
      coveragesByStory[c.story_id].push(c);
    });

    // Build post data for each story
    const posts = stories.map((story: any) => {
      const coverages = coveragesByStory[story.id] || [];

      // Pick best image: story's own image_url → coverage article og:image → default
      const imageUrl = story.image_url || DEFAULT_IMAGE;

      return { story, coverages, imageUrl };
    });

    // Build and send email
    const dateStr = new Date().toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
    const subject = `📱 Sachhh Post Kit — ${dateStr} (${posts.length} posts ready)`;
    const html = buildEmailHtml(posts);

    const sent = await sendEmail(subject, html);

    return new Response(JSON.stringify({
      success: sent,
      stories_included: posts.length,
      story_titles: posts.map((p: any) => p.story.title),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Digest error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
