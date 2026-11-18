// Ejercicio S5 · Parte C · Comportamiento de la lista nueva, de extremo a extremo y SIN red:
// el test compone el módulo con adapters en memoria (otro Composition Root) y mira lo que ve la persona usuaria.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createInMemoryAdapters, createOrdersModule, type OrdersModule } from '../composition';
import type { Actor } from '../domain/cancellation';
import type { Order } from '../domain/order';
import { OrdersListPage } from './OrdersListPage';
import { OrdersProvider } from './OrdersProvider';

type Row = [id: string, customerName: string, status: Order['status'], ownerId: string, unitPrice: number];
const order = ([id, customerName, status, ownerId, unitPrice]: Row): Order =>
  ({ id, customerName, customerTier: 'standard', status, ownerId, createdAt: '2026-11-18T10:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice }] });

const SEED: Order[] = [
  order(['P-1', 'Hotel Brisa', 'pending', 'u2', 300]), //            363 €
  order(['P-2', 'Ferretería Sol', 'approved', 'u2', 200]), //        242 €
  order(['P-3', 'Construcciones Vega', 'pending', 'u3', 5000]), //  6050 €
];
const ADMIN: Actor = { id: 'u1', role: 'admin' };
const MANAGER: Actor = { id: 'u2', role: 'manager' };
const AGENT: Actor = { id: 'u3', role: 'agent' };

function Location() {
  const location = useLocation();
  return <output aria-label="url">{location.pathname + location.search}</output>;
}

function renderList({ url = '/', actor = MANAGER, seed = SEED, patch = (module: OrdersModule) => module } = {}) {
  const adapters = createInMemoryAdapters(seed);
  const onNotify = vi.fn();
  render(
    <MemoryRouter initialEntries={[url]}>
      <OrdersProvider module={patch(createOrdersModule(adapters))}>
        <Routes>
          <Route path="/" element={<OrdersListPage actor={actor} onNotify={onNotify} />} />
          <Route path="/orders/:id" element={<h1>Detalle del pedido</h1>} />
        </Routes>
        <Location />
      </OrdersProvider>
    </MemoryRouter>,
  );
  return { adapters, onNotify };
}

const rowOf = async (id: string) => (await screen.findByRole('button', { name: id })).closest('tr') as HTMLElement;
const visibleIds = () => screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('button')[0].textContent);
const url = () => screen.getByLabelText('url').textContent;

describe('Parte C · la lista nueva, de extremo a extremo', () => {
  describe('criterios en la URL', () => {
    it('un enlace compartido abre la lista ya filtrada', async () => {
      renderList({ url: '/?status=pending&mine=1' });
      await rowOf('P-1');
      expect(visibleIds()).toEqual(['P-1']);
      expect(screen.getByLabelText('Estado')).toHaveValue('pending');
      expect(screen.getByText(/1 pendientes por/)).toBeInTheDocument();
    });

    it('cambiar un filtro cambia la URL y la lista', async () => {
      renderList();
      await rowOf('P-1');
      fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'approved' } });
      expect(url()).toBe('/?status=approved');
      expect(visibleIds()).toEqual(['P-2']);
    });
  });

  describe('los cuatro estados de la pantalla', () => {
    it('cargando → lista', async () => {
      renderList();
      expect(screen.getByText('Cargando…')).toBeInTheDocument();
      expect(await rowOf('P-1')).toBeInTheDocument();
    });

    it('error con reintento: se recupera sin recargar la página', async () => {
      let calls = 0;
      renderList({ patch: (module) => ({ ...module, listOrders: () => (calls++ === 0 ? Promise.reject(new Error('sin red')) : module.listOrders()) }) });
      expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los pedidos');
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(await rowOf('P-1')).toBeInTheDocument();
    });

    it('vacío: distingue «no hay pedidos» de «los filtros no encuentran nada»', async () => {
      renderList({ seed: [] });
      expect(await screen.findByText('Todavía no hay pedidos')).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Buscar cliente o pedido'), { target: { value: 'zzz' } });
      expect(screen.getByText('Sin resultados para estos filtros')).toBeInTheDocument();
    });

    it('un agente no ve la columna Total ni acciones', async () => {
      renderList({ actor: AGENT });
      const row = await rowOf('P-1');
      expect(screen.queryByRole('columnheader', { name: 'Total' })).toBeNull();
      expect(within(row).getAllByRole('button')).toHaveLength(1); // solo el enlace al detalle
    });
  });

  describe('cancelar desde la lista', () => {
    async function openDialog(id: string) {
      fireEvent.click(within(await rowOf(id)).getByRole('button', { name: 'Cancelar' }));
      return screen.getByRole('dialog', { name: 'Cancelar pedido' });
    }
    const confirm = (reason: string) => {
      fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: reason } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    };

    it('un motivo de espacios no es un motivo: el error se ve dentro del diálogo y no se cancela nada', async () => {
      const { adapters, onNotify } = renderList();
      const dialog = await openDialog('P-1');
      confirm('a          b');
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('El motivo debe tener al menos 10 caracteres');
      expect((await adapters.gateway.findById('P-1'))?.status).toBe('pending');
      expect(onNotify).not.toHaveBeenCalled();
    });

    it('cancela con el caso de uso, avisa, cierra el diálogo y la fila se actualiza recargando la lista', async () => {
      const { adapters, onNotify } = renderList();
      await openDialog('P-1');
      confirm('Cliente duplicado en el ERP');
      await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Pedido cancelado'));
      expect(screen.queryByRole('dialog')).toBeNull();
      await waitFor(async () => expect(within(await rowOf('P-1')).getByText('Cancelado')).toBeInTheDocument());
      expect(adapters.events.published).toEqual([expect.objectContaining({ type: 'OrderCancelled', orderId: 'P-1', cancelledBy: 'u2' })]);
    });

    it('si el pedido se cerró en el backend, el diálogo muestra el mensaje del dominio y sigue abierto', async () => {
      const { adapters } = renderList();
      const dialog = await openDialog('P-1');
      await adapters.gateway.approve({ orderId: 'P-1', approvedBy: 'u1' }); // otra persona lo aprueba mientras tanto
      confirm('Cliente duplicado en el ERP');
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Tu rol no permite cancelar este pedido');
    });
  });

  describe('aprobar desde la lista', () => {
    it('un pedido pequeño: avisa y se queda en la lista con la fila actualizada', async () => {
      const { onNotify } = renderList();
      fireEvent.click(within(await rowOf('P-1')).getByRole('button', { name: 'Aprobar' }));
      await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Pedido P-1 aprobado'));
      await waitFor(async () => expect(within(await rowOf('P-1')).getByText('Aprobado')).toBeInTheDocument());
      expect(url()).toBe('/');
    });

    // Sesión 6 · P-3 es urgente (6050 €): ya no se aprueba de un clic, hay que justificar.
    it('un pedido urgente: se justifica en el diálogo y después navega a su detalle', async () => {
      renderList({ actor: ADMIN });
      fireEvent.click(within(await rowOf('P-3')).getByRole('button', { name: 'Aprobar' }));
      const dialog = await screen.findByRole('dialog', { name: 'Aprobar pedido' });
      fireEvent.change(within(dialog).getByLabelText('Justificación'), { target: { value: 'Cliente histórico, riesgo revisado' } });
      fireEvent.click(within(dialog).getByRole('checkbox'));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar aprobación' }));
      expect(await screen.findByRole('heading', { name: 'Detalle del pedido' })).toBeInTheDocument();
      expect(url()).toBe('/orders/P-3');
    });

    it('si el caso de uso lo rechaza, el mensaje se ve en la pantalla', async () => {
      const { adapters } = renderList();
      const row = await rowOf('P-1');
      await adapters.gateway.cancel({ orderId: 'P-1', reason: 'Cliente duplicado' as never, cancelledBy: 'u1' });
      fireEvent.click(within(row).getByRole('button', { name: 'Aprobar' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Solo se aprueban pedidos pendientes');
    });
  });
});
