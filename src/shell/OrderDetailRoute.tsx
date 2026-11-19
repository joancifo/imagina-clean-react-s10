// SHELL · Ruta del detalle durante la migración (Sesión 7): RAMA POR ABSTRACCIÓN.
// Las dos versiones conviven desplegadas y el flag newOrderDetail elige. La heredada se carga con lazy().
import type { Session } from '../session';

type Props = { session: Session; onNotify: (message: string) => void };

export function OrderDetailRoute(_props: Props): JSX.Element {
  throw new Error('Por implementar (Ejercicio S7 · Parte B)');
}
