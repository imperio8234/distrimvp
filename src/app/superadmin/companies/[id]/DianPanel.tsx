"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DianConfig {
  id: string;
  resolutionNumber: string | null;
  prefix: string | null;
  fromNumber: number | null;
  toNumber: number | null;
  resolutionDate: Date | string | null;
  endDate: Date | string | null;
  economicActivity: string | null;
  apiToken: string | null;
  testUserId: string | null;
  softwareId: string | null;
  softwarePin: string | null;
  testMode: boolean;
}

export function DianPanel({
  companyId,
  dianConfig,
}: {
  companyId: string;
  dianConfig: DianConfig | null;
}) {
  const router = useRouter();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [open, setOpen]       = useState(false);

  const fmt = (d: Date | string | null) =>
    d ? new Date(d).toISOString().slice(0, 10) : "";

  const [form, setForm] = useState({
    resolutionNumber: dianConfig?.resolutionNumber ?? "",
    prefix:           dianConfig?.prefix ?? "",
    fromNumber:       dianConfig?.fromNumber?.toString() ?? "",
    toNumber:         dianConfig?.toNumber?.toString() ?? "",
    resolutionDate:   fmt(dianConfig?.resolutionDate ?? null),
    endDate:          fmt(dianConfig?.endDate ?? null),
    economicActivity: dianConfig?.economicActivity ?? "",
    apiToken:         dianConfig?.apiToken ?? "",
    testUserId:       dianConfig?.testUserId ?? "",
    softwareId:       dianConfig?.softwareId ?? "",
    softwarePin:      dianConfig?.softwarePin ?? "",
    testMode:         dianConfig?.testMode ?? true,
  });

  function change(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setSuccess(false);
    };
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    const payload: Record<string, unknown> = {
      resolutionNumber: form.resolutionNumber || undefined,
      prefix:           form.prefix || undefined,
      fromNumber:       form.fromNumber ? parseInt(form.fromNumber) : undefined,
      toNumber:         form.toNumber ? parseInt(form.toNumber) : undefined,
      resolutionDate:   form.resolutionDate ? new Date(form.resolutionDate).toISOString() : undefined,
      endDate:          form.endDate ? new Date(form.endDate).toISOString() : undefined,
      economicActivity: form.economicActivity || undefined,
      apiToken:         form.apiToken || undefined,
      testUserId:       form.testUserId || undefined,
      softwareId:       form.softwareId || undefined,
      softwarePin:      form.softwarePin || undefined,
      testMode:         form.testMode,
    };

    try {
      const res = await fetch(`/api/superadmin/companies/${companyId}/dian`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="bg-white rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Configuración DIAN
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {dianConfig ? "Configurada" : "Sin configurar"} ·{" "}
            {dianConfig?.testMode ? "Ambiente de pruebas" : "Producción"}
          </p>
        </div>
        <span className="text-gray-400 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t space-y-4 pt-4">
          {/* Resolución */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Resolución de facturación
            </p>
            <div className="grid grid-cols-2 gap-3">
              <F label="N° de resolución">
                <input value={form.resolutionNumber} onChange={change("resolutionNumber")} className="input" placeholder="18760000001" />
              </F>
              <F label="Prefijo">
                <input value={form.prefix} onChange={change("prefix")} className="input" placeholder="FV" />
              </F>
              <F label="Rango desde">
                <input value={form.fromNumber} onChange={change("fromNumber")} className="input" type="number" placeholder="1" />
              </F>
              <F label="Rango hasta">
                <input value={form.toNumber} onChange={change("toNumber")} className="input" type="number" placeholder="5000" />
              </F>
              <F label="Fecha inicio vigencia">
                <input value={form.resolutionDate} onChange={change("resolutionDate")} className="input" type="date" />
              </F>
              <F label="Fecha fin vigencia">
                <input value={form.endDate} onChange={change("endDate")} className="input" type="date" />
              </F>
            </div>
          </div>

          {/* Actividad económica */}
          <F label="Código CIIU (actividad económica)">
            <input value={form.economicActivity} onChange={change("economicActivity")} className="input" placeholder="4649" />
          </F>

          {/* Credenciales API */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Credenciales API DIAN
            </p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Token API DIAN" className="col-span-2">
                <input value={form.apiToken} onChange={change("apiToken")} className="input font-mono text-xs" placeholder="eyJ..." />
              </F>
              <F label="ID usuario de pruebas">
                <input value={form.testUserId} onChange={change("testUserId")} className="input" placeholder="900123456" />
              </F>
              <F label="Software ID">
                <input value={form.softwareId} onChange={change("softwareId")} className="input" />
              </F>
              <F label="Software PIN">
                <input value={form.softwarePin} onChange={change("softwarePin")} className="input" type="password" />
              </F>
              <F label="Ambiente">
                <select value={form.testMode ? "test" : "prod"} onChange={(e) => setForm((p) => ({ ...p, testMode: e.target.value === "test" }))} className="input">
                  <option value="test">Pruebas (habilitación)</option>
                  <option value="prod">Producción</option>
                </select>
              </F>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              ✓ Configuración DIAN guardada
            </p>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2">
            {saving ? "Guardando..." : "Guardar configuración DIAN"}
          </button>
        </div>
      )}
    </div>
  );
}

function F({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
