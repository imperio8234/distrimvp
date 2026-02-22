import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name:    z.string().min(2).optional(),
  phone:   z.string().optional(),
  active:  z.boolean().optional(),
  nit:             z.string().optional(),
  legalName:       z.string().optional(),
  tradeName:       z.string().optional(),
  address:         z.string().optional(),
  city:            z.string().optional(),
  department:      z.string().optional(),
  postalCode:      z.string().optional(),
  email:           z.string().email().optional(),
  taxRegime:       z.string().optional(),
  economicActivity:z.string().optional(),
});

/** GET /api/superadmin/companies/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      subscription: { include: { plan: true } },
      dianConfig: true,
      users: { where: { role: "ADMIN" }, select: { id: true, name: true, email: true } },
      _count: { select: { users: true, customers: true, orders: true } },
    },
  });

  if (!company) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  return NextResponse.json(company);
}

/** PATCH /api/superadmin/companies/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(company);
}
