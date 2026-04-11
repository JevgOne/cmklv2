"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OrdersChartProps {
  data: Array<{ label: string; count: number }>;
  height?: number;
  barLabel?: string;
}

export function OrdersChart({ data, height = 200, barLabel = "Objednavky" }: OrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
        <Tooltip formatter={(value) => [value, barLabel]} />
        <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
