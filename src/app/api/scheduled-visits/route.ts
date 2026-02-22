import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { requireWrite } from "@/lib/subscription";

const createSchema = z.object({
  customerId: z.string(),
  scheduledFor: z.string().datetime(),
  notes: z.string().optional(),
});

// GET /api/scheduled-visits — visitas programadas pendientes del vendedor
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role !== "VENDOR") return forbidden();

  const visits = await prisma.scheduledVisit.findMany({
    where: { vendorId: auth.userId, completed: false },
    include: {
      customer: {
        select: { id: true, name: true, address: true, lat: true, lng: true },
      },
    },
    orderBy: { scheduledFor: "asc" },
  });

  return NextResponse.json({
    data: visits.map((sv) => ({
      ...sv,
      customer: {
        ...sv.customer,
        lat: Number(sv.customer.lat),
        lng: Number(sv.customer.lng),
      },
    })),
  });
}

// POST /api/scheduled-visits — programar visita para un cliente
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role !== "VENDOR") return forbidden();

  const guard = await requireWrite(auth.companyId);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerId, scheduledFor, notes } = parsed.data;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId: auth.companyId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const sv = await prisma.scheduledVisit.create({
    data: {
      customerId,
      vendorId: auth.userId,
      scheduledFor: new Date(scheduledFor),
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ data: sv }, { status: 201 });
}
