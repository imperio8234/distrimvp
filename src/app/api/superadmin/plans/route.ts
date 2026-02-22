import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const planSchema = z.object({
  name:            z.string().min(1),
  displayName:     z.string().min(1),
  description:     z.string().optional(),
  price:           z.number().min(0),
  maxVendors:      z.number().int(),
  maxCustomers:    z.number().int(),
  maxDelivery:     z.number().int(),
  dianEnabled:     z.boolean().optional(),
  reportsEnabled:  z.boolean().optional(),
  apiAccess:       z.boolean().optional(),
  historyDays:     z.number().int().optional(),
  durationDays:    z.number().int().positive().optional().nullable(),
  active:          z.boolean().optional(),
});

/** GET /api/superadmin/plans */
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return NextResponse.json(plans);
}

/** POST /api/superadmin/plans */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await prisma.plan.create({ data: parsed.data });
  return NextResponse.json(plan, { status: 201 });
}
