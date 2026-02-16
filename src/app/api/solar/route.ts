import { NextRequest, NextResponse } from "next/server";
import { calculateSolarPower } from "@/lib/solar";

interface OneCallHourly {
  dt: number;
  temp: number;
  clouds: number;
  weather: { main: string }[];
  uvi?: number;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = params.get("lat");
  const lon = params.get("lon");
  const tilt = parseFloat(params.get("tilt") || "30");
  const azimuth = parseFloat(params.get("azimuth") || "180");
  const capacity = parseFloat(params.get("capacity") || "10");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat und lon sind erforderlich" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key nicht konfiguriert" },
      { status: 500 }
    );
  }

  try {
    // One Call API 3.0 for hourly forecast (48h) + current
    const oneCallRes = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&units=metric&appid=${apiKey}`
    );

    if (!oneCallRes.ok) {
      // Fallback: use free 2.5 API
      const fallbackRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );

      if (!fallbackRes.ok) {
        return NextResponse.json(
          { error: "Wetterdaten konnten nicht geladen werden" },
          { status: 502 }
        );
      }

      const fallbackData = await fallbackRes.json();
      return NextResponse.json(
        buildForecastFromFallback(fallbackData, tilt, azimuth, capacity, parseFloat(lat), parseFloat(lon))
      );
    }

    const data = await oneCallRes.json();
    return NextResponse.json(
      buildForecastFromOneCall(data, tilt, azimuth, capacity)
    );
  } catch {
    return NextResponse.json(
      { error: "Solar-Berechnung fehlgeschlagen" },
      { status: 500 }
    );
  }
}

function estimateIrradiance(
  clouds: number,
  hour: number,
  lat: number
): { ghi: number; dni: number; dhi: number } {
  // Sonnenstunden-Modell basierend auf Tageszeit
  const solarNoon = 12;
  const dayLength = 14; // Sommerannahme (wird später durch Jahreszeit adjustiert)
  const sunrise = solarNoon - dayLength / 2;
  const sunset = solarNoon + dayLength / 2;

  if (hour < sunrise || hour > sunset) {
    return { ghi: 0, dni: 0, dhi: 0 };
  }

  // Sonnenwinkel-Approximation
  const hourAngle = ((hour - solarNoon) / (dayLength / 2)) * (Math.PI / 2);
  const solarElevation = Math.cos(hourAngle);

  // Latitude-Korrektur (Deutschland ~47-55°N)
  const latRad = (Math.abs(lat) * Math.PI) / 180;
  const latFactor = Math.cos(latRad) * 1.4; // Normierung für Mitteleuropa

  // Maximale klare Himmel GHI ≈ 1000 W/m²
  const clearSkyGHI = 1000 * solarElevation * latFactor;

  // Cloud-Reduktion
  const cloudFactor = 1 - (clouds / 100) * 0.75;

  const ghi = Math.max(0, clearSkyGHI * cloudFactor);
  const dniRatio = cloudFactor > 0.5 ? 0.7 : 0.3;
  const dni = ghi * dniRatio;
  const dhi = ghi * (1 - dniRatio);

  return { ghi: Math.round(ghi), dni: Math.round(dni), dhi: Math.round(dhi) };
}

function buildForecastFromOneCall(
  data: { current: OneCallHourly; hourly: OneCallHourly[] },
  tilt: number,
  azimuth: number,
  capacity: number
) {
  const hourly = data.hourly.map((h: OneCallHourly) => {
    const date = new Date(h.dt * 1000);
    const hour = date.getHours() + date.getMinutes() / 60;
    const { ghi, dni, dhi } = estimateIrradiance(h.clouds, hour, 51); // ~DE latitude

    return {
      dt: h.dt,
      power: calculateSolarPower(ghi, dni, dhi, tilt, azimuth, capacity),
      ghi,
      temp: h.temp,
      clouds: h.clouds,
      weather: h.weather?.[0]?.main || "",
    };
  });

  // Current power
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentClouds = data.current?.clouds || 0;
  const { ghi, dni, dhi } = estimateIrradiance(currentClouds, currentHour, 51);
  const currentPower = calculateSolarPower(ghi, dni, dhi, tilt, azimuth, capacity);

  const totalKWh = hourly.reduce((sum: number, h: { power: number }) => sum + h.power / 1000, 0);
  const peak = hourly.reduce(
    (max: { power: number; dt: number }, h: { power: number; dt: number }) =>
      h.power > max.power ? h : max,
    { power: 0, dt: 0 }
  );

  return {
    currentPower,
    currentGHI: ghi,
    hourlyForecast: hourly,
    totalKWh72h: Math.round(totalKWh * 10) / 10,
    peakPower: peak.power,
    peakTime: peak.dt,
  };
}

function buildForecastFromFallback(
  data: { list: { dt: number; main: { temp: number }; clouds: { all: number }; weather: { main: string }[] }[] },
  tilt: number,
  azimuth: number,
  capacity: number,
  lat: number,
  _lon: number
) {
  const hourly = data.list.map((item) => {
    const date = new Date(item.dt * 1000);
    const hour = date.getHours() + date.getMinutes() / 60;
    const clouds = item.clouds?.all || 0;
    const { ghi, dni, dhi } = estimateIrradiance(clouds, hour, lat);

    return {
      dt: item.dt,
      power: calculateSolarPower(ghi, dni, dhi, tilt, azimuth, capacity),
      ghi,
      temp: item.main?.temp,
      clouds,
      weather: item.weather?.[0]?.main || "",
    };
  });

  // Interpolate to get more granular data (3h -> ~1h steps)
  const interpolated = interpolateHourly(hourly);

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const { ghi, dni, dhi } = estimateIrradiance(
    data.list[0]?.clouds?.all || 50,
    currentHour,
    lat
  );
  const currentPower = calculateSolarPower(ghi, dni, dhi, tilt, azimuth, capacity);

  const totalKWh = interpolated.reduce((sum, h) => sum + h.power / 1000, 0);
  const peak = interpolated.reduce(
    (max, h) => (h.power > max.power ? h : max),
    { power: 0, dt: 0, ghi: 0 }
  );

  return {
    currentPower,
    currentGHI: ghi,
    hourlyForecast: interpolated,
    totalKWh72h: Math.round(totalKWh * 10) / 10,
    peakPower: peak.power,
    peakTime: peak.dt,
  };
}

function interpolateHourly(
  data: { dt: number; power: number; ghi: number; temp?: number; clouds?: number; weather?: string }[]
) {
  const result: typeof data = [];

  for (let i = 0; i < data.length - 1; i++) {
    const curr = data[i];
    const next = data[i + 1];
    result.push(curr);

    // Interpolate intermediate hours
    const timeDiff = next.dt - curr.dt;
    const steps = Math.floor(timeDiff / 3600);

    for (let s = 1; s < steps; s++) {
      const ratio = s / steps;
      result.push({
        dt: curr.dt + s * 3600,
        power: Math.round(curr.power + (next.power - curr.power) * ratio),
        ghi: Math.round(curr.ghi + (next.ghi - curr.ghi) * ratio),
        temp: curr.temp && next.temp
          ? Math.round((curr.temp + (next.temp - curr.temp) * ratio) * 10) / 10
          : curr.temp,
        clouds: curr.clouds !== undefined && next.clouds !== undefined
          ? Math.round(curr.clouds + (next.clouds - curr.clouds) * ratio)
          : curr.clouds,
        weather: curr.weather,
      });
    }
  }

  if (data.length > 0) result.push(data[data.length - 1]);
  return result;
}
