"use client";

import { useState } from "react";
import Link from "next/link";
import { ColdBadge } from "./ColdBadge";

type ColdStatus = "HOT" | "WARM" | "COLD" | "FROZEN";

interface Customer {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  address: string | null;
  lastVisitAt: string | null;
  coldStatus: ColdStatus;
  daysSinceVisit: number | null;
  assignedVendor: { id: string; name: string } | null;
}

const STATUS_FILTERS: { value: ColdStatus | "ALL"; label: string }[] = [
  { value: "ALL",    label: "Todos" },
  { value: "FROZEN", label: "🔴 Sin visita" },
  { value: "COLD",   label: "🟠 Fríos" },
  { value: "WARM",   label: "🟡 Tibios" },
  { value: "HOT",    label: "🟢 Al día" },
];

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<ColdStatus | "ALL">("ALL");

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.ownerName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || c.coldStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o dueño..."
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === f.value
                  ? "bg-brand-800 text-white border-brand-800"
                  : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {search || filter !== "ALL"
              ? "No hay clientes con ese filtro"
              : "Aún no hay clientes registrados"}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Negocio</th>
                <th className="table-th hidden md:table-cell">Vendedor</th>
                <th className="table-th hidden lg:table-cell">Teléfono</th>
                <th className="table-th">Última visita</th>
                <th className="table-th">Estado</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    {c.ownerName && (
                      <p className="text-xs text-gray-400">{c.ownerName}</p>
                    )}
                  </td>
                  <td className="table-td hidden md:table-cell text-gray-500">
                    {c.assignedVendor?.name ?? "—"}
                  </td>
                  <td className="table-td hidden lg:table-cell text-gray-500">
                    {c.phone ?? "—"}
                  </td>
                  <td className="table-td">
                    {c.lastVisitAt ? (
                      new Date(c.lastVisitAt).toLocaleDateString("es-CO")
                    ) : (
                      <span className="text-gray-400 italic">Nunca</span>
                    )}
                  </td>
                  <td className="table-td">
                    <ColdBadge status={c.coldStatus} days={c.daysSinceVisit} />
                  </td>
                  <td className="table-td text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-brand-700 hover:underline text-sm font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contador de resultados */}
      {(search || filter !== "ALL") && (
        <p className="text-sm text-gray-400">
          Mostrando {filtered.length} de {customers.length} clientes
        </p>
      )}
    </>
  );
}
