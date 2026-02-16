import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const plz = request.nextUrl.searchParams.get("plz");

  if (!plz) {
    return NextResponse.json({ error: "PLZ ist erforderlich" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key nicht konfiguriert" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(plz)},DE&appid=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "PLZ nicht gefunden" },
        { status: 404 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      lat: data.lat,
      lon: data.lon,
      name: data.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Geocoding fehlgeschlagen" },
      { status: 500 }
    );
  }
}
