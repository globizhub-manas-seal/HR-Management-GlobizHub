import React from "react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricKpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  growthPercent?: number;
  growthLabel?: string;
  icon: LucideIcon;
  accentColor?: "sky" | "emerald" | "indigo" | "teal" | "amber" | "rose";
}

export function MetricKpiCard({
  label,
  value,
  subValue,
  growthPercent,
  growthLabel = "vs last period",
  icon: Icon,
  accentColor = "sky",
}: MetricKpiCardProps) {
  const colorMap = {
    sky: {
      bg: "bg-primary/15",
      text: "text-foreground",
      border: "border-primary/25",
    },
    emerald: {
      bg: "bg-status-green/15",
      text: "text-status-green",
      border: "border-status-green/25",
    },
    indigo: {
      bg: "bg-primary/15",
      text: "text-foreground",
      border: "border-primary/25",
    },
    teal: {
      bg: "bg-primary/15",
      text: "text-foreground",
      border: "border-primary/25",
    },
    amber: {
      bg: "bg-status-orange/15",
      text: "text-status-orange",
      border: "border-status-orange/25",
    },
    rose: {
      bg: "bg-destructive/15",
      text: "text-destructive",
      border: "border-destructive/25",
    },
  };

  const style = colorMap[accentColor] || colorMap.sky;
  const isPositive = growthPercent !== undefined && growthPercent >= 0;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:scale-[1.01] transition-transform duration-150 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={cn("size-8 rounded-xl flex items-center justify-center border", style.bg, style.text, style.border)}>
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {subValue && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>
        )}
      </div>

      {growthPercent !== undefined && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
              isPositive
                ? "bg-status-green/15 text-status-green border-status-green/25"
                : "bg-destructive/15 text-destructive border-destructive/25"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {Math.abs(growthPercent)}%
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">{growthLabel}</span>
        </div>
      )}
    </div>
  );
}

