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
  };
  locationName: string;
  hourlyHighlights: {
    time: string;
    power: number;
    ghi: number;
    clouds: number;
    temp: number;
  }[];
}

const SYSTEM_PROMPT = `Du bist ein freundlicher E.ON Solar-Berater. Analysiere die Solardaten eines Hausbesitzers und gib konkrete, motivierende Empfehlungen.

Regeln:
- Schreibe auf Deutsch, Du-Form, locker aber kompetent
- Maximal 4-5 kurze Absätze
- Nutze konkrete Zahlen aus den Daten
- Gib 2-3 praktische Tipps (z.B. Eigenverbrauch optimieren, E-Auto laden, Wärmepumpe)
- Erwähne E.ON Produkte natürlich (SolarCloud, Home Energy Manager, Wallbox)
- Beende mit einem motivierenden Satz
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

    const userMessage = `Hier sind die Solar-Analysedaten für einen Hausbesitzer:

Standort: PLZ ${data.config.plz} (${data.locationName})
Anlage: ${data.config.capacityKWp} kWp, Dachneigung ${data.config.tilt}°, Ausrichtung ${data.config.azimuth}° (180°=Süd)

Aktuelle Leistung: ${data.currentPower} W
72-Stunden-Forecast: ${data.totalKWh72h} kWh gesamt
Spitzenleistung: ${(data.peakPower / 1000).toFixed(1)} kW am ${peakDayStr} um ${peakTimeStr}
Ersparnis (3 Tage): ${data.savingsEuro.toFixed(2)} €

${yearlyInfo}

Wetter-Highlights der nächsten Stunden:
${data.hourlyHighlights.map((h) => `  ${h.time}: ${h.power}W, GHI ${h.ghi} W/m², ${h.clouds}% Wolken, ${h.temp}°C`).join("\n")}

Bitte analysiere diese Daten und gib dem Hausbesitzer eine persönliche Empfehlung.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
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
