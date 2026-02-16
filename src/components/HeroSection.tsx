"use client";

import { Sun } from "lucide-react";

interface HeroSectionProps {
  currentGHI: number | null;
  locationName: string | null;
}

export default function HeroSection({
  currentGHI,
  locationName,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-eon-dark via-gray-900 to-eon-dark py-16 px-6">
      {/* Animated sun glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-eon-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-eon-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <Sun size={16} className="text-yellow-400" />
          <span className="text-sm text-white/80">Live Solar-Daten</span>
        </div>

        {currentGHI !== null ? (
          <>
            <div className="mb-4">
              <span className="text-7xl md:text-9xl font-black text-eon-red tabular-nums">
                {currentGHI}
              </span>
              <span className="text-2xl md:text-3xl text-white/60 ml-2">
                W/m²
              </span>
            </div>
            <p className="text-xl md:text-2xl text-white/90 font-light mb-2">
              Aktuelle Sonneneinstrahlung
              {locationName && (
                <span className="text-white/50"> in {locationName}</span>
              )}
            </p>
            <p className="text-lg text-white/50 font-medium">
              Dein Dach ist bereit. Bist du es auch?
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Wie viel Energie
              <br />
              <span className="text-eon-red">steckt in deinem Dach?</span>
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Erlebe in Echtzeit, wie viel Solarstrom dein Dach produzieren
              würde. Mit Live-Wetterdaten und 72-Stunden-Forecast.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
