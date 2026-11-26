// Sesión 10 · Arnés de los tests de CARACTERIZACIÓN de Devoluciones. Material ya escrito.
// La pantalla heredada llama a `fetch` con rutas relativas y a `Date.now()` directamente: no recibe nada por parámetro.
// Para fijar su comportamiento sin tocarla, el arnés sustituye esas dos cosas desde fuera:
//   · `fetch` global → un backend «de mentira» que responde como las APIs heredadas y apunta lo que recibe.
//   · el reloj → `vi.useFakeTimers({ toFake: ['Date'] })`: solo la fecha; promesas y temporizadores siguen siendo reales.
// Referencia: M. Feathers, «Working Effectively with Legacy Code» (2004), cap. 13 (tests de caracterización).
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AnyProps } from '../shared/types';
import { ToastHost } from '../shell/ToastHost';
import { AppStoreProvider } from '../store/appStore';
import ReturnsPage from './ReturnsPage';

// ── Datos ──────────────────────────────────────────────────────────────────────────
// Usuarios: lo que devuelve GET /api/me.
export const MANAGER = { usr_id: 'u2', usr_nm: 'Pau (manager)', usr_role: 'manager' };
export const ADMIN = { usr_id: 'u1', usr_nm: 'Marta (admin)', usr_role: 'admin' };
export const AGENT = { usr_id: 'u3', usr_nm: 'Iris (agente)', usr_role: 'agent' };

