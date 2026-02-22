import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { auth as nextAuth } from "@/lib/auth";

const schema = z.object({
  vendorId: z.string().nullable(),
});

// PATCH /api/customers/[id]/assign — asignar o cambiar vendedor de un cliente (ADMIN)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Try Bearer token first (mobile), then NextAuth session (web dashboard)
  let companyId: string;
  let role: string;

  const bearerAuth = await getAuth(req);
  if (bearerAuth) {
    if (!bearerAuth.companyId) return forbidden();
    companyId = bearerAuth.companyId;
    role = bearerAuth.role;
  } else {
    const session = await nextAuth();
    if (!session || !session.user.companyId) return unauthorized();
    companyId = session.user.companyId;
    role = session.user.role;
  }

  if (role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { vendorId } = parsed.data;

  const customer = await prisma.customer.findFirst({
    where: { id, companyId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  if (vendorId) {
    const vendor = await prisma.user.findFirst({
      where: { id: vendorId, companyId, role: "VENDOR", active: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
    }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: { assignedVendorId: vendorId },
    select: { id: true, name: true, assignedVendorId: true },
  });

  return NextResponse.json({ data: updated });
}
