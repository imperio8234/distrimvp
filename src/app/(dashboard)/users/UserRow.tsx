"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_LABEL: Record<string, string> = {
  ADMIN:    "Administrador",
  VENDOR:   "Vendedor",
  DELIVERY: "Repartidor",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    "bg-purple-100 text-purple-700",
  VENDOR:   "bg-brand-100 text-brand-700",
  DELIVERY: "bg-amber-100 text-amber-700",
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export function UserRow({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${!user.active ? "opacity-50" : ""}`}>
      <td className="table-td">
        <p className="font-semibold text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </td>
      <td className="table-td">
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR[user.role] ?? "bg-gray-100 text-gray-600"}`}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </span>
      </td>
      <td className="table-td text-center">
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            user.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {user.active ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="table-td text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="table-td text-center">
        {user.role !== "ADMIN" && (
          <button
            onClick={toggleActive}
            disabled={loading}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
              user.active
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {loading ? "..." : user.active ? "Desactivar" : "Activar"}
          </button>
        )}
      </td>
    </tr>
  );
}
