"use client";

import { useState, useEffect } from "react";
import { Lock, Sun } from "lucide-react";

const PASSWORD = "solar26";
const STORAGE_KEY = "solar-auth";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "ok") {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "ok");
      setAuthenticated(true);
    } else {
      setError(true);
    }
  };

  if (checking) return null;

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-eon-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-eon-red rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sun size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-eon-dark">Solar Live-Experience</h1>
          <p className="text-sm text-eon-gray mt-1">Bitte Passwort eingeben</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-eon-dark mb-2">
              <Lock size={16} className="text-eon-red" />
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Passwort eingeben"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eon-red focus:ring-2 focus:ring-eon-red/20 outline-none transition-all text-lg"
              autoFocus
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">Falsches Passwort. Bitte erneut versuchen.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password}
            className="w-full py-3 px-6 bg-eon-red text-white font-bold rounded-full hover:bg-red-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zugang erhalten
          </button>
        </form>
      </div>
    </div>
  );
}
