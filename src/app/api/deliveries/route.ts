import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

// POST /api/deliveries — crear una entrega individual o batch
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const body = await req.json();
  const { orderId, deliveryPersonId, deliveryDate, orderIds } = body;

  // Modo batch si se envía orderIds[]
  if (Array.isArray(orderIds)) {
    if (!deliveryPersonId || orderIds.length === 0) {
      return NextResponse.json({ error: "deliveryPersonId y orderIds son requeridos" }, { status: 400 });
    }

    const deliveryPerson = await prisma.user.findFirst({
      where: { id: deliveryPersonId, companyId, role: "DELIVERY", active: true },
    });
    if (!deliveryPerson) {
      return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, companyId, status: "PENDING", delivery: null },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No hay órdenes válidas para asignar" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      orders.map((order) =>
        prisma.delivery.create({ data: { orderId: order.id, deliveryPersonId } })
      )
    );

    await prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { status: "IN_DELIVERY", ...(deliveryDate ? { deliveryDate: new Date(deliveryDate) } : {}) },
    });

    if (deliveryPerson.pushToken) {
      await sendPushNotification(
        deliveryPerson.pushToken,
        "Nuevas entregas asignadas",
        `Se te asignaron ${created.length} entrega(s) para hoy.`,
        { type: "DELIVERIES_ASSIGNED", count: created.length }
      );
    }

    return NextResponse.json({ data: created }, { status: 201 });
  }

  // Modo individual
  if (!orderId || !deliveryPersonId) {
    return NextResponse.json({ error: "orderId y deliveryPersonId son requeridos" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId },
    include: { delivery: true, customer: { select: { name: true } } },
  });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  if (order.delivery) return NextResponse.json({ error: "La orden ya tiene entrega asignada" }, { status: 409 });

  const deliveryPerson = await prisma.user.findFirst({
    where: { id: deliveryPersonId, companyId, role: "DELIVERY", active: true },
  });
  if (!deliveryPerson) return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });

  const [delivery] = await prisma.$transaction([
    prisma.delivery.create({ data: { orderId, deliveryPersonId } }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "IN_DELIVERY", ...(deliveryDate ? { deliveryDate: new Date(deliveryDate) } : {}) },
    }),
  ]);

  if (deliveryPerson.pushToken) {
    await sendPushNotification(
      deliveryPerson.pushToken,
      "Nueva entrega asignada",
      `Tienes una nueva entrega para: ${order.customer.name}.`,
      { type: "DELIVERY_ASSIGNED", orderId }
    );
  }

  return NextResponse.json({ data: delivery }, { status: 201 });
}
