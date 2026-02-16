"use client";

import { useState } from "react";
import { MapPin, RotateCw, Triangle, Zap } from "lucide-react";

export interface RoofConfig {
  plz: string;
  tilt: number;
  azimuth: number;
  capacityKWp: number;
}

interface RoofConfiguratorProps {
  onSubmit: (config: RoofConfig) => void;
  isLoading: boolean;
}

const AZIMUTH_LABELS: Record<number, string> = {
  0: "Nord",
  45: "Nordost",
  90: "Ost",
  135: "Südost",
  180: "Süd",
  225: "Südwest",
  270: "West",
  315: "Nordwest",
  360: "Nord",
};

function getAzimuthLabel(value: number): string {
  const keys = Object.keys(AZIMUTH_LABELS).map(Number);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
  return AZIMUTH_LABELS[closest] || `${value}°`;
}

export default function RoofConfigurator({
  onSubmit,
  isLoading,
}: RoofConfiguratorProps) {
  const [plz, setPlz] = useState("45131");
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180);
  const [capacityKWp, setCapacityKWp] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ plz, tilt, azimuth, capacityKWp });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PLZ */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-eon-dark mb-2">
          <MapPin size={16} className="text-eon-red" />
          Postleitzahl
        </label>
        <input
          type="text"
          value={plz}
          onChange={(e) => setPlz(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="z.B. 45131"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eon-red focus:ring-2 focus:ring-eon-red/20 outline-none transition-all text-lg"
          maxLength={5}
          required
        />
      </div>

      {/* Dachneigung */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-eon-dark mb-2">
          <Triangle size={16} className="text-eon-red" />
          Dachneigung: {tilt}°
        </label>
        <input
          type="range"
          min={0}
          max={60}
          value={tilt}
          onChange={(e) => setTilt(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-eon-red"
        />
        <div className="flex justify-between text-xs text-eon-dark/40 mt-1">
          <span>Flach (0°)</span>
          <span>Steil (60°)</span>
        </div>
      </div>

      {/* Ausrichtung */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-eon-dark mb-2">
          <RotateCw size={16} className="text-eon-red" />
          Ausrichtung: {getAzimuthLabel(azimuth)} ({azimuth}°)
        </label>
        <input
          type="range"
          min={0}
          max={360}
          step={5}
          value={azimuth}
          onChange={(e) => setAzimuth(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-eon-red"
        />
        <div className="flex justify-between text-xs text-eon-dark/40 mt-1">
          <span>Nord</span>
          <span>Ost</span>
          <span>Süd</span>
          <span>West</span>
          <span>Nord</span>
        </div>
      </div>

      {/* Kapazität */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-eon-dark mb-2">
          <Zap size={16} className="text-eon-red" />
          Anlagengröße: {capacityKWp} kWp
        </label>
        <input
          type="range"
          min={3}
          max={30}
          step={0.5}
          value={capacityKWp}
          onChange={(e) => setCapacityKWp(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-eon-red"
        />
        <div className="flex justify-between text-xs text-eon-dark/40 mt-1">
          <span>3 kWp</span>
          <span>30 kWp</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || plz.length !== 5}
        className="w-full py-4 px-6 bg-eon-red text-white font-bold text-lg rounded-full hover:bg-red-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-eon-red/25"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Berechne...
          </span>
        ) : (
          "Solar-Potenzial berechnen"
        )}
      </button>
    </form>
  );
}
