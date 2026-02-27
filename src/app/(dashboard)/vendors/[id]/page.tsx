import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorReminderButton } from "../VendorReminderButton";

const DAY_MS = 1000 * 60 * 60 * 24;

function coldStatus(lastVisitAt: Date | null) {
  if (!lastVisitAt) return "FROZEN";
  const days = Math.floor((Date.now() - lastVisitAt.getTime()) / DAY_MS);
  if (days <= 3) return "HOT";
  if (days <= 7) return "WARM";
  if (days <= 14) return "COLD";
  return "FROZEN";
}

const COLD_COLORS: Record<string, string> = {
  HOT: "bg-green-100 text-green-700",
  WARM: "bg-yellow-100 text-yellow-700",
  COLD: "bg-orange-100 text-orange-700",
  FROZEN: "bg-red-100 text-red-700",
};

const RESULT_LABELS: Record<string, string> = {
  ORDER_TAKEN: "Pedido tomado",
  NOT_HOME: "No estaba",
  REFUSED: "No quiso comprar",
};

const RESULT_COLORS: Record<string, string> = {
  ORDER_TAKEN: "text-green-700 bg-green-50",
  NOT_HOME: "text-yellow-700 bg-yellow-50",
  REFUSED: "text-red-700 bg-red-50",
};

async function getVendorDetail(vendorId: string, companyId: string) {
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);

  return prisma.user.findFirst({
    where: { id: vendorId, companyId, role: "VENDOR", active: true },
    include: {
      assignedCustomers: {
        where: { active: true },
        orderBy: { lastVisitAt: "asc" },
      },
      visits: {
        where: { visitedAt: { gte: weekAgo }, result: { not: null } },
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { visitedAt: "desc" },
      },
    },
  });
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const vendor = await getVendorDetail(id, session!.user.companyId!);

  if (!vendor) notFound();

  const visitedCustomerIds = new Set(vendor.visits.map((v) => v.customerId));
  const visitedThisWeek = visitedCustomerIds.size;

  const alerts = vendor.assignedCustomers.filter((c) => {
    if (!c.lastVisitAt) return true;
    return Date.now() - c.lastVisitAt.getTime() > 15 * DAY_MS;
  });

  const totalRevenue = vendor.visits
    .filter((v) => v.result === "ORDER_TAKEN")
    .reduce((sum, v) => sum + Number(v.orderAmount ?? 0), 0);

  const cop = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/vendors" className="hover:text-brand-700">
          Vendedores
        </Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{vendor.name}</span>
      </div>

      {/* Header con stats + acciones */}
      <div className="card">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <p className="text-gray-500 mt-1">{vendor.email}</p>
          </div>
          <VendorReminderButton vendorId={vendor.id} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <StatBox label="Clientes asignados" value={vendor.assignedCustomers.length} />
          <StatBox label="Clientes visitados esta semana" value={visitedThisWeek} />
          <StatBox label="Visitas esta semana" value={vendor.visits.length} />
          <StatBox label="Ingresos esta semana" value={cop(totalRevenue)} />
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">
            🚨 {alerts.length} clientes sin visitar en 15+ días
          </p>
          <div className="flex flex-wrap gap-2">
            {alerts.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="text-xs bg-red-100 text-red-700 rounded-full px-3 py-1 hover:bg-red-200 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Clientes asignados */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Clientes Asignados ({vendor.assignedCustomers.length})
        </h2>
        <div className="card p-0 overflow-hidden">
          {vendor.assignedCustomers.length === 0 ? (
            <p className="p-6 text-gray-400 italic text-sm">Sin clientes asignados.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Cliente</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th">Última visita</th>
                  <th className="table-th hidden md:table-cell">Visitado esta semana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendor.assignedCustomers.map((c) => {
                  const status = coldStatus(c.lastVisitAt);
                  const days = c.lastVisitAt
                    ? Math.floor((Date.now() - c.lastVisitAt.getTime()) / DAY_MS)
                    : null;
                  const wasVisited = visitedCustomerIds.has(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-td">
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.address && (
                          <p className="text-xs text-gray-400">{c.address}</p>
                        )}
                      </td>
                      <td className="table-td">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${COLD_COLORS[status]}`}
                        >
                          {status}
                          {days !== null ? ` (${days}d)` : ""}
                        </span>
                      </td>
                      <td className="table-td text-sm text-gray-600">
                        {c.lastVisitAt
                          ? new Date(c.lastVisitAt).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Nunca"}
                      </td>
                      <td className="table-td hidden md:table-cell">
                        {wasVisited ? (
                          <span className="text-xs text-green-700 font-semibold">✓ Sí</span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Visitas esta semana */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Visitas esta semana ({vendor.visits.length})
        </h2>
        <div className="card p-0 overflow-hidden">
          {vendor.visits.length === 0 ? (
            <p className="p-6 text-gray-400 italic text-sm">Sin visitas esta semana.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Cliente</th>
                  <th className="table-th">Resultado</th>
                  <th className="table-th hidden md:table-cell">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendor.visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="table-td whitespace-nowrap text-sm text-gray-600">
                      {new Date(v.visitedAt).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="table-td">
                      <Link
                        href={`/customers/${v.customerId}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {v.customer.name}
                      </Link>
                    </td>
                    <td className="table-td">
                      {v.result && (
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${RESULT_COLORS[v.result]}`}
                        >
                          {RESULT_LABELS[v.result]}
                        </span>
                      )}
                    </td>
                    <td className="table-td hidden md:table-cell text-sm">
                      {v.orderAmount ? cop(Number(v.orderAmount)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
