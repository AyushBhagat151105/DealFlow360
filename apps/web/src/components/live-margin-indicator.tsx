import { cn } from "@/lib/utils";

interface LiveMarginIndicatorProps {
  marginPercent: number;
  riskScore: number;
  requiredApprovalLevel: "NONE" | "SALES_MANAGER" | "FINANCE";
  className?: string;
}

function getRiskConfig(riskScore: number, approvalLevel: string) {
  if (approvalLevel === "FINANCE" || riskScore > 10) {
    return {
      barColor: "bg-destructive",
      textColor: "text-destructive",
      badgeBg: "bg-destructive/10 dark:bg-destructive/20 border-destructive/30",
      badgeText: "text-destructive",
      label: `Finance Approval Required (Risk: ${riskScore})`,
    };
  }
  if (approvalLevel === "SALES_MANAGER" || riskScore > 0) {
    return {
      barColor: "bg-amber-500",
      textColor: "text-amber-500",
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
      badgeText: "text-amber-600 dark:text-amber-400",
      label: `Manager Approval Required (Risk: ${riskScore})`,
    };
  }
  return {
    barColor: "bg-emerald-500",
    textColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    label: "Auto-Approved (Within Limits)",
  };
}

function getMarginBarColor(pct: number) {
  if (pct >= 30) return "bg-emerald-500";
  if (pct >= 15) return "bg-amber-500";
  return "bg-destructive";
}

export function LiveMarginIndicator({
  marginPercent,
  riskScore,
  requiredApprovalLevel,
  className,
}: LiveMarginIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, marginPercent));
  const risk = getRiskConfig(riskScore, requiredApprovalLevel);
  const barColor = getMarginBarColor(marginPercent);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Margin Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Blended Margin</span>
          <span className={cn("font-bold font-mono", getMarginBarColor(marginPercent).replace("bg-", "text-")
            .replace("emerald-500", "emerald-500").replace("amber-500", "amber-500").replace("destructive", "destructive"))}>
            {marginPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-none bg-muted overflow-hidden border border-border/40">
          <div
            className={cn("h-full transition-all duration-500 ease-out", barColor)}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0%</span>
          <span className="text-amber-500">15%</span>
          <span className="text-emerald-500">30%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Risk Score Pill */}
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-none border text-xs font-medium", risk.badgeBg, risk.badgeText)}>
        <span className={cn("h-2 w-2 rounded-full shrink-0", risk.barColor)} />
        <span>{risk.label}</span>
      </div>
    </div>
  );
}
