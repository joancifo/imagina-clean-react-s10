// Ejercicio S5 · Parte C · Comportamiento de la lista nueva, de extremo a extremo y SIN red:
// el test compone el módulo con adapters en memoria (otro Composition Root) y mira lo que ve la persona usuaria.
//
// Sesión 8 · El montaje (router, Composition Root, Provider, usuario simulado) se ha ido a
// `src/orders/testing/render-orders.tsx`: era el mismo en cuatro archivos y escondía de qué iba cada test.
// Y las interacciones pasan de `fireEvent` a `userEvent`: escribe tecla a tecla, respeta `disabled` y
// mueve el foco, que es lo que hace una persona.
import { screen, waitFor, within } from '@testing-library/react';
import { anActor, anOrder, aManager, anAdmin, anAgent, destination, renderOrders } from '../testing';
import type { OrdersModule } from '../composition';
import type { Order } from '../domain/order';
import { OrdersListPage } from './OrdersListPage';

// Tres pedidos que bastan para todo lo que se prueba aquí. El importe entre paréntesis es el total con IVA.
const SEED: Order[] = [
  anOrder({ id: 'P-1', customerName: 'Hotel Brisa', status: 'pending', ownerId: 'u2', createdAt: '2026-11-18T10:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice: 300 }] }), //   363,00 €
  anOrder({ id: 'P-2', customerName: 'Ferretería Sol', status: 'approved', ownerId: 'u2', createdAt: '2026-11-18T11:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice: 200 }] }), // 242,00 €
  anOrder({ id: 'P-3', customerName: 'Construcciones Vega', status: 'pending', ownerId: 'u3', createdAt: '2026-11-18T12:00:00Z', lines: [{ sku: 'A-10', quantity: 1, unitPrice: 5000 }] }), // 6.050,00 €
];

const list = (options: { url?: string; actor?: ReturnType<typeof anActor>; seed?: Order[]; patch?: (module: OrdersModule) => OrdersModule } = {}) =>
  renderOrders(({ onNotify }) => <OrdersListPage actor={options.actor ?? aManager()} onNotify={onNotify} />, {
    seed: options.seed ?? SEED,
    url: options.url,
    patch: options.patch,
    extraRoutes: destination('/orders/:id', 'Detalle del pedido'),
  });

const rowOf = async (id: string) => (await screen.findByRole('button', { name: id })).closest('tr') as HTMLElement;
const visibleIds = () => screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('button')[0].textContent);

describe('Parte C · la lista nueva, de extremo a extremo', () => {
  describe('criterios en la URL', () => {
    it('un enlace compartido abre la lista ya filtrada', async () => {
      list({ url: '/?status=pending&mine=1' });
      await rowOf('P-1');
      expect(visibleIds()).toEqual(['P-1']);
      expect(screen.getByLabelText('Estado')).toHaveValue('pending');
      expect(screen.getByText(/1 pendientes por/)).toBeInTheDocument();
    });

    it('cambiar un filtro cambia la URL y la lista', async () => {
      const { user, url } = list();
      await rowOf('P-1');
      await user.selectOptions(screen.getByLabelText('Estado'), 'approved');
      expect(url()).toBe('/?status=approved');
      expect(visibleIds()).toEqual(['P-2']);
    });
  });

  describe('los cuatro estados de la pantalla', () => {
    it('cargando → lista', async () => {
      list();
      expect(screen.getByText('Cargando…')).toBeInTheDocument();
      expect(await rowOf('P-1')).toBeInTheDocument();
    });

    it('error con reintento: se recupera sin recargar la página', async () => {
      let calls = 0;
      const { user } = list({ patch: (module) => ({ ...module, listOrders: () => (calls++ === 0 ? Promise.reject(new Error('sin red')) : module.listOrders()) }) });
      expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los pedidos');
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(await rowOf('P-1')).toBeInTheDocument();
    });

    it('vacío: distingue «no hay pedidos» de «los filtros no encuentran nada»', async () => {
      const { user } = list({ seed: [] });
      expect(await screen.findByText('Todavía no hay pedidos')).toBeInTheDocument();
      await user.type(screen.getByLabelText('Buscar cliente o pedido'), 'zzz');
      expect(await screen.findByText('Sin resultados para estos filtros')).toBeInTheDocument();
    });

    it('un agente no ve la columna Total ni acciones', async () => {
      list({ actor: anAgent() });
      const row = await rowOf('P-1');
      expect(screen.queryByRole('columnheader', { name: 'Total' })).toBeNull();
      expect(within(row).getAllByRole('button')).toHaveLength(1); // solo el enlace al detalle
    });

    // Sesión 8 · El BFF no le dice a un agente de quién es cada pedido: ofrecerle «Solo míos» era
    // ofrecerle un filtro que siempre deja la lista vacía.
    it('un agente no ve el filtro «Solo míos»; un manager sí', async () => {
      list({ actor: anAgent() });
      await rowOf('P-1');
      expect(screen.queryByLabelText('Solo míos')).toBeNull();
      expect(screen.getByLabelText('Estado')).toBeInTheDocument();
    });
  });

  describe('cancelar desde la lista', () => {
    async function openDialog(user: ReturnType<typeof list>['user'], id: string) {
      await user.click(within(await rowOf(id)).getByRole('button', { name: 'Cancelar' }));
      return screen.getByRole('dialog', { name: 'Cancelar pedido' });
    }
    const confirm = async (user: ReturnType<typeof list>['user'], reason: string) => {
      await user.type(screen.getByLabelText('Motivo'), reason);
      await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    };

    it('un motivo de espacios no es un motivo: el error se ve dentro del diálogo y no se cancela nada', async () => {
      const { user, adapters, notifications } = list();
      const dialog = await openDialog(user, 'P-1');
      await confirm(user, 'a          b');
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('El motivo debe tener al menos 10 caracteres');
      expect((await adapters.gateway.findById('P-1'))?.status).toBe('pending');
      expect(notifications).toEqual([]);
    });

    it('cancela con el caso de uso, avisa, cierra el diálogo y la fila se actualiza recargando la lista', async () => {
      const { user, adapters, notifications } = list();
      await openDialog(user, 'P-1');
      await confirm(user, 'Cliente duplicado en el ERP');
      await waitFor(() => expect(notifications).toEqual(['Pedido cancelado']));
      expect(screen.queryByRole('dialog')).toBeNull();
      await waitFor(async () => expect(within(await rowOf('P-1')).getByText('Cancelado')).toBeInTheDocument());
      expect(adapters.events.published).toEqual([expect.objectContaining({ type: 'OrderCancelled', orderId: 'P-1', cancelledBy: 'u2' })]);
      // El motivo llega al evento TAL Y COMO se escribió, con sus espacios entre palabras.
      expect(adapters.events.published[0]).toMatchObject({ reason: 'Cliente duplicado en el ERP' });
    });

    it('si el pedido se cerró en el backend, el diálogo muestra el mensaje del dominio y sigue abierto', async () => {
      const { user, adapters } = list();
      const dialog = await openDialog(user, 'P-1');
      await adapters.gateway.approve({ orderId: 'P-1', approvedBy: 'u1' }); // otra persona lo aprueba mientras tanto
      await confirm(user, 'Cliente duplicado en el ERP');
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Tu rol no permite cancelar este pedido');
    });
  });

  describe('aprobar desde la lista', () => {
    it('un pedido pequeño: avisa y se queda en la lista con la fila actualizada', async () => {
      const { user, notifications, url } = list();
      await user.click(within(await rowOf('P-1')).getByRole('button', { name: 'Aprobar' }));
      await waitFor(() => expect(notifications).toEqual(['Pedido P-1 aprobado']));
      await waitFor(async () => expect(within(await rowOf('P-1')).getByText('Aprobado')).toBeInTheDocument());
      expect(url()).toBe('/');
    });

    // Sesión 6 · P-3 es urgente (6.050 €): ya no se aprueba de un clic, hay que justificar.
    it('un pedido urgente: se justifica en el diálogo y después navega a su detalle', async () => {
      const { user, url } = list({ actor: anAdmin() });
      await user.click(within(await rowOf('P-3')).getByRole('button', { name: 'Aprobar' }));
      const dialog = await screen.findByRole('dialog', { name: 'Aprobar pedido' });
      await user.type(within(dialog).getByLabelText('Justificación'), 'Cliente histórico, riesgo revisado');
      await user.click(within(dialog).getByRole('checkbox'));
      await user.click(within(dialog).getByRole('button', { name: 'Confirmar aprobación' }));
      expect(await screen.findByRole('heading', { name: 'Detalle del pedido' })).toBeInTheDocument();
      expect(url()).toBe('/orders/P-3');
    });

    it('si el caso de uso lo rechaza, el mensaje se ve en la pantalla', async () => {
      const { user, adapters } = list();
      const row = await rowOf('P-1');
      await adapters.gateway.cancel({ orderId: 'P-1', reason: 'Cliente duplicado en el ERP' as never, cancelledBy: 'u1' });
      await user.click(within(row).getByRole('button', { name: 'Aprobar' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Solo se aprueban pedidos pendientes');
    });
  });
});
