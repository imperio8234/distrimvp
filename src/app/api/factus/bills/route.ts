import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { factus } from "@/lib/factus";

// ── GET /api/factus/bills — listar facturas ──────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const number = searchParams.get("number") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const page   = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;

  try {
    const result = await factus.listBills({ number, status, page });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al consultar facturas";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── POST /api/factus/bills — crear factura y aprobar pedido ──────────
const createSchema = z.object({
  orderId:           z.string(),
  numberingRangeId:  z.number().int().positive(),
  paymentForm:       z.string(), // "1"=Contado "2"=Crédito
  paymentMethodCode: z.string(), // "10"=Efectivo "20"=Cheque etc.
  paymentDueDate:    z.string().optional(),
  customer: z.object({
    identification:           z.string().min(1),
    names:                    z.string().min(1),
    address:                  z.string().min(1),
    email:                    z.string().email(),
    phone:                    z.string().min(1),
    legalOrganizationId:      z.string(), // "1"|"2"
    tributeId:                z.string(), // "1"|"21"
    identificationDocumentId: z.string(), // "3"|"6"
    municipalityId:           z.string(),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const body   = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { orderId, numberingRangeId, paymentForm, paymentMethodCode, paymentDueDate, customer } =
    parsed.data;

  // Verificar pedido
  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, status: "PENDING_REVIEW" },
  });
  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado o no está pendiente de revisión" },
      { status: 404 },
    );
  }

  // Construir payload Factus
  const billPayload = {
    numbering_range_id:  numberingRangeId,
    reference_code:      orderId.slice(-12).toUpperCase(),
    observation:         `Pedido DistriApp #${orderId.slice(-8)}`,
    payment_form:        paymentForm,
    payment_method_code: paymentMethodCode,
    ...(paymentDueDate ? { payment_due_date: paymentDueDate } : {}),
    customer: {
      identification:             customer.identification,
      names:                      customer.names,
      address:                    customer.address,
      email:                      customer.email,
      phone:                      customer.phone,
      legal_organization_id:      customer.legalOrganizationId,
      tribute_id:                 customer.tributeId,
      identification_document_id: customer.identificationDocumentId,
      municipality_id:            customer.municipalityId,
    },
    items: [
      {
        code_reference:   `ORD-${orderId.slice(-8)}`,
        name:             `Pedido distribución`,
        quantity:         1,
        discount_rate:    0,
        price:            Number(order.amount),
        tax_rate:         "0.00",
        unit_measure_id:  70,
        standard_code_id: 1,
        is_excluded:      1,
        tribute_id:       1,
      },
    ],
  };

  let bill: { id: number; number: string; cufe?: string };
  try {
    const factusRes = await factus.createBill(billPayload);
    bill = factusRes.data.bill;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al crear factura";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Aprobar pedido y guardar referencias Factus
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status:             "PENDING",
      factusInvoiceId:    String(bill.id),
      factusInvoiceNumber: bill.number,
    },
  });

  return NextResponse.json({
    data: {
      factusInvoiceId:     String(bill.id),
      factusInvoiceNumber: bill.number,
      cufe:                bill.cufe,
    },
  });
}
