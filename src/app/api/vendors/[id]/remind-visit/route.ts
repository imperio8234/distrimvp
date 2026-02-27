import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { sendPushNotification } from "@/lib/push";

// POST /api/vendors/[id]/remind-visit
// Envía un recordatorio de visita al vendedor vía push notification
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "ADMIN" || !auth.companyId) return forbidden();

  const { id: vendorId } = await params;

  const vendor = await prisma.user.findFirst({
    where: {
      id: vendorId,
      companyId: auth.companyId,
      role: "VENDOR",
      active: true,
    },
    select: {
      name: true,
      pushToken: true,
    },
  });

  if (!vendor) {
    return NextResponse.json(
      { error: "Vendedor no encontrado" },
      { status: 404 }
    );
  }

  if (!vendor.pushToken) {
    return NextResponse.json(
      {
        error:
          "El vendedor no tiene un dispositivo registrado para recibir notificaciones.",
      },
      { status: 400 }
    );
  }

  const title = "Recordatorio de visitas";
  const body = `Hola ${
    vendor.name ?? ""
  }, tienes clientes pendientes por visitar. Revisa la app y actualiza tus visitas.`;

  await sendPushNotification(vendor.pushToken, title, body, {
    type: "VISIT_REMINDER",
    vendorId,
  });

  return NextResponse.json({ ok: true });
}

