import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

const DAY_MS = 1000 * 60 * 60 * 24;

// GET /api/vendor/stats — estadísticas del vendedor autenticado
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "VENDOR") return forbidden();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const [assignedCustomers, visitedToday, pendingAlerts, scheduledToday] =
    await Promise.all([
      prisma.customer.count({
        where: { assignedVendorId: auth.userId, active: true },
      }),
      prisma.visit.count({
        where: {
          vendorId: auth.userId,
          checkOutAt: { gte: today },
          result: { not: null },
        },
      }),
      prisma.customer.count({
        where: {
          assignedVendorId: auth.userId,
          active: true,
          OR: [
            { lastVisitAt: null },
            { lastVisitAt: { lte: new Date(Date.now() - 15 * DAY_MS) } },
          ],
        },
      }),
      prisma.scheduledVisit.count({
        where: {
          vendorId: auth.userId,
          completed: false,
          scheduledFor: { gte: today, lt: tomorrow },
        },
      }),
    ]);

  return NextResponse.json({
    data: { assignedCustomers, visitedToday, pendingAlerts, scheduledToday },
  });
}
