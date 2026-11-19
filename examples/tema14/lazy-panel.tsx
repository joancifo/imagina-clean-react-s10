// TEMA 14 · Carga bajo demanda (code splitting) con React.lazy + Suspense.
// El código de una pantalla que no todo el mundo abre no tiene por qué viajar en el primer JavaScript.
// En OrderDesk: src/shell/OrderDetailRoute.tsx carga así la versión heredada del detalle (y, con ella, axios y moment).
// Referencia: react.dev/reference/react/lazy
import { lazy, Suspense, useState, type ComponentType } from 'react';

/** El cargador se recibe por parámetro para poder contarlo en el test. En la aplicación: () => import('./Pantalla'). */
export function createLazyPanel(loader: () => Promise<{ default: ComponentType }>) {
  const Panel = lazy(loader);
  return function PanelOnDemand() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Ver informe</button>
        {open && (
          <Suspense fallback={<p>Cargando informe…</p>}>
            <Panel />
          </Suspense>
        )}
      </>
    );
  };
}
