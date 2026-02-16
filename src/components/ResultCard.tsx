"use client";

import { TrendingUp, Euro, ArrowRight, Calendar } from "lucide-react";

interface ResultCardProps {
  totalKWh: number;
  savingsEuro: number;
  yearlyEstimate?: {
    yearlyKWh: number;
    monthlyKWh: number[];
  };
  onRequestOffer: () => void;
}

export default function ResultCard({
  totalKWh,
  savingsEuro,
  yearlyEstimate,
  onRequestOffer,
}: ResultCardProps) {
  const yearlyKWh = yearlyEstimate?.yearlyKWh ?? Math.round(totalKWh * 122);
  const yearlySavings = Math.round(yearlyKWh * 0.36);

  return (
    <div className="bg-gradient-to-br from-eon-dark to-gray-800 rounded-2xl p-6 text-white">
      <h3 className="text-lg font-bold mb-4">Dein Solar-Potenzial</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <TrendingUp size={14} />
            Nächste 3 Tage
          </div>
          <p className="text-2xl font-bold">{totalKWh.toFixed(1)} kWh</p>
          <p className="text-xs text-white/50 mt-1">
            Live-Forecast (Bright Sky)
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <Calendar size={14} />
            Jahresertrag
          </div>
          <p className="text-2xl font-bold">
            {yearlyKWh.toLocaleString("de-DE")} kWh
          </p>
          <p className="text-xs text-white/50 mt-1">
            {yearlyEstimate ? "PVGIS-Prognose (EU)" : "Hochrechnung"}
          </p>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
          <Euro size={14} />
          Jährliche Ersparnis
        </div>
        <p className="text-3xl font-bold text-eon-red">
          ≈ {yearlySavings.toLocaleString("de-DE")} €
        </p>
        <p className="text-xs text-white/50 mt-1">
          Bei 0,36 €/kWh Strompreis
        </p>
      </div>

      <p className="text-sm text-white/70 mb-4 leading-relaxed">
        In den nächsten 3 Tagen würde dein Dach{" "}
        <strong className="text-white">{totalKWh.toFixed(1)} kWh</strong>{" "}
        erzeugen. Das spart dir bei aktuellen E.ON Tarifen ca.{" "}
        <strong className="text-eon-red">{savingsEuro.toFixed(2)} Euro</strong>.
      </p>

      <button
        onClick={onRequestOffer}
        className="w-full py-3 px-6 bg-eon-red text-white font-bold rounded-full hover:bg-red-600 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-eon-red/30"
      >
        Jetzt Angebot anfordern
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
