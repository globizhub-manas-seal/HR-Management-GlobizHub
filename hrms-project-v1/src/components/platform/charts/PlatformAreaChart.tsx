"use client";

import { useState } from "react";

interface AreaChartDataPoint {
  date: string;
  mrr: number;
  collected?: number;
}

interface PlatformAreaChartProps {
  data: AreaChartDataPoint[];
  title?: string;
  subtitle?: string;
  currencyPrefix?: string;
  height?: number;
}

export function PlatformAreaChart({
  data,
  title = "Monthly Recurring Revenue Trend",
  subtitle = "Daily progression of annualized and recurring subscription revenue",
  currencyPrefix = "₹",
  height = 240,
}: PlatformAreaChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<AreaChartDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-card border border-border flex items-center justify-center text-xs text-muted-foreground"
      >
        Insufficient historical snapshot records for this period.
      </div>
    );
  }

  const values = data.map((d) => d.mrr);
  const maxValue = Math.max(...values, 100);
  const minValue = 0;

  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600; // SVG viewBox coordinate width

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minValue) / (maxValue - minValue)) * chartHeight;
  };

  // Build SVG Path
  const points = data.map((d, i) => `${getX(i)},${getY(d.mrr)}`);
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${getX(data.length - 1)},${paddingTop + chartHeight} L ${getX(0)},${paddingTop + chartHeight} Z`;

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
              {currencyPrefix}{hoveredPoint.mrr.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> MRR
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDCD56" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FDCD56" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + chartHeight * (1 - pct);
            const val = Math.round(minValue + pct * (maxValue - minValue));
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
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#mrrGradient)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#FDCD56"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Nodes */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.mrr);
            const isHovered = hoveredPoint?.date === d.date;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? "5" : "2.5"}
                  className="fill-primary stroke-card transition-all duration-150"
                  strokeWidth={isHovered ? "3" : "1"}
                />
                {/* Hit target */}
                <rect
                  x={cx - 10}
                  y={paddingTop}
                  width="20"
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {data.length > 0 && (
            <>
              <text
                x={getX(0)}
                y={height - 8}
                textAnchor="start"
                fill="currentColor"
                className="text-muted-foreground"
                fontSize="9"
                fontFamily="monospace"
              >
                {data[0].date}
              </text>
              <text
                x={getX(data.length - 1)}
                y={height - 8}
                textAnchor="end"
                fill="currentColor"
                className="text-muted-foreground"
                fontSize="9"
                fontFamily="monospace"
              >
                {data[data.length - 1].date}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

