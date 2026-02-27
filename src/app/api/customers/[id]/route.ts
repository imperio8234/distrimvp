import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { requireWrite } from "@/lib/subscription";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(date: Date | null): number {
  if (!date) return 999;
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

function coldStatus(days: number) {
  if (days <= 3) return "HOT";
  if (days <= 7) return "WARM";
  if (days <= 14) return "COLD";
  return "FROZEN";
}

// GET /api/customers/[id] — detalle del cliente con últimas visitas
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();

  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, companyId: auth.companyId, active: true },
    include: {
      assignedVendor: { select: { id: true, name: true } },
      visits: {
        orderBy: { visitedAt: "desc" },
        take: 10,
        include: { vendor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const days = daysSince(customer.lastVisitAt);

  return NextResponse.json({
    data: {
      ...customer,
      lat: Number(customer.lat),
      lng: Number(customer.lng),
      coldStatus: coldStatus(days),
      daysSinceVisit: days === 999 ? null : days,
    },
  });
}

const updateSchema = z.object({
  name:      z.string().min(2).optional(),
  ownerName: z.string().optional(),
  phone:     z.string().optional(),
  address:   z.string().optional(),
  notes:     z.string().optional(),
  // Facturación electrónica
  requiresInvoice:       z.boolean().optional(),
  billingId:             z.string().optional(),
  billingIdType:         z.string().optional(),
  billingLegalOrg:       z.string().optional(),
  billingTribute:        z.string().optional(),
  billingMunicipalityId: z.string().optional(),
  billingEmail:          z.string().email().optional().or(z.literal("")),
});

// PATCH /api/customers/[id] — editar datos del cliente (VENDOR o ADMIN)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role === "DELIVERY") return forbidden();

  const guard = await requireWrite(auth.companyId);
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id, companyId: auth.companyId, active: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: updated });
}
