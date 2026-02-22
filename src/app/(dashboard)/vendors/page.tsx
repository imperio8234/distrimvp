import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAY_MS = 1000 * 60 * 60 * 24;

async function getVendorsData(companyId: string) {
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);

  const vendors = await prisma.user.findMany({
    where: { companyId, role: "VENDOR", active: true },
    include: {
      assignedCustomers: {
        where: { active: true },
        select: {
          id: true,
          lastVisitAt: true,
        },
      },
      visits: {
        where: { visitedAt: { gte: weekAgo }, result: { not: null } },
        select: { id: true, visitedAt: true, result: true, customerId: true },
        orderBy: { visitedAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Para cada vendedor, obtener su última visita global
  const vendorIds = vendors.map((v) => v.id);
  const lastVisits = await prisma.visit.groupBy({
    by: ["vendorId"],
    where: { vendorId: { in: vendorIds } },
    _max: { visitedAt: true },
  });

  const lastVisitMap = Object.fromEntries(
    lastVisits.map((v) => [v.vendorId, v._max.visitedAt])
  );

  return vendors.map((v) => {
    const coldCount = v.assignedCustomers.filter((c) => {
      if (!c.lastVisitAt) return true;
      return Date.now() - c.lastVisitAt.getTime() > 15 * DAY_MS;
    }).length;

    return {
      id: v.id,
      name: v.name,
      email: v.email,
      assignedCustomers: v.assignedCustomers.length,
      visitsThisWeek: v.visits.length,
      ordersThisWeek: v.visits.filter((vi) => vi.result === "ORDER_TAKEN").length,
      pendingAlerts: coldCount,
      lastActivity: lastVisitMap[v.id] ?? null,
    };
  });
}

function activityStatus(lastActivity: Date | null) {
  if (!lastActivity) return { label: "Sin actividad", className: "bg-gray-100 text-gray-600" };
  const days = Math.floor((Date.now() - lastActivity.getTime()) / DAY_MS);
  if (days === 0) return { label: "Hoy", className: "bg-green-100 text-green-700" };
  if (days === 1) return { label: "Ayer", className: "bg-green-100 text-green-700" };
  if (days <= 3) return { label: `Hace ${days} días`, className: "bg-yellow-100 text-yellow-700" };
  return { label: `Hace ${days} días`, className: "bg-red-100 text-red-700" };
}

export default async function VendorsPage() {
  const session = await auth();
  const vendors = await getVendorsData(session!.user.companyId!);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Actividad del equipo de ventas
        </p>
      </div>

      {/* Resumen semanal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total vendedores activos"
          value={vendors.length}
        />
        <SummaryCard
          label="Visitas esta semana (equipo)"
          value={vendors.reduce((sum, v) => sum + v.visitsThisWeek, 0)}
        />
        <SummaryCard
          label="Pedidos tomados esta semana"
          value={vendors.reduce((sum, v) => sum + v.ordersThisWeek, 0)}
        />
      </div>

      {/* Tabla de vendedores */}
      <div className="card p-0 overflow-hidden">
        {vendors.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No hay vendedores registrados en la empresa.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Vendedor</th>
                <th className="table-th text-center">Clientes asignados</th>
                <th className="table-th text-center">Visitas (7 días)</th>
                <th className="table-th text-center">Pedidos (7 días)</th>
                <th className="table-th text-center">Alertas (15d+)</th>
                <th className="table-th">Última actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => {
                const activity = activityStatus(v.lastActivity);
                const conversionRate =
                  v.visitsThisWeek > 0
                    ? Math.round((v.ordersThisWeek / v.visitsThisWeek) * 100)
                    : 0;

                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td">
                      <Link
                        href={`/vendors/${v.id}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {v.name}
                      </Link>
                      <p className="text-xs text-gray-400">{v.email}</p>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-bold text-brand-800">
                        {v.assignedCustomers}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-800">
                          {v.visitsThisWeek}
                        </span>
                        {v.visitsThisWeek > 0 && (
                          <span className="text-xs text-gray-400">
                            {conversionRate}% con pedido
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-bold text-green-700">
                        {v.ordersThisWeek}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      {v.pendingAlerts > 0 ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          {v.pendingAlerts}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">0</span>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${activity.className}`}
                        >
                          {activity.label}
                        </span>
                        {v.lastActivity && (
                          <span className="text-xs text-gray-400">
                            {new Date(v.lastActivity).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Alerta si vendedor inactivo */}
      {vendors.some((v) => {
        if (!v.lastActivity) return true;
        return (Date.now() - v.lastActivity.getTime()) / DAY_MS > 3;
      }) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ Hay vendedores sin actividad en los últimos 3 días.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Revisa la columna de "Última actividad" y contacta al vendedor si es necesario.
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card bg-brand-50 border border-brand-100">
      <p className="text-sm text-brand-700 font-medium">{label}</p>
      <p className="text-3xl font-bold text-brand-800 mt-1">{value}</p>
    </div>
  );
}
