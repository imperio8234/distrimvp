import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

// PATCH /api/deliveries/[orderId]/start — marcar pedido como en camino (IN_DELIVERY)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();

  const { orderId } = await params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId: auth.companyId, status: "PENDING" },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado o ya no está pendiente" },
      { status: 404 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.delivery.upsert({
      where: { orderId },
      create: { orderId, deliveryPersonId: auth.userId, status: "PENDING" },
      update: { deliveryPersonId: auth.userId, status: "PENDING" },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "IN_DELIVERY" },
    });
  });

  return NextResponse.json({ data: { status: "IN_DELIVERY" } });
}
