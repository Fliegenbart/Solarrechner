import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface AnalyzeRequest {
  currentPower: number;
  totalKWh72h: number;
  peakPower: number;
  peakTime: number;
  savingsEuro: number;
  yearlyEstimate?: {
    yearlyKWh: number;
    monthlyKWh: number[];
  };
  config: {
    plz: string;
    tilt: number;
    azimuth: number;
    capacityKWp: number;
    shading?: number;
  };
  locationName: string;
  hourlyHighlights: {
    time: string;
    power: number;
    ghi: number;
    clouds: number;
    temp: number;
  }[];
  autarky?: {
    battery5: { autarkyPercent: number; selfConsumptionPercent: number };
    battery10: { autarkyPercent: number; selfConsumptionPercent: number };
  };
  co2SavedKg?: number;
}

const SYSTEM_PROMPT = `Du bist ein erfahrener E.ON Solar-Berater mit Vertriebskompetenz. Analysiere die Solardaten eines Hausbesitzers und gib konkrete, motivierende Empfehlungen mit sanftem Vertriebsimpuls.

Regeln:
- Schreibe auf Deutsch, Du-Form, locker aber kompetent
- Maximal 5-6 kurze Absätze
- Nutze konkrete Zahlen aus den Daten
- Gib 2-3 praktische Tipps (z.B. Eigenverbrauch optimieren, E-Auto laden, Wärmepumpe)
- Erwähne passend E.ON Produkte:
  • Wenn hoher Mittags-Peak: empfehle E.ON Drive Wallbox ("Nutze den Sonnenstrom direkt fürs E-Auto")
  • Wenn sonnige 72h: empfehle E.ON SolarCloud ("Speichere überschüssigen Strom virtuell")
  • Wenn Autarkie-Daten vorhanden: empfehle Batteriespeicher mit konkreten Autarkie-Werten
  • Immer: erwähne E.ON Home Energy Manager als intelligente Steuerung
- Wenn CO₂-Daten vorhanden: erwähne den Umwelteffekt kurz (Tonnen CO₂, Bäume)
- Erzeuge sanfte Dringlichkeit: "Die aktuelle Einspeisevergütung von 8,03 ct/kWh ist nur noch bis zur nächsten Absenkung garantiert"
- Beende mit einem motivierenden Call-to-Action
- Keine Markdown-Formatierung, nur Fließtext mit Zeilenumbrüchen`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API Key nicht konfiguriert" },
      { status: 500 }
    );
  }

  try {
    const data: AnalyzeRequest = await request.json();

    const peakDate = new Date(data.peakTime * 1000);
    const peakTimeStr = peakDate.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const peakDayStr = peakDate.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const yearlyInfo = data.yearlyEstimate
      ? `Jahresertrag laut PVGIS (EU): ${data.yearlyEstimate.yearlyKWh} kWh/Jahr. Monatliche Verteilung (Jan-Dez): ${data.yearlyEstimate.monthlyKWh.join(", ")} kWh.`
      : "Kein PVGIS-Jahresertrag verfügbar.";

    const autarkyInfo = data.autarky
      ? `\nAutarkie-Simulation:\n- Mit 5 kWh Speicher: ${data.autarky.battery5.autarkyPercent}% Autarkie, ${data.autarky.battery5.selfConsumptionPercent}% Eigenverbrauch\n- Mit 10 kWh Speicher: ${data.autarky.battery10.autarkyPercent}% Autarkie, ${data.autarky.battery10.selfConsumptionPercent}% Eigenverbrauch`
      : "";

    const co2Info = data.co2SavedKg
      ? `\nCO₂-Einsparung: ${data.co2SavedKg} kg/Jahr (≈ ${(data.co2SavedKg / 1000).toFixed(1)} Tonnen), entspricht ca. ${Math.round(data.co2SavedKg / 12.5)} Bäumen.`
      : "";

    const shadingInfo = data.config.shading
      ? `Verschattung: ${data.config.shading}%`
      : "Keine Verschattung";

    const userMessage = `Hier sind die Solar-Analysedaten für einen Hausbesitzer:

Standort: PLZ ${data.config.plz} (${data.locationName})
Anlage: ${data.config.capacityKWp} kWp, Dachneigung ${data.config.tilt}°, Ausrichtung ${data.config.azimuth}° (180°=Süd)
${shadingInfo}

Aktuelle Leistung: ${data.currentPower} W
72-Stunden-Forecast: ${data.totalKWh72h} kWh gesamt
Spitzenleistung: ${(data.peakPower / 1000).toFixed(1)} kW am ${peakDayStr} um ${peakTimeStr}
Ersparnis (3 Tage): ${data.savingsEuro.toFixed(2)} €

${yearlyInfo}${autarkyInfo}${co2Info}

Wetter-Highlights der nächsten Stunden:
${data.hourlyHighlights.map((h) => `  ${h.time}: ${h.power}W, GHI ${h.ghi} W/m², ${h.clouds}% Wolken, ${h.temp}°C`).join("\n")}

Bitte analysiere diese Daten und gib dem Hausbesitzer eine persönliche Empfehlung mit E.ON Produktvorschlägen.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ analysis: text });
  } catch (err) {
    console.error("Claude analysis error:", err);
    return NextResponse.json(
      { error: "Analyse konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
