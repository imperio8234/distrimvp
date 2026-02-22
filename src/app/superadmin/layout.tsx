import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SuperAdminNav } from "./SuperAdminNav";
import { SuperAdminLogout } from "./SuperAdminLogout";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-gray-900 flex flex-col text-white shrink-0">
        <div className="px-5 py-6 border-b border-gray-700">
          <p className="text-lg font-bold text-white">DistriApp</p>
          <p className="text-xs text-gray-400 mt-0.5">Super Admin</p>
        </div>

        <SuperAdminNav />

        <div className="px-4 py-4 border-t border-gray-700 mt-auto">
          <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
          <SuperAdminLogout />
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
