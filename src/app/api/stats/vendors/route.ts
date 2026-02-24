import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/stats/vendors?days=7
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "7", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const vendors = await prisma.user.findMany({
    where: { companyId, role: "VENDOR", active: true },
    select: { id: true, name: true },
  });

  const customerCounts = await prisma.customer.groupBy({
    by: ["assignedVendorId"],
    where: { companyId, active: true, assignedVendorId: { not: null } },
    _count: { id: true },
  });
  const customerCountMap = Object.fromEntries(
    customerCounts.map((c) => [c.assignedVendorId!, c._count.id])
  );

  const visits = await prisma.visit.findMany({
    where: { vendor: { companyId }, visitedAt: { gte: since } },
    select: { vendorId: true, result: true, visitedAt: true },
  });

  const orders = await prisma.order.findMany({
    where: { companyId, createdAt: { gte: since } },
    select: { amount: true, visit: { select: { vendorId: true } } },
  });

  const visitsByVendor: Record<string, typeof visits> = {};
  for (const v of visits) {
    if (!visitsByVendor[v.vendorId]) visitsByVendor[v.vendorId] = [];
    visitsByVendor[v.vendorId].push(v);
  }

  const ordersByVendor: Record<string, { count: number; amount: number }> = {};
  for (const o of orders) {
    const vendorId = o.visit?.vendorId;
    if (!vendorId) continue;
    if (!ordersByVendor[vendorId]) ordersByVendor[vendorId] = { count: 0, amount: 0 };
    ordersByVendor[vendorId].count++;
    ordersByVendor[vendorId].amount += Number(o.amount);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dailyVisits = await prisma.visit.findMany({
    where: { vendor: { companyId }, visitedAt: { gte: thirtyDaysAgo } },
    select: { visitedAt: true, vendorId: true },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { metaVisitasSemanales: true },
  });

  const stats = vendors.map((vendor) => {
    const vVisits = visitsByVendor[vendor.id] ?? [];
    const vOrders = ordersByVendor[vendor.id] ?? { count: 0, amount: 0 };
    const conversion = vVisits.length > 0 ? (vOrders.count / vVisits.length) * 100 : 0;

    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      clientesAsignados: customerCountMap[vendor.id] ?? 0,
      visitas: vVisits.length,
      ordenes: vOrders.count,
      monto: vOrders.amount,
      conversion: Math.round(conversion * 10) / 10,
    };
  });

  const dailyMap: Record<string, number> = {};
  for (const v of dailyVisits) {
    const day = v.visitedAt.toISOString().slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    data: {
      vendors: stats,
      dailyVisits: dailyData,
      metaVisitasSemanales: company?.metaVisitasSemanales ?? 0,
      period: { days, since: since.toISOString() },
    },
  });
}
