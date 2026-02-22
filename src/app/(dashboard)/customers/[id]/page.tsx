import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ColdBadge } from "@/components/ui/ColdBadge";
import { AssignVendorForm } from "@/components/ui/AssignVendorForm";

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

const VISIT_RESULT_LABEL: Record<string, string> = {
  ORDER_TAKEN: "Pedido tomado",
  NOT_HOME:    "No estaba",
  REFUSED:     "No quiso comprar",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:     "Pendiente",
  IN_DELIVERY: "En reparto",
  DELIVERED:   "Entregado",
  CANCELLED:   "Cancelado",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING:     "text-yellow-700 bg-yellow-50",
  IN_DELIVERY: "text-blue-700 bg-blue-50",
  DELIVERED:   "text-green-700 bg-green-50",
  CANCELLED:   "text-red-700 bg-red-50",
};

const VISIT_RESULT_COLOR: Record<string, string> = {
  ORDER_TAKEN: "text-green-700 bg-green-50",
  NOT_HOME:    "text-yellow-700 bg-yellow-50",
  REFUSED:     "text-red-700 bg-red-50",
};

async function getCustomer(id: string, companyId: string) {
  return prisma.customer.findFirst({
    where: { id, companyId, active: true },
    include: {
      assignedVendor: { select: { id: true, name: true } },
      visits: {
        orderBy: { visitedAt: "desc" },
        take: 20,
        include: { vendor: { select: { name: true } } },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          delivery: { include: { deliveryPerson: { select: { name: true } } } },
        },
      },
    },
  });
}

async function getVendors(companyId: string) {
  return prisma.user.findMany({
    where: { companyId, role: "VENDOR", active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [customer, vendors] = await Promise.all([
    getCustomer(id, session!.user.companyId!),
    getVendors(session!.user.companyId!),
  ]);

  if (!customer) notFound();

  const days = daysSince(customer.lastVisitAt);
  const status = coldStatus(days);
  const mapsUrl = `https://www.google.com/maps?q=${customer.lat},${customer.lng}`;

  const totalRevenue = customer.orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/customers" className="hover:text-brand-700">Clientes</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{customer.name}</span>
      </div>

      {/* Tarjeta de información */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <ColdBadge status={status} days={days} />
            </div>
            {customer.ownerName && (
              <p className="text-gray-500 mt-1">Dueño: {customer.ownerName}</p>
            )}
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-sm"
          >
            Ver en Google Maps →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <InfoField label="Teléfono" value={customer.phone ?? "—"} />
          <InfoField label="Dirección" value={customer.address ?? "—"} />
          <InfoField
            label="Última visita"
            value={
              customer.lastVisitAt
                ? new Date(customer.lastVisitAt).toLocaleDateString("es-CO", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "Nunca visitado"
            }
          />
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <InfoField
            label="Total visitas"
            value={customer.visits.length.toString()}
          />
          <InfoField
            label="Total pedidos"
            value={customer.orders.length.toString()}
          />
          <InfoField
            label="Ingresos entregados"
            value={new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(totalRevenue)}
          />
        </div>

        {/* Sección de asignación de vendedor */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <AssignVendorForm
            customerId={customer.id}
            currentVendorId={customer.assignedVendor?.id ?? null}
            vendors={vendors}
          />
        </div>
      </div>

      {/* Historial de visitas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Historial de visitas
        </h2>
        <div className="card p-0 overflow-hidden">
          {customer.visits.length === 0 ? (
            <p className="p-6 text-gray-400 italic text-sm">
              Este cliente aún no ha sido visitado.
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Vendedor</th>
                  <th className="table-th">Resultado</th>
                  <th className="table-th hidden md:table-cell">Monto</th>
                  <th className="table-th hidden lg:table-cell">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="table-td whitespace-nowrap">
                      {new Date(v.visitedAt).toLocaleDateString("es-CO", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="table-td">{v.vendor.name}</td>
                    <td className="table-td">
                      {v.result ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${VISIT_RESULT_COLOR[v.result]}`}>
                          {VISIT_RESULT_LABEL[v.result]}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          En progreso
                        </span>
                      )}
                    </td>
                    <td className="table-td hidden md:table-cell">
                      {v.orderAmount
                        ? new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }).format(Number(v.orderAmount))
                        : "—"}
                    </td>
                    <td className="table-td hidden lg:table-cell text-gray-400">
                      {v.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Historial de pedidos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Pedidos ({customer.orders.length})
        </h2>
        <div className="card p-0 overflow-hidden">
          {customer.orders.length === 0 ? (
            <p className="p-6 text-gray-400 italic text-sm">
              Este cliente aún no tiene pedidos.
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Fecha pedido</th>
                  <th className="table-th">Entrega</th>
                  <th className="table-th text-right">Monto</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th hidden md:table-cell">Repartidor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="table-td whitespace-nowrap text-sm text-gray-600">
                      {new Date(o.createdAt).toLocaleDateString("es-CO", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="table-td whitespace-nowrap text-sm text-gray-600">
                      {o.deliveryDate
                        ? new Date(o.deliveryDate).toLocaleDateString("es-CO", {
                            day: "numeric", month: "short",
                          })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-td text-sm font-semibold text-gray-800 text-right whitespace-nowrap">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency", currency: "COP", maximumFractionDigits: 0,
                      }).format(Number(o.amount))}
                    </td>
                    <td className="table-td">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ORDER_STATUS_COLOR[o.status]}`}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="table-td hidden md:table-cell text-sm text-gray-600">
                      {o.delivery?.deliveryPerson.name ?? <span className="text-gray-300">—</span>}
                      {o.delivery?.status === "FAILED" && o.delivery.notes && (
                        <p className="text-xs text-red-500 mt-0.5">✗ {o.delivery.notes}</p>
                      )}
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
