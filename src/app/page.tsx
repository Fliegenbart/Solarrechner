"use client";

import { useState, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import RoofConfigurator, { type RoofConfig } from "@/components/RoofConfigurator";
import GaugeChart from "@/components/GaugeChart";
import ForecastChart from "@/components/ForecastChart";
import SmartMessages from "@/components/SmartMessages";
import ResultCard from "@/components/ResultCard";
import LeadForm from "@/components/LeadForm";
import { calculateSavings, generateSmartMessages, type SolarResult } from "@/lib/solar";
import { Sun, BarChart3, Zap, BookOpen } from "lucide-react";

interface ApiResponse {
  currentPower: number;
  currentGHI: number;
  hourlyForecast: {
    dt: number;
    power: number;
    ghi: number;
    temp?: number;
    clouds?: number;
    weather?: string;
  }[];
  totalKWh72h: number;
  peakPower: number;
  peakTime: number;
  yearlyEstimate?: {
    yearlyKWh: number;
    monthlyKWh: number[];
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolarResult | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RoofConfig | null>(null);

  const handleSubmit = useCallback(async (roofConfig: RoofConfig) => {
    setIsLoading(true);
    setError(null);
    setConfig(roofConfig);

    try {
      // Step 1: Geocode PLZ
      const geoRes = await fetch(`/api/geocode?plz=${roofConfig.plz}`);
      if (!geoRes.ok) {
        const geoErr = await geoRes.json();
        throw new Error(geoErr.error || "PLZ nicht gefunden");
      }
      const geo = await geoRes.json();
      setLocationName(geo.name);

      // Step 2: Get solar forecast
      const solarRes = await fetch(
        `/api/solar?lat=${geo.lat}&lon=${geo.lon}&tilt=${roofConfig.tilt}&azimuth=${roofConfig.azimuth}&capacity=${roofConfig.capacityKWp}`
      );
      if (!solarRes.ok) {
        const solarErr = await solarRes.json();
        throw new Error(solarErr.error || "Berechnung fehlgeschlagen");
      }
      const data: ApiResponse = await solarRes.json();
      setApiData(data);

      const savings = calculateSavings(data.totalKWh72h);
      const solarResult: SolarResult = {
        currentPower: data.currentPower,
        hourlyForecast: data.hourlyForecast,
        totalKWh72h: data.totalKWh72h,
        peakPower: data.peakPower,
        peakTime: data.peakTime,
        savingsEuro: savings,
        yearlyEstimate: data.yearlyEstimate,
      };

      setResult(solarResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const smartMessages = result ? generateSmartMessages(result) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <HeroSection
        currentGHI={apiData?.currentGHI ?? null}
        locationName={locationName}
      />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Configurator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-eon-dark mb-1 flex items-center gap-2">
                <Sun size={20} className="text-eon-red" />
                Dach-Konfigurator
              </h2>
              <p className="text-sm text-eon-dark/50 mb-6">
                Konfiguriere dein Dach für eine Live-Berechnung
              </p>
              <RoofConfigurator onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {!result && !isLoading && !error && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-eon-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap size={32} className="text-eon-red" />
                </div>
                <h3 className="text-xl font-bold text-eon-dark mb-2">
                  Bereit für deine Solar-Analyse?
                </h3>
                <p className="text-eon-dark/50 max-w-md mx-auto">
                  Gib deine PLZ ein und konfiguriere dein Dach. Wir zeigen dir
                  in Echtzeit, was möglich ist.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-eon-red/20 border-t-eon-red rounded-full animate-spin mx-auto mb-4" />
                <p className="text-eon-dark/60">
                  Lade Live-Wetterdaten und berechne...
                </p>
              </div>
            )}

            {result && !isLoading && (
              <>
                {/* Live Power Gauge */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-eon-dark/70 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-eon-red" />
                    Live-Leistung jetzt
                  </h3>
                  <GaugeChart
                    value={result.currentPower}
                    max={(config?.capacityKWp || 10) * 1000}
                    label="Aktuelle Produktion"
                  />
                </div>

                {/* Forecast Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-eon-dark/70 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-eon-red" />
                    Ertrags-Forecast (72 Stunden)
                  </h3>
                  <ForecastChart data={result.hourlyForecast} />
                </div>

                {/* Smart Messages */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SmartMessages messages={smartMessages} />
                </div>

                {/* Result Card */}
                <ResultCard
                  totalKWh={result.totalKWh72h}
                  savingsEuro={result.savingsEuro}
                  yearlyEstimate={result.yearlyEstimate}
                  onRequestOffer={() => setShowLeadForm(true)}
                />

                {/* Save Report Button */}
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="w-full py-4 px-6 bg-eon-light text-eon-dark font-semibold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen size={18} />
                  Meinen Solar-Report speichern
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-eon-dark text-white/40 text-xs text-center py-6 mt-12">
        <p>
          E.ON Solar Live-Experience &middot; Wetterdaten: DWD via Bright
          Sky &middot; Jahresertrag: PVGIS (EU) &middot; Alle Angaben ohne
          Gewähr
        </p>
      </footer>

      {/* Lead Form Modal */}
      <LeadForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        solarData={
          result && config
            ? {
                totalKWh: result.totalKWh72h,
                savingsEuro: result.savingsEuro,
                plz: config.plz,
                capacityKWp: config.capacityKWp,
              }
            : undefined
        }
      />
    </div>
  );
}
