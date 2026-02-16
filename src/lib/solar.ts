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

export interface SolarResult {
  currentPower: number; // Watts
  hourlyForecast: HourlyForecast[];
  totalKWh72h: number;
  peakPower: number;
  peakTime: number;
  savingsEuro: number;
  yearlyEstimate?: YearlyEstimate;
}

const SYSTEM_LOSSES = 0.14;
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
 * Sonnenstand berechnen (vereinfacht).
 * Gibt Elevation in Grad zurück.
 */
export function getSolarElevation(
  lat: number,
  lon: number,
  date: Date
): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;

  const declination =
    23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const declRad = (declination * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  const solarTime = hour + lon / 15;
  const hourAngle = ((solarTime - 12) * 15 * Math.PI) / 180;

  const sinElevation =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngle);

  return Math.max(0, (Math.asin(sinElevation) * 180) / Math.PI);
}

/**
 * Berechnet Solarleistung aus GHI (von Bright Sky) unter Berücksichtigung
 * von Dachneigung und Ausrichtung. Nutzt Erbs-Decomposition für DNI/DHI.
 */
export function calculateSolarPowerFromGHI(
  ghi: number,
  lat: number,
  lon: number,
  date: Date,
  tilt: number,
  azimuth: number,
  capacityKWp: number
): number {
  if (ghi <= 0) return 0;

  const elevation = getSolarElevation(lat, lon, date);
  if (elevation <= 0) return 0;

  const { dni, dhi } = decomposeGHI(ghi, elevation);

  const tiltRad = (tilt * Math.PI) / 180;

  // Sonnenazimut-Approximation
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + lon / 15;
  const solarAzimuth = hour < 12 ? 90 + (hour - 6) * 15 : 180 + (hour - 12) * 15;

  // Einfallswinkel auf geneigte Fläche
  const elevRad = (elevation * Math.PI) / 180;
  const surfaceAzimuthRad = (azimuth * Math.PI) / 180;
  const solarAzimuthRad = (solarAzimuth * Math.PI) / 180;

  const cosIncidence =
    Math.sin(elevRad) * Math.cos(tiltRad) +
    Math.cos(elevRad) *
      Math.sin(tiltRad) *
      Math.cos(solarAzimuthRad - surfaceAzimuthRad);

  const beamTilted = Math.max(0, dni * cosIncidence);
  const diffuseTilted = dhi * (1 + Math.cos(tiltRad)) / 2;
  const groundReflected = ghi * 0.2 * (1 - Math.cos(tiltRad)) / 2;

  const gti = beamTilted + diffuseTilted + groundReflected;
  const powerWatts = (gti / 1000) * capacityKWp * 1000 * (1 - SYSTEM_LOSSES);

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
