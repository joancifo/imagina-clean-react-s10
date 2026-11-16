// TEMA 9 · Componente PRESENTACIONAL: recibe el estado ya resuelto y callbacks. No carga datos, no navega.
// Se puede probar, reutilizar y enseñar en un catálogo sin backend, sin router y sin providers.
import type { AsyncState } from './async-state';

/** Props en el lenguaje de la PANTALLA: «cliente» e «importe ya formateado», no cust_nm ni ln_items. */
export type UrgentOrderItem = { id: string; customer: string; total: string };

type Props = { state: AsyncState<UrgentOrderItem[]>; onRetry: () => void; onOpen: (id: string) => void };

export function UrgentOrdersPanel({ state, onRetry, onOpen }: Props) {
  return (
    <section aria-label="Pedidos urgentes">
      <h2>Pedidos urgentes</h2>
      <PanelBody state={state} onRetry={onRetry} onOpen={onOpen} />
    </section>
  );
}

function PanelBody({ state, onRetry, onOpen }: Props) {
  switch (state.status) {
    case 'loading':
      return <p role="status">Cargando pedidos urgentes…</p>;
    case 'error':
      return (
        <div role="alert">
          <p>{state.message}</p>
          <button onClick={onRetry}>Reintentar</button>
        </div>
      );
    case 'empty':
      return <p>No hay pedidos urgentes. Buen trabajo.</p>;
    case 'success':
      return (
        <ul>
          {state.data.map((item) => (
            <li key={item.id}>
              <button onClick={() => onOpen(item.id)}>{item.id}</button> {item.customer} · {item.total}
            </li>
          ))}
        </ul>
      );
  }
}
