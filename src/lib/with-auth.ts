import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import type { Role } from "@prisma/client";

export interface AuthContext {
  userId: string;
  companyId: string | null; // null para SUPER_ADMIN
  role: Role;
}

/** Extrae y valida el JWT del header Authorization: Bearer <token> */
export async function getAuth(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token);
    return {
      userId: payload.id,
      companyId: payload.companyId ?? null,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export const unauthorized = () =>
  NextResponse.json({ error: "No autorizado" }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
