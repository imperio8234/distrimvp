import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name:            z.string().min(2).optional(),
  phone:           z.string().optional(),
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

/** GET /api/company — datos de la empresa del admin */
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId! },
    include: {
      subscription: { include: { plan: true } },
    },
  });

  if (!company) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

  return NextResponse.json(company);
}

/** PATCH /api/company — actualiza datos fiscales de la empresa */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: session.user.companyId! },
    data: parsed.data,
  });

  return NextResponse.json(company);
}
