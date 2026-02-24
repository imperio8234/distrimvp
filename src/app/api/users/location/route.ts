import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

// PATCH /api/users/location — actualiza la ubicación del usuario autenticado
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();

  // Solo VENDOR y DELIVERY pueden reportar ubicación
  if (auth.role !== "VENDOR" && auth.role !== "DELIVERY") return forbidden();

  const body = await req.json();
  const { lat, lng } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat y lng son requeridos" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      lastLat: lat,
      lastLng: lng,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ data: { ok: true } });
}
