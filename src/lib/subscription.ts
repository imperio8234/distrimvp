import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export interface SubStatus {
  readOnly: boolean;
  plan: {
    maxVendors: number;
    maxCustomers: number;
    maxDelivery: number;
    dianEnabled: boolean;
    reportsEnabled: boolean;
    apiAccess: boolean;
    historyDays: number;
  } | null;
}

/** Evalúa si una empresa puede escribir datos según su suscripción */
export async function getSubStatus(companyId: string): Promise<SubStatus> {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });

  if (!sub) return { readOnly: true, plan: null };

  const now = new Date();
  const periodExpired = sub.currentPeriodEnd < now;
  const trialExpired =
    sub.status === "TRIAL" && !!sub.trialEndsAt && sub.trialEndsAt < now;

  const readOnly =
    periodExpired ||
    trialExpired ||
    sub.status === "PAST_DUE" ||
    sub.status === "CANCELLED" ||
    sub.status === "SUSPENDED";

  return { readOnly, plan: sub.plan };
}

const EXPIRED_MSG =
  "Tu suscripción ha vencido o está inactiva. Solo puedes consultar información. Contacta a DistriApp para renovar.";

/** Retorna 403 si la suscripción no permite escritura, null si puede continuar */
export async function requireWrite(
  companyId: string
): Promise<NextResponse | null> {
  const { readOnly } = await getSubStatus(companyId);
  if (readOnly) {
    return NextResponse.json({ error: EXPIRED_MSG }, { status: 403 });
  }
  return null;
}
