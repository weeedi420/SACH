import { Claim } from "@/data/types";
import { getSource } from "@/data/sources";
import { getInternationalSource } from "@/data/international-sources";
import { CheckCircle, XCircle, Minus } from "lucide-react";

interface EvidenceMatrixProps {
  claims: Claim[];
}

export function EvidenceMatrix({ claims }: EvidenceMatrixProps) {
  // Collect all unique source IDs
  const allSourceIds = Array.from(
    new Set(claims.flatMap((c) => [...c.supportingSources, ...c.contradictingSources]))
  );

  const resolveSource = (id: string) => {
    const local = getSource(id);
    if (local) return { name: local.name, logo: local.logo, isIntl: false };
    const intl = getInternationalSource(id);
    if (intl) return { name: intl.name, logo: intl.logo, isIntl: true };
    return { name: id, logo: "❓", isIntl: false };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 border-b border-border font-semibold text-muted-foreground min-w-[200px]">
              Claim
            </th>
            {allSourceIds.map((id) => {
              const s = resolveSource(id);
              return (
                <th key={id} className="p-2 border-b border-border text-center min-w-[60px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{s.logo}</span>
                    <span className={`text-[9px] font-medium leading-tight ${s.isIntl ? "text-primary" : "text-muted-foreground"}`}>
                      {s.name.split(" ")[0]}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-muted/50">
              <td className="p-2 border-b border-border text-foreground leading-snug max-w-[250px]">
                {claim.text.length > 80 ? claim.text.slice(0, 80) + "…" : claim.text}
              </td>
              {allSourceIds.map((sourceId) => {
                const supports = claim.supportingSources.includes(sourceId);
                const contradicts = claim.contradictingSources.includes(sourceId);
                return (
                  <td key={sourceId} className="p-2 border-b border-border text-center">
                    {supports ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : contradicts ? (
                      <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
