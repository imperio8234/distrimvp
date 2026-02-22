import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "./CreateUserForm";
import { UserRow } from "./UserRow";

async function getUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
  });
}

export default async function UsersPage() {
  const session = await auth();
  const users = await getUsers(session!.user.companyId!);

  const activeVendors = users.filter((u) => u.role === "VENDOR" && u.active).length;
  const activeDelivery = users.filter((u) => u.role === "DELIVERY" && u.active).length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestiona el equipo de tu distribuidora
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Vendedores activos" value={activeVendors} />
        <StatCard label="Repartidores activos" value={activeDelivery} />
        <StatCard label="Total usuarios" value={users.length} />
      </div>

      {/* Formulario de creación */}
      <CreateUserForm />

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Equipo</h2>
        </div>
        {users.length === 0 ? (
          <p className="p-12 text-center text-gray-400">
            No hay usuarios registrados.
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Usuario</th>
                <th className="table-th">Rol</th>
                <th className="table-th text-center">Estado</th>
                <th className="table-th">Miembro desde</th>
                <th className="table-th text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card bg-brand-50 border border-brand-100">
      <p className="text-sm text-brand-700 font-medium">{label}</p>
      <p className="text-3xl font-bold text-brand-800 mt-1">{value}</p>
    </div>
  );
}
