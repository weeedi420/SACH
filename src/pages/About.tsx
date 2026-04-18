import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, BarChart3, Search, Users, FileText, Globe, Scale, BookOpen, ClipboardList, Eye } from "lucide-react";

const missionVision = [
  {
    icon: Shield,
    title: "Our Mission",
    content:
      "Sachhh is a purpose-built, Pakistan-focused news aggregation and transparency service. We collect, compare, and explain news so citizens can see what happened, who reported it, how different outlets framed it, and which claims are corroborated by evidence.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    content:
      "A Pakistan where every citizen can instantly see how media shapes narratives — where bias is visible, facts are verified, and trust in journalism is rebuilt through radical transparency.",
  },
];

const methodology = [
  {
    icon: BarChart3,
    title: "How Bias Scores Work",
    content:
      "Every article is analyzed using a multi-factor bias classifier trained on a balanced dataset of Pakistani and international sources. Unlike Western models that use a Left-Center-Right spectrum, our classification reflects Pakistan's unique media landscape: Establishment, Government, Opposition, and Independent. Scores come with explanations so you can decide for yourself.",
  },
  {
    icon: Search,
    title: "Fact-Checking Methodology",
    content:
      "Claims are automatically extracted from articles and cross-referenced against verified sources, government records, and international reporting. Each claim receives a confidence score (0–100%) with a full explanation — which sources support it, which contradict it, and what evidence is missing.",
  },
  {
    icon: Globe,
    title: "International Transparency",
    content:
      "Our signature feature compares local Pakistani coverage with international reporting side-by-side. For any major story, the transparency page shows local coverage with framing analysis, international coverage from outlets like BBC, Reuters, and Al Jazeera, and an evidence matrix mapping claims to sources.",
  },
  {
    icon: Users,
    title: "Citizen Journalism & Community",
    content:
      "Verified users can submit local reports and evidence through our citizen journalism portal. Submissions enter an AI triage queue followed by human moderation for verification.",
  },
  {
    icon: FileText,
    title: "Data Sources & Audits",
    content:
      "We ingest content from 16+ domestic and international sources — mainstream Pakistani outlets (Geo, ARY, Dawn, Express Tribune, Samaa, BOL, Jang, Nawa-i-Waqt, The News, ProPakistani), international wire services and broadcasters (Reuters, AP, BBC, Al Jazeera, CNN, The Guardian), and verified official releases. We publish periodic audit reports detailing our training datasets, model performance metrics, and bias distribution analysis.",
  },
];

export default function About() {
  return (
    <main className="min-h-screen">
      {/* === Hero Section (Ghounsla-style) === */}
      <section className="relative overflow-hidden bg-primary py-20 md:py-28">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary-foreground)) 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="container relative z-10 flex flex-col items-center text-center space-y-6 max-w-3xl">
          {/* Large Urdu calligraphy */}
          <h1 className="font-urdu text-7xl md:text-9xl leading-none text-primary-foreground tracking-wide select-none" style={{ lineHeight: 1.4 }}>
            سچ
          </h1>

          {/* Golden tagline */}
          <p className="text-xl md:text-2xl font-semibold tracking-wide" style={{ color: "hsl(42, 80%, 65%)" }}>
            The Truth in Pakistan's News
          </p>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl leading-relaxed">
            Sachhh (سچ) — an Urdu word meaning "Truth" — represents our commitment to transparent, evidence-based journalism. In a media landscape shaped by ownership and politics, we exist to show you what really happened.
          </p>
        </div>
      </section>

      {/* === Content === */}
      <div className="container py-10 max-w-4xl space-y-8">
        {/* Mission & Vision — 2-column grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {missionVision.map((section) => (
            <Card key={section.title} className="border-primary/20">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">{section.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Methodology cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Methodology</h2>
          {methodology.map((section) => (
            <Card key={section.title}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{section.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bias Mitigation */}
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-semibold text-lg">Bias Mitigation Layers</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "AI Transparency", desc: "Scores + explanations, never final 'truth' labels" },
                { label: "Multi-Source Triangulation", desc: "Corroboration required from independent outlets" },
                { label: "Editorial Oversight", desc: "Human review for disputed or sensitive topics" },
                { label: "Public Audits", desc: "Published methodology, datasets, and retraining schedules" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-muted space-y-1">
                  <Badge variant="secondary" className="text-[10px]">{item.label}</Badge>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editorial Charter */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Editorial Charter</h2>
              <Badge variant="outline" className="text-[10px]">v1.0</Badge>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p><strong>Independence:</strong> Sachhh operates independently of any political party, military institution, government body, or corporate interest.</p>
              <p><strong>Accuracy:</strong> We commit to factual accuracy in all our analyses. When errors occur, we publish corrections promptly and transparently.</p>
              <p><strong>Fairness:</strong> All editorial alignments are presented without value judgment. Our role is to inform, not to persuade.</p>
              <p><strong>Conflict of Interest:</strong> Staff and contributors must disclose any political affiliations, financial interests, or relationships that could influence editorial judgment.</p>
              <p><strong>Corrections & Takedowns:</strong> We maintain a public log of all corrections and takedown requests, with explanations for each decision.</p>
            </div>
          </CardContent>
        </Card>

        {/* Advisory Board */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Advisory Board</h2>
              <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are assembling a multi-stakeholder advisory board comprising news editors, independent journalists,
              digital-rights lawyers, and civil society representatives. Board member profiles and meeting minutes
              will be published publicly once established.
            </p>
          </CardContent>
        </Card>

        {/* Transparency Reports */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Quarterly Transparency Reports</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Every quarter, we publish a public transparency report covering:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                "Sources added or removed",
                "Major disputed items and outcomes",
                "Model updates and dataset changes",
                "User moderation statistics",
                "Bias audit results by topic & language",
                "Roadmap updates and funding notes",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Badge variant="outline" className="text-[10px] mt-2">First report: Q2 2026</Badge>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 space-y-2">
          <p className="font-urdu text-2xl text-primary" style={{ lineHeight: 1.6 }}>سچ</p>
          <p className="text-sm font-semibold">Built for Pakistan</p>
          <p className="text-xs text-muted-foreground">
            Sachhh is an independent platform committed to media transparency, press freedom, and informed citizenship.
          </p>
        </div>
      </div>
    </main>
  );
}
