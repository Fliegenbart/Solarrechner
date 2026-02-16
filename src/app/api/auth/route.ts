import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = body?.password?.trim();
  const sitePassword = process.env.SITE_PASSWORD;

  console.log("Auth attempt:", { hasPassword: !!password, hasEnvVar: !!sitePassword });

  if (!sitePassword || !password || password !== sitePassword) {
    return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("solar-auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    path: "/",
  });

  return response;
}
