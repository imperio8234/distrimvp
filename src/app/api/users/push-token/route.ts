import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized } from "@/lib/with-auth";

// PATCH /api/users/push-token — guarda el Expo push token del usuario autenticado (mobile JWT)
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json();
  const { token } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token es requerido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { pushToken: token },
  });

  return NextResponse.json({ data: { ok: true } });
}
