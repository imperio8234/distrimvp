"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"VENDOR" | "DELIVERY">("VENDOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setName(""); setEmail(""); setPassword(""); setRole("VENDOR"); setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el usuario");
      setLoading(false);
      return;
    }

    reset();
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-primary px-5 py-2.5" onClick={() => setOpen(true)}>
        + Nuevo usuario
      </button>
    );
  }

  return (
    <div className="card border border-brand-100">
      <h3 className="font-semibold text-gray-800 mb-4">Crear usuario</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan López"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo *
          </label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@empresa.co"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña * (mín. 6 caracteres)
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as "VENDOR" | "DELIVERY")}
          >
            <option value="VENDOR">Vendedor</option>
            <option value="DELIVERY">Repartidor</option>
          </select>
        </div>

        {error && (
          <p className="md:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="md:col-span-2 flex gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            onClick={() => { setOpen(false); reset(); }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-5 py-2.5 disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
