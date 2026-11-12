// PRESENTACIÓN · Hook adaptador: conecta React con el caso de uso. No sabe que existe HTTP.
// Sesión 4: el caso de uso llega por el Provider (antes: parámetro por defecto con un singleton de composition.ts).
import { useEffect, useState } from 'react';
import type { OrderSummary } from '../application/load-order-summary';
import { useOrdersModule } from './OrdersProvider';

export type OrderSummaryState =
  | { status: 'loading' }
  | { status: 'ready'; summary: OrderSummary }
  | { status: 'error' };

export function useOrderSummary(): OrderSummaryState {
  const { loadOrderSummary } = useOrdersModule();
  const [state, setState] = useState<OrderSummaryState>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    loadOrderSummary()
      .then((summary) => active && setState({ status: 'ready', summary }))
      .catch(() => active && setState({ status: 'error' }));
    return () => { active = false; };
  }, [loadOrderSummary]);
  return state;
}
