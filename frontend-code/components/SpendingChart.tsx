"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SummaryByCategory } from "@/types";

interface SpendingChartProps {
  data: SummaryByCategory[];
  grandTotal: number;
}

const FALLBACK_COLORS = [
  "#22c55e",
  "#6366f1",
  "#f59e0b",
  "#0ea5e9",
  "#ec4899",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
];

export function SpendingChart({ data, grandTotal }: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/60 backdrop-blur-md">
        No transactions yet — add one to see your breakdown.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
        <span className="text-sm text-white/70">
          Total: ${grandTotal.toFixed(2)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total_amount"
            nameKey="category_name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.category_id}
                fill={entry.color_hex || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Spent"]}
            contentStyle={{
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "white",
            }}
          />
          <Legend wrapperStyle={{ color: "white", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
