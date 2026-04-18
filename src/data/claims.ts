import { Claim, FactCheck, InternationalCoverage } from "./types";

export const claims: Claim[] = [
  // Story 1: IMF Bailout
  {
    id: "c1-1",
    storyId: "1",
    text: "The IMF approved a $3 billion Extended Fund Facility for Pakistan.",
    supportingSources: ["dawn", "geo", "ary", "express", "reuters", "bbc"],
    contradictingSources: [],
    confidence: 98,
    explanation: "Confirmed by IMF official press release and corroborated by 6 independent sources including Reuters and BBC.",
    category: "factual",
  },
  {
    id: "c1-2",
    storyId: "1",
    text: "The deal requires Pakistan to expand its tax base and restructure the energy sector.",
    supportingSources: ["dawn", "geo", "express", "reuters"],
    contradictingSources: [],
    confidence: 92,
    explanation: "Reported consistently across 4 sources with reference to IMF conditionality documents.",
    category: "factual",
  },
  {
    id: "c1-3",
    storyId: "1",
    text: "The government described the bailout as a major economic achievement.",
    supportingSources: ["ary"],
    contradictingSources: ["dawn", "express"],
    confidence: 45,
    explanation: "Only ARY framed it as a 'victory'. Dawn and Express Tribune noted critics questioning the harsh austerity conditions, suggesting a more nuanced picture.",
    category: "assertion",
  },
  {
    id: "c1-4",
    storyId: "1",
    text: "Pakistan's debt-to-GDP ratio will decrease as a result of this package.",
    supportingSources: [],
    contradictingSources: ["bbc", "reuters"],
    confidence: 15,
    explanation: "No domestic source made this claim explicitly. BBC and Reuters noted that Pakistan's debt burden is expected to remain high despite the bailout.",
    category: "prediction",
  },
  // Story 2: Supreme Court
  {
    id: "c2-1",
    storyId: "2",
    text: "The Supreme Court took suo motu notice of election tribunal delays.",
    supportingSources: ["dawn", "ary", "thenews", "aljazeera"],
    contradictingSources: [],
    confidence: 97,
    explanation: "Confirmed by court records and reported by all covering outlets consistently.",
    category: "factual",
  },
  {
    id: "c2-2",
    storyId: "2",
    text: "Hundreds of election cases are still pending months after elections.",
    supportingSources: ["dawn", "thenews", "bbc"],
    contradictingSources: [],
    confidence: 88,
    explanation: "Election Commission records confirm significant backlog. BBC independently verified this figure.",
    category: "factual",
  },
  {
    id: "c2-3",
    storyId: "2",
    text: "The tribunal delays are a deliberate attempt to deny justice.",
    supportingSources: ["bol"],
    contradictingSources: [],
    confidence: 25,
    explanation: "This is an opposition allegation reported only by BOL News. No corroborating evidence or independent verification provided.",
    category: "opinion",
  },
  // Story 5: Balochistan Protests
  {
    id: "c5-1",
    storyId: "5",
    text: "Thousands protested in Quetta demanding answers on missing persons.",
    supportingSources: ["dawn", "thenews", "bbc", "aljazeera"],
    contradictingSources: [],
    confidence: 95,
    explanation: "Confirmed by multiple independent sources including international outlets with on-ground reporting.",
    category: "factual",
  },
  {
    id: "c5-2",
    storyId: "5",
    text: "The number of enforced disappearances in Balochistan is in the thousands.",
    supportingSources: ["dawn", "bbc", "aljazeera"],
    contradictingSources: [],
    confidence: 82,
    explanation: "Human rights organizations' reports corroborate this figure. International outlets cite specific NGO data.",
    category: "factual",
  },
  {
    id: "c5-3",
    storyId: "5",
    text: "The government has failed to provide accountability for missing persons.",
    supportingSources: ["dawn", "thenews", "aljazeera"],
    contradictingSources: ["ary"],
    confidence: 70,
    explanation: "Multiple sources report lack of government response. ARY quoted government officials claiming progress on the issue.",
    category: "assertion",
  },
];

export const factChecks: FactCheck[] = [
  { claimId: "c1-1", score: 98, label: "verified", explanation: "Confirmed by IMF official press release.", sources: ["IMF Press Release", "Reuters Wire"] },
  { claimId: "c1-2", score: 92, label: "verified", explanation: "Conditions documented in IMF board statement.", sources: ["IMF Board Statement"] },
  { claimId: "c1-3", score: 45, label: "disputed", explanation: "Framing varies significantly between outlets.", sources: [] },
  { claimId: "c1-4", score: 15, label: "false", explanation: "Contradicted by IMF's own economic projections for Pakistan.", sources: ["IMF World Economic Outlook"] },
  { claimId: "c2-1", score: 97, label: "verified", explanation: "Court order is public record.", sources: ["Supreme Court Order 2026/SC-12"] },
  { claimId: "c2-2", score: 88, label: "likely", explanation: "Election Commission data supports this but exact figures vary.", sources: ["ECP Annual Report"] },
  { claimId: "c2-3", score: 25, label: "unverified", explanation: "Political allegation without supporting evidence.", sources: [] },
  { claimId: "c5-1", score: 95, label: "verified", explanation: "Independently confirmed by international correspondents.", sources: ["BBC Correspondent Report", "Al Jazeera Field Report"] },
  { claimId: "c5-2", score: 82, label: "likely", explanation: "NGO reports provide substantial evidence.", sources: ["HRCP Report 2025", "Amnesty International"] },
  { claimId: "c5-3", score: 70, label: "likely", explanation: "Government response has been limited but not entirely absent.", sources: ["Commission of Inquiry Report"] },
];

