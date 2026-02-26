import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { broadcast } from "@/lib/sse-broadcaster";

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

  const now = new Date();

  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      lastLat: lat,
      lastLng: lng,
      lastSeenAt: now,
    },
  });

  // Notificar en tiempo real a los dashboards conectados de esta empresa
  if (auth.companyId) {
    broadcast(auth.companyId, {
      type: "location_update",
      userId: auth.userId,
      lat,
      lng,
      lastSeenAt: now.toISOString(),
    });
  }

  return NextResponse.json({ data: { ok: true } });
}
