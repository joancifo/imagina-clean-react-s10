// PRESENTACIÓN · Hook adaptador del caso de uso «Cancelar pedido».
// Traduce el mundo del caso de uso (Result con códigos) al de la pantalla (pending + mensaje).
// No valida, no decide permisos, no llama a la red: eso ya lo hace el caso de uso.
import { useCallback, useState } from 'react';
import type { CancelOrderCommand } from '../application/cancel-order';
import { CANCELLATION_MESSAGES, UNEXPECTED_ERROR } from './cancellation-messages';
import { useOrdersModule } from './OrdersProvider';

export type CancelOutcome = { ok: true } | { ok: false; message: string };

export function useCancelOrder() {
  const { cancelOrder } = useOrdersModule();
  const [pending, setPending] = useState(false);

  const cancel = useCallback(
    async (command: CancelOrderCommand): Promise<CancelOutcome> => {
      setPending(true);
      try {
        const result = await cancelOrder(command);
        return result.ok ? { ok: true } : { ok: false, message: CANCELLATION_MESSAGES[result.error] };
      } catch {
        // Un bug: la pantalla sigue viva. Registrarlo con un puerto Logger es la Sesión 7 (observabilidad).
        return { ok: false, message: UNEXPECTED_ERROR };
      } finally {
        setPending(false);
      }
    },
    [cancelOrder],
  );

  return { cancel, pending };
}
