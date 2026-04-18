import { useReadingTracker } from "@/hooks/useReadingTracker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3, Trash2, Lightbulb } from "lucide-react";
import { stories } from "@/data/stories";
import { BiasLabel } from "@/data/types";

const biasColors: Record<BiasLabel, string> = {
  establishment: "hsl(80, 40%, 45%)",
  "anti-establishment": "hsl(35, 70%, 45%)",
  government: "hsl(220, 70%, 55%)",
  opposition: "hsl(15, 80%, 55%)",
  independent: "hsl(170, 60%, 40%)",
  partisan: "hsl(280, 50%, 50%)",
};

const biasLabels: Record<BiasLabel, string> = {
  establishment: "Establishment",
  "anti-establishment": "Anti-Establishment",
  government: "Government",
  opposition: "Opposition",
  independent: "Independent",
  partisan: "Partisan",
};

export default function MyBias() {
  const { stats, clearStats } = useReadingTracker();

  const totalSources = Object.values(stats.byBias).reduce((a, b) => a + b, 0);

  const chartData = (Object.keys(stats.byBias) as BiasLabel[])
    .filter((k) => stats.byBias[k] > 0)
    .map((key) => ({
      name: biasLabels[key],
      value: stats.byBias[key],
      color: biasColors[key],
    }));

  // Find dominant bias for nudge
  const dominant = (Object.keys(stats.byBias) as BiasLabel[]).reduce((a, b) =>
    stats.byBias[a] > stats.byBias[b] ? a : b
  );
  const dominantPct = totalSources > 0 ? Math.round((stats.byBias[dominant] / totalSources) * 100) : 0;

  // Suggest stories from underrepresented bias
  const underrepresented = (Object.keys(stats.byBias) as BiasLabel[]).reduce((a, b) =>
    stats.byBias[a] < stats.byBias[b] ? a : b
  );

  const suggestedStories = stories.filter((s) => {
    const dist = s.biasDistribution as Record<string, number>;
    return dist[underrepresented] > 0;
  }).slice(0, 3);

  return (
    <main className="container py-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            My News Bias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your reading patterns across different editorial alignments
          </p>
        </div>
        {stats.total > 0 && (
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={clearStats}>
            <Trash2 className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No reading data yet.</p>
            <p className="text-xs text-muted-foreground">
              Start reading stories from the feed to see your personal bias breakdown here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold mb-3">Your Reading Distribution</h2>
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {chartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="text-sm font-semibold">Reading Stats</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Stories read</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Sources encountered</span>
                    <span className="font-medium">{totalSources}</span>
                  </div>
                  {(Object.keys(stats.byBias) as BiasLabel[]).map((key) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: biasColors[key] }} />
                        {biasLabels[key]}
                      </span>
                      <span className="font-medium">
                        {stats.byBias[key]} ({totalSources > 0 ? Math.round((stats.byBias[key] / totalSources) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nudge */}
          {dominantPct >= 50 && totalSources >= 3 && (
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Diversify Your Reading</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dominantPct}% of your sources are <strong>{biasLabels[dominant]}</strong>-aligned. 
                  Try reading stories with more <strong>{biasLabels[underrepresented]}</strong> coverage for a broader perspective.
                </p>
                {suggestedStories.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {suggestedStories.map((s) => (
                      <div key={s.id} className="text-xs">
                        <a href={`/story/${s.id}`} className="text-primary hover:underline">
                          {s.title}
                        </a>
                        <Badge variant="outline" className="ml-2 text-[9px]">{s.topic}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
