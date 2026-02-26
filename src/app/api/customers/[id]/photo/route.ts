import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, unauthorized, forbidden } from "@/lib/with-auth";
import { createServerSupabase } from "@/lib/supabase-server";

const BUCKET = "distri";

/**
 * POST /api/customers/[id]/photo
 * Content-Type: multipart/form-data  →  campo "photo" con el archivo de imagen.
 * Sube la foto a Supabase Storage y actualiza customer.photoUrl en la BD.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return unauthorized();
  if (!auth.companyId) return forbidden();
  if (auth.role === "DELIVERY") return forbidden();

  const { id } = await params;

  // Verificar que el cliente pertenece a esta empresa
  const customer = await prisma.customer.findFirst({
    where: { id, companyId: auth.companyId, active: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Parsear multipart/form-data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: "No se recibió ninguna foto" }, { status: 400 });
  }

  // Límite de 5 MB
  if (photo.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "La foto no puede superar 5 MB" }, { status: 400 });
  }

  const ext        = photo.name?.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `customers/${id}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await photo.arrayBuffer());

  const supabase = createServerSupabase();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: photo.type || "image/jpeg",
      upsert:      true,
    });

  if (uploadError) {
    console.error("[photo] Supabase upload error:", uploadError.message);
    return NextResponse.json({ error: "Error al subir la foto" }, { status: 500 });
  }

  // URL pública (el bucket "distri" debe ser público en Supabase)
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  // Guardar URL en la BD
  await prisma.customer.update({
    where: { id },
    data:  { photoUrl: publicUrl },
  });

  return NextResponse.json({ data: { photoUrl: publicUrl } });
}
