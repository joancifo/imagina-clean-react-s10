// Arnés de los tests de CARACTERIZACIÓN (Sesión 7). Material ya escrito.
// Un test de caracterización no dice cómo DEBERÍA comportarse el código: fija cómo se comporta HOY.
// Se escriben antes de tocar código heredado y se ejecutan contra las DOS versiones (heredada y nueva):
// si las dos pasan los mismos tests, la migración no ha cambiado nada que no se haya decidido cambiar.
// Referencia: M. Feathers, «Working Effectively with Legacy Code» (2004), cap. 13.
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { createInMemoryAdapters, createOrdersModule, OrdersProvider, toOrder, type Actor } from '../orders';
import { createInMemorySessionGateway, SessionProvider, useSession } from '../session';
import type { Order } from '../shared/types';
import { ToastHost } from '../shell/ToastHost';
import { AppStoreProvider, useAppStore } from '../store/appStore';

/** Mismos datos que server/store.mjs. Entre paréntesis, el total con descuento e IVA. */
export const ORDERS: Order[] = [
  { ord_id: 'P-1001', cust_nm: 'Talleres Norte', cust_tier: 'gold', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-10-02T09:15:00Z', ln_items: [{ sku: 'A-10', qty: 40, unit_prc: 32.5 }, { sku: 'B-20', qty: 4, unit_prc: 210 }] }, // 2330,46 €
  { ord_id: 'P-1002', cust_nm: 'Ferretería Sol', cust_tier: 'silver', ord_st: 'approved', owner_id: 'u2', crt_ts: '2026-10-03T11:40:00Z', ln_items: [{ sku: 'C-30', qty: 12, unit_prc: 18 }], cust_note: 'Entregar <b>antes</b> del viernes' }, // 248,29 €
  { ord_id: 'P-1003', cust_nm: 'Construcciones Vega', cust_tier: 'gold', ord_st: 'pending', owner_id: 'u3', crt_ts: '2026-10-05T08:05:00Z', ln_items: [{ sku: 'D-40', qty: 60, unit_prc: 95 }] }, // 6207,30 €
  { ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped', owner_id: 'u3', crt_ts: '2026-10-06T16:20:00Z', ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140 }] }, // 508,20 €
  { ord_id: 'P-1005', cust_nm: 'Hotel Brisa', cust_tier: 'silver', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-10-08T10:00:00Z', ln_items: [{ sku: 'A-10', qty: 10, unit_prc: 32.5 }] }, // 373,59 €
  { ord_id: 'P-1006', cust_nm: 'Logística Ebro', cust_tier: 'standard', ord_st: 'cancelled', owner_id: 'u3', crt_ts: '2026-10-09T12:30:00Z', ln_items: [{ sku: 'F-60', qty: 1, unit_prc: 900 }] }, // 1089,00 €
];

export const ADMIN: Actor = { id: 'u1', role: 'admin' };
export const MANAGER: Actor = { id: 'u2', role: 'manager' };
export const AGENT: Actor = { id: 'u3', role: 'agent' };

/** Lo que devuelve el BFF a cada rol (server/bff.mjs · visibleFor): a un agente, sin líneas ni responsable. */
export const asSeenBy = (actor: Actor) => (order: Order): Order => (actor.role === 'agent' ? { ...order, owner_id: undefined as unknown as string, ln_items: [] } : order);

/** Monta una pantalla en una ruta, con la sesión del actor, el aviso global y una lista «de mentira» en «/». */
export function renderScreen({ path, route, actor, element, orders }: { path: string; route: string; actor: Actor; element: ReactElement; orders: Order[] }) {
  const module = createOrdersModule(createInMemoryAdapters(orders.map(toOrder)));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider gateway={createInMemorySessionGateway(actor)}>
        <AppStoreProvider>
          <OrdersProvider module={module}>
            <Routes>
              <Route path={route} element={element} />
              <Route path="/" element={<h1>Lista de pedidos</h1>} />
            </Routes>
            <ToastHost />
          </OrdersProvider>
        </AppStoreProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

/** Adaptador para montar la pantalla NUEVA igual que la monta el shell: actor de la sesión y aviso del store. */
export function WithSessionAndToast({ children }: { children: (props: { orderId: string; actor: Actor; onNotify: (message: string) => void }) => ReactElement }) {
  const { id = '' } = useParams();
  const session = useSession();
  const { setToast } = useAppStore();
  if (session.status !== 'ready' || session.actor === null) return <main className="page">Cargando…</main>;
  return children({ orderId: id, actor: session.actor, onNotify: setToast });
}
