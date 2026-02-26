import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { subscribe } from "@/lib/sse-broadcaster";

/**
 * GET /api/vendors/stream
 *
 * Endpoint Server-Sent Events (SSE).
 * El dashboard admin se conecta aquí y recibe actualizaciones
 * de ubicación de los vendedores/repartidores en tiempo real,
 * sin necesidad de Supabase Realtime ni WebSockets.
 *
 * Flujo:
 *  1. App móvil → PATCH /api/users/location → guarda en DB → broadcast()
 *  2. Este endpoint → recibe broadcast → envía evento SSE al browser
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("No autorizado", { status: 401 });
  }

  const companyId = session.user.companyId as string;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Ping inicial para confirmar conexión
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Suscribir al broadcaster de esta empresa
      const unsubscribe = subscribe(companyId, (data) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Keep-alive: comentario SSE cada 25 s (evita timeout de proxies)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 25_000);

      // Limpiar al desconectar el cliente
      req.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          // ya estaba cerrado
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // deshabilita buffering en nginx
    },
  });
}
