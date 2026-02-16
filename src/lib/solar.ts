import SunCalc from "suncalc";

export interface HourlyForecast {
  dt: number; // Unix timestamp
  power: number; // Watts
  ghi: number; // W/m²
  temp?: number;
  clouds?: number;
  weather?: string;
}

export interface YearlyEstimate {
  yearlyKWh: number;
  monthlyKWh: number[];
}

export interface AutorkyResult {
  autarkyPercent: number;
  selfConsumptionPercent: number;
}

export interface SolarResult {
  currentPower: number; // Watts
  hourlyForecast: HourlyForecast[];
  totalKWh72h: number;
  peakPower: number;
  peakTime: number;
  savingsEuro: number;
  yearlyEstimate?: YearlyEstimate;
}

const BASE_SYSTEM_LOSSES = 0.14;
const ELECTRICITY_PRICE_EUR = 0.36; // €/kWh aktueller Durchschnitt DE

/**
 * Erbs-Modell: Zerlegt GHI in DNI und DHI.
 * Basiert auf dem Clearness Index kt = GHI / extraterrestrische Strahlung.
 */
export function decomposeGHI(
  ghi: number,
  solarElevationDeg: number
): { dni: number; dhi: number } {
  if (ghi <= 0 || solarElevationDeg <= 0) {
    return { dni: 0, dhi: 0 };
  }

  const elevRad = (solarElevationDeg * Math.PI) / 180;
  const sinElev = Math.sin(elevRad);
  const extraterrestrial = 1361 * sinElev;

  if (extraterrestrial <= 0) return { dni: 0, dhi: 0 };

  const kt = Math.min(1, ghi / extraterrestrial);

  let diffuseFraction: number;
  if (kt <= 0.22) {
    diffuseFraction = 1 - 0.09 * kt;
  } else if (kt <= 0.8) {
    diffuseFraction =
      0.9511 - 0.1604 * kt + 4.388 * kt ** 2 - 16.638 * kt ** 3 + 12.336 * kt ** 4;
  } else {
    diffuseFraction = 0.165;
  }

  const dhi = ghi * diffuseFraction;
  const dni = sinElev > 0.05 ? Math.max(0, (ghi - dhi) / sinElev) : 0;

  return { dni: Math.round(dni), dhi: Math.round(dhi) };
}

/**
 * Sonnenstand berechnen via SunCalc (präzise Astronomie).
 * Gibt { elevation, azimuth } in Grad zurück.
 * SunCalc azimuth: 0=Süd, positiv=West → Umrechnung zu 0=Nord, 180=Süd.
 */
export function getSolarPosition(
  lat: number,
  lon: number,
  date: Date
): { elevation: number; azimuth: number } {
  const pos = SunCalc.getPosition(date, lat, lon);
  // SunCalc: altitude in Rad, azimuth in Rad (0=Süd, West=positiv)
  const elevation = (pos.altitude * 180) / Math.PI;
  // Konvertiere zu Kompass-Azimut: 0=Nord, 90=Ost, 180=Süd, 270=West
  let azimuth = ((pos.azimuth * 180) / Math.PI + 180) % 360;
  if (azimuth < 0) azimuth += 360;

  return {
    elevation: Math.max(0, elevation),
    azimuth,
  };
}

/**
 * Legacy-Wrapper für Kompatibilität.
 */
export function getSolarElevation(
  lat: number,
  lon: number,
  date: Date
): number {
  return getSolarPosition(lat, lon, date).elevation;
}

/**
 * Berechnet Solarleistung aus GHI (von Bright Sky) unter Berücksichtigung
 * von Dachneigung, Ausrichtung, Temperatur und Verschattung.
 * Nutzt SunCalc für präzisen Sonnenstand und Erbs-Decomposition für DNI/DHI.
 */
