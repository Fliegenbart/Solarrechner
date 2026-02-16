import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const plz = request.nextUrl.searchParams.get("plz");

  if (!plz) {
    return NextResponse.json({ error: "PLZ ist erforderlich" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(plz)}&country=Germany&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "EON-Solarrechner/1.0",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding-Service nicht erreichbar" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.length) {
      return NextResponse.json(
        { error: "PLZ nicht gefunden" },
        { status: 404 }
      );
    }

    const result = data[0];
    return NextResponse.json({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name?.split(",")[0] || plz,
    });
  } catch {
    return NextResponse.json(
      { error: "Geocoding fehlgeschlagen" },
      { status: 500 }
    );
  }
}
