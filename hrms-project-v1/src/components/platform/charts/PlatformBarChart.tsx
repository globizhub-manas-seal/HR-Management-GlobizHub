"use client";

import { useState } from "react";

interface BarChartDataPoint {
  date: string;
  totalOrgs: number;
  activeOrgs?: number;
  churned?: number;
}

interface PlatformBarChartProps {
  data: BarChartDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function PlatformBarChart({
  data,
  title = "Tenant Onboarding vs Churn",
  subtitle = "Cumulative active tenant organizations versus cancellations",
  height = 240,
}: PlatformBarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<BarChartDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-card border border-border flex items-center justify-center text-xs text-muted-foreground"
      >
        No tenant growth data points available.
      </div>
    );
  }

  const sampleStep = Math.max(1, Math.floor(data.length / 15));
  const sampledData = data.filter((_, idx) => idx % sampleStep === 0);

  const maxVal = Math.max(...sampledData.map((d) => d.totalOrgs), 10);
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.max(6, Math.min(24, (chartWidth / sampledData.length) * 0.6));

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {hoveredPoint ? (
          <div className="text-right">
            <span className="text-xs text-muted-foreground font-mono">{hoveredPoint.date}</span>
            <div className="text-sm font-bold text-foreground">
              {hoveredPoint.totalOrgs} Tenants
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Active Orgs
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Gridlines */}
          {[0, 0.5, 1].map((pct, idx) => {
            const y = paddingTop + chartHeight * (1 - pct);
            const val = Math.round(pct * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="currentColor"
                  className="text-muted-foreground"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {sampledData.map((d, i) => {
            const x = paddingLeft + (i / sampledData.length) * chartWidth + (chartWidth / sampledData.length - barWidth) / 2;
            const barH = (d.totalOrgs / maxVal) * chartHeight;
            const y = paddingTop + chartHeight - barH;
            const isHovered = hoveredPoint?.date === d.date;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barH)}
                  rx="4"
                  className={`transition-colors duration-150 ${
                    isHovered ? "fill-primary" : "fill-primary/70 hover:fill-primary"
                  }`}
                />
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {sampledData.length > 0 && (
            <>
              <text
                x={paddingLeft}
                y={height - 8}
                textAnchor="start"
                fill="currentColor"
                className="text-muted-foreground"
                fontSize="9"
                fontFamily="monospace"
              >
                {sampledData[0].date}
              </text>
              <text
                x={width - paddingRight}
                y={height - 8}
                textAnchor="end"
                fill="currentColor"
                className="text-muted-foreground"
                fontSize="9"
                fontFamily="monospace"
              >
                {sampledData[sampledData.length - 1].date}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

