import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con service_role — solo para uso en el servidor.
 * Nunca exponer en el cliente ni en la app móvil.
 */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
