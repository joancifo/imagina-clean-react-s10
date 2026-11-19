// PRESENTACIÓN · Pantalla de detalle NUEVA (Sesión 7). Sustituirá a src/pages/OrderDetailPage.tsx detrás del flag newOrderDetail.
// Contenedor: conecta el hook de datos, el view model y el caso de uso de cancelar. No calcula ni formatea.
import type { Actor } from '../domain/cancellation';

type Props = { orderId: string; actor: Actor; onNotify: (message: string) => void };

export function OrderDetailScreen(_props: Props): JSX.Element {
  throw new Error('Por implementar (Ejercicio S7 · Parte B)');
}
