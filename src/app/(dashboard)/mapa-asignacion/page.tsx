"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";

// Leaflet no funciona en SSR — se carga solo en el cliente
const MapaAsignacionMap = dynamic(() => import("@/components/MapaAsignacionMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  ),
});

interface NearbyCustomer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  assignedVendorId: string | null;
  vendorName: string | null;
  lastVisitAt: string | null;
  distanceKm: number;
}

interface Vendor {
  id: string;
  name: string;
  role: "VENDOR" | "DELIVERY";
}

export default function MapaAsignacionPage() {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [customers, setCustomers] = useState<NearbyCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [assignMode, setAssignMode] = useState<"vendor" | "delivery">("vendor");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Cargar vendedores/repartidores al iniciar
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        const all: Vendor[] = (d.data ?? []).filter(
          (u: any) => u.active && (u.role === "VENDOR" || u.role === "DELIVERY")
        );
        setVendors(all);
      })
      .catch(console.error);
  }, []);

  const loadNearby = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    try {
      const url = `/api/customers/nearby?lat=${center.lat}&lng=${center.lng}&radiusKm=${radiusKm}`;
      const res = await fetch(url);
      const json = await res.json();
      setCustomers(json.data ?? []);
      setSelectedCustomers(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [center, radiusKm]);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

  function handleMapClick(lat: number, lng: number) {
    setCenter({ lat, lng });
  }

  function toggleCustomer(id: string) {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map((c) => c.id)));
    }
  }

  const filteredVendors = vendors.filter((v) =>
    assignMode === "vendor" ? v.role === "VENDOR" : v.role === "DELIVERY"
  );

  async function handleAssign() {
    if (selectedCustomers.size === 0) {
      return setMessage({ type: "err", text: "Selecciona al menos un cliente." });
    }
    if (!selectedVendorId) {
      return setMessage({ type: "err", text: "Selecciona un destino." });
    }
    setAssigning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/customers/batch-assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: [...selectedCustomers],
          vendorId: selectedVendorId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al asignar");
      setMessage({ type: "ok", text: `✓ ${json.data.updated} cliente(s) asignados correctamente.` });
      setSelectedCustomers(new Set());
      await loadNearby();
    } catch (e: any) {
      setMessage({ type: "err", text: e.message });
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="space-y-4 h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asignación por radio</h1>
        <p className="text-gray-500 text-sm mt-1">
          Haz clic en el mapa para fijar el centro, ajusta el radio y asigna clientes masivamente.
        </p>
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

      {/* Control de radio */}
      <div className="card p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3 flex-1 min-w-48">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Radio: <strong>{radiusKm} km</strong>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="flex-1 accent-brand-600"
          />
        </div>
        {center && (
          <p className="text-xs text-gray-400">
            Centro: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </p>
        )}
        {!center && (
          <p className="text-xs text-gray-400 italic">Haz clic en el mapa para fijar el centro</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 520 }}>
        {/* Mapa */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: 480 }}>
          <MapaAsignacionMap
            center={center}
            radiusKm={radiusKm}
            customers={customers}
            selectedCustomers={selectedCustomers}
            onMapClick={handleMapClick}
            onCustomerClick={(id) => toggleCustomer(id)}
          />
        </div>

        {/* Panel lateral */}
        <div className="flex flex-col gap-4">
          {/* Lista de clientes en radio */}
          <div className="card p-0 overflow-hidden flex-1">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCustomers.size === customers.length && customers.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Clientes en radio{" "}
                  {loading ? (
                    <span className="text-gray-400">(cargando…)</span>
                  ) : (
                    <span className="text-gray-400 font-normal">({customers.length})</span>
                  )}
                </span>
              </div>
              {selectedCustomers.size > 0 && (
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  {selectedCustomers.size} sel.
                </span>
              )}
            </div>

            {!center ? (
              <p className="p-6 text-center text-gray-400 text-sm italic">
                Haz clic en el mapa para ver clientes del área.
              </p>
            ) : customers.length === 0 && !loading ? (
              <p className="p-6 text-center text-gray-400 text-sm italic">
                No hay clientes en este radio.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-72">
                {customers.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${
                      selectedCustomers.has(c.id) ? "bg-brand-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(c.id)}
                      onChange={() => toggleCustomer(c.id)}
                      className="mt-0.5 rounded border-gray-300 text-brand-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">
                        {c.distanceKm.toFixed(2)} km
                        {c.vendorName && (
                          <span className="ml-2 text-blue-500">→ {c.vendorName}</span>
                        )}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Panel de asignación */}
          <div className="card p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => { setAssignMode("vendor"); setSelectedVendorId(""); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  assignMode === "vendor"
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                Vendedor
              </button>
              <button
                onClick={() => { setAssignMode("delivery"); setSelectedVendorId(""); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  assignMode === "delivery"
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                Repartidor
              </button>
            </div>

            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar {assignMode === "vendor" ? "vendedor" : "repartidor"}…</option>
              {filteredVendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              disabled={assigning || selectedCustomers.size === 0 || !selectedVendorId}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {assigning
                ? "Asignando…"
                : selectedCustomers.size === 0
                ? "Selecciona clientes"
                : `Asignar ${selectedCustomers.size} cliente(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