export function calculateSolarPowerFromGHI(
  ghi: number,
  lat: number,
  lon: number,
  date: Date,
  tilt: number,
  azimuth: number,
  capacityKWp: number,
  options?: { temp?: number; shading?: number }
): number {
  if (ghi <= 0) return 0;

  const sunPos = getSolarPosition(lat, lon, date);
  if (sunPos.elevation <= 0) return 0;

  const { dni, dhi } = decomposeGHI(ghi, sunPos.elevation);

  const tiltRad = (tilt * Math.PI) / 180;

  // Präziser Sonnenazimut aus SunCalc
  const elevRad = (sunPos.elevation * Math.PI) / 180;
  const surfaceAzimuthRad = (azimuth * Math.PI) / 180;
  const solarAzimuthRad = (sunPos.azimuth * Math.PI) / 180;

  const cosIncidence =
    Math.sin(elevRad) * Math.cos(tiltRad) +
    Math.cos(elevRad) *
      Math.sin(tiltRad) *
      Math.cos(solarAzimuthRad - surfaceAzimuthRad);

  const beamTilted = Math.max(0, dni * cosIncidence);
  const diffuseTilted = dhi * (1 + Math.cos(tiltRad)) / 2;
  const groundReflected = ghi * 0.2 * (1 - Math.cos(tiltRad)) / 2;

  const gti = beamTilted + diffuseTilted + groundReflected;

  // Verluste: Basis + Verschattung
  const shadingLoss = (options?.shading ?? 0) / 100;
  const totalLosses = BASE_SYSTEM_LOSSES + shadingLoss;

  let powerWatts = (gti / 1000) * capacityKWp * 1000 * (1 - totalLosses);

  // Temperatur-Koeffizient (NOCT-Approximation)
  if (options?.temp !== undefined) {
    const cellTemp = options.temp + 25; // Zelltemp ≈ Umgebung + 25°C
    const tempLoss = Math.max(0, (cellTemp - 25) * 0.004); // -0.4%/°C über 25°C
    powerWatts *= 1 - tempLoss;
  }

  return Math.max(0, Math.round(powerWatts));
}

export function calculateSavings(totalKWh: number): number {
  return Math.round(totalKWh * ELECTRICITY_PRICE_EUR * 100) / 100;
}

/**
 * Simuliert Autarkie mit einem Standard-Haushaltslastprofil.
 * ~3500 kWh/Jahr ≈ 400W Durchschnitt mit Tagesgang.
 */
export function simulateAutarky(
  hourlyForecast: HourlyForecast[],
  capacityKWp: number,
  batteryKWh: number
): AutorkyResult {
  // Typisches Lastprofil (relative Faktoren, normiert auf ~400W Durchschnitt)
  const loadProfile: Record<number, number> = {
    0: 200, 1: 180, 2: 170, 3: 170, 4: 180, 5: 220,
    6: 350, 7: 500, 8: 450, 9: 380, 10: 350, 11: 380,
    12: 500, 13: 450, 14: 380, 15: 350, 16: 380, 17: 500,
    18: 650, 19: 700, 20: 600, 21: 500, 22: 380, 23: 280,
  };

  let batteryCharge = 0; // kWh aktuell im Speicher
  let totalConsumption = 0; // kWh
  let totalProduction = 0; // kWh
  let selfConsumed = 0; // kWh direkt + aus Batterie

  for (const hour of hourlyForecast) {
    const d = new Date(hour.dt * 1000);
    const h = d.getHours();
    const consumptionW = loadProfile[h] ?? 400;
    const consumptionKWh = consumptionW / 1000;
    const productionKWh = hour.power / 1000;

    totalConsumption += consumptionKWh;
    totalProduction += productionKWh;

    const surplus = productionKWh - consumptionKWh;

    if (surplus >= 0) {
      // Produktion > Verbrauch: Alles selbst verbraucht + Überschuss in Batterie
      selfConsumed += consumptionKWh;
      const chargeable = Math.min(surplus, batteryKWh - batteryCharge);
      batteryCharge += chargeable;
    } else {
      // Verbrauch > Produktion: Direkt + aus Batterie
      selfConsumed += productionKWh;
      const deficit = -surplus;
      const fromBattery = Math.min(deficit, batteryCharge);
      batteryCharge -= fromBattery;
      selfConsumed += fromBattery;
    }
  }

  const autarkyPercent =
    totalConsumption > 0
      ? Math.round((selfConsumed / totalConsumption) * 100)
      : 0;

  const selfConsumptionPercent =
    totalProduction > 0
      ? Math.round(
          (Math.min(selfConsumed, totalProduction) / totalProduction) * 100
        )
      : 0;

  return {
    autarkyPercent: Math.min(100, autarkyPercent),
    selfConsumptionPercent: Math.min(100, selfConsumptionPercent),
  };
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

  if (result.yearlyEstimate) {
    messages.push(
      `Laut PVGIS-Daten der EU würde deine Anlage im Schnitt ${result.yearlyEstimate.yearlyKWh.toLocaleString("de-DE")} kWh pro Jahr erzeugen.`
    );
  } else if (result.savingsEuro > 5) {
    messages.push(
      `Du würdest in 3 Tagen ca. ${result.savingsEuro.toFixed(2)} € sparen.`
    );
  }

  return messages;
}
