import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

// PATCH /api/customers/batch-assign — asigna vendedor a múltiples clientes
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const body = await req.json();
  const { customerIds, vendorId } = body;

  if (!Array.isArray(customerIds) || customerIds.length === 0 || !vendorId) {
    return NextResponse.json({ error: "customerIds[] y vendorId son requeridos" }, { status: 400 });
  }

  const vendor = await prisma.user.findFirst({
    where: { id: vendorId, companyId, role: "VENDOR", active: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, companyId, active: true },
    select: { id: true },
  });

  if (customers.length === 0) {
    return NextResponse.json({ error: "No se encontraron clientes válidos" }, { status: 404 });
  }

  const validIds = customers.map((c) => c.id);
  const result = await prisma.customer.updateMany({
    where: { id: { in: validIds } },
    data: { assignedVendorId: vendorId },
  });

  if (vendor.pushToken) {
    await sendPushNotification(
      vendor.pushToken,
      "Nuevos clientes asignados",
      `Se te asignaron ${result.count} cliente(s).`,
      { type: "CUSTOMERS_ASSIGNED", count: result.count }
    );
  }

  return NextResponse.json({ data: { updated: result.count } });
}
