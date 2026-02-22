"use client";

import { signOut } from "next-auth/react";

export function SuperAdminLogout() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-1 text-xs text-gray-400 hover:text-white transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
