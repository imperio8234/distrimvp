"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OrderStatus    = "PENDING" | "IN_DELIVERY" | "DELIVERED" | "CANCELLED";
type DeliveryStatus = "PENDING" | "DELIVERED" | "FAILED";

export type SerializedOrder = {
  id:           string;
  status:       OrderStatus;
  amount:       number;
  deliveryDate: string | null;
  customer: {
    id:      string;
    name:    string;
    address: string | null;
  };
  visit:    { vendor: { name: string } } | null;
  delivery: {
    deliveryPersonId: string;
    deliveryPerson:   { name: string };
    status:           DeliveryStatus;
    notes:            string | null;
  } | null;
};

export type DeliveryPerson = { id: string; name: string };

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

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style:                "currency",
    currency:             "COP",
    maximumFractionDigits: 0,
  }).format(n);

// ── Componente principal ──────────────────────────────────────────
export function PedidosTable({
  orders,
  deliveryPersons,
}: {
  orders:          SerializedOrder[];
  deliveryPersons: DeliveryPerson[];
}) {
  const [editOrder, setEditOrder] = useState<SerializedOrder | null>(null);
  const router = useRouter();

  return (
    <>
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
                  <th className="table-th w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">

                    {/* Cliente */}
                    <td className="table-td">
                      <Link
                        href={`/customers/${order.customer.id}`}
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
                    <td
                      suppressHydrationWarning
                      className="table-td text-sm font-semibold text-gray-800 text-right whitespace-nowrap"
                    >
                      {cop(order.amount)}
                    </td>

                    {/* Fecha entrega */}
                    <td className="table-td text-sm whitespace-nowrap">
                      {order.deliveryDate ? (
                        <span suppressHydrationWarning className="text-gray-700">
                          {new Date(order.deliveryDate).toLocaleDateString("es-CO", {
                            day:   "numeric",
                            month: "short",
                            year:  "numeric",
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
                          STATUS_COLOR[order.status]
                        }`}
                      >
                        {STATUS_LABEL[order.status]}
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

                    {/* Acción */}
                    <td className="table-td">
                      {order.status !== "DELIVERED" && (
                        <button
                          onClick={() => setEditOrder(order)}
                          className="text-xs text-brand-700 hover:text-brand-900 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors whitespace-nowrap"
                          title="Reagendar / Reasignar"
                        >
                          Gestionar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {editOrder && (
        <RescheduleModal
          order={editOrder}
          deliveryPersons={deliveryPersons}
          onClose={() => setEditOrder(null)}
          onSaved={() => {
            setEditOrder(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ── Modal de reagendamiento / reasignación ────────────────────────
function RescheduleModal({
  order,
  deliveryPersons,
  onClose,
  onSaved,
}: {
  order:           SerializedOrder;
  deliveryPersons: DeliveryPerson[];
  onClose:         () => void;
  onSaved:         () => void;
}) {
  const [deliveryDate, setDeliveryDate] = useState(
    order.deliveryDate ? order.deliveryDate.split("T")[0] : ""
  );
  const [deliveryPersonId, setDeliveryPersonId] = useState(
    order.delivery?.deliveryPersonId ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const isCancelled = order.status === "CANCELLED";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          deliveryDate:     deliveryDate || null,
          ...(deliveryPersonId ? { deliveryPersonId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            Reagendar / Reasignar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Info del pedido */}
        <div className="px-6 pt-4 pb-2 space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">{order.customer.name}</p>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[order.status]}`}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          {order.customer.address && (
            <p className="text-xs text-gray-400">{order.customer.address}</p>
          )}
          <p className="text-sm font-bold text-gray-700">{cop(order.amount)}</p>

          {order.delivery?.status === "FAILED" && order.delivery.notes && (
            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
              <span className="font-semibold">Entrega fallida:</span>{" "}
              {order.delivery.notes}
            </div>
          )}

          {isCancelled && (
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              ⚠️ Este pedido fue cancelado. Asignar un repartidor lo reactivará.
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-4">
          {/* Fecha de entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de entrega
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Repartidor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repartidor
            </label>
            {deliveryPersons.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No hay repartidores activos
              </p>
            ) : (
              <select
                value={deliveryPersonId}
                onChange={(e) => setDeliveryPersonId(e.target.value)}
                className="input w-full"
              >
                <option value="">— Sin cambios / Sin asignar —</option>
                {deliveryPersons.map((dp) => (
                  <option key={dp.id} value={dp.id}>
                    {dp.name}
                    {dp.id === order.delivery?.deliveryPersonId
                      ? " (actual)"
                      : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || (!deliveryDate && !deliveryPersonId)}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
