import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { requireWrite } from "@/lib/subscription";

const schema = z.object({
  customerId: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// POST /api/visits/checkin — registrar llegada (inicio de visita)
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role !== "VENDOR") return forbidden();

  const guard = await requireWrite(auth.companyId);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerId, lat, lng } = parsed.data;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId: auth.companyId },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const visit = await prisma.visit.create({
    data: {
      customerId,
      vendorId: auth.userId,
      lat: lat ?? null,
      lng: lng ?? null,
      checkInAt: new Date(),
    },
  });

  return NextResponse.json({ data: { id: visit.id } }, { status: 201 });
}
