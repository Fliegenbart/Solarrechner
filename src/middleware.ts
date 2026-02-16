import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login-Seite und Auth-API nicht schützen
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Prüfe Auth-Cookie
  const authCookie = request.cookies.get("solar-auth");
  if (authCookie?.value === "authenticated") {
    return NextResponse.next();
  }

  // Redirect zu Login
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Alle Seiten außer statische Assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
