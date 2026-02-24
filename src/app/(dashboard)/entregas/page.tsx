"use client";

import { useEffect, useState, useCallback } from "react";

type OrderStatus = "PENDING" | "IN_DELIVERY" | "DELIVERED" | "CANCELLED";

interface UnassignedOrder {
  id: string;
  amount: string;
  deliveryDate: string | null;
  createdAt: string;
  notes: string | null;
  status: OrderStatus;
  customer: { id: string; name: string; address: string | null; phone: string | null };
  visit: { vendor: { id: string; name: string } } | null;
}

interface DeliveryPersonStat {
  deliveryPersonId: string;
  deliveryPersonName: string;
  total: number;
  delivered: number;
  failed: number;
  inProgress: number;
  successRate: number;
}

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function EntregasPage() {
  const [orders, setOrders] = useState<UnassignedOrder[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPersonStat[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch("/api/orders/unassigned"),
        fetch("/api/stats/deliveries"),
      ]);
      const ordersJson = await ordersRes.json();
      const statsJson = await statsRes.json();

      setOrders(ordersJson.data ?? []);
      setDeliveryPeople(statsJson.data?.deliveries ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleOrder(id: string) {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleAssign() {
    if (selectedOrders.size === 0) return setMessage({ type: "err", text: "Selecciona al menos una orden." });
    if (!selectedDeliveryPerson) return setMessage({ type: "err", text: "Selecciona un repartidor." });

    setAssigning(true);
    setMessage(null);
    try {
      const body =
        selectedOrders.size === 1
          ? {
              orderId: [...selectedOrders][0],
              deliveryPersonId: selectedDeliveryPerson,
              deliveryDate: deliveryDate || undefined,
            }
          : {
              orderIds: [...selectedOrders],
              deliveryPersonId: selectedDeliveryPerson,
              deliveryDate: deliveryDate || undefined,
            };

      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al asignar");

      const count = selectedOrders.size;
      setMessage({ type: "ok", text: `✓ ${count} entrega(s) asignadas correctamente.` });
      setSelectedOrders(new Set());
      setSelectedDeliveryPerson("");
      setDeliveryDate("");
      await loadData();
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Entregas</h1>
        <p className="text-gray-500 text-sm mt-1">Asigna órdenes pendientes a repartidores</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Órdenes sin asignar */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedOrders.size === orders.length && orders.length > 0}
                onChange={toggleAll}
                className="rounded border-gray-300 text-brand-600"
              />
              <h2 className="font-semibold text-gray-700">
                Órdenes sin repartidor{" "}
                <span className="text-gray-400 font-normal">({orders.length})</span>
              </h2>
            </div>
            {selectedOrders.size > 0 && (
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">
                {selectedOrders.size} seleccionadas
              </span>
            )}
          </div>

          {orders.length === 0 ? (
            <p className="p-8 text-center text-gray-400 italic text-sm">
              No hay órdenes pendientes sin asignar.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedOrders.has(order.id) ? "bg-brand-50" : ""
                  }`}
                  onClick={() => toggleOrder(order.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => toggleOrder(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded border-gray-300 text-brand-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 truncate">{order.customer.name}</p>
                      <span className="font-bold text-gray-800 shrink-0">{cop(Number(order.amount))}</span>
                    </div>
                    {order.customer.address && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {order.customer.address}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {order.visit?.vendor && (
                        <span className="text-xs text-gray-400">Vendedor: {order.visit.vendor.name}</span>
                      )}
                      {order.deliveryDate && (
                        <span className="text-xs text-blue-600">
                          📅 {new Date(order.deliveryDate).toLocaleDateString("es-CO")}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho: Asignación */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h2 className="font-semibold text-gray-700">Asignar a repartidor</h2>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {deliveryPeople.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No hay repartidores activos.</p>
              ) : (
                deliveryPeople.map((person) => (
                  <label
                    key={person.deliveryPersonId}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDeliveryPerson === person.deliveryPersonId
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryPerson"
                        value={person.deliveryPersonId}
                        checked={selectedDeliveryPerson === person.deliveryPersonId}
                        onChange={() => setSelectedDeliveryPerson(person.deliveryPersonId)}
                        className="text-brand-600"
                      />
                      <span className="font-medium text-sm text-gray-800">{person.deliveryPersonName}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        person.total >= 15
                          ? "bg-red-100 text-red-600"
                          : person.total >= 8
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {person.total} hoy
                    </span>
                  </label>
                ))
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha de entrega (opcional)
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              onClick={handleAssign}
              disabled={assigning || selectedOrders.size === 0 || !selectedDeliveryPerson}
              className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {assigning
                ? "Asignando..."
                : selectedOrders.size === 0
                ? "Selecciona órdenes"
                : `Asignar ${selectedOrders.size} orden(es)`}
            </button>
          </div>

          {selectedOrders.size > 0 && (
            <div className="card p-4 bg-brand-50 border border-brand-200">
              <p className="text-sm font-semibold text-brand-800">
                {selectedOrders.size} orden(es) seleccionadas
              </p>
              <p className="text-sm text-brand-700 mt-1">
                Total:{" "}
                <strong>
                  {cop(
                    orders
                      .filter((o) => selectedOrders.has(o.id))
                      .reduce((s, o) => s + Number(o.amount), 0)
                  )}
                </strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
