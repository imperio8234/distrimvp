import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { auth as nextAuth } from "@/lib/auth";
import { requireWrite } from "@/lib/subscription";

async function resolveAuth(req: NextRequest) {
  const bearer = await getAuth(req);
  if (bearer) return { companyId: bearer.companyId, role: bearer.role as string };

  const session = await nextAuth();
  if (!session) return null;
  return { companyId: session.user.companyId!, role: session.user.role };
}

const schema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["VENDOR", "DELIVERY"]).optional(),
  active: z.boolean().optional(),
});

// PATCH /api/users/[id] — editar nombre, rol o estado activo (ADMIN, mismo tenant)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveAuth(req);
  if (!ctx) return unauthorized();
  if (ctx.role !== "ADMIN") return forbidden();

  const guard = await requireWrite(ctx.companyId!);
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Verificar que el usuario pertenece a la misma empresa
  const target = await prisma.user.findFirst({
    where: { id, companyId: ctx.companyId },
  });

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // No permitir modificar el rol de un ADMIN
  if (target.role === "ADMIN" && parsed.data.role) {
    return NextResponse.json(
      { error: "No se puede cambiar el rol del administrador" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  return NextResponse.json({ data: updated });
}
