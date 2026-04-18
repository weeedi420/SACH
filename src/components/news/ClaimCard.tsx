import { Claim } from "@/data/types";
import { getFactCheck } from "@/data/claims";
import { getSource } from "@/data/sources";
import { getInternationalSource } from "@/data/international-sources";
import { FactCheckBar } from "./FactCheckBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const categoryColors: Record<string, string> = {
  factual: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  assertion: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  opinion: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  prediction: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const confidenceIcon = (score: number) => {
  if (score >= 80) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  if (score >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  if (score >= 25) return <HelpCircle className="h-4 w-4 text-orange-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
};

export function ClaimCard({ claim }: { claim: Claim }) {
  const [open, setOpen] = useState(false);
  const factCheck = getFactCheck(claim.id);

  const resolveSourceName = (id: string) => {
    const local = getSource(id);
    if (local) return local.name;
    const intl = getInternationalSource(id);
    if (intl) return intl.name;
    return id;
  };

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: claim.confidence >= 80 ? "hsl(var(--bias-independent))" : claim.confidence >= 40 ? "hsl(45, 90%, 50%)" : "hsl(var(--destructive))"
    }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          {confidenceIcon(claim.confidence)}
          <p className="text-sm font-medium leading-snug flex-1">{claim.text}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={`text-[10px] ${categoryColors[claim.category]}`}>
            {claim.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {claim.supportingSources.length} supporting · {claim.contradictingSources.length} contradicting
          </span>
        </div>

        {factCheck && (
          <FactCheckBar score={factCheck.score} label={factCheck.label} />
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="text-xs text-primary hover:underline cursor-pointer">
            {open ? "Hide details" : "Why this score?"}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <p className="text-xs text-muted-foreground">{claim.explanation}</p>
            {claim.supportingSources.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground">Supporting:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {claim.supportingSources.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {resolveSourceName(s)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {claim.contradictingSources.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-destructive">Contradicting:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {claim.contradictingSources.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] border-destructive text-destructive">
                      {resolveSourceName(s)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {factCheck?.sources.length ? (
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground">Evidence:</span>
                <ul className="mt-1 space-y-0.5">
                  {factCheck.sources.map((s, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
