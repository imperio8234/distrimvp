import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { auth as nextAuth } from "@/lib/auth";
import { requireWrite, getSubStatus } from "@/lib/subscription";

async function resolveAuth(req: NextRequest) {
  const bearer = await getAuth(req);
  if (bearer) return { companyId: bearer.companyId, role: bearer.role as string };

  const session = await nextAuth();
  if (!session) return null;
  return { companyId: session.user.companyId!, role: session.user.role };
}

// GET /api/users — lista todos los usuarios de la empresa (ADMIN)
// ?role=field → solo VENDOR y DELIVERY, incluye coordenadas de ubicación
export async function GET(req: NextRequest) {
  const ctx = await resolveAuth(req);
  if (!ctx) return unauthorized();
  if (ctx.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role");
  const isField = roleFilter === "field";

  const users = await prisma.user.findMany({
    where: {
      companyId: ctx.companyId,
      ...(isField ? { role: { in: ["VENDOR", "DELIVERY"] } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      ...(isField
        ? { lastLat: true, lastLng: true, lastSeenAt: true }
        : {}),
    },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: users });
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["VENDOR", "DELIVERY"]),
});

// POST /api/users — crea vendedor o repartidor (ADMIN)
export async function POST(req: NextRequest) {
  const ctx = await resolveAuth(req);
  if (!ctx) return unauthorized();
  if (ctx.role !== "ADMIN") return forbidden();

  const guard = await requireWrite(ctx.companyId!);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verificar límites del plan según el rol a crear
  const { plan } = await getSubStatus(ctx.companyId!);
  if (plan) {
    if (parsed.data.role === "VENDOR" && plan.maxVendors !== -1) {
      const count = await prisma.user.count({
        where: { companyId: ctx.companyId, role: "VENDOR", active: true },
      });
      if (count >= plan.maxVendors) {
        return NextResponse.json(
          { error: `Tu plan permite máximo ${plan.maxVendors} vendedor(es). Actualiza tu plan para agregar más.` },
          { status: 403 }
        );
      }
    }
    if (parsed.data.role === "DELIVERY" && plan.maxDelivery !== -1) {
      const count = await prisma.user.count({
        where: { companyId: ctx.companyId, role: "DELIVERY", active: true },
      });
      if (count >= plan.maxDelivery) {
        return NextResponse.json(
          { error: `Tu plan permite máximo ${plan.maxDelivery} repartidor(es). Actualiza tu plan para agregar más.` },
          { status: 403 }
        );
      }
    }
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese correo" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      companyId: ctx.companyId,
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      role: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
