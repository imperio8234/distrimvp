"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";

interface Props {
  companyId: string;
}

/**
 * Componente cliente que escucha cambios en pedidos vía Supabase Realtime.
 * Cuando detecta un INSERT o UPDATE en la tabla 'orders', llama a router.refresh()
 * para que el Server Component vuelva a cargar los datos actualizados.
 */
export function PedidosRealtimeRefresh({ companyId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabaseClient
      .channel(`orders:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [companyId, router]);

  return null;
}
