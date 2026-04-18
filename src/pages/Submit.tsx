import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Eye, AlertTriangle, Bot, Users, UserCheck, ArrowRight } from "lucide-react";
import { Topic, Region } from "@/data/types";
import { getTopicColor } from "@/data/utils";
import { toast } from "@/hooks/use-toast";

const topics: Topic[] = ["Politics", "Economy", "Sports", "Tech", "Regional", "World", "Opinion"];
const regions: Region[] = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "National"];

const verificationSteps = [
  {
    icon: Bot,
    label: "AI Triage",
    description: "Automated checks for source matches, claim patterns, and duplication detection.",
  },
  {
    icon: Users,
    label: "Crowd Signal",
    description: "Community verification — verified users flag and corroborate submissions.",
  },
  {
    icon: UserCheck,
    label: "Human Review",
    description: "Editor reviews evidence matrix, contacts sources, and makes final determination.",
  },
];

export default function Submit() {
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [evidence, setEvidence] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Submission Received",
      description: "Your report has been queued for verification. Thank you for contributing.",
    });
    setHeadline("");
    setContent("");
    setEvidence("");
    setTopic("");
    setRegion("");
    setShowPreview(false);
  };

  return (
    <main className="container py-6 max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">Citizen Journalism</h1>
        <p className="text-sm text-muted-foreground">
          Submit news tips, local reports, or evidence for verification. All submissions go through AI triage and human moderation.
        </p>
      </div>

      {/* Verification Workflow */}
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Verification Workflow</h2>
          <div className="flex items-start gap-2">
            {verificationSteps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-2 flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-center">{step.label}</span>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">{step.description}</p>
                </div>
                {i < verificationSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Verification Notice</p>
              <p className="text-xs text-muted-foreground">
                All submissions are verified before publication. Include links to evidence, documents, or corroborating sources to speed up the process. Anonymous submissions are accepted and your identity is protected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="What happened?" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
              <SelectContent>
                {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the event in detail…" rows={6} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidence">Evidence Links</Label>
          <Textarea id="evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Paste links to documents, photos, or corroborating sources (one per line)" rows={3} />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
            <Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Preview"}
          </Button>
          <Button type="submit" className="gap-2">
            <Send className="h-4 w-4" /> Submit Report
          </Button>
        </div>
      </form>

      {showPreview && headline && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Preview</p>
            <div className="flex items-center gap-2">
              {topic && <Badge variant="secondary" className={`text-[10px] ${getTopicColor(topic as Topic)}`}>{topic}</Badge>}
              {region && <span className="text-xs text-muted-foreground">{region}</span>}
            </div>
            <h2 className="text-base font-bold">{headline}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
            {evidence && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Evidence:</p>
                {evidence.split("\n").filter(Boolean).map((link, i) => (
                  <p key={i} className="text-xs text-primary truncate">{link}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
