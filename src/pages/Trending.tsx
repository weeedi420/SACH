import { useQuery } from "@tanstack/react-query";
import { fetchStories } from "@/lib/api";
import { sources } from "@/data/sources";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Trending() {
  const { data: dbStories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
  });

  const stories = dbStories;

  if (!isLoading && stories.length === 0) {
    return (
      <main className="container py-6 max-w-5xl space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">No stories available yet. Data will appear after the next refresh cycle.</p>
      </main>
    );
  }

  // Topic distribution
  const topicCounts: Record<string, number> = {};
  stories.forEach((s) => {
    topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
  });
  const topicData = Object.entries(topicCounts).map(([name, count]) => ({ name, count }));

  // Bias distribution
  const totalBias = stories.reduce(
    (acc, s) => ({
      establishment: acc.establishment + s.biasDistribution.establishment,
      government: acc.government + s.biasDistribution.government,
      opposition: acc.opposition + s.biasDistribution.opposition,
      independent: acc.independent + s.biasDistribution.independent,
    }),
    { establishment: 0, government: 0, opposition: 0, independent: 0 }
  );
  const biasData = [
    { name: "Establishment", value: totalBias.establishment, color: "hsl(80, 40%, 45%)" },
    { name: "Government", value: totalBias.government, color: "hsl(220, 70%, 55%)" },
    { name: "Opposition", value: totalBias.opposition, color: "hsl(15, 80%, 55%)" },
    { name: "Independent", value: totalBias.independent, color: "hsl(170, 60%, 40%)" },
  ];

  // Regional coverage
  const regionCounts: Record<string, number> = {};
  stories.forEach((s) => {
    regionCounts[s.region] = (regionCounts[s.region] || 0) + 1;
  });
  const regionData = Object.entries(regionCounts).map(([name, count]) => ({ name, count }));

  const mostCovered = [...stories].sort((a, b) => b.coverages.length - a.coverages.length).slice(0, 5);

  const chartConfig = {
    count: { label: "Stories", color: "hsl(var(--primary))" },
  };

  if (isLoading) {
    return (
      <main className="container py-6 max-w-5xl space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending & Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Coverage patterns across Pakistani media today
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Topic Distribution
            </h2>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={topicData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Bias Breakdown</h2>
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={biasData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {biasData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {biasData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Regional Coverage</h2>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={regionData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Most Covered Stories</h2>
            <div className="space-y-3">
              {mostCovered.map((story, i) => (
                <div key={story.id} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary mt-0.5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{story.title}</p>
                    <span className="text-[10px] text-muted-foreground">{story.coverages.length} sources · {story.topic}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
