import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { requireWrite } from "@/lib/subscription";

const schema = z.object({
  result: z.enum(["ORDER_TAKEN", "NOT_HOME", "REFUSED"]),
  reason: z.string().optional(),
  orderAmount: z.number().positive().optional(),
  notes: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
});

// PATCH /api/visits/[id]/checkout — completar visita con resultado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "VENDOR") return forbidden();

  const guard = await requireWrite(auth.companyId!);
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { result, reason, orderAmount, notes, scheduledFor, deliveryDate } = parsed.data;

  const visit = await prisma.visit.findFirst({
    where: { id, vendorId: auth.userId },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visita no encontrada" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedVisit = await tx.visit.update({
      where: { id },
      data: {
        result,
        reason: reason ?? null,
        orderAmount: orderAmount ?? null,
        notes: notes ?? null,
        checkOutAt: new Date(),
      },
    });

    // Actualizar lastVisitAt del cliente
    await tx.customer.update({
      where: { id: visit.customerId },
      data: { lastVisitAt: new Date() },
    });

    // Si se tomó pedido, crear orden (solo si no existe ya)
    if (result === "ORDER_TAKEN" && orderAmount) {
      const existingOrder = await tx.order.findUnique({ where: { visitId: id } });
      if (!existingOrder) {
        const customer = await tx.customer.findUnique({
          where: { id: visit.customerId },
          select: { companyId: true },
        });
        await tx.order.create({
          data: {
            companyId: customer!.companyId,
            customerId: visit.customerId,
            visitId: id,
            amount: orderAmount,
            status: "PENDING_REVIEW",
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          },
        });
      }
    }

    // Programar próxima visita si se indicó
    if (scheduledFor) {
      await tx.scheduledVisit.create({
        data: {
          customerId: visit.customerId,
          vendorId: auth.userId,
          scheduledFor: new Date(scheduledFor),
        },
      });
    }

    // Marcar visitas programadas pendientes de este cliente como completadas
    await tx.scheduledVisit.updateMany({
      where: {
        vendorId: auth.userId,
        customerId: visit.customerId,
        completed: false,
        visitId: null,
        scheduledFor: { lte: new Date() },
      },
      data: { completed: true, visitId: id },
    });

    return updatedVisit;
  });

  return NextResponse.json({ data: { id: updated.id } });
}
