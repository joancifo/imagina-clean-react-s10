// TEMA 13 · Todo lo que viene de fuera es texto hasta que alguien lo comprueba.
// TypeScript describe lo que ESPERAS; en tiempo de ejecución no comprueba nada. El `as` es una promesa, no una garantía.
export type ExternalOrder = { id: string; total: number; status: 'pending' | 'approved' };

const STATUSES = ['pending', 'approved'] as const;

/** Parsea, no «castea»: si no cuadra, devuelve null y el dominio nunca llega a verlo. */
export function parseExternalOrder(raw: unknown): ExternalOrder | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { id, total, status } = raw as Record<string, unknown>;
  if (typeof id !== 'string' || !/^P-\d{4}$/.test(id)) return null;
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0) return null;
  if (!(STATUSES as readonly unknown[]).includes(status)) return null;
  return { id, total, status: status as ExternalOrder['status'] };
}

/** Un enlace que llega de fuera: solo http(s). `javascript:` ejecuta código al hacer clic. */
export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw, 'https://orderdesk.example');
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
