import { cn } from "@/lib/utils";

interface BiasIndicatorProps {
  distribution: { establishment: number; government: number; opposition: number; independent: number };
  size?: "sm" | "md";
}

export function BiasIndicator({ distribution, size = "sm" }: BiasIndicatorProps) {
  const total = distribution.establishment + distribution.government + distribution.opposition + distribution.independent;
  if (total === 0) return null;

  const estPct = (distribution.establishment / total) * 100;
  const govPct = (distribution.government / total) * 100;
  const oppPct = (distribution.opposition / total) * 100;
  const indPct = (distribution.independent / total) * 100;

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
      {size === "md" && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Est. ({distribution.establishment})</span>
          <span>Gov. ({distribution.government})</span>
          <span>Opp. ({distribution.opposition})</span>
          <span>Ind. ({distribution.independent})</span>
        </div>
      )}
    </div>
  );
}
