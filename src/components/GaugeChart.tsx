"use client";

interface GaugeChartProps {
  value: number; // current watts
  max: number; // max watts (capacity)
  label?: string;
}

export default function GaugeChart({ value, max, label }: GaugeChartProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const rotation = (percentage / 100) * 180;

  // Arc path for the gauge background
  const radius = 90;
  const cx = 100;
  const cy = 100;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 180) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  const kw = (value / 1000).toFixed(1);
  const maxKw = (max / 1000).toFixed(0);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-xs">
        {/* Background arc */}
        <path
          d={describeArc(0, 180)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {rotation > 0 && (
          <path
            d={describeArc(0, Math.min(rotation, 179.9))}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1EA2B1" />
            <stop offset="50%" stopColor="#EA1C0A" />
            <stop offset="100%" stopColor="#EA1C0A" />
          </linearGradient>
        </defs>
        {/* Center text */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          className="fill-eon-dark text-3xl font-bold"
          fontSize="32"
          fontWeight="700"
        >
          {kw}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="fill-eon-dark/60"
          fontSize="14"
        >
          kW
        </text>
      </svg>
      <div className="flex justify-between w-full max-w-xs px-2 -mt-2 text-xs text-eon-dark/40">
        <span>0</span>
        <span>{maxKw} kW</span>
      </div>
      {label && (
        <p className="mt-2 text-sm font-medium text-eon-dark/70">{label}</p>
      )}
    </div>
  );
}
