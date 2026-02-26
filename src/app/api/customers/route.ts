import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth as nextAuth } from "@/lib/auth";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { requireWrite, getSubStatus } from "@/lib/subscription";

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

// GET /api/customers — lista todos los clientes de la empresa
export async function GET(req: NextRequest) {
  // Intentar Bearer token (app móvil) → luego sesión NextAuth (dashboard web)
  let companyId: string | null = null;

  const bearerAuth = await getAuth(req);
  if (bearerAuth) {
    companyId = bearerAuth.companyId;
  } else {
    const session = await nextAuth();
    if (!session?.user) return unauthorized();
    companyId = session.user.companyId ?? null;
  }

  if (!companyId) return forbidden();

  const customers = await prisma.customer.findMany({
    where: { companyId, active: true },
    include: { assignedVendor: { select: { id: true, name: true } } },
    orderBy: { lastVisitAt: "asc" }, // los más fríos primero
  });

  const data = customers.map((c) => {
    const days = daysSince(c.lastVisitAt);
    return {
      id: c.id,
      name: c.name,
      ownerName: c.ownerName,
      phone: c.phone,
      address: c.address,
      lat: Number(c.lat),
      lng: Number(c.lng),
      photoUrl: c.photoUrl,
      notes: c.notes,
      lastVisitAt: c.lastVisitAt,
      coldStatus: coldStatus(days),
      daysSinceVisit: days === 999 ? null : days,
      assignedVendor: c.assignedVendor,
    };
  });

  return NextResponse.json({ data });
}

const createSchema = z.object({
  name: z.string().min(2),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  photoUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// POST /api/customers — registrar nuevo cliente
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role === "DELIVERY") return forbidden();

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

  // Verificar límite maxCustomers del plan
  const { plan } = await getSubStatus(auth.companyId);
  if (plan && plan.maxCustomers !== -1) {
    const count = await prisma.customer.count({
      where: { companyId: auth.companyId, active: true },
    });
    if (count >= plan.maxCustomers) {
      return NextResponse.json(
        { error: `Tu plan permite máximo ${plan.maxCustomers} clientes activos. Actualiza tu plan para agregar más.` },
        { status: 403 }
      );
    }
  }

  const customer = await prisma.customer.create({
    data: {
      companyId: auth.companyId,
      assignedVendorId: auth.role === "VENDOR" ? auth.userId : undefined,
      ...parsed.data,
    },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
}
