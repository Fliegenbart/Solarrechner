"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface AiAnalysisProps {
  onRequestAnalysis: () => Promise<string>;
}

export default function AiAnalysis({ onRequestAnalysis }: AiAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await onRequestAnalysis();
      setAnalysis(text);
    } catch {
      setError("Analyse konnte nicht geladen werden. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!analysis && !isLoading && !error) {
    return (
      <button
        onClick={handleAnalyze}
        className="w-full py-4 px-6 bg-gradient-to-r from-eon-dark to-gray-800 text-white font-semibold rounded-2xl hover:from-gray-800 hover:to-eon-dark transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
      >
        <Sparkles size={20} className="text-eon-accent" />
        KI-Analyse & persönliche Empfehlung erstellen
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-eon-dark to-gray-800 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sparkles size={20} className="text-eon-accent" />
          Deine persönliche Solar-Analyse
        </h3>
        {analysis && (
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Neue Analyse"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-8">
          <div className="w-5 h-5 border-2 border-eon-accent/30 border-t-eon-accent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">
            Claude analysiert deine Solardaten...
          </p>
        </div>
      )}

      {error && (
        <div className="py-4">
          <p className="text-red-300 text-sm mb-3">{error}</p>
          <button
            onClick={handleAnalyze}
            className="text-sm text-eon-accent hover:underline"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-3">
          {analysis.split("\n").filter(Boolean).map((paragraph, i) => (
            <p key={i} className="text-sm text-white/85 leading-relaxed">
              {paragraph}
            </p>
          ))}
          <p className="text-xs text-white/30 mt-4 pt-3 border-t border-white/10">
            Analyse powered by Claude (Anthropic) · Keine personenbezogenen Daten verarbeitet
          </p>
        </div>
      )}
    </div>
  );
}
