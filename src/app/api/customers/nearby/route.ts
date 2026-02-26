import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/customers/nearby?lat=&lng=&radiusKm=&unassigned=true
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const companyId = session.user.companyId!;

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = parseFloat(searchParams.get("radiusKm") ?? "5");
  const onlyUnassigned = searchParams.get("unassigned") === "true";

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat y lng son requeridos" }, { status: 400 });
  }

  const unassignedClause = onlyUnassigned
    ? Prisma.sql`AND c."assignedVendorId" IS NULL`
    : Prisma.empty;

  // Usamos subconsulta para calcular la distancia por fila y filtrarla en el WHERE externo.
  // HAVING sin GROUP BY en PostgreSQL evalúa la condición UNA SOLA VEZ para todo
  // el resultado como si fuera un grupo, no fila por fila — por eso devolvía 0 resultados.
  const customers = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      address: string | null;
      phone: string | null;
      lat: number;
      lng: number;
      assignedVendorId: string | null;
      vendorName: string | null;
      lastVisitAt: Date | null;
      distanceKm: number;
    }>
  >`
    SELECT *
    FROM (
      SELECT
        c.id,
        c.name,
        c.address,
        c.phone,
        CAST(c.lat AS FLOAT)  AS lat,
        CAST(c.lng AS FLOAT)  AS lng,
        c."assignedVendorId",
        u.name                AS "vendorName",
        c."lastVisitAt",
        (
          6371 * acos(
            LEAST(1.0,
              cos(radians(${lat})) * cos(radians(CAST(c.lat AS FLOAT))) *
              cos(radians(CAST(c.lng AS FLOAT)) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(CAST(c.lat AS FLOAT)))
            )
          )
        ) AS "distanceKm"
      FROM customers c
      LEFT JOIN users u ON u.id = c."assignedVendorId"
      WHERE c."companyId" = ${companyId}
        AND c.active = true
        ${unassignedClause}
    ) AS sub
    WHERE sub."distanceKm" <= ${radiusKm}
    ORDER BY sub."distanceKm" ASC
  `;

  return NextResponse.json({ data: customers });
}
