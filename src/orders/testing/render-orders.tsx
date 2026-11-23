// PRUEBAS · Arranque de una pantalla de Pedidos tal y como la ve una persona.
//
// Un test de componente que empieza con veinte líneas de montaje acaba probando el montaje.
// Aquí viven esas veinte líneas: router, Composition Root en memoria, Provider y el usuario simulado.
//
// Dos decisiones que se repiten en cada test de esta feature:
//   · NO hay `vi.mock`. El módulo se compone con adapters en memoria, que es otro Composition Root.
//     Lo que se prueba es el mismo código que corre en producción, con otras implementaciones de los puertos.
//   · El aviso (`onNotify`) se apunta con un SPY escrito a mano. Se lee mejor que `toHaveBeenCalledWith`
//     y no obliga a nadie a conocer la API de dobles de la librería de tests.
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createInMemoryAdapters, createOrdersModule, type OrdersModule } from '../composition';
import type { Order } from '../domain/order';
import { OrdersProvider } from '../ui/OrdersProvider';
import { anOrder } from './builders';

/** Pinta la URL actual en la pantalla: así un test puede comprobar la navegación sin espiar al router. */
function CurrentUrl() {
  const location = useLocation();
  return <output aria-label="url">{location.pathname + location.search}</output>;
}

export type RenderOrdersOptions = {
  /** Pedidos con los que arranca el backend en memoria. */
  seed?: Order[];
  /** Ruta inicial, con sus criterios si hace falta: `/?status=pending`. */
  url?: string;
  /** Sustituye un caso de uso por otro: para forzar un error sin tocar los adapters. */
  patch?: (module: OrdersModule) => OrdersModule;
  /** Rutas adicionales (destinos de navegación) además de la que se está probando. */
  extraRoutes?: ReactNode;
  /** Ruta en la que se monta el elemento. Por defecto, `/`. */
  path?: string;
};

export type RenderedOrders = RenderResult & {
  /** Usuario simulado de `@testing-library/user-event`: escribe letra a letra, mueve el foco y respeta `disabled`. */
  user: ReturnType<typeof userEvent.setup>;
  adapters: ReturnType<typeof createInMemoryAdapters>;
  module: OrdersModule;
  /** Avisos que ha pedido la pantalla, en orden. */
  notifications: string[];
  onNotify: (message: string) => void;
  /** La URL que se ve ahora mismo. */
  url: () => string;
};

/**
 * `renderOrders(({ onNotify }) => <OrdersListPage actor={aManager()} onNotify={onNotify} />, { seed })`
 *
 * El elemento llega como función para que la pantalla reciba el MISMO spy que después se comprueba.
 */
export function renderOrders(element: (helpers: { onNotify: (message: string) => void }) => ReactElement, options: RenderOrdersOptions = {}): RenderedOrders {
  const { seed = [anOrder()], url = '/', patch = (module: OrdersModule) => module, extraRoutes = null, path = '/' } = options;

  const adapters = createInMemoryAdapters(seed);
  const module = patch(createOrdersModule(adapters));
  const notifications: string[] = [];
  const onNotify = (message: string) => {
    notifications.push(message);
  };
  const user = userEvent.setup();

  const result = render(
    <MemoryRouter initialEntries={[url]}>
      <OrdersProvider module={module}>
        <Routes>
          <Route path={path} element={element({ onNotify })} />
          {extraRoutes}
        </Routes>
        <CurrentUrl />
      </OrdersProvider>
    </MemoryRouter>,
  );

  return {
    ...result,
    user,
    adapters,
    module,
    notifications,
    onNotify,
    url: () => result.container.querySelector('output[aria-label="url"]')?.textContent ?? '',
  };
}

/** Atajo para las rutas de destino: `destination('/orders/:id', 'Detalle del pedido')`. */
export const destination = (path: string, heading: string) => <Route key={path} path={path} element={<h1>{heading}</h1>} />;
