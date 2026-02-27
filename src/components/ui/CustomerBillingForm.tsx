"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BillingData = {
  requiresInvoice:       boolean;
  billingId:             string | null;
  billingIdType:         string | null;
  billingLegalOrg:       string | null;
  billingTribute:        string | null;
  billingMunicipalityId: string | null;
  billingEmail:          string | null;
};

const ID_TYPE_LABELS: Record<string, string> = {
  "3":  "Cédula de ciudadanía (CC)",
  "6":  "NIT",
  "2":  "Tarjeta de identidad",
  "7":  "Pasaporte",
  "12": "Tarjeta de identidad",
};

const LEGAL_ORG_LABELS: Record<string, string> = {
  "1": "Persona Jurídica",
  "2": "Persona Natural",
};

const TRIBUTE_LABELS: Record<string, string> = {
  "1":  "Responsable de IVA",
  "21": "No responsable de IVA",
};

export function CustomerBillingForm({
  customerId,
  billing,
  dianEnabled,
}: {
  customerId:  string;
  billing:     BillingData;
  dianEnabled: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [requiresInvoice, setRequiresInvoice]             = useState(billing.requiresInvoice);
  const [billingId, setBillingId]                         = useState(billing.billingId ?? "");
  const [billingIdType, setBillingIdType]                 = useState(billing.billingIdType ?? "3");
  const [billingLegalOrg, setBillingLegalOrg]             = useState(billing.billingLegalOrg ?? "2");
  const [billingTribute, setBillingTribute]               = useState(billing.billingTribute ?? "21");
  const [billingMunicipalityId, setBillingMunicipalityId] = useState(billing.billingMunicipalityId ?? "");
  const [billingEmail, setBillingEmail]                   = useState(billing.billingEmail ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiresInvoice,
          billingId:             billingId       || undefined,
          billingIdType:         billingIdType   || undefined,
          billingLegalOrg:       billingLegalOrg || undefined,
          billingTribute:        billingTribute  || undefined,
          billingMunicipalityId: billingMunicipalityId || undefined,
          billingEmail:          billingEmail    || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      setEditing(false);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // ── Vista de solo lectura ────────────────────────────────
  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Facturación electrónica
            </h3>
            {!dianEnabled && (
              <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                Requiere plan superior
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-brand-700 hover:text-brand-900 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors"
          >
            Editar
          </button>
        </div>

        {!dianEnabled && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
            La facturación electrónica está restringida en tu plan actual. Actualiza tu plan para habilitarla.
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <ReadField
            label="Requiere factura"
            value={billing.requiresInvoice ? "Sí" : "No"}
          />
          {billing.requiresInvoice && (
            <>
              <ReadField
                label="Identificación"
                value={billing.billingId
                  ? `${ID_TYPE_LABELS[billing.billingIdType ?? "3"] ?? "Doc"}: ${billing.billingId}`
                  : "—"}
              />
              <ReadField
                label="Tipo de persona"
                value={LEGAL_ORG_LABELS[billing.billingLegalOrg ?? "2"] ?? "—"}
              />
              <ReadField
                label="Régimen tributario"
                value={TRIBUTE_LABELS[billing.billingTribute ?? "21"] ?? "—"}
              />
              <ReadField
                label="Municipio (ID Factus)"
                value={billing.billingMunicipalityId ?? "—"}
              />
              <ReadField
                label="Email facturación"
                value={billing.billingEmail ?? "—"}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Formulario de edición ────────────────────────────────
  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Facturación electrónica
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setEditing(false); setError(""); }}
            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-xs btn-primary px-3 py-1 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Toggle requiere factura */}
      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <div
          className={`relative w-10 h-6 rounded-full transition-colors ${requiresInvoice ? "bg-brand-600" : "bg-gray-200"}`}
          onClick={() => setRequiresInvoice(!requiresInvoice)}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${requiresInvoice ? "translate-x-4" : ""}`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">
          ¿Requiere factura electrónica?
        </span>
      </label>

      {requiresInvoice && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tipo de documento
              </label>
              <select
                value={billingIdType}
                onChange={(e) => setBillingIdType(e.target.value)}
                className="input w-full text-sm"
              >
                <option value="3">Cédula de ciudadanía (CC)</option>
                <option value="6">NIT</option>
                <option value="2">Tarjeta de identidad</option>
                <option value="7">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Número de identificación
              </label>
              <input
                type="text"
                value={billingId}
                onChange={(e) => setBillingId(e.target.value)}
                placeholder="Ej: 123456789"
                className="input w-full text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tipo de persona
              </label>
              <select
                value={billingLegalOrg}
                onChange={(e) => setBillingLegalOrg(e.target.value)}
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
                value={billingTribute}
                onChange={(e) => setBillingTribute(e.target.value)}
                className="input w-full text-sm"
              >
                <option value="21">No responsable de IVA</option>
                <option value="1">Responsable de IVA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ID Municipio (Factus)
              </label>
              <input
                type="text"
                value={billingMunicipalityId}
                onChange={(e) => setBillingMunicipalityId(e.target.value)}
                placeholder="Ej: 980"
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email para factura
              </label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="input w-full text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
          {error}
        </p>
      )}
    </form>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
