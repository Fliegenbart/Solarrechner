import { NextRequest, NextResponse } from "next/server";
import { calculateSolarPowerFromGHI } from "@/lib/solar";

interface BrightSkyWeather {
  timestamp: string;
  temperature: number | null;
  cloud_cover: number | null;
  sunshine: number | null;
  solar: number | null; // kWh/m² (stündlich)
  condition: string | null;
  icon: string | null;
}

interface BrightSkyResponse {
  weather: BrightSkyWeather[];
  sources: { station_name: string }[];
}

interface PVGISMonthly {
  month: number;
  E_d: number; // kWh/Tag Durchschnitt
  E_m: number; // kWh/Monat
}

interface PVGISResponse {
  outputs: {
    monthly: { fixed: PVGISMonthly[] };
    totals: { fixed: { E_y: number } }; // kWh/Jahr
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = params.get("lat");
  const lon = params.get("lon");
  const tilt = parseFloat(params.get("tilt") || "30");
  const azimuth = parseFloat(params.get("azimuth") || "180");
  const capacity = parseFloat(params.get("capacity") || "10");
  const shading = parseFloat(params.get("shading") || "0");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat und lon sind erforderlich" },
      { status: 400 }
    );
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  try {
    // Parallel: Bright Sky (72h Forecast) + PVGIS (Jahresertrag)
    const [brightSkyResult, pvgisResult] = await Promise.allSettled([
      fetchBrightSky(latNum, lonNum),
      fetchPVGIS(latNum, lonNum, tilt, azimuth, capacity),
    ]);

    // Bright Sky ist Pflicht
    if (brightSkyResult.status === "rejected") {
      return NextResponse.json(
        { error: "Wetterdaten konnten nicht geladen werden" },
        { status: 502 }
      );
    }

    const brightSkyData = brightSkyResult.value;
    const forecast = buildForecast(brightSkyData, latNum, lonNum, tilt, azimuth, capacity, shading);

    // PVGIS ist optional (Jahresertrag)
    let yearlyEstimate: { yearlyKWh: number; monthlyKWh: number[] } | undefined;
    if (pvgisResult.status === "fulfilled" && pvgisResult.value) {
      yearlyEstimate = pvgisResult.value;
    }

    return NextResponse.json({
      ...forecast,
      yearlyEstimate,
    });
  } catch {
    return NextResponse.json(
      { error: "Solar-Berechnung fehlgeschlagen" },
      { status: 500 }
    );
  }
}

async function fetchBrightSky(lat: number, lon: number): Promise<BrightSkyResponse> {
  const now = new Date();
  const end = new Date(now.getTime() + 72 * 3600 * 1000);

  const dateStr = now.toISOString().slice(0, 16);
  const endStr = end.toISOString().slice(0, 16);

  const res = await fetch(
    `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}&date=${dateStr}&last_date=${endStr}&tz=Europe/Berlin`
  );

  if (!res.ok) {
    throw new Error(`Bright Sky error: ${res.status}`);
  }

  return res.json();
}

async function fetchPVGIS(
  lat: number,
  lon: number,
  tilt: number,
  azimuth: number,
  capacity: number
): Promise<{ yearlyKWh: number; monthlyKWh: number[] } | null> {
  // PVGIS nutzt aspect-Konvention: 0=Süd, -90=Ost, 90=West
  // Unsere App: azimuth 180=Süd, 90=Ost, 270=West
  const pvgisAspect = azimuth - 180;

  const res = await fetch(
    `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${lat}&lon=${lon}&peakpower=${capacity}&angle=${tilt}&aspect=${pvgisAspect}&loss=14&outputformat=json`,
    { signal: AbortSignal.timeout(8000) }
  );

  if (!res.ok) return null;

  const data: PVGISResponse = await res.json();

  const monthlyKWh = data.outputs.monthly.fixed.map((m) => Math.round(m.E_m));
  const yearlyKWh = Math.round(data.outputs.totals.fixed.E_y);

  return { yearlyKWh, monthlyKWh };
}

function buildForecast(
  data: BrightSkyResponse,
  lat: number,
  lon: number,
  tilt: number,
  azimuth: number,
  capacity: number,
  shading: number
) {
  const hourly = data.weather.map((w) => {
    const date = new Date(w.timestamp);
    const dt = Math.floor(date.getTime() / 1000);

    // Bright Sky solar: kWh/m² pro Stunde → W/m² (× 1000)
    const ghiWm2 = (w.solar ?? 0) * 1000;

    const power = calculateSolarPowerFromGHI(
      ghiWm2,
      lat,
      lon,
      date,
      tilt,
      azimuth,
      capacity,
      { temp: w.temperature ?? undefined, shading }
    );

    return {
      dt,
      power,
      ghi: Math.round(ghiWm2),
      temp: w.temperature ?? undefined,
      clouds: w.cloud_cover ?? undefined,
      weather: w.condition ?? "",
    };
  });

  // Aktuelle Leistung: nächster Datenpunkt zur aktuellen Zeit
  const now = Date.now() / 1000;
  const currentEntry = hourly.reduce((closest, h) =>
    Math.abs(h.dt - now) < Math.abs(closest.dt - now) ? h : closest
  );

  const totalKWh = hourly.reduce((sum, h) => sum + h.power / 1000, 0);
  const peak = hourly.reduce(
    (max, h) => (h.power > max.power ? h : max),
    { power: 0, dt: 0 }
  );

  return {
    currentPower: currentEntry?.power || 0,
    currentGHI: currentEntry?.ghi || 0,
    hourlyForecast: hourly,
    totalKWh72h: Math.round(totalKWh * 10) / 10,
    peakPower: peak.power,
    peakTime: peak.dt,
  };
}
