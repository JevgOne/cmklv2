"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";

interface Bucket {
  min: number;
  max: number;
  count: number;
  isCurrent: boolean;
}

interface LeadPriceChartProps {
  buckets: Bucket[];
  stats: {
    median: number;
    mean: number;
    min: number;
    max: number;
    count: number;
    percentile: number;
  };
  sources?: {
    autoscout24: number;
    sauto: number;
    mobile_de: number;
  };
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <div className="font-medium">{label} Kč</div>
      <div className="text-gray-300 mt-0.5">
        {count} {count === 1 ? "vůz" : count < 5 ? "vozy" : "vozů"}
      </div>
    </div>
  );
}

export function LeadPriceChart({ buckets, stats, sources }: LeadPriceChartProps) {
  const data = buckets.map((b) => ({
    label: formatPrice(b.min),
    fullLabel: `${formatPrice(b.min)}–${formatPrice(b.max)}`,
    count: b.count,
    isCurrent: b.isCurrent,
  }));

  // Find bucket labels for reference lines
  const medianBucket = buckets.find(
    (b) => stats.median >= b.min && stats.median <= b.max
  );
  const medianBucketLabel = medianBucket ? formatPrice(medianBucket.min) : null;

  const currentBucket = buckets.find((b) => b.isCurrent);
  const currentBucketLabel = currentBucket ? formatPrice(currentBucket.min) : null;

  return (
    <Card className="p-5">
      {/* Header with source badges */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Cenová distribuce
        </h3>
        {sources && (
          <div className="flex gap-1.5">
            {sources.autoscout24 > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-600 font-medium">
                AutoScout24: {sources.autoscout24}
              </span>
            )}
            {sources.sauto > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-600 font-medium">
                Sauto: {sources.sauto}
              </span>
            )}
            {sources.mobile_de > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-50 text-purple-600 font-medium">
                Mobile.de: {sources.mobile_de}
              </span>
            )}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#F97316" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="barGradientMuted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            interval={0}
            height={25}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            width={25}
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          {medianBucketLabel && (
            <ReferenceLine
              x={medianBucketLabel}
              stroke="#3B82F6"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{ value: "Medián", position: "top", fontSize: 10, fill: "#3B82F6" }}
            />
          )}
          {currentBucketLabel && currentBucketLabel !== medianBucketLabel && (
            <ReferenceLine
              x={currentBucketLabel}
              stroke="#F97316"
              strokeWidth={2}
              label={{ value: "Tento vůz", position: "top", fontSize: 10, fill: "#F97316" }}
            />
          )}
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isCurrent ? "url(#barGradient)" : "url(#barGradientMuted)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold">
            Tržní medián
          </div>
          <div className="text-lg font-bold text-blue-700 tabular-nums">
            {stats.median.toLocaleString("cs-CZ")} Kč
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Průměr
          </div>
          <div className="text-lg font-bold text-gray-700 tabular-nums">
            {stats.mean.toLocaleString("cs-CZ")} Kč
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Cenové pásmo
          </div>
          <div className="text-sm font-bold text-gray-700 tabular-nums">
            {formatPrice(stats.min)} – {formatPrice(stats.max)} Kč
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Porovnáno
          </div>
          <div className="text-lg font-bold text-gray-700 tabular-nums">
            {stats.count} <span className="text-sm font-normal text-gray-500">vozů</span>
          </div>
          <div className="text-[10px] text-gray-400">{stats.percentile}. percentil</div>
        </div>
      </div>
    </Card>
  );
}
