import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/stats/deliveries?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const deliveryPeople = await prisma.user.findMany({
    where: { companyId, role: "DELIVERY", active: true },
    select: { id: true, name: true },
  });

  const deliveries = await prisma.delivery.findMany({
    where: {
      deliveryPerson: { companyId },
      createdAt: { gte: dayStart, lte: dayEnd },
    },
    select: {
      deliveryPersonId: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
    },
  });

  const byPerson: Record<string, typeof deliveries> = {};
  for (const d of deliveries) {
    if (!byPerson[d.deliveryPersonId]) byPerson[d.deliveryPersonId] = [];
    byPerson[d.deliveryPersonId].push(d);
  }

  const stats = deliveryPeople.map((person) => {
    const personDeliveries = byPerson[person.id] ?? [];
    const total = personDeliveries.length;
    const delivered = personDeliveries.filter((d) => d.status === "DELIVERED").length;
    const failed = personDeliveries.filter((d) => d.status === "FAILED").length;
    const inProgress = personDeliveries.filter((d) => d.status === "PENDING").length;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const deliveredWithTime = personDeliveries.filter(
      (d) => d.status === "DELIVERED" && d.deliveredAt
    );
    let avgDeliveryMinutes: number | null = null;
    if (deliveredWithTime.length > 0) {
      const totalMs = deliveredWithTime.reduce(
        (sum, d) => sum + (d.deliveredAt!.getTime() - d.createdAt.getTime()),
        0
      );
      avgDeliveryMinutes = Math.round(totalMs / deliveredWithTime.length / 60000);
    }

    return {
      deliveryPersonId: person.id,
      deliveryPersonName: person.name,
      total,
      delivered,
      failed,
      inProgress,
      successRate,
      avgDeliveryMinutes,
    };
  });

  return NextResponse.json({
    data: { deliveries: stats, date: date.toISOString().slice(0, 10) },
  });
}
