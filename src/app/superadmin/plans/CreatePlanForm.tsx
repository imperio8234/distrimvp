"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreatePlanForm() {
  const router = useRouter();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const [form, setForm] = useState({
    name:           "",
    displayName:    "",
    description:    "",
    price:          "0",
    maxVendors:     "1",
    maxCustomers:   "50",
    maxDelivery:    "1",
    dianEnabled:    false,
    reportsEnabled: false,
    apiAccess:      false,
    historyDays:    "90",
    durationDays:   "",
  });

  function change(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/superadmin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           form.name.toUpperCase().replace(/\s+/g, "_"),
          displayName:    form.displayName,
          description:    form.description || undefined,
          price:          parseFloat(form.price),
          maxVendors:     parseInt(form.maxVendors),
          maxCustomers:   parseInt(form.maxCustomers),
          maxDelivery:    parseInt(form.maxDelivery),
          dianEnabled:    form.dianEnabled,
          reportsEnabled: form.reportsEnabled,
          apiAccess:      form.apiAccess,
          historyDays:    parseInt(form.historyDays),
          durationDays:   form.durationDays ? parseInt(form.durationDays) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data.error));
      }

      setOpen(false);
      setForm({
        name: "", displayName: "", description: "", price: "0",
        maxVendors: "1", maxCustomers: "50", maxDelivery: "1",
        dianEnabled: false, reportsEnabled: false, apiAccess: false, historyDays: "90", durationDays: "",
      });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary px-6 py-2 text-sm">
        + Crear plan
      </button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-xs text-gray-500 font-medium">Nombre interno (ej: PREMIUM)</label>
          <input value={form.name} onChange={change("name")} required className="input mt-0.5 w-full" placeholder="PREMIUM" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Nombre visible</label>
          <input value={form.displayName} onChange={change("displayName")} required className="input mt-0.5 w-full" placeholder="Premium" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 font-medium">Descripción</label>
          <textarea value={form.description} onChange={change("description")} className="input mt-0.5 w-full h-16 resize-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Precio (COP/mes)</label>
          <input value={form.price} onChange={change("price")} type="number" className="input mt-0.5 w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Historial (días, 0=ilimitado)</label>
          <input value={form.historyDays} onChange={change("historyDays")} type="number" className="input mt-0.5 w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Duración acceso (días, vacío=renovable)</label>
          <input value={form.durationDays} onChange={change("durationDays")} type="number" min="1" className="input mt-0.5 w-full" placeholder="ej: 30" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Max. vendedores (-1=ilim.)</label>
          <input value={form.maxVendors} onChange={change("maxVendors")} type="number" className="input mt-0.5 w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Max. clientes (-1=ilim.)</label>
          <input value={form.maxCustomers} onChange={change("maxCustomers")} type="number" className="input mt-0.5 w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Max. repartidores (-1=ilim.)</label>
          <input value={form.maxDelivery} onChange={change("maxDelivery")} type="number" className="input mt-0.5 w-full" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { key: "dianEnabled",    label: "DIAN habilitado" },
          { key: "reportsEnabled", label: "Reportes avanzados" },
          { key: "apiAccess",      label: "Acceso API" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form[key as keyof typeof form] as boolean}
              onChange={change(key as keyof typeof form)}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary px-6 py-2 text-sm">
          {saving ? "Creando..." : "Crear plan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-lg"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
