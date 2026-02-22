import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";

const DAY_MS = 1000 * 60 * 60 * 24;

// GET /api/vendor/my-visits — visitas de hoy, pendientes y alertas del vendedor
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "VENDOR") return forbidden();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayVisits, scheduledPending, alerts] = await Promise.all([
    // Visitas completadas hoy
    prisma.visit.findMany({
      where: {
        vendorId: auth.userId,
        checkOutAt: { gte: today },
        result: { not: null },
      },
      include: {
        customer: { select: { id: true, name: true, address: true } },
      },
      orderBy: { checkOutAt: "desc" },
    }),
    // Visitas programadas pendientes
    prisma.scheduledVisit.findMany({
      where: { vendorId: auth.userId, completed: false },
      include: {
        customer: {
          select: { id: true, name: true, address: true, lat: true, lng: true },
        },
      },
      orderBy: { scheduledFor: "asc" },
    }),
    // Clientes con 15+ días sin visita (alertas)
    prisma.customer.findMany({
      where: {
        assignedVendorId: auth.userId,
        active: true,
        OR: [
          { lastVisitAt: null },
          { lastVisitAt: { lte: new Date(Date.now() - 15 * DAY_MS) } },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        lastVisitAt: true,
        lat: true,
        lng: true,
      },
      orderBy: { lastVisitAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    data: {
      today: todayVisits.map((v) => ({
        id: v.id,
        customer: v.customer,
        result: v.result,
        orderAmount: v.orderAmount ? Number(v.orderAmount) : null,
        notes: v.notes,
        checkInAt: v.checkInAt,
        checkOutAt: v.checkOutAt,
      })),
      pending: scheduledPending.map((sv) => ({
        id: sv.id,
        type: "scheduled" as const,
        customer: {
          ...sv.customer,
          lat: Number(sv.customer.lat),
          lng: Number(sv.customer.lng),
        },
        scheduledFor: sv.scheduledFor,
        notes: sv.notes,
      })),
      alerts: alerts.map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        lastVisitAt: c.lastVisitAt,
        lat: Number(c.lat),
        lng: Number(c.lng),
        daysSinceVisit: c.lastVisitAt
          ? Math.floor((Date.now() - c.lastVisitAt.getTime()) / DAY_MS)
          : null,
      })),
    },
  });
}
