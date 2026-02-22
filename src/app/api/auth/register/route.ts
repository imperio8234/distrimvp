import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  companyName: z.string().min(2),
  adminName:   z.string().min(2),
  email:       z.string().email(),
  password:    z.string().min(6),
});

const TRIAL_DAYS = 14;

// POST /api/auth/register — crea empresa + admin + suscripción TRIAL en una transacción
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { companyName, adminName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo" },
      { status: 409 }
    );
  }

  // Plan de referencia para el TRIAL: usar PROFESIONAL (todas las funciones)
  // Si no existe, usar el primer plan activo disponible
  const trialPlan = await prisma.plan.findFirst({
    where: { name: "PROFESIONAL", active: true },
  }) ?? await prisma.plan.findFirst({ where: { active: true }, orderBy: { price: "desc" } });

  if (!trialPlan) {
    return NextResponse.json(
      { error: "No hay planes configurados. Contacta al administrador." },
      { status: 503 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: companyName },
    });

    const user = await tx.user.create({
      data: {
        companyId: company.id,
        name:      adminName,
        email,
        password:  passwordHash,
        role:      "ADMIN",
      },
    });

    // Suscripción TRIAL automática — el super admin la activa cuando el cliente paga
    const subscription = await tx.subscription.create({
      data: {
        companyId:          company.id,
        planId:             trialPlan.id,
        status:             "TRIAL",
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd:   periodEnd,
      },
    });

    return { company, user, subscription };
  });

  return NextResponse.json(
    {
      data: {
        companyId:    result.company.id,
        companyName:  result.company.name,
        userId:       result.user.id,
        email:        result.user.email,
        trialEndsAt:  result.subscription.trialEndsAt,
        trialDays:    TRIAL_DAYS,
      },
    },
    { status: 201 }
  );
}
