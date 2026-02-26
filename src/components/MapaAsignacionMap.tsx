"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Iconos con DivIcon (sin URLs externas, siempre funcionan) ───────────────

function makeDotIcon(color: string, size: number, ring = false) {
  // Combinar box-shadow en una sola declaración para evitar que se sobreescriba
  const shadow = ring
    ? `0 0 0 3px white, 0 0 0 5px ${color}, 0 2px 6px rgba(0,0,0,0.35)`
    : `0 2px 6px rgba(0,0,0,0.35)`;
  return new L.DivIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid rgba(255,255,255,0.95);border-radius:50%;box-shadow:${shadow};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// Clientes de fondo (fuera del radio) — círculo gris pequeño
const ICON_GREY = makeDotIcon("#9ca3af", 10);
// Dentro del radio, sin asignar — círculo rojo
const ICON_UNASSIGNED = makeDotIcon("#ef4444", 16);
// Dentro del radio, asignado — círculo verde
const ICON_ASSIGNED = makeDotIcon("#22c55e", 16);
// Seleccionado — círculo azul con anillo
const ICON_SELECTED = makeDotIcon("#3b82f6", 18, true);

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  assignedVendorId: string | null;
  vendorName: string | null;
  distanceKm: number;
}

interface AllCustomer {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  // /api/customers devuelve objeto, no solo el ID
  assignedVendor: { id: string; name: string } | null;
}

interface Props {
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  customers: Customer[];
  allCustomers: AllCustomer[];
  selectedCustomers: Set<string>;
  flyToCoords: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onCustomerClick: (id: string) => void;
  focusedCustomerId?: string | null;
}

// ─── Subcomponentes internos ─────────────────────────────────────────────────

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ flyToCoords }: { flyToCoords: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!flyToCoords) return;
    map.flyTo([flyToCoords.lat, flyToCoords.lng], 13, { animate: true, duration: 1.2 });
  }, [flyToCoords, map]);
  return null;
}

// ─── Componente principal ────────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];

export default function MapaAsignacionMap({
  center,
  radiusKm,
  customers,
  allCustomers,
  selectedCustomers,
  flyToCoords,
  onMapClick,
  onCustomerClick,
  focusedCustomerId,
}: Props) {
  const customersInRadius = new Set(customers.map((c) => c.id));
  const backgroundCustomers = allCustomers.filter((c) => !customersInRadius.has(c.id));

  return (
    <MapContainer
      center={center ? [center.lat, center.lng] : DEFAULT_CENTER}
      zoom={12}
      style={{ height: "100%", width: "100%", minHeight: 480 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />
      <MapController flyToCoords={flyToCoords} />

      {/* Círculo de radio — redondo y transparente */}
      {center && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            weight: 2,
          }}
        />
      )}

      {/* Marcadores grises — todos los clientes fuera del radio */}
      {backgroundCustomers.map((c) => (
        <Marker
          key={`bg-${c.id}`}
          position={[c.lat, c.lng]}
          icon={ICON_GREY}
        >
          <Popup>
            <p className="font-semibold text-sm">{c.name}</p>
            {c.address && <p className="text-xs text-gray-500">{c.address}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {c.assignedVendor ? `✓ ${c.assignedVendor.name}` : "Sin asignar"}
            </p>
          </Popup>
        </Marker>
      ))}

      {/* Marcadores coloreados — clientes dentro del radio */}
      {customers.map((c) => {
        const isSelected = selectedCustomers.has(c.id);
        const isAssigned = !!c.assignedVendorId;
        const isFocused = focusedCustomerId === c.id;
        // Focused overrides selected for icon (bigger ring)
        const icon = isFocused
          ? makeDotIcon("#f59e0b", 22, true)
          : isSelected
          ? ICON_SELECTED
          : isAssigned
          ? ICON_ASSIGNED
          : ICON_UNASSIGNED;

        return (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={icon}
            eventHandlers={{ click: () => onCustomerClick(c.id) }}
          >
            <Popup>
              <div className="text-sm space-y-0.5">
                <p className="font-semibold">{c.name}</p>
                {c.address && <p className="text-xs text-gray-500">{c.address}</p>}
                <p className="text-xs text-blue-600">{c.distanceKm.toFixed(2)} km del centro</p>
                {c.vendorName && (
                  <p className="text-xs text-green-600">Asignado a: {c.vendorName}</p>
                )}
                <button
                  onClick={() => onCustomerClick(c.id)}
                  className="mt-1 text-xs text-brand-600 underline block"
                >
                  {isSelected ? "Deseleccionar" : "Seleccionar"}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
