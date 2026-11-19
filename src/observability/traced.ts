// OBSERVABILIDAD · Decorador de casos de uso: mide, registra el resultado y no cambia nada más.
// Patrón Decorator: el caso de uso no sabe que lo miden. Se aplica en la composición (composition.ts),
// así que dominio y aplicación siguen sin importar nada de observabilidad (lo comprueba lint:arch).
import type { Logger, TimeSource } from './port';

/** Forma mínima de un Result: basta con saber si fue bien y, si no, su código. */
type ResultLike = { ok: true } | { ok: false; error: string };

export type TraceDeps = { logger: Logger; clock: TimeSource; newId: () => string; feature: string };

export function traced<C, R extends ResultLike>(_name: string, _useCase: (command: C) => Promise<R>, _deps: TraceDeps): (command: C) => Promise<R> {
  throw new Error('Por implementar (Ejercicio S7 · Parte A)');
}
