"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number | string;
  maxVendors: number;
  maxCustomers: number;
  maxDelivery: number;
  dianEnabled: boolean;
  reportsEnabled: boolean;
  apiAccess: boolean;
  historyDays: number;
  durationDays: number | null;
  active: boolean;
  _count: { subscriptions: number };
}

function limit(v: number) {
  return v === -1 ? "Ilimitado" : v === 0 ? "Ilimitado" : v.toString();
}

export function PlanCard({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    displayName:    plan.displayName,
    description:    plan.description ?? "",
    price:          plan.price.toString(),
    maxVendors:     plan.maxVendors.toString(),
    maxCustomers:   plan.maxCustomers.toString(),
    maxDelivery:    plan.maxDelivery.toString(),
    dianEnabled:    plan.dianEnabled,
    reportsEnabled: plan.reportsEnabled,
    apiAccess:      plan.apiAccess,
    historyDays:    plan.historyDays.toString(),
    durationDays:   plan.durationDays?.toString() ?? "",
    active:         plan.active,
  });

  function change(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/superadmin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          active:         form.active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data.error));
      }

      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className={`bg-white rounded-xl border p-5 space-y-3 ${!plan.active ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-gray-400 font-mono uppercase">{plan.name}</span>
            <p className="text-lg font-bold text-gray-900">{plan.displayName}</p>
            {plan.description && <p className="text-sm text-gray-500">{plan.description}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-brand-700">
              ${Number(plan.price).toLocaleString("es-CO")}
            </p>
            <p className="text-xs text-gray-400">/mes COP</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
          <div><span className="font-semibold">Vendedores:</span> {limit(plan.maxVendors)}</div>
          <div><span className="font-semibold">Clientes:</span>   {limit(plan.maxCustomers)}</div>
          <div><span className="font-semibold">Repartidores:</span> {limit(plan.maxDelivery)}</div>
        </div>

        <div className="flex gap-2 flex-wrap text-xs">
          {plan.dianEnabled    && <Tag>DIAN</Tag>}
          {plan.reportsEnabled && <Tag>Reportes</Tag>}
          {plan.apiAccess      && <Tag>API</Tag>}
          <Tag>{plan.historyDays === 0 ? "Historial ilimitado" : `${plan.historyDays}d historial`}</Tag>
          {plan.durationDays && <Tag>{plan.durationDays}d acceso</Tag>}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">{plan._count.subscriptions} empresa(s)</span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{plan.name}</span>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <label className="text-xs text-gray-500 font-medium">Nombre visible</label>
          <input value={form.displayName} onChange={change("displayName")} className="input mt-0.5 w-full" />
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
          { key: "active",         label: "Plan activo" },
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

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2 text-sm">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
      {children}
    </span>
  );
}
