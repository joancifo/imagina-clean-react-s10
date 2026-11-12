// PRESENTACIÓN · Hook adaptador del caso de uso «Cancelar pedido».
// Traduce el mundo del caso de uso (Result con códigos) al de la pantalla (pending + mensaje).
// No valida, no decide permisos, no llama a la red: eso ya lo hace el caso de uso.
import { useCallback, useState } from 'react';
import type { CancelOrderCommand } from '../application/cancel-order';
import { CANCELLATION_MESSAGES, UNEXPECTED_ERROR } from './cancellation-messages';
import { useOrdersModule } from './OrdersProvider';

export type CancelOutcome = { ok: true } | { ok: false; message: string };

// Ejercicio S4 · Parte C · paso 3. Especificación: useCancelOrder.test.tsx
// - El caso de uso sale de useOrdersModule().
// - pending: true mientras el caso de uso trabaja.
// - Result ok → { ok: true } · Result error → { ok: false, message: CANCELLATION_MESSAGES[código] }
// - Excepción (bug) → { ok: false, message: UNEXPECTED_ERROR }, sin romper la pantalla.
export function useCancelOrder(): { cancel: (command: CancelOrderCommand) => Promise<CancelOutcome>; pending: boolean } {
  void [useCallback, useState, useOrdersModule, CANCELLATION_MESSAGES, UNEXPECTED_ERROR];
  return {
    cancel: async () => {
      throw new Error('Por implementar (ejercicio S4 · Parte C · useCancelOrder)');
    },
    pending: false,
  };
}
