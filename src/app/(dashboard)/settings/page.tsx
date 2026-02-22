import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CompanyForm } from "./CompanyForm";

export const metadata = { title: "Configuración · DistriApp" };

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  TRIAL:     { label: "Período de prueba",  color: "bg-blue-50 border-blue-200 text-blue-700" },
  ACTIVE:    { label: "Activa",             color: "bg-green-50 border-green-200 text-green-700" },
  PAST_DUE:  { label: "Pago vencido",       color: "bg-amber-50 border-amber-200 text-amber-700" },
  CANCELLED: { label: "Cancelada",          color: "bg-gray-50 border-gray-200 text-gray-600" },
  SUSPENDED: { label: "Suspendida",         color: "bg-red-50 border-red-200 text-red-700" },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId! },
    include: {
      subscription: { include: { plan: true } },
    },
  });

  if (!company) redirect("/login");

  const sub = company.subscription;
  const statusInfo = sub ? (STATUS_INFO[sub.status] ?? STATUS_INFO.ACTIVE) : null;

  // Días restantes del trial
  const trialDaysLeft = sub?.status === "TRIAL" && sub.trialEndsAt
    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">
          Datos de tu empresa. La información fiscal es requerida para facturación electrónica.
        </p>
      </div>

      {/* Plan actual */}
      {sub && statusInfo && (
        <div className={`border rounded-xl p-5 ${statusInfo.color}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">Plan actual</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-white/60 rounded-full">
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xl font-black">{sub.plan.displayName}</p>

              {sub.status === "TRIAL" && (
                <p className="text-sm mt-1">
                  {trialDaysLeft !== null && trialDaysLeft > 0
                    ? <>⏳ Te quedan <strong>{trialDaysLeft} días</strong> de prueba gratis (vence el {sub.trialEndsAt!.toLocaleDateString("es-CO")})</>
                    : <>⚠️ Tu período de prueba <strong>ha vencido</strong>. Contacta a DistriApp para activar tu plan.</>
                  }
                </p>
              )}

              {sub.status === "ACTIVE" && (
                <p className="text-sm mt-1">
                  ✓ Próximo cobro: <strong>{sub.currentPeriodEnd.toLocaleDateString("es-CO")}</strong>
                </p>
              )}

              {sub.status === "PAST_DUE" && (
                <p className="text-sm mt-1">
                  ⚠️ Tienes un pago pendiente. Contacta a DistriApp para regularizar tu cuenta.
                </p>
              )}

              {sub.status === "SUSPENDED" && (
                <p className="text-sm mt-1">
                  🚫 Tu cuenta está suspendida. Contacta a DistriApp para reactivarla.
                </p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black">
                {Number(sub.plan.price) === 0 ? "Gratis" : `$${Number(sub.plan.price).toLocaleString("es-CO")}`}
              </p>
              {Number(sub.plan.price) > 0 && (
                <p className="text-xs opacity-60">/ mes COP</p>
              )}
            </div>
          </div>

          {/* Resumen de límites del plan */}
          <div className="mt-4 pt-4 border-t border-current border-opacity-20 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="opacity-60">Vendedores</span>
              <p className="font-bold">{sub.plan.maxVendors === -1 ? "Ilimitados" : sub.plan.maxVendors}</p>
            </div>
            <div>
              <span className="opacity-60">Clientes</span>
              <p className="font-bold">{sub.plan.maxCustomers === -1 ? "Ilimitados" : sub.plan.maxCustomers.toLocaleString()}</p>
            </div>
            <div>
              <span className="opacity-60">Repartidores</span>
              <p className="font-bold">{sub.plan.maxDelivery === -1 ? "Ilimitados" : sub.plan.maxDelivery}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sin suscripción */}
      {!sub && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700">
          <p className="font-semibold">Sin plan asignado</p>
          <p className="text-sm mt-0.5">Contacta a DistriApp para activar tu suscripción.</p>
        </div>
      )}

      {/* Formulario de datos de empresa */}
      <CompanyForm company={company} />
    </div>
  );
}
