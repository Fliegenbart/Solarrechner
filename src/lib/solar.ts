export interface SolarInput {
  ghi: number; // W/m² Global Horizontal Irradiance
  dni: number; // W/m² Direct Normal Irradiance
  dhi: number; // W/m² Diffuse Horizontal Irradiance
  tilt: number; // degrees 0-60
  azimuth: number; // degrees 0-360 (180 = Süd)
  capacityKWp: number;
}

export interface HourlyForecast {
  dt: number; // Unix timestamp
  power: number; // Watts
  ghi: number;
  temp?: number;
  clouds?: number;
  weather?: string;
}

export interface SolarResult {
  currentPower: number; // Watts
  hourlyForecast: HourlyForecast[];
  totalKWh72h: number;
  peakPower: number;
  peakTime: number;
  savingsEuro: number;
}

const SYSTEM_LOSSES = 0.14;
const ELECTRICITY_PRICE_EUR = 0.36; // €/kWh aktueller Durchschnitt

export function calculateSolarPower(
  ghi: number,
  dni: number,
  dhi: number,
  tilt: number,
  azimuth: number,
  capacityKWp: number
): number {
  const tiltRad = (tilt * Math.PI) / 180;
  const tiltFactor = Math.cos(tiltRad);
  // Süd-Optimierung: bei 180° (Süd) ist die Korrektur 1.0
  const _azimuthCorrection = 1 - Math.abs(180 - azimuth) / 360;

  const estimatedGTI = dni * tiltFactor + dhi;
  const powerWatts = (estimatedGTI / 1000) * capacityKWp * 1000 * (1 - SYSTEM_LOSSES);

  return Math.max(0, Math.round(powerWatts));
}

export function calculateSavings(totalKWh: number): number {
  return Math.round(totalKWh * ELECTRICITY_PRICE_EUR * 100) / 100;
}

export function generateSmartMessages(result: SolarResult): string[] {
  const messages: string[] = [];

  if (result.peakPower > 0) {
    const peakDate = new Date(result.peakTime * 1000);
    const timeStr = peakDate.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dayStr = peakDate.toLocaleDateString("de-DE", { weekday: "long" });

    messages.push(
      `${dayStr} um ${timeStr} Uhr erreichst du deine Spitzenleistung von ${(result.peakPower / 1000).toFixed(1)} kW. Der E.ON Home Energy Manager würde jetzt dein E-Auto laden.`
    );
  }

  if (result.totalKWh72h > 20) {
    messages.push(
      `In den nächsten 3 Tagen hättest du genug Solarstrom, um ${Math.round(result.totalKWh72h / 4)} Waschmaschinenladungen zu betreiben.`
    );
  }

  if (result.currentPower > 500) {
    messages.push(
      `Gerade jetzt würde dein Dach ${(result.currentPower / 1000).toFixed(1)} kW produzieren – genug für deinen gesamten Haushalt!`
    );
  } else if (result.currentPower > 0) {
    messages.push(
      `Dein Dach erzeugt gerade ${result.currentPower} W. Schon kleine Anlagen machen einen Unterschied!`
    );
  }

  if (result.savingsEuro > 5) {
    messages.push(
      `Du würdest in 3 Tagen ca. ${result.savingsEuro.toFixed(2)} € sparen – das sind über ${(result.savingsEuro * 122).toFixed(0)} € im Jahr.`
    );
  }

  return messages;
}
