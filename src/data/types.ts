export type BiasLabel = "establishment" | "anti-establishment" | "government" | "opposition" | "independent" | "partisan";
export type Topic = "Politics" | "Economy" | "Sports" | "Tech" | "Regional" | "World" | "Opinion";
export type Language = "English" | "Urdu";
export type Region = "Punjab" | "Sindh" | "KPK" | "Balochistan" | "Islamabad" | "National" | "South Asia" | "Middle East" | "Central Asia" | "Africa" | "Europe" | "Americas" | "Asia" | "Oceania" | "Global";
export type SourceType = "newspaper" | "tv" | "online";

export interface NewsSource {
  id: string;
  name: string;
  nameUrdu?: string;
  bias: BiasLabel;
  credibility: number; // 0-100
  factuality: number; // 0-100
  language: Language[];
  type: SourceType;
  logo: string;
  color: string;
  ownership?: string;
  affiliations?: string[];
  ownershipNote?: string;
  isInternational?: boolean;
  country?: string;
}

export interface ArticleCoverage {
  sourceId: string;
  headline: string;
  summary: string;
  fullContent?: string;
  url: string;
  publishedAt: string;
  isInternational?: boolean;
}

export interface NewsStory {
  id: string;
  title: string;
  titleUrdu?: string;
  topic: Topic;
  region: Region;
  coverages: ArticleCoverage[];
  biasDistribution: { establishment: number; government: number; opposition: number; independent: number };
  isTrending: boolean;
  publishedAt: string;
  imageUrl?: string;
  aiSummary?: string;
  keyPoints?: string[];
  importanceScore?: number;
  isBreaking?: boolean;
}

export interface Claim {
  id: string;
  storyId: string;
  text: string;
  textUrdu?: string;
  supportingSources: string[];
  contradictingSources: string[];
  confidence: number; // 0-100
  explanation: string;
  category: "factual" | "assertion" | "opinion" | "prediction";
}

export interface FactCheck {
  claimId: string;
  score: number; // 0-100
  label: "verified" | "likely" | "unverified" | "disputed" | "false";
  explanation: string;
  sources: string[];
}

export interface InternationalSource {
  id: string;
  name: string;
  country: string;
  bias: BiasLabel;
  credibility: number;
  language: Language[];
  type: SourceType;
  logo: string;
  color: string;
}

export interface InternationalCoverage extends ArticleCoverage {
  isInternational: true;
  sourceId: string;
}
