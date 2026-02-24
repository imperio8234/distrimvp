import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET /api/orders/unassigned — órdenes PENDING sin entrega asignada
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const minAmount = searchParams.get("minAmount");

  const orders = await prisma.order.findMany({
    where: {
      companyId,
      status: "PENDING",
      delivery: null,
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
      ...(minAmount ? { amount: { gte: Number(minAmount) } } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, address: true, phone: true } },
      visit: { include: { vendor: { select: { id: true, name: true } } } },
    },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: orders });
}