// Pedidos: lo que devuelve GET /api/orders/:id (nombres del backend, como llegan).
/** El de server/store.mjs: standard, 3 × E-50 a 140 €, enviado. */
export const STANDARD = { ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped', owner_id: 'u3', crt_ts: '2026-10-06T16:20:00Z', ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140 }] };
/** Solo para tests: gold (10 % de descuento), dos líneas y un importe alto. */
export const GOLD = { ord_id: 'P-2001', cust_nm: 'Construcciones Vega', cust_tier: 'gold', ord_st: 'shipped', owner_id: 'u2', crt_ts: '2026-11-02T08:00:00Z', ln_items: [{ sku: 'D-40', qty: 10, unit_prc: 95 }, { sku: 'A-10', qty: 4, unit_prc: 32.5 }] };
/** Solo para tests: silver (5 % de descuento). */
export const SILVER = { ord_id: 'P-2002', cust_nm: 'Hotel Brisa', cust_tier: 'silver', ord_st: 'shipped', owner_id: 'u2', crt_ts: '2026-11-03T08:00:00Z', ln_items: [{ sku: 'A-10', qty: 10, unit_prc: 32.5 }] };
/** El de server/store.mjs: aprobado, todavía en camino. */
export const IN_TRANSIT = { ord_id: 'P-1002', cust_nm: 'Ferretería Sol', cust_tier: 'silver', ord_st: 'approved', owner_id: 'u2', crt_ts: '2026-10-03T11:40:00Z', ln_items: [{ sku: 'C-30', qty: 12, unit_prc: 18 }] };

// Transportista: lo que devuelve GET /api/carrier/shipments/:id (SU formato).
export const SHIPMENTS: Record<string, AnyProps> = {
  'P-1004': { trk_no: 'TRK-88412', sts_cd: 'DLV', dlv_ts: '2026-11-12T10:00:00Z' },
  'P-2001': { trk_no: 'TRK-90001', sts_cd: 'DLV', dlv_ts: '2026-11-20T10:00:00Z' },
  'P-2002': { trk_no: 'TRK-90002', sts_cd: 'DLV', dlv_ts: '2026-11-20T10:00:00Z' },
  'P-1002': { trk_no: 'TRK-88501', sts_cd: 'TRN', dlv_ts: null },
};

// Devoluciones previas: lo que devuelve GET /api/returns?ord_id=…
export const PREVIOUS = [{ rma_id: 'RMA-001', ord_id: 'P-1004', sku: 'E-50', qty: 1, rsn_cd: 'DEFECTIVE', rfd_amt: 169.4, req_by: 'u2', crt_ts: '2026-11-14T09:00:00Z' }];

/** Lunes 30 de noviembre de 2026, 18:00 en Madrid: 18 días después de la entrega de P-1004. */
export const CLASS_DAY = '2026-11-30T17:00:00Z';

// ── Backend «de mentira» ───────────────────────────────────────────────────────────
type BackendOptions = {
  me?: AnyProps;
  orders?: AnyProps[];
  shipments?: Record<string, AnyProps>;
  returns?: AnyProps[];
  /** El transportista no responde: la petición falla por red. */
  carrierDown?: boolean;
  /** Código con el que responde POST /api/returns (por defecto, 201). */
  postStatus?: number;
};

export type LegacyBackend = {
  fetch: typeof fetch;
  /** Cuerpos recibidos en POST /api/returns, ya parseados. */
  posted: AnyProps[];
  /** Rutas pedidas, en orden («GET /api/me»…). */
  calls: string[];
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export function legacyBackend({ me = MANAGER, orders = [STANDARD], shipments = SHIPMENTS, returns = PREVIOUS, carrierDown = false, postStatus = 201 }: BackendOptions = {}): LegacyBackend {
  const posted: AnyProps[] = [];
  const calls: string[] = [];
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://orderdesk.test');
    const method = (init?.method ?? 'GET').toUpperCase();
    calls.push(`${method} ${url.pathname}${url.search}`);

    if (method === 'GET' && url.pathname === '/api/me') return json(me);
    let match = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (method === 'GET' && match) {
      const order = orders.find((item) => item.ord_id === match![1]);
      return order ? json(order) : json({ error: { code: 'not-found' } }, 404);
    }
    match = url.pathname.match(/^\/api\/carrier\/shipments\/([^/]+)$/);
    if (method === 'GET' && match) {
      if (carrierDown) throw new TypeError('Failed to fetch');
      const shipment = shipments[match[1]];
      return shipment ? json(shipment) : json({ msg: 'unknown shipment' }, 404);
    }
    if (method === 'GET' && url.pathname === '/api/returns') return json(returns.filter((item) => item.ord_id === url.searchParams.get('ord_id')));
    if (method === 'POST' && url.pathname === '/api/returns') {
      posted.push(JSON.parse(String(init?.body)));
      return postStatus < 400 ? json({ rma_id: 'RMA-002' }, postStatus) : json({ msg: 'error' }, postStatus);
    }
    return json({ error: { code: 'not-found' } }, 404);
  }) as typeof fetch;
  return { fetch: fakeFetch, posted, calls };
}

// ── Reloj y montaje ────────────────────────────────────────────────────────────────
/** Fija la fecha del sistema. En `afterEach`, `closeReturns()` lo deshace. */
export function atDate(iso: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
}

/** Monta la pantalla heredada en /orders/:id/returns con el aviso global y un detalle «de mentira». */
export function openReturns(orderId: string, backend: LegacyBackend) {
  vi.stubGlobal('fetch', backend.fetch);
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[`/orders/${orderId}/returns`]}>
      <AppStoreProvider>
        <Routes>
          <Route path="/orders/:id/returns" element={<ReturnsPage />} />
          <Route path="/orders/:id" element={<h1>Detalle del pedido</h1>} />
        </Routes>
        <ToastHost />
      </AppStoreProvider>
    </MemoryRouter>,
  );
  return { user, ...view };
}

/** Deshace lo que cambió el arnés. Antes espera a que terminen las peticiones encadenadas de la pantalla
 *  (pide el transportista y las devoluciones DESPUÉS del pedido): si no, saldrían con el `fetch` real. */
export async function closeReturns() {
  await new Promise((resolve) => setTimeout(resolve, 20));
  vi.unstubAllGlobals();
  vi.useRealTimers();
}

/** Intl separa el importe del símbolo con un espacio de no separación (U+00A0). Se normaliza para comparar. */
export const plain = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
