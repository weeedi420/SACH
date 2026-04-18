interface FactCheckBarProps {
  score: number;
  label: string;
  size?: "sm" | "md";
}

export function FactCheckBar({ score, label, size = "sm" }: FactCheckBarProps) {
  const getColor = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getLabelColor = () => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase ${getLabelColor()}`}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{score}%</span>
      </div>
      <div className={`w-full rounded-full bg-muted overflow-hidden ${size === "sm" ? "h-1.5" : "h-2.5"}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
