"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OrderStatus    = "PENDING_REVIEW" | "PENDING" | "IN_DELIVERY" | "DELIVERED" | "CANCELLED";
type DeliveryStatus = "PENDING" | "DELIVERED" | "FAILED";

export type SerializedOrder = {
  id:                  string;
  status:              OrderStatus;
  amount:              number;
  deliveryDate:        string | null;
  factusInvoiceId:     string | null;
  factusInvoiceNumber: string | null;
  customer: {
    id:                   string;
    name:                 string;
    address:              string | null;
    phone:                string | null;
    requiresInvoice:      boolean;
    billingId:            string | null;
    billingIdType:        string;
    billingLegalOrg:      string;
    billingTribute:       string;
    billingMunicipalityId: string | null;
    billingEmail:         string | null;
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
  PENDING_REVIEW: "Por revisar",
  PENDING:        "Pendiente",
  IN_DELIVERY:    "En reparto",
  DELIVERED:      "Entregado",
  CANCELLED:      "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_REVIEW: "bg-purple-100 text-purple-700",
  PENDING:        "bg-yellow-100 text-yellow-700",
  IN_DELIVERY:    "bg-blue-100 text-blue-700",
  DELIVERED:      "bg-green-100 text-green-700",
  CANCELLED:      "bg-red-100 text-red-700",
};

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style:                "currency",
    currency:             "COP",
    maximumFractionDigits: 0,
  }).format(n);

