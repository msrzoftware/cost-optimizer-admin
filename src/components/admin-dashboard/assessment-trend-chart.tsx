"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AssessmentTrendPoint = {
  month: string;
  value: number;
};

export function AssessmentTrendChart({ data }: { data: readonly AssessmentTrendPoint[] }) {
  const maxValue = Math.max(5, ...data.map((point) => point.value));

  return (
    <div
      className="mt-7 h-[180px] w-full"
      aria-label="New assessments trend over the last six months"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 18, bottom: 0, left: 10 }}>
          <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="2 4" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#A1A1AA", fontSize: 11, fontWeight: 600 }}
            dy={8}
            interval={0}
          />
          <YAxis domain={[0, maxValue]} hide tickCount={5} />
          <Tooltip
            cursor={{ stroke: "#007AFF", strokeDasharray: "3 3", strokeOpacity: 0.24 }}
            contentStyle={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 6,
              boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
              fontSize: 12,
              fontWeight: 700,
            }}
            formatter={(value) => [`${value}`, "Assessments"]}
            labelStyle={{ color: "#86868B", fontWeight: 700 }}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="#007AFF"
            strokeWidth={3}
            dot={{ r: 4, fill: "#007AFF", stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#007AFF", stroke: "#FFFFFF", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
