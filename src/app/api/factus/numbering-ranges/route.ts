import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { factus } from "@/lib/factus";

// GET /api/factus/numbering-ranges
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await factus.getNumberingRanges();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener rangos";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
