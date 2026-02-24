"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard",        label: "Panel",            icon: "📊" },
  { href: "/customers",        label: "Clientes",         icon: "👥" },
  { href: "/vendors",          label: "Vendedores",       icon: "🧑‍💼" },
  { href: "/pedidos",          label: "Pedidos",          icon: "📦" },
  { href: "/entregas",         label: "Entregas",         icon: "🚚" },
  { href: "/mapa-asignacion",  label: "Mapa asignación",  icon: "🗺️" },
  { href: "/rendimiento",      label: "Rendimiento",      icon: "📈" },
  { href: "/ubicacion-equipo", label: "Ubicación equipo", icon: "📡" },
  { href: "/users",            label: "Usuarios",         icon: "👤" },
  { href: "/settings",         label: "Configuración",    icon: "⚙️" },
];

interface Props {
  userName: string;
  companyName: string;
}

export function Sidebar({ userName, companyName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-brand-800 flex flex-col text-white shrink-0">
      {/* Marca */}
      <div className="px-6 py-6 border-b border-brand-700">
        <p className="text-xl font-bold">DistriApp</p>
        <p className="text-brand-100 text-xs mt-0.5 truncate">{companyName}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white/20 text-white"
                  : "text-brand-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario + logout */}
      <div className="px-4 py-4 border-t border-brand-700">
        <p className="text-sm font-medium text-white truncate">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 text-xs text-brand-200 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
