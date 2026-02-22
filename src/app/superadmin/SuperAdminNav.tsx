"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/superadmin",         label: "Empresas",  icon: "🏢" },
  { href: "/superadmin/plans",   label: "Planes",    icon: "📋" },
];

export function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV.map(({ href, label, icon }) => {
        const active = href === "/superadmin"
          ? pathname === "/superadmin"
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
