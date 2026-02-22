import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Empresas · Super Admin" };

const STATUS_LABEL: Record<string, string> = {
  TRIAL:     "Prueba",
  ACTIVE:    "Activa",
  PAST_DUE:  "Vencida",
  CANCELLED: "Cancelada",
  SUSPENDED: "Suspendida",
};

const STATUS_COLOR: Record<string, string> = {
  TRIAL:     "bg-blue-100 text-blue-700",
  ACTIVE:    "bg-green-100 text-green-700",
  PAST_DUE:  "bg-amber-100 text-amber-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default async function SuperAdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { users: true, customers: true } },
    },
  });

  const stats = {
    total:     companies.length,
    active:    companies.filter((c) => c.subscription?.status === "ACTIVE").length,
    trial:     companies.filter((c) => c.subscription?.status === "TRIAL").length,
    pastDue:   companies.filter((c) => c.subscription?.status === "PAST_DUE").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión de todas las distribuidoras en la plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total",          value: stats.total,   color: "text-gray-800" },
          { label: "Activas",        value: stats.active,  color: "text-green-700" },
          { label: "En prueba",      value: stats.trial,   color: "text-blue-700" },
          { label: "Pago vencido",   value: stats.pastDue, color: "text-amber-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-5 py-3 font-semibold text-gray-600">Empresa</th>
              <th className="px-5 py-3 font-semibold text-gray-600">Plan</th>
              <th className="px-5 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-5 py-3 font-semibold text-gray-600">Usuarios</th>
              <th className="px-5 py-3 font-semibold text-gray-600">Clientes</th>
              <th className="px-5 py-3 font-semibold text-gray-600">Registro</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((company) => {
              const sub = company.subscription;
              const status = sub?.status ?? "—";
              return (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{company.name}</p>
                    {company.nit && (
                      <p className="text-xs text-gray-500">NIT {company.nit}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {sub?.plan.displayName ?? <span className="text-gray-400">Sin plan</span>}
                  </td>
                  <td className="px-5 py-3">
                    {sub ? (
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{company._count.users}</td>
                  <td className="px-5 py-3 text-gray-700">{company._count.customers}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {company.createdAt.toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/superadmin/companies/${company.id}`}
                      className="text-brand-600 hover:text-brand-800 font-medium text-xs"
                    >
                      Gestionar →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {companies.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                  No hay empresas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
