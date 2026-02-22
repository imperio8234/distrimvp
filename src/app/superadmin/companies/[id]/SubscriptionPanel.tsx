"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number | string;
}

interface Subscription {
  id: string;
  status: string;
  planId: string;
  billingPeriod: string;
  plan: Plan;
  trialEndsAt: Date | string | null;
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  notes: string | null;
}

const STATUS_OPTIONS = [
  { value: "TRIAL",     label: "Período de prueba" },
  { value: "ACTIVE",    label: "Activa" },
  { value: "PAST_DUE",  label: "Pago vencido" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "SUSPENDED", label: "Suspendida" },
];

export function SubscriptionPanel({
  companyId,
  subscription,
  plans,
}: {
  companyId: string;
  subscription: Subscription | null;
  plans: Plan[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [planId,         setPlanId]         = useState(subscription?.planId ?? plans[0]?.id ?? "");
  const [status,         setStatus]         = useState(subscription?.status ?? "TRIAL");
  const [billingPeriod,  setBillingPeriod]  = useState(subscription?.billingPeriod ?? "MONTHLY");
  const [notes,          setNotes]          = useState(subscription?.notes ?? "");

  async function handleSave() {
    if (!planId) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/superadmin/companies/${companyId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status, billingPeriod, notes: notes || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Suscripción</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
          <select
            value={planId}
            onChange={(e) => { setPlanId(e.target.value); setSuccess(false); }}
            className="input w-full"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName} — ${Number(p.price).toLocaleString("es-CO")} COP/mes
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facturación</label>
          <select
            value={billingPeriod}
            onChange={(e) => { setBillingPeriod(e.target.value); setSuccess(false); }}
            className="input w-full"
          >
            <option value="MONTHLY">Mensual</option>
            <option value="YEARLY">Anual (12 meses)</option>
          </select>
          <p className="text-xs text-gray-400 mt-0.5">
            Determina el período al asignar o renovar el plan. Los planes con duración fija ignorarán este campo.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSuccess(false); }}
            className="input w-full"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSuccess(false); }}
            className="input w-full h-20 resize-none"
            placeholder="Acuerdos especiales, descuentos, etc."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            ✓ Suscripción actualizada
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-2"
        >
          {saving ? "Guardando..." : "Guardar suscripción"}
        </button>
      </div>
    </div>
  );
}
