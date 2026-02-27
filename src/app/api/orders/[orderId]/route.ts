import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";

const schema = z.object({
  deliveryDate:     z.string().nullable().optional(), // ISO string o null
  deliveryPersonId: z.string().nullable().optional(), // string = asignar, null = desasignar, undefined = sin cambio
  action:           z.enum(["approve"]).optional(),   // aprobar PENDING_REVIEW → PENDING
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
  const { deliveryDate, deliveryPersonId, action } = parsed.data;

  if (deliveryDate === undefined && deliveryPersonId === undefined && action === undefined) {
    return NextResponse.json(
      { error: "Debe indicar al menos un cambio" },
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

  // Aprobar pedido PENDING_REVIEW → PENDING (sin factura)
  if (action === "approve") {
    if (order.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Solo se pueden aprobar pedidos en estado 'Pendiente de revisión'" },
        { status: 400 }
      );
    }
    await prisma.order.update({ where: { id: orderId }, data: { status: "PENDING" } });
    return NextResponse.json({ ok: true });
  }

  // Validar repartidor si se indica (solo cuando es string, no null)
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
    const orderData: Record<string, unknown> = {};

    if (deliveryDate !== undefined) {
      orderData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    if (deliveryPersonId) {
      // Asignar/reasignar → en reparto
      orderData.status = "IN_DELIVERY";
    } else if (deliveryPersonId === null) {
      // Desasignar explícitamente → volver a pendiente
      orderData.status = "PENDING";
    } else if (order.status === "CANCELLED") {
      // Solo reagendar un pedido cancelado → volver a pendiente
      orderData.status = "PENDING";
    }

    if (Object.keys(orderData).length > 0) {
      await tx.order.update({ where: { id: orderId }, data: orderData });
    }

    if (deliveryPersonId) {
      // Asignar/reasignar: upsert del registro de entrega
      await tx.delivery.upsert({
        where: { orderId },
        update: {
          deliveryPersonId,
          status:      "PENDING",
          deliveredAt: null,
          notes:       null,
        },
        create: { orderId, deliveryPersonId },
      });
    } else if (deliveryPersonId === null && order.delivery) {
      // Desasignar: eliminar el registro de entrega para que vuelva al área de asignación
      await tx.delivery.delete({ where: { orderId } });
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
