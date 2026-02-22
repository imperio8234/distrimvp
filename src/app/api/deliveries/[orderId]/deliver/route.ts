import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

const schema = z.object({ notes: z.string().optional() });

// PATCH /api/deliveries/[orderId]/deliver — marcar pedido como entregado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();

  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  const { notes } = schema.parse(body);

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId: auth.companyId },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.upsert({
      where: { orderId },
      update: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        deliveryPersonId: auth.userId,
        notes: notes ?? null,
      },
      create: {
        orderId,
        deliveryPersonId: auth.userId,
        status: "DELIVERED",
        deliveredAt: new Date(),
        notes: notes ?? null,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });

    return delivery;
  });

  return NextResponse.json({ data: { id: result.id } });
}
