import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Solo aplica CORS a rutas /api/*
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // Preflight OPTIONS
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
