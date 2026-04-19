/**
 * Strip all markdown syntax and site junk from text, returning clean readable plain text.
 */

const NAV_BLOCKLIST = new Set([
  "home", "latest", "pakistan", "world", "sports", "showbiz", "entertainment",
  "royal", "hollywood", "business", "health", "sci-tech", "food", "videos",
  "shows", "watch", "opinion", "editorial", "columns", "e-paper", "epaper",
  "magazine", "photos", "podcasts", "live", "fact check", "big picture",
  "national", "international", "education", "technology", "lifestyle",
  "culture", "travel", "blogs", "multimedia", "gallery", "tv", "radio",
  "urdu", "english", "trending", "popular", "more", "menu", "search",
  "login", "sign in", "subscribe", "newsletter", "follow us", "contact",
  "about", "advertise", "privacy", "terms", "careers", "feedback",
  "news", "sport", "arts", "earth", "audio", "video", "documentaries",
  "weather", "newsletters", "watch live", "sections",
  "asia pacific", "latin america", "europe", "africa", "china",
  "iran war", "russia-ukraine war", "español",
]);

// Single-word/short junk from video players, caption UIs, etc.
const VIDEO_UI_JUNK = new Set([
  "play", "mute", "unmute", "pause", "stop", "fullscreen", "captions",
  "subtitles", "chapters", "descriptions", "audio track", "show less",
  "show more", "done", "reset", "defaults", "close", "1", "/", "time",
  "loaded", "progress", "stream type", "remaining time", "current time",
  "duration time", "playback rate", "picture-in-picture",
  "captions off, selected", "subtitles off, selected",
  "descriptions off, selected", "audio track, selected",
  "defaultsdone", "back", "forward", "share", "save", "sharesave",
  "info", "listen", "cancel",
]);