// ── Componente principal ──────────────────────────────────────────────
export function PedidosTable({
  orders,
  deliveryPersons,
  dianEnabled,
}: {
  orders:          SerializedOrder[];
  deliveryPersons: DeliveryPerson[];
  dianEnabled:     boolean;
}) {
  const [editOrder,   setEditOrder]   = useState<SerializedOrder | null>(null);
  const [reviewOrder, setReviewOrder] = useState<SerializedOrder | null>(null);
  const router = useRouter();

  const handleSaved = () => {
    setEditOrder(null);
    setReviewOrder(null);
    router.refresh();
  };

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
                  <th className="table-th hidden md:table-cell">Factura</th>
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
                          {order.delivery.status === "FAILED" && order.delivery.notes && (
                            <p className="text-xs text-red-500 mt-0.5">
                              ✗ {order.delivery.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Factura */}
                    <td className="table-td hidden md:table-cell text-sm">
                      {order.factusInvoiceNumber ? (
                        <span className="text-green-700 font-medium text-xs">
                          {order.factusInvoiceNumber}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="table-td">
                      {order.status === "PENDING_REVIEW" ? (
                        <button
                          onClick={() => setReviewOrder(order)}
                          className="text-xs text-purple-700 hover:text-purple-900 font-medium px-2 py-1 rounded hover:bg-purple-50 transition-colors whitespace-nowrap"
                        >
                          Revisar
                        </button>
                      ) : order.status !== "DELIVERED" ? (
                        <button
                          onClick={() => setEditOrder(order)}
                          className="text-xs text-brand-700 hover:text-brand-900 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors whitespace-nowrap"
                          title="Reagendar / Reasignar"
                        >
                          Gestionar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal gestión (reagendar/reasignar) */}
      {editOrder && (
        <RescheduleModal
          order={editOrder}
          deliveryPersons={deliveryPersons}
          onClose={() => setEditOrder(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Modal revisión (con opción de factura) */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          dianEnabled={dianEnabled}
          onClose={() => setReviewOrder(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

// ── Modal de revisión de pedido (PENDING_REVIEW) ──────────────────────
type ReviewStep = "choice" | "invoice" | "approving";

function ReviewModal({
  order,
  dianEnabled,
  onClose,
  onSaved,
}: {
  order:       SerializedOrder;
  dianEnabled: boolean;
  onClose:     () => void;
  onSaved:     () => void;
}) {
  const [step, setStep] = useState<ReviewStep>("choice");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Invoice form state (pre-filled from customer billing data) ──
  const c = order.customer;
  const [ranges, setRanges]             = useState<{ id: number; prefix: string; from: number; to: number }[]>([]);
  const [loadingRanges, setLoadingRanges] = useState(false);
  const [rangeId, setRangeId]           = useState<number | "">("");
  const [identification, setIdentification] = useState(c.billingId ?? "");
  const [names, setNames]               = useState(c.name);
  const [address, setAddress]           = useState(c.address ?? "");
  const [email, setEmail]               = useState(c.billingEmail ?? "");
  const [phone, setPhone]               = useState(c.phone ?? "");
  const [idDocType, setIdDocType]       = useState(c.billingIdType ?? "3");
  const [legalOrg, setLegalOrg]         = useState(c.billingLegalOrg ?? "2");
  const [tribute, setTribute]           = useState(c.billingTribute ?? "21");
  const [municipalityId, setMunicipalityId] = useState(c.billingMunicipalityId ?? "980");
  const [paymentForm, setPaymentForm]   = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("10");

  async function loadRanges() {
    setLoadingRanges(true);
    setError("");
    try {
      const res = await fetch("/api/factus/numbering-ranges");
      if (!res.ok) throw new Error("No se pudo cargar rangos de numeración");
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      setRanges(list);
      if (list.length === 1) setRangeId(list[0].id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando rangos");
    } finally {
      setLoadingRanges(false);
    }
  }

  function openInvoiceForm() {
    setStep("invoice");
    loadRanges();
  }

  async function approveWithoutInvoice() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al aprobar");
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al aprobar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!rangeId) { setError("Selecciona un rango de numeración"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/factus/bills", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:           order.id,
          numberingRangeId:  Number(rangeId),
          paymentForm,
          paymentMethodCode: paymentMethod,
          customer: {
            identification,
            names,
            address,
            email,
            phone,
            legalOrganizationId:      legalOrg,
            tributeId:                tribute,
            identificationDocumentId: idDocType,
            municipalityId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear factura");
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear factura");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {step === "choice" ? "Revisar pedido" : "Crear factura electrónica"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Info del pedido */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">{order.customer.name}</p>
            <span suppressHydrationWarning className="text-sm font-bold text-gray-700">
              {cop(order.amount)}
            </span>
          </div>
          {order.customer.address && (
            <p className="text-xs text-gray-400 mt-0.5">{order.customer.address}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            Vendedor: {order.visit?.vendor.name ?? "—"}
          </p>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* ── PASO 1: elección ─────────────────────────────── */}
          {step === "choice" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                ¿Deseas crear una factura electrónica antes de despachar este pedido?
              </p>

              {!dianEnabled ? (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-semibold text-amber-800">Facturación electrónica restringida</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      La facturación electrónica no está disponible en tu plan actual.
                      Actualiza tu plan para habilitar esta función.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openInvoiceForm}
                  className="w-full flex items-start gap-3 rounded-xl border-2 border-brand-200 hover:border-brand-500 p-4 text-left transition-colors group"
                >
                  <span className="text-2xl">🧾</span>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-brand-700">
                      Crear factura y despachar
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Genera factura electrónica DIAN y mueve el pedido a pendiente de entrega.
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={approveWithoutInvoice}
                disabled={saving}
                className="w-full flex items-start gap-3 rounded-xl border-2 border-gray-200 hover:border-gray-400 p-4 text-left transition-colors group disabled:opacity-50"
              >
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-gray-900">
                    {saving ? "Despachando…" : "Despachar sin factura"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mueve directamente a pendiente de entrega sin generar factura.
                  </p>
                </div>
              </button>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── PASO 2: formulario de factura ────────────────── */}
          {step === "invoice" && (
            <form id="invoice-form" onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Rango de numeración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rango de numeración *
                </label>
                {loadingRanges ? (
                  <p className="text-sm text-gray-400 italic">Cargando rangos…</p>
                ) : ranges.length === 0 ? (
                  <div>
                    <input
                      type="number"
                      value={rangeId}
                      onChange={(e) => setRangeId(Number(e.target.value))}
                      placeholder="ID del rango (ej: 1)"
                      className="input w-full"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      No se cargaron rangos. Ingresa el ID manualmente.
                    </p>
                  </div>
                ) : (
                  <select
                    value={rangeId}
                    onChange={(e) => setRangeId(Number(e.target.value))}
                    className="input w-full"
                    required
                  >
                    <option value="">— Selecciona un rango —</option>
                    {ranges.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.prefix} ({r.from} - {r.to})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Datos del cliente */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2 border-t">
                Datos de facturación del cliente
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tipo de documento
                  </label>
                  <select
                    value={idDocType}
                    onChange={(e) => setIdDocType(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="3">Cédula (CC)</option>
                    <option value="6">NIT</option>
                    <option value="2">Tarjeta de identidad</option>
                    <option value="7">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Número de identificación *
                  </label>
                  <input
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="1234567890"
                    className="input w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombres / Razón social *
                </label>
                <input
                  type="text"
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  className="input w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input w-full text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="input w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="3001234567"
                    className="input w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tipo de persona
                  </label>
                  <select
                    value={legalOrg}
                    onChange={(e) => setLegalOrg(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="2">Persona Natural</option>
                    <option value="1">Persona Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Régimen tributario
                  </label>
                  <select
                    value={tribute}
                    onChange={(e) => setTribute(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="21">No responsable de IVA</option>
                    <option value="1">Responsable de IVA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ID Municipio *
                  <span className="text-gray-400 font-normal ml-1">(Factus)</span>
                </label>
                <input
                  type="text"
                  value={municipalityId}
                  onChange={(e) => setMunicipalityId(e.target.value)}
                  placeholder="ej: 980 (Bogotá)"
                  className="input w-full text-sm"
                  required
                />
              </div>

              {/* Pago */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2 border-t">
                Forma de pago
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Forma de pago
                  </label>
                  <select
                    value={paymentForm}
                    onChange={(e) => setPaymentForm(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="1">Contado</option>
                    <option value="2">Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Método de pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="10">Efectivo</option>
                    <option value="20">Cheque</option>
                    <option value="48">Tarjeta Crédito</option>
                    <option value="49">Tarjeta Débito</option>
                    <option value="42">Consignación bancaria</option>
                    <option value="45">Transferencia bancaria</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "invoice" && (
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 shrink-0 flex gap-3">
            <button
              type="button"
              onClick={() => { setStep("choice"); setError(""); }}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Volver
            </button>
            <button
              type="submit"
              form="invoice-form"
              disabled={saving}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Creando factura…" : "Crear factura y despachar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal de reagendamiento / reasignación ────────────────────────────
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
  const originalDeliveryPersonId = order.delivery?.deliveryPersonId ?? "";

  const [deliveryDate, setDeliveryDate] = useState(
    order.deliveryDate ? order.deliveryDate.split("T")[0] : ""
  );
  const [deliveryPersonId, setDeliveryPersonId] = useState(originalDeliveryPersonId);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const isCancelled   = order.status === "CANCELLED";
  const isUnassigning = originalDeliveryPersonId !== "" && deliveryPersonId === "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const dpPayload = deliveryPersonId
      ? deliveryPersonId
      : isUnassigning
        ? null
        : undefined;

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          deliveryDate: deliveryDate || null,
          ...(dpPayload !== undefined ? { deliveryPersonId: dpPayload } : {}),
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
          <p suppressHydrationWarning className="text-sm font-bold text-gray-700">
            {cop(order.amount)}
          </p>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repartidor
            </label>
            {deliveryPersons.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay repartidores activos</p>
            ) : (
              <>
                <select
                  value={deliveryPersonId}
                  onChange={(e) => setDeliveryPersonId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">
                    {originalDeliveryPersonId
                      ? "— Quitar asignación (volver a pendiente) —"
                      : "— Sin asignar —"}
                  </option>
                  {deliveryPersons.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {dp.name}
                      {dp.id === originalDeliveryPersonId ? " (actual)" : ""}
                    </option>
                  ))}
                </select>
                {isUnassigning && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ El pedido volverá a estado Pendiente y aparecerá en el área de asignación.
                  </p>
                )}
              </>
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
              disabled={saving || (!deliveryDate && !deliveryPersonId && !isUnassigning)}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-50"
            >
              {saving
                ? "Guardando…"
                : isUnassigning
                  ? "Quitar y poner pendiente"
                  : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
