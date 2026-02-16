"use client";

import { useState } from "react";
import { X, Send, FileText } from "lucide-react";

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  solarData?: {
    totalKWh: number;
    savingsEuro: number;
    plz: string;
    capacityKWp: number;
  };
}

export default function LeadForm({ isOpen, onClose, solarData }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: send to backend / CRM
    console.log("Lead submitted:", { ...form, solarData });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-eon-dark flex items-center gap-2">
              <FileText size={20} className="text-eon-red" />
              {submitted ? "Vielen Dank!" : "Solar-Report anfordern"}
            </h2>
            <button
              onClick={() => {
                onClose();
                setSubmitted(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-green-600" />
              </div>
              <p className="text-lg font-semibold text-eon-dark mb-2">
                Dein Report ist unterwegs!
              </p>
              <p className="text-sm text-eon-dark/60">
                Wir melden uns innerhalb von 24 Stunden bei dir mit deinem
                persönlichen Solar-Report und einem unverbindlichen Angebot.
              </p>
            </div>
          ) : (
            <>
              {solarData && (
                <div className="bg-eon-light rounded-xl p-4 mb-6">
                  <p className="text-sm text-eon-dark/70">
                    Dein Dach könnte{" "}
                    <strong>
                      {(solarData.totalKWh * 122).toLocaleString("de-DE", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      kWh/Jahr
                    </strong>{" "}
                    erzeugen und dir bis zu{" "}
                    <strong className="text-eon-red">
                      {(solarData.savingsEuro * 122).toFixed(0)} €/Jahr
                    </strong>{" "}
                    sparen.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-eon-dark mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eon-red focus:ring-2 focus:ring-eon-red/20 outline-none transition-all"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eon-dark mb-1">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eon-red focus:ring-2 focus:ring-eon-red/20 outline-none transition-all"
                    placeholder="max@beispiel.de"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eon-dark mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eon-red focus:ring-2 focus:ring-eon-red/20 outline-none transition-all"
                    placeholder="+49 123 456 789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eon-dark mb-1">
                    Nachricht
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eon-red focus:ring-2 focus:ring-eon-red/20 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="Optional: Hast du besondere Wünsche?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-eon-red text-white font-bold rounded-full hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-eon-red/25"
                >
                  Report & Angebot anfordern
                </button>

                <p className="text-xs text-center text-eon-dark/40">
                  Unverbindlich und kostenlos. Deine Daten werden nicht an Dritte
                  weitergegeben.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
