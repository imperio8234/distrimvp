import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { requireWrite } from "@/lib/subscription";

const schema = z.object({
  customerId: z.string(),
  result: z.enum(["ORDER_TAKEN", "NOT_HOME", "REFUSED"]),
  orderAmount: z.number().positive().optional(),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// POST /api/visits — registrar visita y opcionalmente crear pedido
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role === "DELIVERY") return forbidden();

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

  const { customerId, result, orderAmount, notes, lat, lng } = parsed.data;

  // Verifica que el cliente pertenece a la empresa
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId: auth.companyId },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const visit = await prisma.$transaction(async (tx) => {
    // 1. Crear el registro de visita
    const newVisit = await tx.visit.create({
      data: {
        customerId,
        vendorId: auth.userId,
        result,
        orderAmount: orderAmount ?? null,
        notes: notes ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
      },
    });

    // 2. Actualizar lastVisitAt del cliente
    await tx.customer.update({
      where: { id: customerId },
      data: { lastVisitAt: new Date() },
    });

    // 3. Si se tomó pedido, crear la orden
    if (result === "ORDER_TAKEN" && orderAmount) {
      await tx.order.create({
        data: {
          companyId: auth.companyId ?? "",
          customerId,
          visitId: newVisit.id,
          amount: orderAmount,
          status: "PENDING",
        },
      });
    }

    return newVisit;
  });

  return NextResponse.json({ data: { id: visit.id } }, { status: 201 });
}
