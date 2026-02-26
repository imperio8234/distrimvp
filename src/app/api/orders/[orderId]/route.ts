import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";

const schema = z.object({
  deliveryDate:     z.string().nullable().optional(), // ISO string o null
  deliveryPersonId: z.string().optional(),
});

/**
 * PATCH /api/orders/[orderId]
 * Reagenda la fecha de entrega y/o reasigna el repartidor de un pedido.
 * Solo para ADMIN. No permite modificar pedidos en estado DELIVERED.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;
  const { orderId } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { deliveryDate, deliveryPersonId } = parsed.data;

  if (deliveryDate === undefined && !deliveryPersonId) {
    return NextResponse.json(
      { error: "Debe indicar al menos una fecha o un repartidor" },
      { status: 400 }
    );
  }

  // Buscar el pedido
  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId },
    include: { delivery: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (order.status === "DELIVERED") {
    return NextResponse.json(
      { error: "No se puede modificar un pedido ya entregado" },
      { status: 400 }
    );
  }

  // Validar repartidor si se indica
  let deliveryPerson = null;
  if (deliveryPersonId) {
    deliveryPerson = await prisma.user.findFirst({
      where: { id: deliveryPersonId, companyId, role: "DELIVERY", active: true },
    });
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
    }
  }

  await prisma.$transaction(async (tx) => {
    // Actualizar pedido
    const orderData: Record<string, unknown> = {};

    if (deliveryDate !== undefined) {
      orderData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    if (deliveryPersonId) {
      // Asignar/reasignar → poner en reparto
      orderData.status = "IN_DELIVERY";
    } else if (order.status === "CANCELLED") {
      // Solo reagendar sin repartidor en orden cancelada → volver a pendiente
      orderData.status = "PENDING";
    }

    if (Object.keys(orderData).length > 0) {
      await tx.order.update({ where: { id: orderId }, data: orderData });
    }

    // Upsert delivery si se indica repartidor
    if (deliveryPersonId) {
      await tx.delivery.upsert({
        where: { orderId },
        update: {
          deliveryPersonId,
          status: "PENDING",
          deliveredAt: null,
          notes:       null,
        },
        create: {
          orderId,
          deliveryPersonId,
        },
      });
    }
  });

  // Notificar al nuevo repartidor
  if (deliveryPerson?.pushToken) {
    await sendPushNotification(
      deliveryPerson.pushToken,
      "Entrega asignada",
      "Se te asignó un pedido para entregar.",
      { type: "DELIVERY_ASSIGNED", orderId }
    );
  }

  return NextResponse.json({ ok: true });
}
