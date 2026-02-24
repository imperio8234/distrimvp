"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabase-client";

const TeamLocationMap = dynamic(() => import("@/components/TeamLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  ),
});

export interface TeamMember {
  id: string;
  name: string;
  role: "VENDOR" | "DELIVERY";
  lastLat: number | null;
  lastLng: number | null;
  lastSeenAt: string | null;
  active: boolean;
}

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

export default function UbicacionEquipoPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=field");
      const json = await res.json();
      setMembers(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();

    // Suscripción Supabase Realtime para actualizar ubicaciones en vivo
    // El canal escucha cambios en la tabla 'users' (UPDATE)
    const channel = supabaseClient
      .channel("team-locations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => {
          const updated = payload.new as any;
          if (!updated.id) return;
          setMembers((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? {
                    ...m,
                    lastLat: updated.last_lat ? parseFloat(updated.last_lat) : null,
                    lastLng: updated.last_lng ? parseFloat(updated.last_lng) : null,
                    lastSeenAt: updated.last_seen_at,
                  }
                : m
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [loadMembers]);

  const withLocation = members.filter((m) => m.lastLat != null && m.lastLng != null);
  const activeCount = withLocation.filter((m) => isActive(m.lastSeenAt)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubicación del equipo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Posición en tiempo real de vendedores y repartidores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">
            <strong>{activeCount}</strong> activos ahora ·{" "}
            <span className="text-gray-400">{members.length} total</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Mapa */}
        <div
          className="lg:col-span-3 rounded-xl overflow-hidden border border-gray-200"
          style={{ minHeight: 500 }}
        >
          <TeamLocationMap members={withLocation} selectedMember={selectedMember} />
        </div>

        {/* Lista de colaboradores */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 text-sm">Colaboradores</h2>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
            {members.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 italic text-center">No hay colaboradores.</p>
            ) : (
              members.map((m) => {
                const active = isActive(m.lastSeenAt);
                const hasLocation = m.lastLat != null && m.lastLng != null;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m.id === selectedMember ? null : m.id)}
                    className={`w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedMember === m.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <div className="relative mt-0.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          m.role === "VENDOR" ? "bg-blue-100" : "bg-orange-100"
                        }`}
                      >
                        {m.role === "VENDOR" ? "🧑‍💼" : "🏍️"}
                      </div>
                      {active && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400">
                        {m.role === "VENDOR" ? "Vendedor" : "Repartidor"}
                      </p>
                      <p
                        className={`text-xs mt-0.5 font-medium ${
                          active ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {active ? "● ACTIVO" : "○ INACTIVO"} ·{" "}
                        {hasLocation ? timeAgo(m.lastSeenAt) : "Sin ubicación"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {withLocation.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-gray-400 text-sm">
            Ningún colaborador ha compartido su ubicación aún. La app móvil reporta
            la posición automáticamente cuando están en ruta.
          </p>
        </div>
      )}
    </div>
  );
}
