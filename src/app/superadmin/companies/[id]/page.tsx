import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SubscriptionPanel } from "./SubscriptionPanel";
import { DianPanel } from "./DianPanel";

export const metadata = { title: "Empresa · Super Admin" };

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const { id } = await params;
  const [company, plans] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        dianConfig: true,
        users: {
          where: { role: "ADMIN" },
          select: { id: true, name: true, email: true },
        },
        _count: { select: { users: true, customers: true, orders: true } },
      },
    }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } }),
  ]);

  if (!company) notFound();

  // Serializar Decimal → number para pasar a componentes cliente
  const serializedPlans = plans.map((p) => ({ ...p, price: Number(p.price) }));
  const serializedSubscription = company.subscription
    ? {
        ...company.subscription,
        plan: { ...company.subscription.plan, price: Number(company.subscription.plan.price) },
      }
    : null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/superadmin" className="hover:text-gray-800">Empresas</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium">{company.name}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
        {company.nit && <p className="text-gray-500 text-sm">NIT {company.nit}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Usuarios",  value: company._count.users },
          { label: "Clientes",  value: company._count.customers },
          { label: "Órdenes",   value: company._count.orders },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Admin de la empresa */}
      {company.users.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Administrador</h2>
          {company.users.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-brand-700 font-bold text-sm">
                  {u.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Datos fiscales de la empresa (solo lectura) */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Datos fiscales</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ["Razón social",       company.legalName],
            ["Nombre comercial",   company.tradeName],
            ["NIT",                company.nit],
            ["Régimen tributario", company.taxRegime],
            ["Actividad económica",company.economicActivity],
            ["Correo",             company.email],
            ["Teléfono",           company.phone],
            ["Dirección",          company.address],
            ["Ciudad",             company.city],
            ["Departamento",       company.department],
            ["Código postal",      company.postalCode],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-gray-900 font-medium">{value ?? <span className="text-gray-300">—</span>}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Panel suscripción */}
      <SubscriptionPanel
        companyId={id}
        subscription={serializedSubscription}
        plans={serializedPlans}
      />

      {/* Panel DIAN */}
      <DianPanel
        companyId={id}
        dianConfig={company.dianConfig}
      />
    </div>
  );
}