export const internationalCoverages: InternationalCoverage[] = [
  // Story 1: IMF
  {
    sourceId: "reuters",
    headline: "IMF Approves $3 Billion Bailout for Cash-Strapped Pakistan",
    summary: "The International Monetary Fund approved a new $3 billion loan for Pakistan on Wednesday, providing a lifeline to the cash-strapped South Asian nation struggling with inflation and fiscal deficits.",
    url: "#",
    publishedAt: "2026-02-13T07:30:00Z",
    isInternational: true,
  },
  {
    sourceId: "bbc",
    headline: "Pakistan Secures IMF Bailout Amid Economic Crisis",
    summary: "Pakistan has secured a $3 billion bailout from the IMF, its latest in a series of rescue packages. Analysts warn the country's debt burden remains unsustainable without deeper structural reforms.",
    url: "#",
    publishedAt: "2026-02-13T08:15:00Z",
    isInternational: true,
  },
  {
    sourceId: "aljazeera",
    headline: "IMF Greenlights New Pakistan Loan as Austerity Bites",
    summary: "The IMF has approved a fresh $3 billion loan for Pakistan, but the accompanying austerity measures are expected to hit ordinary citizens hard, with subsidy cuts and tax increases on the horizon.",
    url: "#",
    publishedAt: "2026-02-13T09:00:00Z",
    isInternational: true,
  },
  // Story 2: Supreme Court
  {
    sourceId: "aljazeera",
    headline: "Pakistan's Top Court Intervenes in Post-Election Disputes",
    summary: "Pakistan's Supreme Court has taken notice of stalled election tribunals, raising concerns about the country's democratic processes months after controversial general elections.",
    url: "#",
    publishedAt: "2026-02-12T15:30:00Z",
    isInternational: true,
  },
  {
    sourceId: "bbc",
    headline: "Pakistan Supreme Court Flags Election Tribunal Delays",
    summary: "The Supreme Court of Pakistan has highlighted serious delays in election tribunals, with critics saying the backlog undermines democratic accountability.",
    url: "#",
    publishedAt: "2026-02-12T16:00:00Z",
    isInternational: true,
  },
  // Story 5: Balochistan
  {
    sourceId: "bbc",
    headline: "Balochistan Protests: Thousands Demand Answers on 'Disappeared'",
    summary: "Thousands of people have taken to the streets in Pakistan's Balochistan province, demanding information about relatives they say were forcibly disappeared by security forces.",
    url: "#",
    publishedAt: "2026-02-12T17:00:00Z",
    isInternational: true,
  },
  {
    sourceId: "aljazeera",
    headline: "Enforced Disappearances: Balochistan's Open Wound",
    summary: "Mass protests in Balochistan have drawn international attention to the issue of enforced disappearances in Pakistan, with rights groups calling for an independent investigation.",
    url: "#",
    publishedAt: "2026-02-12T17:30:00Z",
    isInternational: true,
  },
  {
    sourceId: "reuters",
    headline: "Pakistan Faces Scrutiny Over Missing Persons as Protests Grow",
    summary: "Growing protests in Pakistan's restive Balochistan province over missing persons are putting renewed pressure on Islamabad to address long-standing human rights concerns.",
    url: "#",
    publishedAt: "2026-02-12T18:00:00Z",
    isInternational: true,
  },
];

export const getClaimsForStory = (storyId: string) =>
  claims.filter((c) => c.storyId === storyId);

export const getFactCheck = (claimId: string) =>
  factChecks.find((fc) => fc.claimId === claimId);

export const getInternationalCoveragesForStory = (storyId: string) => {
  const storyMap: Record<string, string[]> = {
    "1": ["reuters", "bbc", "aljazeera"],
    "2": ["aljazeera", "bbc"],
    "5": ["bbc", "aljazeera", "reuters"],
  };
  const sourceIds = storyMap[storyId] || [];
  return internationalCoverages.filter(
    (c) => sourceIds.includes(c.sourceId) && internationalCoverages.some(
      (ic) => ic.sourceId === c.sourceId && ic === c
    )
  ).filter((c) => {
    // Match by storyId context
    if (storyId === "1") return ["reuters", "bbc", "aljazeera"].includes(c.sourceId) && c.headline.toLowerCase().includes("imf");
    if (storyId === "2") return c.headline.toLowerCase().includes("election") || c.headline.toLowerCase().includes("court");
    if (storyId === "5") return c.headline.toLowerCase().includes("balochistan") || c.headline.toLowerCase().includes("disappear") || c.headline.toLowerCase().includes("missing");
    return false;
  });
};
