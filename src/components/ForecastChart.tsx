"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ForecastDataPoint {
  dt: number;
  power: number;
  ghi: number;
  temp?: number;
  clouds?: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
}

function formatTime(dt: number) {
  const date = new Date(dt * 1000);
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(dt: number) {
  const date = new Date(dt * 1000);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Heute";
  if (date.toDateString() === tomorrow.toDateString()) return "Morgen";
  return date.toLocaleDateString("de-DE", { weekday: "short" });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ForecastDataPoint; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white shadow-lg rounded-lg p-3 border border-eon-light">
      <p className="text-xs text-eon-dark/50">
        {formatDay(d.dt)} {formatTime(d.dt)}
      </p>
      <p className="text-lg font-bold text-eon-dark">
        {(d.power / 1000).toFixed(2)} kW
      </p>
      <p className="text-xs text-eon-dark/50">
        GHI: {d.ghi} W/m²
        {d.temp !== undefined && ` · ${d.temp}°C`}
        {d.clouds !== undefined && ` · ${d.clouds}% Wolken`}
      </p>
    </div>
  );
}

export default function ForecastChart({ data }: ForecastChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    powerKW: Math.round((d.power / 1000) * 100) / 100,
    label: formatTime(d.dt),
    dayLabel: formatDay(d.dt),
  }));

  // Mark day boundaries
  const dayBreaks: number[] = [];
  for (let i = 1; i < chartData.length; i++) {
    const prev = new Date(chartData[i - 1].dt * 1000).getDate();
    const curr = new Date(chartData[i].dt * 1000).getDate();
    if (prev !== curr) dayBreaks.push(i);
  }

  // Show a tick every ~3 hours
  const tickInterval = Math.max(1, Math.floor(chartData.length / 24));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA1C0A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EA1C0A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#313131" }}
            interval={tickInterval}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#313131" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v} kW`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="powerKW"
            stroke="#EA1C0A"
            strokeWidth={2}
            fill="url(#colorSolar)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Day labels */}
      <div className="flex justify-around mt-2 text-xs text-eon-dark/50">
        {dayBreaks.length === 0 && chartData.length > 0 && (
          <span>{chartData[0].dayLabel}</span>
        )}
        {dayBreaks.map((idx) => (
          <span key={idx}>{chartData[idx]?.dayLabel}</span>
        ))}
      </div>
    </div>
  );
}
