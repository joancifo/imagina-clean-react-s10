// DOMINIO · Resultado explícito para errores previsibles. Mismo patrón que src/orders/domain/result.ts;
// se repite (seis líneas) para que Devoluciones no dependa de los internos de Pedidos.
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
