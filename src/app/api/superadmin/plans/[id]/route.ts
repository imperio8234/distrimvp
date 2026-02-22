import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  displayName:     z.string().min(1).optional(),
  description:     z.string().optional(),
  price:           z.number().min(0).optional(),
  maxVendors:      z.number().int().optional(),
  maxCustomers:    z.number().int().optional(),
  maxDelivery:     z.number().int().optional(),
  dianEnabled:     z.boolean().optional(),
  reportsEnabled:  z.boolean().optional(),
  apiAccess:       z.boolean().optional(),
  historyDays:     z.number().int().optional(),
  durationDays:    z.number().int().positive().optional().nullable(),
  active:          z.boolean().optional(),
});

/** PATCH /api/superadmin/plans/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await prisma.plan.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(plan);
}
