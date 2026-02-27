import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { ColdBadge } from "@/components/ui/ColdBadge";
import { OnboardingCard } from "@/components/OnboardingCard";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(date: Date | null) {
  if (!date) return 999;
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

function coldStatus(days: number): "HOT" | "WARM" | "COLD" | "FROZEN" {
  if (days <= 3) return "HOT";
  if (days <= 7) return "WARM";
  if (days <= 14) return "COLD";
  return "FROZEN";
}

async function getDashboardData(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [customers, pendingOrders, todayVisits, monthRevenue, vendorCount] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId, active: true },
      select: {
        id: true,
        name: true,
        phone: true,
        lastVisitAt: true,
        assignedVendor: { select: { name: true } },
      },
      orderBy: { lastVisitAt: "asc" },
    }),
    prisma.order.count({ where: { companyId, status: { in: ["PENDING_REVIEW", "PENDING"] } } }),
    prisma.visit.count({
      where: { customer: { companyId }, visitedAt: { gte: startOfToday } },
    }),
    prisma.order.aggregate({
      where: {
        companyId,
        status: { in: ["DELIVERED", "IN_DELIVERY"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { companyId, role: "VENDOR", active: true } }),
  ]);

  const withStatus = customers.map((c) => {
    const days = daysSince(c.lastVisitAt);
    return { ...c, days: days === 999 ? null : days, status: coldStatus(days) };
  });

  return {
    customers: withStatus,
    pendingOrders,
    todayVisits,
    monthRevenue: Number(monthRevenue._sum.amount ?? 0),
    vendorCount,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const { customers, pendingOrders, todayVisits, monthRevenue, vendorCount } =
    await getDashboardData(session!.user.companyId!);

  const frozen  = customers.filter((c) => c.status === "FROZEN");
  const cold    = customers.filter((c) => c.status === "COLD");
  const warm    = customers.filter((c) => c.status === "WARM");
  const hot     = customers.filter((c) => c.status === "HOT");

  const revenueFormatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(monthRevenue);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Onboarding: primeros pasos si la cuenta está recién creada */}
      <OnboardingCard
        customerCount={customers.length}
        vendorCount={vendorCount}
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Clientes activos"
          value={customers.length}
          accent="blue"
        />
        <StatCard
          label="Pedidos pendientes"
          value={pendingOrders}
          sub="por entregar"
          accent={pendingOrders > 5 ? "orange" : "green"}
        />
        <StatCard
          label="Visitas hoy"
          value={todayVisits}
          accent="green"
        />
        <StatCard
          label="Ingresos del mes"
          value={revenueFormatted}
          accent="blue"
        />
      </div>

      {/* Panel semáforo de clientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Estado de la cartera de clientes
          </h2>
          <Link href="/customers" className="text-sm text-brand-700 hover:underline">
            Ver todos →
          </Link>
        </div>

        <div className="space-y-4">
          {/* FROZEN — rojo */}
          <CustomerGroup
            status="FROZEN"
            title="🔴 Sin visita (15+ días)"
            customers={frozen}
            emptyMsg="No hay clientes en esta categoría"
          />

          {/* COLD — naranja */}
          <CustomerGroup
            status="COLD"
            title="🟠 Visita necesaria pronto (8–14 días)"
            customers={cold}
            emptyMsg="No hay clientes en esta categoría"
          />

          {/* WARM — amarillo */}
          <CustomerGroup
            status="WARM"
            title="🟡 Atentos (4–7 días)"
            customers={warm}
            emptyMsg="No hay clientes en esta categoría"
          />

          {/* HOT — verde */}
          <CustomerGroup
            status="HOT"
            title="🟢 Al día (0–3 días)"
            customers={hot}
            emptyMsg="Aún no hay clientes visitados recientemente"
          />
        </div>
      </div>
    </div>
  );
}

// ── Componente auxiliar de grupo ─────────────────────────────────
type Customer = {
  id: string;
  name: string;
  phone: string | null;
  days: number | null;
  status: "HOT" | "WARM" | "COLD" | "FROZEN";
  assignedVendor: { name: string } | null;
};

function CustomerGroup({
  status,
  title,
  customers,
  emptyMsg,
}: {
  status: "HOT" | "WARM" | "COLD" | "FROZEN";
  title: string;
  customers: Customer[];
  emptyMsg: string;
}) {
  const borderColor = {
    FROZEN: "border-red-200",
    COLD:   "border-orange-200",
    WARM:   "border-yellow-200",
    HOT:    "border-green-200",
  }[status];

  const headerBg = {
    FROZEN: "bg-red-50",
    COLD:   "bg-orange-50",
    WARM:   "bg-yellow-50",
    HOT:    "bg-green-50",
  }[status];

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <span className="font-semibold text-gray-700 text-sm">{title}</span>
        <span className="text-xs font-bold text-gray-500">
          {customers.length} cliente{customers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {customers.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400 italic">{emptyMsg}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.assignedVendor?.name ?? "Sin vendedor asignado"}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ColdBadge status={c.status} days={c.days} />
                <span className="text-gray-300 text-sm">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
