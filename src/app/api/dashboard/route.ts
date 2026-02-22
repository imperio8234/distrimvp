import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

const DAY_MS = 1000 * 60 * 60 * 24;

// GET /api/dashboard — estadísticas del panel del dueño
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role !== "ADMIN") return forbidden();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [customers, pendingOrders, todayVisits, monthRevenue] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: auth.companyId, active: true },
      select: { lastVisitAt: true },
    }),
    prisma.order.count({
      where: { companyId: auth.companyId, status: "PENDING" },
    }),
    prisma.visit.count({
      where: {
        customer: { companyId: auth.companyId },
        visitedAt: { gte: startOfToday },
      },
    }),
    prisma.order.aggregate({
      where: {
        companyId: auth.companyId,
        status: { in: ["DELIVERED", "IN_DELIVERY"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  // Clasificar clientes por estado de frío
  let hot = 0, warm = 0, cold = 0, frozen = 0;
  for (const c of customers) {
    const days = c.lastVisitAt
      ? Math.floor((Date.now() - c.lastVisitAt.getTime()) / DAY_MS)
      : 999;
    if (days <= 3) hot++;
    else if (days <= 7) warm++;
    else if (days <= 14) cold++;
    else frozen++;
  }

  return NextResponse.json({
    data: {
      totalCustomers: customers.length,
      hotCustomers: hot,
      warmCustomers: warm,
      coldCustomers: cold,
      frozenCustomers: frozen,
      pendingOrders,
      todayVisits,
      monthRevenue: Number(monthRevenue._sum.amount ?? 0),
    },
  });
}
