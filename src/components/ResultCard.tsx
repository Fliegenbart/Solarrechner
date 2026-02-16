"use client";

import { TrendingUp, Euro, ArrowRight, Calendar, TreePine, Car, Leaf, Battery } from "lucide-react";
import type { AutorkyResult } from "@/lib/solar";

interface ResultCardProps {
  totalKWh: number;
  savingsEuro: number;
  yearlyEstimate?: {
    yearlyKWh: number;
    monthlyKWh: number[];
  };
  autarky?: {
    battery5: AutorkyResult;
    battery10: AutorkyResult;
  };
  onRequestOffer: () => void;
}

export default function ResultCard({
  totalKWh,
  savingsEuro,
  yearlyEstimate,
  autarky,
  onRequestOffer,
}: ResultCardProps) {
  const yearlyKWh = yearlyEstimate?.yearlyKWh ?? Math.round(totalKWh * 122);
  const yearlySavings = Math.round(yearlyKWh * 0.36);

  // CO₂-Äquivalente
  const co2SavedKg = Math.round(yearlyKWh * 0.4); // 400g CO₂/kWh
  const treesEquiv = Math.round(co2SavedKg / 12.5); // 12,5 kg CO₂/Baum/Jahr
  const carKmSaved = Math.round(co2SavedKg / 0.12); // 120g CO₂/km

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

      <div className="bg-white/10 rounded-xl p-4 mb-4">
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

      {/* CO₂-Äquivalente */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <Leaf size={18} className="text-eon-turquoise mx-auto mb-1" />
          <p className="text-lg font-bold">{(co2SavedKg / 1000).toFixed(1)} t</p>
          <p className="text-[10px] text-white/50">CO₂ gespart/Jahr</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <TreePine size={18} className="text-eon-turquoise mx-auto mb-1" />
          <p className="text-lg font-bold">{treesEquiv}</p>
          <p className="text-[10px] text-white/50">Bäume Äquivalent</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <Car size={18} className="text-eon-turquoise mx-auto mb-1" />
          <p className="text-lg font-bold">{(carKmSaved / 1000).toFixed(0)}k km</p>
          <p className="text-[10px] text-white/50">Auto-km gespart</p>
        </div>
      </div>

      {/* Autarkie mit Batterie */}
      {autarky && (
        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-3">
            <Battery size={14} />
            Autarkie-Simulation
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">Mit 5 kWh Speicher</span>
                <span className="font-bold">{autarky.battery5.autarkyPercent}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-eon-turquoise to-eon-accent h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${autarky.battery5.autarkyPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">Mit 10 kWh Speicher</span>
                <span className="font-bold">{autarky.battery10.autarkyPercent}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-eon-turquoise to-eon-accent h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${autarky.battery10.autarkyPercent}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-white/40 mt-2">
            Basierend auf 3.500 kWh Jahresverbrauch (Ø 2-Personen-Haushalt)
          </p>
        </div>
      )}

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
