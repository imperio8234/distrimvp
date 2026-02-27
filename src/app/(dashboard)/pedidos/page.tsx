import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PedidosRealtimeRefresh } from "@/components/PedidosRealtimeRefresh";
import { PedidosTable } from "./PedidosTable";

export const metadata = { title: "Pedidos · DistriApp" };

type OrderStatus = "PENDING_REVIEW" | "PENDING" | "IN_DELIVERY" | "DELIVERED" | "CANCELLED";

const TABS = [
  { label: "Todos",          value: ""               },
  { label: "Por revisar",    value: "PENDING_REVIEW" },
  { label: "Pendientes",     value: "PENDING"        },
  { label: "En reparto",     value: "IN_DELIVERY"    },
  { label: "Entregados",     value: "DELIVERED"      },
  { label: "Cancelados",     value: "CANCELLED"      },
];

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style:                "currency",
    currency:             "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const { status: statusFilter } = await searchParams;

  const [ordersRaw, counts, deliveryPersons, subscription] = await Promise.all([
    prisma.order.findMany({
      where: {
        companyId,
        ...(statusFilter ? { status: statusFilter as OrderStatus } : {}),
      },
      include: {
        customer: {
          select: {
            id: true, name: true, address: true, phone: true,
            requiresInvoice: true,
            billingId: true, billingIdType: true, billingLegalOrg: true,
            billingTribute: true, billingMunicipalityId: true, billingEmail: true,
          },
        },
        visit:    { include: { vendor: { select: { name: true } } } },
        delivery: {
          include: { deliveryPerson: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.order.groupBy({
      by:    ["status"],
      where: { companyId },
      _count: true,
    }),
    prisma.user.findMany({
      where:   { companyId, role: "DELIVERY", active: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subscription.findUnique({
      where:   { companyId },
      include: { plan: { select: { dianEnabled: true } } },
    }),
  ]);

  const dianEnabled = subscription?.plan.dianEnabled ?? false;

  // Serializar: Decimal → number, Date → ISO string
  const orders = ordersRaw.map((o) => ({
    id:                  o.id,
    status:              o.status as OrderStatus,
    amount:              Number(o.amount),
    deliveryDate:        o.deliveryDate?.toISOString() ?? null,
    factusInvoiceId:     o.factusInvoiceId ?? null,
    factusInvoiceNumber: o.factusInvoiceNumber ?? null,
    customer: {
      id:                   o.customer.id,
      name:                 o.customer.name,
      address:              o.customer.address,
      phone:                o.customer.phone,
      requiresInvoice:      o.customer.requiresInvoice,
      billingId:            o.customer.billingId ?? null,
      billingIdType:        o.customer.billingIdType ?? "3",
      billingLegalOrg:      o.customer.billingLegalOrg ?? "2",
      billingTribute:       o.customer.billingTribute ?? "21",
      billingMunicipalityId: o.customer.billingMunicipalityId ?? null,
      billingEmail:         o.customer.billingEmail ?? null,
    },
    visit:               o.visit,
    delivery:            o.delivery
      ? {
          deliveryPersonId: o.delivery.deliveryPersonId,
          deliveryPerson:   o.delivery.deliveryPerson,
          status:           o.delivery.status as "PENDING" | "DELIVERED" | "FAILED",
          notes:            o.delivery.notes,
        }
      : null,
  }));

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const total    = counts.reduce((s, c) => s + c._count, 0);

  const totalAmount     = orders.reduce((s, o) => s + o.amount, 0);
  const deliveredAmount = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-6">
      {/* Realtime refresh cuando cambian órdenes/entregas */}
      <PedidosRealtimeRefresh companyId={companyId} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de todos los pedidos y su estado de entrega
        </p>
      </div>

      {/* Tabs con contadores */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((tab) => {
          const count  = tab.value ? (countMap[tab.value] ?? 0) : total;
          const active = (statusFilter ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/pedidos?status=${tab.value}` : "/pedidos"}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Tabla (client component con modal integrado) */}
      <PedidosTable orders={orders} deliveryPersons={deliveryPersons} dianEnabled={dianEnabled} />

      {/* Resumen de totales */}
      {orders.length > 0 && (
        <div className="flex gap-6 text-sm text-gray-500">
          <span>
            <strong className="text-gray-800">{orders.length}</strong> pedidos
          </span>
          <span>
            <strong suppressHydrationWarning className="text-gray-800">{cop(totalAmount)}</strong> total
          </span>
          {(statusFilter === "DELIVERED" || !statusFilter) && deliveredAmount > 0 && (
            <span>
              <strong suppressHydrationWarning className="text-green-700">{cop(deliveredAmount)}</strong>{" "}
              entregados
            </span>
          )}
        </div>
      )}
    </div>
  );
}
