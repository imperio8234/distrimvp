import type { Role, VisitResult, OrderStatus, DeliveryStatus } from "@prisma/client";

// Re-exporta enums de Prisma para uso en el cliente
export type { Role, VisitResult, OrderStatus, DeliveryStatus };

// Colores del panel de cliente frío según días sin visita
export type ColdStatus = "HOT" | "WARM" | "COLD" | "FROZEN";

export function getColdStatus(lastVisitAt: Date | null): ColdStatus {
  if (!lastVisitAt) return "FROZEN";
  const days = Math.floor((Date.now() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 3) return "HOT";
  if (days <= 7) return "WARM";
  if (days <= 14) return "COLD";
  return "FROZEN";
}

export const COLD_STATUS_LABELS: Record<ColdStatus, { label: string; days: string; color: string }> = {
  HOT:    { label: "Verde",    days: "0-3 días",   color: "#22c55e" },
  WARM:   { label: "Amarillo", days: "4-7 días",   color: "#eab308" },
  COLD:   { label: "Naranja",  days: "8-14 días",  color: "#f97316" },
  FROZEN: { label: "Rojo",     days: "15+ días",   color: "#ef4444" },
};

// Tipos de respuesta de la API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// Tipos extendidos para las vistas
export interface CustomerWithStatus {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  address: string | null;
  lat: number;
  lng: number;
  photoUrl: string | null;
  lastVisitAt: Date | null;
  coldStatus: ColdStatus;
  daysSinceVisit: number;
  assignedVendor: { id: string; name: string } | null;
}

export interface DashboardStats {
  totalCustomers: number;
  frozenCustomers: number; // +15 días sin visita
  coldCustomers: number;   // 8-14 días
  warmCustomers: number;   // 4-7 días
  hotCustomers: number;    // 0-3 días
  pendingOrders: number;
  todayVisits: number;
  monthRevenue: number;
}
