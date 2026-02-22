import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

// GET /api/deliveries/today — pedidos pendientes del día para el repartidor
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const orders = await prisma.order.findMany({
    where: {
      companyId: auth.companyId,
      status: { in: ["PENDING", "IN_DELIVERY"] },
      deliveryDate: { gte: startOfToday, lte: endOfToday },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          address: true,
          lat: true,
          lng: true,
          phone: true,
        },
      },
      delivery: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const data = orders.map((o) => ({
    orderId: o.id,
    deliveryId: o.delivery?.id ?? null,
    amount: Number(o.amount),
    orderStatus: o.status,                    // PENDING | IN_DELIVERY | DELIVERED | CANCELLED
    status: o.delivery?.status ?? "PENDING",  // delivery record status (compat)
    deliveryDate: o.deliveryDate,
    notes: o.notes,
    customer: {
      id: o.customer.id,
      name: o.customer.name,
      address: o.customer.address,
      lat: Number(o.customer.lat),
      lng: Number(o.customer.lng),
      phone: o.customer.phone,
    },
  }));

  return NextResponse.json({ data });
}
