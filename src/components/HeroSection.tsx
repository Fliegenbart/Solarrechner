"use client";

import { Sun, Shield, Award } from "lucide-react";

interface HeroSectionProps {
  currentGHI: number | null;
  locationName: string | null;
}

export default function HeroSection({
  currentGHI,
  locationName,
}: HeroSectionProps) {
  return (
    <>
      {/* E.ON Top Bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-eon-red rounded-sm flex items-center justify-center">
              <span className="text-white font-black text-xs">e.on</span>
            </div>
            <span className="text-sm font-semibold text-eon-dark hidden sm:inline">
              Solar Live-Experience
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-eon-gray">
            <span className="hidden md:flex items-center gap-1">
              <Shield size={12} className="text-eon-turquoise" />
              DSGVO-konform
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Award size={12} className="text-eon-turquoise" />
              Daten: DWD & EU
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-eon-red">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-black/5 rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 relative z-10">
          <div className="max-w-3xl">
            {currentGHI !== null ? (
              <>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                  <Sun size={14} className="text-yellow-300" />
                  <span className="text-sm text-white/90 font-medium">
                    Live-Daten
                    {locationName && ` · ${locationName}`}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-7xl md:text-8xl font-black text-white tabular-nums tracking-tight">
                    {currentGHI}
                  </span>
                  <span className="text-2xl md:text-3xl text-white/70 ml-2 font-light">
                    W/m²
                  </span>
                </div>
                <p className="text-xl md:text-2xl text-white/90 font-light mb-2">
                  Sonneneinstrahlung auf deinem Dach – jetzt gerade.
                </p>
                <p className="text-base text-white/60">
                  Dein Dach ist bereit. Bist du es auch?
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.1]">
                  Wie viel Energie steckt
                  <br />
                  in deinem Dach?
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-lg mb-8 font-light leading-relaxed">
                  Erlebe in Echtzeit, wie viel Solarstrom dein Dach produzieren
                  würde. Mit Live-Wetterdaten und 72-Stunden-Forecast.
                </p>
                <div className="flex flex-wrap gap-6 text-sm text-white/70">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-eon-turquoise rounded-full" />
                    Kostenlos & unverbindlich
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-eon-turquoise rounded-full" />
                    Live DWD-Wetterdaten
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-eon-turquoise rounded-full" />
                    EU-Ertragsprognose (PVGIS)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
