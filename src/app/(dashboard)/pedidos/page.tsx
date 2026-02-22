import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Pedidos · DistriApp" };

type OrderStatus = "PENDING" | "IN_DELIVERY" | "DELIVERED" | "CANCELLED";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:     "Pendiente",
  IN_DELIVERY: "En reparto",
  DELIVERED:   "Entregado",
  CANCELLED:   "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  IN_DELIVERY: "bg-blue-100 text-blue-700",
  DELIVERED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-700",
};

const TABS = [
  { label: "Todos",        value: ""            },
  { label: "Pendientes",   value: "PENDING"     },
  { label: "En reparto",   value: "IN_DELIVERY" },
  { label: "Entregados",   value: "DELIVERED"   },
  { label: "Cancelados",   value: "CANCELLED"   },
];

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const { status: statusFilter } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      companyId,
      ...(statusFilter ? { status: statusFilter as OrderStatus } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, address: true } },
      visit: { include: { vendor: { select: { name: true } } } },
      delivery: { include: { deliveryPerson: { select: { name: true } } } },
    },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
  });

  // Contadores por estado para las tabs
  const counts = await prisma.order.groupBy({
    by: ["status"],
    where: { companyId },
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const total = counts.reduce((s, c) => s + c._count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de todos los pedidos y su estado de entrega
        </p>
      </div>

      {/* Tabs con contadores */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((tab) => {
          const count = tab.value ? (countMap[tab.value] ?? 0) : total;
          const active = (statusFilter ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/pedidos?status=${tab.value}` : "/pedidos"}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                active ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {orders.length === 0 ? (
          <p className="p-8 text-gray-400 italic text-sm text-center">
            No hay pedidos en esta categoría.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Cliente</th>
                  <th className="table-th">Vendedor</th>
                  <th className="table-th text-right">Monto</th>
                  <th className="table-th">Fecha entrega</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th hidden md:table-cell">Repartidor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* Cliente */}
                    <td className="table-td">
                      <Link
                        href={`/customers/${order.customerId}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {order.customer.name}
                      </Link>
                      {order.customer.address && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.customer.address}
                        </p>
                      )}
                    </td>

                    {/* Vendedor */}
                    <td className="table-td text-sm text-gray-600">
                      {order.visit?.vendor.name ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="table-td text-sm font-semibold text-gray-800 text-right whitespace-nowrap">
                      {cop(Number(order.amount))}
                    </td>

                    {/* Fecha entrega */}
                    <td className="table-td text-sm whitespace-nowrap">
                      {order.deliveryDate ? (
                        <span className="text-gray-700">
                          {new Date(order.deliveryDate).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-300">Sin fecha</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="table-td">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLOR[order.status as OrderStatus]
                        }`}
                      >
                        {STATUS_LABEL[order.status as OrderStatus]}
                      </span>
                    </td>

                    {/* Repartidor */}
                    <td className="table-td hidden md:table-cell text-sm">
                      {order.delivery ? (
                        <div>
                          <span className="text-gray-700">
                            {order.delivery.deliveryPerson.name}
                          </span>
                          {order.delivery.status === "FAILED" &&
                            order.delivery.notes && (
                              <p className="text-xs text-red-500 mt-0.5">
                                ✗ {order.delivery.notes}
                              </p>
                            )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen de totales */}
      {orders.length > 0 && (
        <div className="flex gap-6 text-sm text-gray-500">
          <span>
            <strong className="text-gray-800">{orders.length}</strong> pedidos
          </span>
          <span>
            <strong className="text-gray-800">
              {cop(orders.reduce((s, o) => s + Number(o.amount), 0))}
            </strong>{" "}
            total
          </span>
          {statusFilter === "DELIVERED" || !statusFilter ? (
            <span>
              <strong className="text-green-700">
                {cop(
                  orders
                    .filter((o) => o.status === "DELIVERED")
                    .reduce((s, o) => s + Number(o.amount), 0)
                )}
              </strong>{" "}
              entregados
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
