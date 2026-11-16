// Ejercicio S5 · Parte C · Rutas y permisos: qué pantalla se ve en cada URL según la sesión.
// Se prueba el MAPA de rutas, no la implementación de cada pantalla.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../services/api';
import { AppStoreProvider } from '../store/appStore';
import { createInMemoryAdapters, createOrdersModule, OrdersProvider, toOrder, type Actor } from '../orders';
import type { Order } from '../shared/types';
import { AppRoutes } from './AppRoutes';
import type { Session } from './session';

vi.mock('../services/api');

const ORDERS: Order[] = [
  { ord_id: 'P-1005', cust_nm: 'Hotel Brisa', cust_tier: 'silver', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-10-08T10:00:00Z', ln_items: [{ sku: 'A-10', qty: 10, unit_prc: 32.5 }] },
  { ord_id: 'P-1003', cust_nm: 'Construcciones Vega', cust_tier: 'gold', ord_st: 'pending', owner_id: 'u3', crt_ts: '2026-10-05T08:05:00Z', ln_items: [{ sku: 'D-40', qty: 60, unit_prc: 95 }] },
  { ord_id: 'P-1002', cust_nm: 'Ferretería Sol', cust_tier: 'silver', ord_st: 'approved', owner_id: 'u2', crt_ts: '2026-10-03T11:40:00Z', ln_items: [{ sku: 'C-30', qty: 12, unit_prc: 18 }] },
];
const as = (actor: Actor | null): Session => ({ status: 'ready', actor });
const MANAGER = as({ id: 'u2', role: 'manager' });
const AGENT = as({ id: 'u3', role: 'agent' });

function renderAt(path: string, session: Session) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppStoreProvider>
        <OrdersProvider module={createOrdersModule(createInMemoryAdapters(ORDERS.map(toOrder)))}>
          <AppRoutes session={session} onNotify={() => {}} />
        </OrdersProvider>
      </AppStoreProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.getOrders).mockResolvedValue(ORDERS);
  vi.mocked(api.getMe).mockResolvedValue({ usr_id: 'u2', usr_nm: 'Pau', usr_role: 'manager' });
});
afterEach(() => vi.restoreAllMocks());

// Parte C · paso 2: quita .skip
describe.skip('Parte C · rutas y permisos', () => {
  describe('panel: ruta protegida', () => {
    it('un manager entra', async () => {
      renderAt('/dashboard', MANAGER);
      expect(await screen.findByRole('heading', { name: 'Panel' })).toBeInTheDocument();
    });

    it('un agente ve «no autorizado» y el panel NO se monta (no pide datos)', () => {
      renderAt('/dashboard', AGENT);
      expect(screen.getByRole('heading', { name: 'No tienes acceso a esta página' })).toBeInTheDocument();
      expect(api.getOrders).not.toHaveBeenCalled();
    });

    it('mientras la sesión carga no hay «no autorizado»: se espera', () => {
      renderAt('/dashboard', { status: 'loading' });
      expect(screen.getByText('Cargando…')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'No tienes acceso a esta página' })).toBeNull();
    });
  });

  describe('rutas que no existen', () => {
    it('muestran la página 404 con un enlace para volver', () => {
      renderAt('/facturas/2026', MANAGER);
      expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver a Pedidos' })).toHaveAttribute('href', '/');
    });
  });

  describe('lista de pedidos: la pantalla nueva', () => {
    it('un enlace con filtros abre la lista filtrada (deep link) usando el módulo Pedidos, no src/services/api', async () => {
      renderAt('/?status=pending&mine=1', MANAGER);
      expect(await screen.findByRole('button', { name: 'P-1005' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'P-1003' })).toBeNull(); // pendiente, pero de otra persona
      expect(screen.queryByRole('button', { name: 'P-1002' })).toBeNull(); // mío, pero aprobado
      expect(api.getOrders).not.toHaveBeenCalled();
    });

    it('sin sesión no se entra en la lista', () => {
      renderAt('/', as(null));
      expect(screen.getByRole('heading', { name: 'No tienes acceso a esta página' })).toBeInTheDocument();
    });
  });
});
