"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TeamMember } from "@/app/(dashboard)/ubicacion-equipo/page";

// Fix default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const VENDOR_ICON = new L.DivIcon({
  html: '<div style="background:#3b82f6;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25)">🧑‍💼</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const DELIVERY_ICON = new L.DivIcon({
  html: '<div style="background:#f97316;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25)">🏍️</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function isActive(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

// Helper para centrar el mapa en el miembro seleccionado
function MapFocus({ members, selectedMember }: { members: TeamMember[]; selectedMember: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedMember) return;
    const m = members.find((x) => x.id === selectedMember);
    if (m?.lastLat && m?.lastLng) {
      map.flyTo([m.lastLat, m.lastLng], 15, { animate: true, duration: 0.8 });
    }
  }, [selectedMember, members, map]);
  return null;
}

// Bogotá como posición por defecto
const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];

interface Props {
  members: TeamMember[];
  selectedMember: string | null;
}

export default function TeamLocationMap({ members, selectedMember }: Props) {
  const mapCenter: [number, number] =
    members.length > 0 && members[0].lastLat && members[0].lastLng
      ? [members[0].lastLat, members[0].lastLng]
      : DEFAULT_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={12}
      style={{ height: "100%", width: "100%", minHeight: 500 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocus members={members} selectedMember={selectedMember} />

      {members.map((m) => {
        if (m.lastLat == null || m.lastLng == null) return null;
        const active = isActive(m.lastSeenAt);
        const icon = m.role === "VENDOR" ? VENDOR_ICON : DELIVERY_ICON;

        return (
          <Marker key={m.id} position={[m.lastLat, m.lastLng]} icon={icon}>
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold text-gray-800">{m.name}</p>
                <p className="text-gray-500 text-xs">{m.role === "VENDOR" ? "Vendedor" : "Repartidor"}</p>
                <p
                  className={`text-xs mt-1 font-medium ${active ? "text-green-600" : "text-gray-400"}`}
                >
                  {active ? "● ACTIVO" : "○ INACTIVO"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Últ. reporte: {timeAgo(m.lastSeenAt)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
