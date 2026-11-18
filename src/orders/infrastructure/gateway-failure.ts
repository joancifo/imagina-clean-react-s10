// INFRAESTRUCTURA · Adapter de errores: traduce la respuesta del BFF a un fallo estable del puerto.
// Patrón Strategy en su forma más simple: una tabla en lugar de una escalera de if.
// Regla: manda el CÓDIGO del cuerpo cuando el BFF lo envía; el estado HTTP es el plan B.
import type { GatewayFailure } from '../application/ports';

/** Envoltorio de error del BFF: { "error": { "code": "forbidden" } } y nada más. */
export type ErrorEnvelope = { error?: { code?: unknown } };

const BY_CODE: Record<string, GatewayFailure> = {
  'no-session': 'forbidden',
  forbidden: 'forbidden',
  'invalid-lines': 'invalid',
  'invalid-body': 'invalid',
  'not-found': 'not-found',
  conflict: 'conflict',
};

const BY_STATUS: Record<number, GatewayFailure> = {
  400: 'invalid',
  401: 'forbidden',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  422: 'invalid',
};

/** El cuerpo llega de fuera: puede ser cualquier cosa. Si no se reconoce, 'unavailable'. */
export function failureFor(status: number, body: unknown): GatewayFailure {
  const code = (body as ErrorEnvelope | null)?.error?.code;
  if (typeof code === 'string' && code in BY_CODE) return BY_CODE[code];
  return BY_STATUS[status] ?? 'unavailable';
}

/** Lee el cuerpo sin romperse: una respuesta sin JSON (502 de un proxy, HTML de un portal) es previsible. */
export async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}
