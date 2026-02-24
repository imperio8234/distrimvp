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
    SELECT
      c.id,
      c.name,
      c.address,
      c.phone,
      CAST(c.lat AS FLOAT) as lat,
      CAST(c.lng AS FLOAT) as lng,
      c."assignedVendorId",
      u.name as "vendorName",
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
    HAVING (
      6371 * acos(
        LEAST(1.0,
          cos(radians(${lat})) * cos(radians(CAST(c.lat AS FLOAT))) *
          cos(radians(CAST(c.lng AS FLOAT)) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(CAST(c.lat AS FLOAT)))
        )
      )
    ) <= ${radiusKm}
    ORDER BY "distanceKm" ASC
  `;

  return NextResponse.json({ data: customers });
}
