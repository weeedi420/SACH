import { cn } from "@/lib/utils";

interface BiasIndicatorProps {
  distribution: { establishment: number; government: number; opposition: number; independent: number };
  size?: "sm" | "md";
}

function getBiasLabel(distribution: BiasIndicatorProps["distribution"]): string {
  const { establishment, government, opposition, independent } = distribution;
  const total = establishment + government + opposition + independent;
  if (total === 0) return "";
  const max = Math.max(establishment, government, opposition, independent);
  const indPct = (independent / total) * 100;
  if (indPct >= 70) return "Mostly independent coverage";
  if (indPct >= 50) return "Largely independent coverage";
  if (max === government && government / total >= 0.5) return "Government-leaning coverage";
  if (max === opposition && opposition / total >= 0.5) return "Opposition-leaning coverage";
  if (max === establishment && establishment / total >= 0.5) return "Establishment-leaning coverage";
  return "Mixed bias coverage";
}

export function BiasIndicator({ distribution, size = "sm" }: BiasIndicatorProps) {
  const total = distribution.establishment + distribution.government + distribution.opposition + distribution.independent;
  if (total === 0) return null;

  const estPct = (distribution.establishment / total) * 100;
  const govPct = (distribution.government / total) * 100;
  const oppPct = (distribution.opposition / total) * 100;
  const indPct = (distribution.independent / total) * 100;
  const label = getBiasLabel(distribution);

  return (
    <div className={cn("flex flex-col gap-1", size === "md" && "gap-1.5")}>
      <div className={cn("flex rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-2.5")}>
        {estPct > 0 && (
          <div className="bg-bias-establishment transition-all" style={{ width: `${estPct}%` }} />
        )}
        {govPct > 0 && (
          <div className="bg-bias-government transition-all" style={{ width: `${govPct}%` }} />
        )}
        {oppPct > 0 && (
          <div className="bg-bias-opposition transition-all" style={{ width: `${oppPct}%` }} />
        )}
        {indPct > 0 && (
          <div className="bg-bias-independent transition-all" style={{ width: `${indPct}%` }} />
        )}
      </div>
      {size === "sm" && label && (
        <span className="text-[10px] text-muted-foreground">{label}</span>
      )}
      {size === "md" && (
        <div className="space-y-0.5">
          {label && <span className="text-[11px] text-muted-foreground font-medium">{label}</span>}
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Est. ({distribution.establishment})</span>
            <span>Gov. ({distribution.government})</span>
            <span>Opp. ({distribution.opposition})</span>
            <span>Ind. ({distribution.independent})</span>
          </div>
        </div>
      )}
    </div>
  );
}
