// PRESENTACIÓN · Hook de CASO DE USO: adapta «Aprobar pedido» a React (pending + mensaje).
// No decide permisos ni navega: devuelve el pedido aprobado y la pantalla decide qué hacer con él.
import { useCallback, useState } from 'react';
import type { ApproveOrderCommand } from '../application/approve-order';
import type { Order } from '../domain/order';
import { APPROVAL_MESSAGES, UNEXPECTED_APPROVAL_ERROR } from './approval-messages';
import { useOrdersModule } from './OrdersProvider';

export type ApproveOutcome = { ok: true; order: Order } | { ok: false; message: string };

export function useApproveOrder() {
  const { approveOrder } = useOrdersModule();
  const [pending, setPending] = useState(false);

  const approve = useCallback(
    async (command: ApproveOrderCommand): Promise<ApproveOutcome> => {
      setPending(true);
      try {
        const result = await approveOrder(command);
        return result.ok ? { ok: true, order: result.value } : { ok: false, message: APPROVAL_MESSAGES[result.error] };
      } catch {
        return { ok: false, message: UNEXPECTED_APPROVAL_ERROR };
      } finally {
        setPending(false);
      }
    },
    [approveOrder],
  );

  return { approve, pending };
}
