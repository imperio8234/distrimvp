import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscriptionSchema = z.object({
  planId:        z.string().optional(),
  status:        z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "SUSPENDED"]).optional(),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]).optional(),
  trialEndsAt:   z.string().datetime().optional().nullable(),
  notes:         z.string().optional(),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd:   z.string().datetime().optional(),
});

/** PATCH /api/superadmin/companies/[id]/subscription */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  let periodEnd = new Date(now);

  if (!parsed.data.currentPeriodEnd) {
    // 1. Si el plan tiene durationDays fijo, ese manda
    if (parsed.data.planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: parsed.data.planId },
        select: { durationDays: true },
      });
      if (plan?.durationDays) {
        periodEnd.setDate(periodEnd.getDate() + plan.durationDays);
      } else {
        // 2. Sin durationDays: usar billingPeriod (MONTHLY o YEARLY)
        const billing = parsed.data.billingPeriod ?? "MONTHLY";
        if (billing === "YEARLY") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
      }
    } else {
      // Sin cambio de plan: usar billingPeriod o default mensual
      const billing = parsed.data.billingPeriod ?? "MONTHLY";
      if (billing === "YEARLY") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
    }
  }

  const data = {
    ...parsed.data,
    trialEndsAt:        parsed.data.trialEndsAt ? new Date(parsed.data.trialEndsAt) : parsed.data.trialEndsAt,
    currentPeriodStart: parsed.data.currentPeriodStart ? new Date(parsed.data.currentPeriodStart) : undefined,
    currentPeriodEnd:   parsed.data.currentPeriodEnd ? new Date(parsed.data.currentPeriodEnd) : undefined,
  };

  const subscription = await prisma.subscription.upsert({
    where: { companyId: params.id },
    create: {
      companyId: params.id,
      planId: parsed.data.planId!,
      status: parsed.data.status ?? "TRIAL",
      currentPeriodStart: data.currentPeriodStart ?? now,
      currentPeriodEnd: data.currentPeriodEnd ?? periodEnd,
      trialEndsAt: data.trialEndsAt ?? undefined,
      notes: data.notes,
    },
    update: data,
    include: { plan: true },
  });

  return NextResponse.json(subscription);
}
