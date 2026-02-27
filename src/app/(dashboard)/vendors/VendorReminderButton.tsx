"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

interface Props {
  vendorId: string;
}

export function VendorReminderButton({ vendorId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/remind-visit`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo enviar el recordatorio.");
      }
      setMessage("Recordatorio enviado al vendedor desde la app móvil.");
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al enviar el recordatorio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Bell className="h-4 w-4" />
        {loading ? "Enviando recordatorio…" : "Enviar recordatorio de visita"}
      </button>
      {message && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-1">
          {message}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-1">
          {error}
        </p>
      )}
    </div>
  );
}

