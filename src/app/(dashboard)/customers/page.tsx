import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomersTable } from "@/components/ui/CustomersTable";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(date: Date | null) {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

function coldStatus(days: number | null): "HOT" | "WARM" | "COLD" | "FROZEN" {
  if (days === null) return "FROZEN";
  if (days <= 3) return "HOT";
  if (days <= 7) return "WARM";
  if (days <= 14) return "COLD";
  return "FROZEN";
}

async function getCustomers(companyId: string) {
  const customers = await prisma.customer.findMany({
    where: { companyId, active: true },
    include: { assignedVendor: { select: { id: true, name: true } } },
    orderBy: { lastVisitAt: "asc" },
  });

  return customers.map((c) => {
    const days = daysSince(c.lastVisitAt);
    return {
      id: c.id,
      name: c.name,
      ownerName: c.ownerName,
      phone: c.phone,
      address: c.address,
      lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
      coldStatus: coldStatus(days),
      daysSinceVisit: days,
      assignedVendor: c.assignedVendor,
    };
  });
}

export default async function CustomersPage() {
  const session = await auth();
  const customers = await getCustomers(session!.user.companyId!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {customers.length} cliente{customers.length !== 1 ? "s" : ""} registrado
          {customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabla interactiva (Client Component) con datos del servidor */}
      <CustomersTable customers={customers} />
    </div>
  );
}
