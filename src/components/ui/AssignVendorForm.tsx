"use client";

import { useState } from "react";

interface Vendor {
  id: string;
  name: string;
  email: string;
}

interface Props {
  customerId: string;
  currentVendorId: string | null;
  vendors: Vendor[];
}

export function AssignVendorForm({ customerId, currentVendorId, vendors }: Props) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    currentVendorId ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: selectedVendorId || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage({ text: err.error ?? "Error al guardar", ok: false });
      } else {
        setMessage({ text: "Vendedor actualizado correctamente.", ok: true });
      }
    } catch {
      setMessage({ text: "Error de red.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1">
            Vendedor asignado
          </label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
          >
            <option value="">Sin asignar</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.email}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary text-sm disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {message && (
        <p
          className={`text-xs font-medium ${
            message.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
