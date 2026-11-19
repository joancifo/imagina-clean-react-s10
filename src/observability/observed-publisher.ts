// OBSERVABILIDAD · Decorador del puerto EventPublisher: si publicar falla, queda constancia.
// Los casos de uso ignoran a propósito un fallo de analítica (el pedido YA está cancelado y no se deshace).
// Ignorar no puede significar «no enterarse».
import type { Logger } from './port';

type Publisher<E extends { type: string }> = { publish(event: E): Promise<void> };

export function observePublisher<E extends { type: string }>(_events: Publisher<E>, _deps: { logger: Logger; feature: string }): Publisher<E> {
  throw new Error('Por implementar (Ejercicio S7 · Parte A)');
}
