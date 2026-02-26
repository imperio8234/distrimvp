import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export interface AuthContext {
  userId: string;
  companyId: string | null; // null para SUPER_ADMIN
  role: Role;
}

/**
 * Autentica la petición de dos formas:
 * 1. Bearer token en el header Authorization (app móvil)
 * 2. Sesión de NextAuth via cookie (dashboard web)
 */
export async function getAuth(req: NextRequest): Promise<AuthContext | null> {
  // ── 1. Bearer token (app móvil) ──────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
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

  // ── 2. Sesión NextAuth (dashboard web) ───────────────────────
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = session.user as any;
  return {
    userId: u.id,
    companyId: u.companyId ?? null,
    role: u.role as Role,
  };
}

export const unauthorized = () =>
  NextResponse.json({ error: "No autorizado" }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
