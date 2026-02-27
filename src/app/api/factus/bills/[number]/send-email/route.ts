import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { factus } from "@/lib/factus";

const schema = z.object({
  email: z.string().email(),
});

// POST /api/factus/bills/[number]/send-email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { number } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  try {
    await factus.sendEmail(number, parsed.data.email);
    return NextResponse.json({ data: { ok: true } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al enviar email";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
