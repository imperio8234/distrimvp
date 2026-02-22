"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  phone: string | null;
  nit: string | null;
  legalName: string | null;
  tradeName: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  postalCode: string | null;
  email: string | null;
  taxRegime: string | null;
  economicActivity: string | null;
}

export function CompanyForm({ company }: { company: Company }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name:             company.name,
    phone:            company.phone ?? "",
    nit:              company.nit ?? "",
    legalName:        company.legalName ?? "",
    tradeName:        company.tradeName ?? "",
    address:          company.address ?? "",
    city:             company.city ?? "",
    department:       company.department ?? "",
    postalCode:       company.postalCode ?? "",
    email:            company.email ?? "",
    taxRegime:        company.taxRegime ?? "",
    economicActivity: company.economicActivity ?? "",
  });

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSaved(false);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone:            form.phone || undefined,
          nit:              form.nit || undefined,
          legalName:        form.legalName || undefined,
          tradeName:        form.tradeName || undefined,
          address:          form.address || undefined,
          city:             form.city || undefined,
          department:       form.department || undefined,
          postalCode:       form.postalCode || undefined,
          email:            form.email || undefined,
          taxRegime:        form.taxRegime || undefined,
          economicActivity: form.economicActivity || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      setSaved(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info básica */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b">
          Información básica
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre comercial *" className="col-span-2">
            <input
              value={form.name}
              onChange={handleChange("name")}
              required
              className="input"
              placeholder="Distribuidora El Progreso"
            />
          </Field>
          <Field label="Nombre de marca">
            <input
              value={form.tradeName}
              onChange={handleChange("tradeName")}
              className="input"
              placeholder="El Progreso"
            />
          </Field>
          <Field label="Teléfono">
            <input
              value={form.phone}
              onChange={handleChange("phone")}
              className="input"
              placeholder="310 500 1234"
            />
          </Field>
        </div>
      </section>

      {/* Datos fiscales */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b">
          Datos fiscales
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="NIT (con dígito verificador)">
            <input
              value={form.nit}
              onChange={handleChange("nit")}
              className="input"
              placeholder="900.123.456-7"
            />
          </Field>
          <Field label="Razón social">
            <input
              value={form.legalName}
              onChange={handleChange("legalName")}
              className="input"
              placeholder="Distribuidora El Progreso S.A.S."
            />
          </Field>
          <Field label="Régimen tributario">
            <select
              value={form.taxRegime}
              onChange={handleChange("taxRegime")}
              className="input"
            >
              <option value="">— Seleccionar —</option>
              <option value="Responsable de IVA">Responsable de IVA</option>
              <option value="No responsable de IVA">No responsable de IVA</option>
              <option value="Gran contribuyente">Gran contribuyente</option>
              <option value="Régimen simple de tributación">Régimen simple de tributación</option>
            </select>
          </Field>
          <Field label="Código CIIU (actividad económica)">
            <input
              value={form.economicActivity}
              onChange={handleChange("economicActivity")}
              className="input"
              placeholder="4649"
            />
          </Field>
          <Field label="Correo de facturación">
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              className="input"
              placeholder="facturacion@empresa.co"
            />
          </Field>
        </div>
      </section>

      {/* Dirección */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b">
          Dirección fiscal
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dirección" className="col-span-2">
            <input
              value={form.address}
              onChange={handleChange("address")}
              className="input"
              placeholder="Cra 7 #45-10, Chapinero"
            />
          </Field>
          <Field label="Ciudad">
            <input
              value={form.city}
              onChange={handleChange("city")}
              className="input"
              placeholder="Bogotá"
            />
          </Field>
          <Field label="Departamento">
            <input
              value={form.department}
              onChange={handleChange("department")}
              className="input"
              placeholder="Cundinamarca"
            />
          </Field>
          <Field label="Código postal">
            <input
              value={form.postalCode}
              onChange={handleChange("postalCode")}
              className="input"
              placeholder="110231"
            />
          </Field>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          ✓ Cambios guardados correctamente
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full py-2.5"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function Field({
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
