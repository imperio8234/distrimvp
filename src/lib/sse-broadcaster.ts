/**
 * SSE Broadcaster — singleton en memoria por companyId.
 *
 * Limitación: solo funciona en entornos con proceso persistente
 * (Node.js standalone, Docker, Railway, Render…).
 * En Vercel serverless cada lambda es independiente, por lo que
 * para ese entorno se necesitaría Redis pub/sub u otro broker.
 */

type Listener = (data: string) => void;

// Map<companyId, Set<listener>>
const registry = new Map<string, Set<Listener>>();

/** Registra un listener. Devuelve la función para darse de baja. */
export function subscribe(companyId: string, listener: Listener): () => void {
  if (!registry.has(companyId)) registry.set(companyId, new Set());
  registry.get(companyId)!.add(listener);

  return () => {
    const set = registry.get(companyId);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) registry.delete(companyId);
  };
}

/** Envía un evento a todos los suscriptores de una empresa. */
export function broadcast(companyId: string, payload: object): void {
  const set = registry.get(companyId);
  if (!set || set.size === 0) return;
  const data = JSON.stringify(payload);
  set.forEach((fn) => {
    try {
      fn(data);
    } catch {
      // El cliente ya se desconectó; lo ignora (el cleanup de la señal abort lo elimina)
    }
  });
}
