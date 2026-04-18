import { sources } from "@/data/sources";
import { getBiasColor, getBiasLabel } from "@/data/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Building2, Newspaper, Tv, Globe } from "lucide-react";

const sourceTypeIcon = (type: string) => {
  switch (type) {
    case "newspaper": return <Newspaper className="h-5 w-5 text-muted-foreground" />;
    case "tv": return <Tv className="h-5 w-5 text-muted-foreground" />;
    case "online": return <Globe className="h-5 w-5 text-muted-foreground" />;
    default: return <Newspaper className="h-5 w-5 text-muted-foreground" />;
  }
};

const pakistaniSources = sources.filter(s => !s.isInternational && s.id !== "unknown");
const internationalSources = sources.filter(s => s.isInternational);

function SourceGrid({ list, delay = 0 }: { list: typeof sources; delay?: number }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {list.map((source, i) => (
        <motion.div
          key={source.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (delay + i) * 0.04 }}
        >
          <Card className="h-full">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sourceTypeIcon(source.type)}
                  <div>
                    <h3 className="font-semibold text-sm">{source.name}</h3>
                    {source.nameUrdu && (
                      <span className="font-urdu text-xs text-muted-foreground" dir="rtl">{source.nameUrdu}</span>
                    )}
                    {source.country && source.isInternational && (
                      <span className="text-xs text-muted-foreground ml-1">({source.country})</span>
                    )}
                  </div>
                </div>
                <Badge className={`text-[10px] ${getBiasColor(source.bias)}`}>
                  {getBiasLabel(source.bias)}
                </Badge>
              </div>

              {source.ownership && (
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">{source.ownership}</span>
                    {source.ownershipNote && (
                      <p className="text-[10px] mt-0.5">{source.ownershipNote}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Credibility</span>
                  <span className="font-medium">{source.credibility}%</span>
                </div>
                <Progress value={source.credibility} className="h-1.5" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Factuality</span>
                  <span className="font-medium">{source.factuality}%</span>
                </div>
                <Progress value={source.factuality} className="h-1.5" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{source.type}</Badge>
                {source.language.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-[10px]">{lang}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default function Sources() {
  return (
    <main className="container py-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Source Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All {sources.length - 1} news sources tracked by Sachhh — with bias ratings, credibility, and factuality scores
        </p>
      </div>

      {/* Pakistani Sources */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🇵🇰</span>
          <h2 className="text-base font-semibold">Pakistani Sources</h2>
          <Badge variant="secondary" className="text-[10px]">{pakistaniSources.length}</Badge>
        </div>
        <SourceGrid list={pakistaniSources} />
      </section>

      {/* International Sources */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">International Sources</h2>
          <Badge variant="secondary" className="text-[10px]">{internationalSources.length}</Badge>
        </div>
        <SourceGrid list={internationalSources} delay={pakistaniSources.length} />
      </section>
    </main>
  );
}
