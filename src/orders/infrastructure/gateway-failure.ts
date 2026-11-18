// INFRAESTRUCTURA · Adapter de errores: traduce la respuesta del BFF a un fallo estable del puerto.
// Patrón Strategy en su forma más simple: una tabla en lugar de una escalera de if.
// Regla: manda el CÓDIGO del cuerpo cuando el BFF lo envía; el estado HTTP es el plan B.
import type { GatewayFailure } from '../application/ports';

/** Envoltorio de error del BFF: { "error": { "code": "forbidden" } } y nada más. */
export type ErrorEnvelope = { error?: { code?: unknown } };

/**
 * PARTE B · Traduce la respuesta del BFF a un fallo estable del puerto.
 * Reglas (las fijan los tests de gateway-failure.test.ts):
 *   · Manda el CÓDIGO del cuerpo cuando el BFF envía uno conocido; el estado HTTP es el plan B.
 *   · Códigos del BFF: no-session, forbidden, invalid-lines, invalid-body, not-found, conflict.
 *   · Estados HTTP: 400, 401, 403, 404, 409, 422. Cualquier otra cosa es 'unavailable'.
 *   · El cuerpo llega de fuera: puede ser null, una cadena o un objeto con lo que sea dentro.
 * Escríbelo con tablas, no con una escalera de if (Strategy, examples/tema12/patterns.ts).
 */
export function failureFor(status: number, body: unknown): GatewayFailure {
  void status;
  void body;
  const _envelope: ErrorEnvelope | null = null;
  void _envelope;
  return 'unavailable';
}

/** Lee el cuerpo sin romperse: una respuesta sin JSON (502 de un proxy, HTML de un portal) es previsible. */
export async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}
