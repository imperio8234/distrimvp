"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SELECTED_ICON = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ASSIGNED_ICON = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

interface Props {
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  customers: Customer[];
  selectedCustomers: Set<string>;
  onMapClick: (lat: number, lng: number) => void;
  onCustomerClick: (id: string) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Bogotá como posición por defecto
const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];

export default function MapaAsignacionMap({
  center,
  radiusKm,
  customers,
  selectedCustomers,
  onMapClick,
  onCustomerClick,
}: Props) {
  return (
    <MapContainer
      center={center ? [center.lat, center.lng] : DEFAULT_CENTER}
      zoom={12}
      style={{ height: "100%", width: "100%", minHeight: 480 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />

      {/* Círculo de radio */}
      {center && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 2 }}
        />
      )}

      {/* Marcadores de clientes */}
      {customers.map((c) => {
        const isSelected = selectedCustomers.has(c.id);
        const isAssigned = !!c.assignedVendorId;
        const icon = isSelected ? SELECTED_ICON : isAssigned ? ASSIGNED_ICON : new L.Icon.Default();

        return (
          <Marker
            key={c.id}
            position={[c.lat, c.lng]}
            icon={icon}
            eventHandlers={{ click: () => onCustomerClick(c.id) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{c.name}</p>
                {c.address && <p className="text-gray-500 text-xs">{c.address}</p>}
                <p className="text-xs mt-1 text-blue-600">{c.distanceKm.toFixed(2)} km del centro</p>
                {c.vendorName && (
                  <p className="text-xs text-green-600">Asignado a: {c.vendorName}</p>
                )}
                <button
                  onClick={() => onCustomerClick(c.id)}
                  className="mt-1 text-xs text-brand-600 underline"
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
