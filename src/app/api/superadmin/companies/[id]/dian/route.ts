import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const dianSchema = z.object({
  resolutionNumber: z.string().optional(),
  prefix:           z.string().optional(),
  fromNumber:       z.number().int().optional(),
  toNumber:         z.number().int().optional(),
  resolutionDate:   z.string().datetime().optional(),
  endDate:          z.string().datetime().optional(),
  economicActivity: z.string().optional(),
  apiToken:         z.string().optional(),
  testUserId:       z.string().optional(),
  softwareId:       z.string().optional(),
  softwarePin:      z.string().optional(),
  testMode:         z.boolean().optional(),
});

/** GET /api/superadmin/companies/[id]/dian */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dian = await prisma.dianConfiguration.findUnique({
    where: { companyId: params.id },
  });

  return NextResponse.json(dian ?? null);
}

/** PUT /api/superadmin/companies/[id]/dian — crea o actualiza config DIAN */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = dianSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    resolutionDate: parsed.data.resolutionDate ? new Date(parsed.data.resolutionDate) : undefined,
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
  };

  const dian = await prisma.dianConfiguration.upsert({
    where: { companyId: params.id },
    create: { companyId: params.id, ...data },
    update: data,
  });

  return NextResponse.json(dian);
}
