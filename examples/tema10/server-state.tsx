// TEMA 10 · Estado de servidor: la caché es INFRAESTRUCTURA de presentación, no dominio.
// TanStack Query aporta caché, deduplicación, reintentos y revalidación. Lo que NO hace es decidir reglas:
// la queryFn llama a un caso de uso y el dominio sigue sin saber que existe una caché.
// Documentación: https://tanstack.com/query/latest/docs/framework/react/overview
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CancelOrderCommand } from '../../src/orders/application/cancel-order';
import { isUrgent } from '../../src/orders/domain/order';
import { useOrdersModule } from '../../src/orders/ui/OrdersProvider';

/** Las claves de caché se definen en un único sitio: quien invalida y quien lee usan la misma. */
export const ordersKeys = { all: ['orders'] as const };

export function useOrdersQuery() {
  const { listOrders } = useOrdersModule();
  return useQuery({ queryKey: ordersKeys.all, queryFn: listOrders });
}

/** Estado DERIVADO de la caché con `select`: no se guarda en otro sitio ni se sincroniza con un efecto. */
export function useUrgentCount() {
  const { listOrders } = useOrdersModule();
  return useQuery({ queryKey: ordersKeys.all, queryFn: listOrders, select: (orders) => orders.filter(isUrgent).length });
}

export function useCancelOrderMutation() {
  const { cancelOrder } = useOrdersModule();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: CancelOrderCommand) => cancelOrder(command),
    // Tras un comando correcto no se parchea la lista a mano: se invalida y la caché vuelve a pedirla.
    onSuccess: (result) => (result.ok ? queryClient.invalidateQueries({ queryKey: ordersKeys.all }) : undefined),
  });
}
