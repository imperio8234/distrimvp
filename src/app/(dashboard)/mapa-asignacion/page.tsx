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

interface AllCustomer {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  // /api/customers devuelve el objeto completo, no solo el ID
  assignedVendor: { id: string; name: string } | null;
}

interface CityGroup {
  key: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
}

interface Vendor {
  id: string;
  name: string;
  role: "VENDOR" | "DELIVERY";
}

/**
 * Agrupa clientes por proximidad geográfica (grid de 0.1°≈11 km)
 * y les da nombre extrayendo la ciudad de la dirección si la tiene.
 * Si no hay ciudad en la dirección, usa "Zona N".
 */
function buildCityGroups(customers: AllCustomer[]): CityGroup[] {
  const grid = new Map<string, { lats: number[]; lngs: number[]; addresses: string[] }>();

  for (const c of customers) {
    // Celda de ~11 km × ~11 km
    const gLat = Math.round(c.lat * 10) / 10;
    const gLng = Math.round(c.lng * 10) / 10;
    const key = `${gLat},${gLng}`;

    if (!grid.has(key)) grid.set(key, { lats: [], lngs: [], addresses: [] });
    const g = grid.get(key)!;
    g.lats.push(c.lat);
    g.lngs.push(c.lng);
    if (c.address) g.addresses.push(c.address);
  }

  let zone = 1;
  const groups: CityGroup[] = [];

  for (const [key, g] of grid.entries()) {
    const avgLat = g.lats.reduce((a, b) => a + b, 0) / g.lats.length;
    const avgLng = g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length;

    // Intentar extraer ciudad de las direcciones del grupo (última parte tras coma)
    const freq = new Map<string, number>();
    for (const addr of g.addresses) {
      const parts = addr.split(",");
      if (parts.length > 1) {
        const city = parts[parts.length - 1].trim();
        if (city.length > 1) freq.set(city, (freq.get(city) ?? 0) + 1);
      }
    }

    const label =
      freq.size > 0
        ? [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : `Zona ${zone++}`;

    groups.push({ key, label, lat: avgLat, lng: avgLng, count: g.lats.length });
  }

  return groups.sort((a, b) => b.count - a.count);
}

export default function MapaAsignacionPage() {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [customers, setCustomers] = useState<NearbyCustomer[]>([]);
  const [allCustomers, setAllCustomers] = useState<AllCustomer[]>([]);
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([]);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [assignMode, setAssignMode] = useState<"vendor" | "delivery">("vendor");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [focusedCustomerId, setFocusedCustomerId] = useState<string | null>(null);

  // Cargar TODOS los clientes al montar — se muestran en el mapa como fondo
  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        const all: AllCustomer[] = (d.data ?? []).filter(
          (c: any) => c.lat && c.lng && c.lat !== 0 && c.lng !== 0
        );
        setAllCustomers(all);
        setCityGroups(buildCityGroups(all));
      })
      .catch(console.error);
  }, []);

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
      setFocusedCustomerId(null);
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

  function handleCityClick(city: CityGroup) {
    setFlyToCoords({ lat: city.lat, lng: city.lng });
    setCenter({ lat: city.lat, lng: city.lng });
    // Asegurar que el radio cubra el cluster (~11 km de diámetro → 12 km mínimo)
    setRadiusKm((prev) => Math.max(prev, 12));
  }

  return (
    <div className="space-y-4 h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asignación por radio</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecciona una ciudad o haz clic en el mapa para fijar el centro, ajusta el radio y asigna clientes masivamente.
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
          <p className="text-xs text-gray-400 italic">
            Selecciona una ciudad o haz clic en el mapa para fijar el centro
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 520 }}>
        {/* Mapa */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: 480 }}>
          <MapaAsignacionMap
            center={center}
            radiusKm={radiusKm}
            customers={customers}
            allCustomers={allCustomers}
            selectedCustomers={selectedCustomers}
            flyToCoords={flyToCoords}
            focusedCustomerId={focusedCustomerId}
            onMapClick={handleMapClick}
            onCustomerClick={(id) => toggleCustomer(id)}
          />
        </div>

        {/* Panel lateral */}
        <div className="flex flex-col gap-4">

          {/* Lista de ciudades con clientes */}
          {cityGroups.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Ciudades con clientes</span>
                <span className="text-xs text-gray-400 font-normal">({cityGroups.length})</span>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-40">
                {cityGroups.map((city) => (
                  <button
                    key={city.key}
                    onClick={() => handleCityClick(city)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-brand-50 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700">
                        {city.label}
                      </p>
                      <p className="text-xs text-gray-400">{city.count} cliente(s)</p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 group-hover:text-brand-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de clientes en radio */}
          <div className="card p-0 overflow-hidden flex-1">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-2">
              {/* Título y contador */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Clientes en radio{" "}
                  {loading ? (
                    <span className="text-gray-400 font-normal">(cargando…)</span>
                  ) : (
                    <span className="text-gray-400 font-normal">({customers.length})</span>
                  )}
                </span>
                {selectedCustomers.size > 0 && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                    {selectedCustomers.size} seleccionado(s)
                  </span>
                )}
              </div>
              {/* Botones de selección rápida */}
              {customers.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={toggleAll}
                    className="flex-1 text-xs py-1 px-2 rounded border border-gray-300 text-gray-600 hover:border-brand-500 hover:text-brand-700 transition-colors"
                  >
                    {selectedCustomers.size === customers.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                  {selectedCustomers.size > 0 && (
                    <button
                      onClick={() => setSelectedCustomers(new Set())}
                      className="text-xs py-1 px-2 rounded border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              )}
            </div>

            {!center ? (
              <p className="p-6 text-center text-gray-400 text-sm italic">
                Selecciona una ciudad o haz clic en el mapa para ver clientes del área.
              </p>
            ) : customers.length === 0 && !loading ? (
              <p className="p-6 text-center text-gray-400 text-sm italic">
                No hay clientes en este radio.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-56">
                {customers.map((c) => {
                  const isFocused = focusedCustomerId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-2 px-3 py-2.5 transition-colors ${
                        isFocused
                          ? "bg-amber-50 border-l-2 border-amber-400"
                          : selectedCustomers.has(c.id)
                          ? "bg-brand-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Checkbox — solo selecciona */}
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(c.id)}
                        onChange={() => toggleCustomer(c.id)}
                        className="mt-1 rounded border-gray-300 text-brand-600 cursor-pointer flex-shrink-0"
                      />
                      {/* Nombre — clic vuela al marcador en el mapa */}
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => {
                          setFlyToCoords({ lat: c.lat, lng: c.lng });
                          setFocusedCustomerId(isFocused ? null : c.id);
                        }}
                      >
                        <p className="text-sm font-medium text-gray-800 truncate hover:text-brand-700">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.distanceKm.toFixed(2)} km
                          {c.vendorName && (
                            <span className="ml-2 text-blue-500">→ {c.vendorName}</span>
                          )}
                        </p>
                      </button>
                    </div>
                  );
                })}
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
