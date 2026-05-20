"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function LeadPriceChart({ buckets, stats }: LeadPriceChartProps) {
  const data = buckets.map((b) => ({
    label: `${formatPrice(b.min)}–${formatPrice(b.max)}`,
    count: b.count,
    isCurrent: b.isCurrent,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
        Cenová distribuce
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [Number(value), "Vozů"]}
            labelFormatter={(label) => `Cena: ${String(label)} Kč`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isCurrent ? "#F97316" : "#E5E7EB"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs text-gray-500">
        <div>
          <span className="block text-gray-400">Medián</span>
          <span className="font-semibold text-gray-700">
            {stats.median.toLocaleString("cs-CZ")} Kč
          </span>
        </div>
        <div>
          <span className="block text-gray-400">Rozsah</span>
          <span className="font-semibold text-gray-700">
            {stats.min.toLocaleString("cs-CZ")} – {stats.max.toLocaleString("cs-CZ")} Kč
          </span>
        </div>
        <div>
          <span className="block text-gray-400">Percentil</span>
          <span className="font-semibold text-gray-700">{stats.percentile}.</span>
        </div>
        <div>
          <span className="block text-gray-400">Porovnáno</span>
          <span className="font-semibold text-gray-700">{stats.count} vozů</span>
        </div>
      </div>
    </Card>
  );
}