export function decodeEntities(text: string): string {
  if (!text) return "";
  let t = text
    .replace(/&mdash;/g, " — ").replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ").replace(/&apos;|&#039;/g, "'")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&lsquo;|&#x2018;/g, "\u2018").replace(/&rsquo;|&#x2019;/g, "\u2019")
    .replace(/&ldquo;|&#x201C;/g, "\u201C").replace(/&rdquo;|&#x201D;/g, "\u201D");
  t = t.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  t = t.replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
  return t;
}

export function stripMarkdown(text: string): string {
  if (!text) return "";
  text = decodeEntities(text);

  let result = text;

  // Remove code blocks first
  result = result.replace(/```[\s\S]*?```/g, "");

  // Remove markdown images
  result = result.replace(/!\[.*?\]\(.*?\)/g, "");

  // Convert markdown links to just text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Remove HTML tags
  result = result.replace(/<[^>]+>/g, "");

  // Remove heading markers
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic markers
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/\*(.+?)\*/g, "$1");
  result = result.replace(/___(.+?)___/g, "$1");
  result = result.replace(/__(.+?)__/g, "$1");
  result = result.replace(/_(.+?)_/g, "$1");

  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove blockquote markers
  result = result.replace(/^>\s?/gm, "");

  // Remove bullet/list markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove inline code
  result = result.replace(/`([^`]+)`/g, "$1");

  // === VIDEO PLAYER JUNK ===
  result = result.replace(/^.*(?:Play Video|Play Mute|Current Time|Duration Time|Playback Rate|Stream Type|Remaining Time|Loaded:\s*\d|Progress:\s*\d).*$/gm, "");
  result = result.replace(/^.*(?:Fullscreen|Picture-in-Picture|This is a modal window).*$/gm, "");
  result = result.replace(/^.*0 seconds of 0 seconds.*$/gm, "");
  result = result.replace(/^.*Volume \d+%.*$/gm, "");
  result = result.replace(/^.*Press shift question mark.*$/gm, "");
  result = result.replace(/^.*Keyboard Shortcuts?(?:Enabled|Disabled)?.*$/gmi, "");
  result = result.replace(/^.*(?:Decrease|Increase) (?:Volume|Caption Size).*$/gm, "");
  result = result.replace(/^.*Seek (?:Forward|Backward).*$/gm, "");
  result = result.replace(/^.*Captions On\/Off.*$/gm, "");
  result = result.replace(/^.*Mute\/Unmute.*$/gm, "");
  result = result.replace(/^.*Error Code:\s*\d+.*$/gm, "");
  result = result.replace(/^.*This video file cannot be played.*$/gm, "");
  result = result.replace(/^.*Seek\s*%\s*\d.*$/gm, "");

  // === CAPTION SETTINGS DIALOG (whole block) ===
  result = result.replace(/Captions Settings Dialog[\s\S]*?(?:Done|Reset|Defaults)/gi, "");
  result = result.replace(/Beginning of dialog window[\s\S]*?End of dialog window/gi, "");

  // === Concatenated color/font settings strings ===
  result = result.replace(/^.*(?:TextColorWhite|FontFamily|BackgroundColor|WindowColor|Font Size|Text Edge Style|Font Family|Text Opacity|Background Opacity).*$/gm, "");
  result = result.replace(/^(?:White|Black|Red|Green|Blue|Yellow|Magenta|Cyan|None|Raised|Depressed|Uniform|Dropshadow|Monospace\s*(?:Sans-Serif|Serif)?|Sans-Serif|Serif|Proportional|Casual|Script|Small Caps|100%|75%|50%|25%|0%)\s*$/gm, "");
  result = result.replace(/^(?:White)?Black(?:Red)?(?:Green)?(?:Blue)?(?:Yellow)?(?:Magenta)?(?:Cyan).*$/gm, "");
  result = result.replace(/^(?:None)?(?:Raised)?(?:Depressed)?(?:Uniform)?(?:Dropshadow).*$/gm, "");
  result = result.replace(/^(?:Monospace\s*)?(?:Sans-Serif)?(?:Serif)?(?:Proportional)?(?:Casual)?(?:Script)?(?:Small Caps)?.*(?:Sans-Serif|Serif|Proportional|Casual|Script|Small Caps).*$/gm, "");
  result = result.replace(/^(?:50%)?(?:75%)?(?:100%)?(?:150%)?(?:200%)?(?:300%)?(?:400%).*$/gm, "");

  // === SITE BOILERPLATE REMOVAL ===
  result = result.replace(/^.*(?:Skip to (?:content|main content|navigation)).*$/gm, "");
  result = result.replace(/^.*Listen to (?:this )?article.*$/gm, "");
  // Dawn "Listen to article1x1.2x1.5x" junk
  result = result.replace(/^.*Listen to article\s*\d.*$/gm, "");
  result = result.replace(/^.*Jump to comments.*$/gm, "");
  result = result.replace(/^.*Join our Whatsapp Channel.*$/gm, "");
  result = result.replace(/^.*Purchase Licensing Rights.*$/gm, "");
  result = result.replace(/^.*Learn more about\s*Refinitiv.*$/gm, "");
  result = result.replace(/^.*Enable accessibility.*$/gm, "");
  result = result.replace(/^.*Get the latest news and updates from (?:Dawn|Geo|ARY).*$/gm, "");
  // Breaking news tickers
  result = result.replace(/BREAKING\s+[\s\S]*?(?:Click to pause|Close Breaking News Ticker|close)\s*/gi, "");
  result = result.replace(/^.*(?:Login or register to continue|Submit\s*Or use).*$/gm, "");
  result = result.replace(/^SECTIONS\s*$/gm, "");
  // Newsletter promos
  result = result.replace(/^.*(?:The Morning Wire|Our flagship newsletter|Newsletter).*$/gm, "");
  result = result.replace(/^.*View image in fullscreen.*$/gm, "");
  // Photo credits
  result = result.replace(/^Photograph:.*$/gm, "");
  // Dawn specific: "Our readers are at the heart..."
  result = result.replace(/^.*Our readers are at the heart.*$/gm, "");
  // Dawn email form junk
  result = result.replace(/^(?:Email|Your Name|Recipient Email|Cancel|Stuck\? Troubleshoot|Troubleshoot|Refresh|Privacy • Help)\*?\s*$/gm, "");
  // Dawn reporter bio lines
  result = result.replace(/^.*is a [\w-]+-based reporter for Dawn.*$/gm, "");
  // "Published[date]Updated[date]" run-together
  result = result.replace(/^.*Published\w+\d{1,2},\s*\d{4}Updated.*$/gm, "");
  // Dawn "PublishedMarch 21, 2026Updatedabout..." lines
  result = result.replace(/^.*Published(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d.*$/gm, "");
  // Al Jazeera "ListenListen (X mins)" 
  result = result.replace(/^.*ListenListen\s*\(\d+\s*mins?\).*$/gm, "");
  // "Click here to share on social media"
  result = result.replace(/^.*Click here to share.*$/gm, "");
  // "share2 Share"
  result = result.replace(/^.*share\d+\s*Share.*$/gm, "");
  // "googleAdd [source] on Google"
  result = result.replace(/^.*googleAdd.*on Google.*$/gm, "");
  // Guardian date headers
  result = result.replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\d{1,2}(?:January|February|March|April|May|June|July|August|September|October|November|December)\d{4}\s*$/gm, "");
  // "pause-square-background"
  result = result.replace(/^.*pause-square-background.*$/gm, "");
  // "opens new tab" (Reuters)
  result = result.replace(/,?\s*opens new tab/g, "");
  // Close/sidebar junk
  result = result.replace(/^Close the sidebar\s*$/gm, "");
  result = result.replace(/^Latest News\s*$/gm, "");
  // Dawn date+reporter line "Web Desk |March 17, 2026"
  result = result.replace(/^(?:Web Desk|Online Desk|News Desk|Staff Reporter).*\d{4}\s*$/gm, "");
  // AFP/File, Reuters captions
  result = result.replace(/^.*— (?:AFP|Reuters|AP|Getty Images?)(?:\/File)?\s*$/gm, "");
  // "Picture taken with a mobile phone"
  result = result.replace(/^.*Picture taken with a mobile phone.*$/gm, "");

  // === "More From" TRUNCATION ===
  const moreFromMatch = result.search(/\n\s*(?:More From|RECOMMENDED FOR YOU|Recommended for you)\s*/i);
  if (moreFromMatch > 200) {
    result = result.substring(0, moreFromMatch);
  }

  // --- Byline detection ---
  const bylineMatch = result.match(/\bBy\s*\n+\s*[A-Z][\w\s]+(?:Desk|Reporter|Correspondent|Staff|Bureau|Editor|Writer|Agency)?\s*\n+\s*\\?\|?\s*\n+\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/i);
  if (bylineMatch && bylineMatch.index !== undefined) {
    const afterByline = bylineMatch.index + bylineMatch[0].length;
    if (afterByline < result.length - 100) {
      result = result.substring(afterByline);
    }
  }

  // --- Site-specific junk removal ---
  result = result.replace(/subscribe to notifications[\s\S]*?(?:not now|allow)/gi, "");
  result = result.replace(/checking your browser[\s\S]*?(?:verification (?:failed|expired|succeeded|success))/gi, "");

  const junkSections = [
    /\n\s*(?:#{1,4}\s*)?(?:read more|most popular|latest stories|comments|related articles|trending|you might also like|popular news|latest news|also read)\s*\n/i,
  ];
  for (const pattern of junkSections) {
    const match = result.search(pattern);
    if (match > 200) {
      result = result.substring(0, match);
    }
  }

  // Remove lines that are just URLs
  result = result.replace(/^https?:\/\/\S+$/gm, "");

  // Remove branding lines
  result = result.replace(/^.*(?:dawn\.com|geo\.tv|arynews\.tv|samaaenglish\.tv).*$/gm, "");
  result = result.replace(/^Published in .+$/gm, "");
  result = result.replace(/^(?:Your Name|Recipient Email|Cancel)\*?\s*$/gm, "");
  result = result.replace(/^.*join our whatsapp.*$/gim, "");
  result = result.replace(/^.*(?:\|.*){3,}$/gm, "");
  result = result.replace(/^\\?\|?\s*$/gm, "");

  // --- Line-by-line filtering ---
  const lines = result.split("\n");
  const filtered: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (!trimmed) { filtered.push(line); continue; }

    // Nav blocklist
    if (trimmed.length < 30 && NAV_BLOCKLIST.has(lower)) continue;

    // Video UI junk (single-word/short lines)
    if (trimmed.length < 40 && VIDEO_UI_JUNK.has(lower)) continue;

    // Short nav-like lines
    if (trimmed.length < 25 && !trimmed.includes(".") && /^[A-Za-z\s&-]+$/.test(trimmed)) {
      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount <= 2 && NAV_BLOCKLIST.has(lower)) continue;
    }

    // Social sharing
    if (lower.includes("share on facebook") || lower.includes("share on twitter") || lower.includes("share on whatsapp")) continue;
    if (lower.includes("icon-whatsapp") || lower.includes("icon-facebook")) continue;

    // Cookie/cloudflare
    if (lower.includes("cookie") && lower.includes("accept")) continue;
    if (lower.includes("cloudflare") || lower.includes("just a moment") || lower.includes("checking your browser")) continue;

    // Ad markers
    if (lower === "advertisement" || lower === "ad") continue;

    // "time" followed by date on its own line (video metadata)
    if (/^time\s/i.test(trimmed) && /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(trimmed)) continue;

    // Facebook/Twitter/Print/Whatsapp share line
    if (/^(?:facebook|twitter|print|whatsapp)\s*[·•]?\s*(?:facebook|twitter|print|whatsapp)/i.test(trimmed)) continue;
    if (/^(?:Facebook\s*·?\s*Twitter\s*Print\s*whatsapp)/i.test(trimmed)) continue;
    if (/facebook\s*[·•.\s]+\s*twitter\s*[·•.\s]*\s*print\s*[·•.\s]*\s*whatsapp/i.test(trimmed)) continue;
    // Lines that are just "More From <show name>"
    if (/^more from\s/i.test(trimmed) && trimmed.length < 60) continue;

    // Dawn: "1x1.2x1.5x" (playback rate selector)
    if (/^\d+x[\d.x]+$/.test(trimmed)) continue;
    // Short lines with only special chars
    if (trimmed.length < 5 && /^[\\|·•\-–—\s]+$/.test(trimmed)) continue;
    // "Top Stories" type headers from AP/BBC
    if (/^TOP STORIES$/i.test(trimmed)) continue;
    // "X hours ago" standalone
    if (/^\d+\s+hours?\s+ago$/i.test(trimmed)) continue;

    filtered.push(line);
  }

  result = filtered.join("\n");

  // --- SMART LEADING BOILERPLATE STRIP ---
  // Find the first paragraph that's 80+ chars (real article content)
  // and strip all short junk lines before it
  const contentLines = result.split("\n");
  let firstRealParagraphIdx = -1;
  for (let i = 0; i < contentLines.length; i++) {
    const t = contentLines[i].trim();
    if (t.length >= 80 && /[a-z]/.test(t)) {
      firstRealParagraphIdx = i;
      break;
    }
  }
  if (firstRealParagraphIdx > 2) {
    // Check if everything before it is short header/nav junk
    const beforeLines = contentLines.slice(0, firstRealParagraphIdx);
    const allShortJunk = beforeLines.every(l => l.trim().length < 60 || !l.trim());
    if (allShortJunk) {
      result = contentLines.slice(firstRealParagraphIdx).join("\n");
    }
  }

  // --- "Next Up" truncation ---
  const nextUpIdx = result.search(/\n\s*Next Up\s*\n/i);
  if (nextUpIdx > 200) result = result.substring(0, nextUpIdx);

  // --- Related article truncation at end ---
  const finalLines = result.split("\n").filter(l => l.trim());
  if (finalLines.length > 5) {
    let cutIndex = finalLines.length;
    let consecutiveShort = 0;
    
    for (let i = finalLines.length - 1; i >= 0; i--) {
      const line = finalLines[i].trim();
      if (line.length > 10 && line.length < 120 && !line.endsWith(".") && /[A-Z]/.test(line[0])) {
        consecutiveShort++;
        if (consecutiveShort >= 3) cutIndex = i;
      } else if (line.length < 5) {
        continue;
      } else {
        break;
      }
    }

    if (cutIndex < finalLines.length - 2) {
      result = finalLines.slice(0, cutIndex).join("\n");
    }
  }

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.trim();

  // === PARAGRAPH QUALITY SCORING ===
  // Instead of chasing junk patterns, score each paragraph structurally
  const UI_JUNK_WORDS = /\b(volume|pause|seek|mute|unmute|fullscreen|keyboard|captions|subtitles|chapters|playback|rewind|forward|scrubber|slider|toggle|viewport|modal|dialog|overlay|popup|dropdown|sidebar|toolbar|widget|checkbox|radio|textarea|placeholder)\b/i;

  const paragraphs = result.split(/\n\s*\n/);
  const scoredParagraphs = paragraphs.filter(p => {
    const trimmed = p.trim();
    if (!trimmed) return false;

    let score = 0;

    // Good signals
    if (trimmed.length >= 80) score += 2;
    if (trimmed.length >= 40) score += 1;
    if ((trimmed.match(/\./g) || []).length >= 1) score += 2;
    if (trimmed.endsWith(".")) score += 1;
    if (trimmed.split(/\s+/).length >= 12) score += 1;

    // Bad signals
    if (UI_JUNK_WORDS.test(trimmed)) score -= 5;
    if (trimmed.length < 30 && !/[.!?]$/.test(trimmed)) score -= 2;
    if (/^\d+:\d+/.test(trimmed)) score -= 3; // timestamps
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(trimmed) && trimmed.length < 30) score -= 2; // "Show Less" type

    return score >= 1;
  });

  result = scoredParagraphs.join("\n\n").trim();

  // Final quality gate
  if (result.length < 50) return "";

  return result;
}
