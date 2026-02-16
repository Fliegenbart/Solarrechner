"use client";

import { useState, useEffect, useRef } from "react";
import { Euro } from "lucide-react";

interface OpportunityCounterProps {
  currentPower: number; // Watts
}

export default function OpportunityCounter({ currentPower }: OpportunityCounterProps) {
  const [cents, setCents] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    setCents(0);
  }, [currentPower]);

  useEffect(() => {
    if (currentPower <= 0) return;

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime.current) / 1000;
      // kW × €/kWh ÷ 3600 × Sekunden = Euro
      const earned = (currentPower / 1000) * 0.36 / 3600 * elapsedSeconds;
      setCents(earned * 100); // in Cent
    }, 100);

    return () => clearInterval(interval);
  }, [currentPower]);

  if (currentPower <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-eon-turquoise/10 to-eon-accent/10 border border-eon-turquoise/20 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-eon-turquoise/20 rounded-full flex items-center justify-center">
          <Euro size={20} className="text-eon-turquoise" />
        </div>
        <div>
          <p className="text-sm text-eon-dark/60">Seit du hier bist, hättest du bereits</p>
          <p className="text-2xl font-bold text-eon-turquoise tabular-nums">
            {cents.toFixed(2)} Cent
          </p>
          <p className="text-xs text-eon-dark/40">verdient – bei {(currentPower / 1000).toFixed(1)} kW Leistung</p>
        </div>
      </div>
    </div>
  );
}
