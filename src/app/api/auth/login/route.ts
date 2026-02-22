import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { company: true },
  });

  if (!user || !user.active) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  // La app móvil es solo para VENDOR y DELIVERY
  if (user.role !== "VENDOR" && user.role !== "DELIVERY") {
    return NextResponse.json({ error: "Acceso no permitido" }, { status: 403 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const token = await signToken({
    id: user.id,
    companyId: user.companyId ?? "",
    role: user.role,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? "",
      companyName: user.company?.name ?? "",
    },
  });
}
