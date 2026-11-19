// @vitest-environment node
// TEMA 16 · Los cinco dobles de prueba (G. Meszaros, «xUnit Test Patterns», 2007), en un mismo caso de uso.
// Regla práctica: compruebas ESTADO con stubs y fakes; compruebas INTERACCIONES con spies y mocks.
// Y cuanto menos se comprueben interacciones, menos se rompe el test al refactorizar.
import { anOrder } from './builders';
import { remindOverdue, type RemindDeps } from './remind-overdue';

const NOW = new Date('2026-11-23T09:00:00Z');

/** FAKE: funciona de verdad (filtra pendientes), pero en memoria. */
const fakeOrders = (...orders: ReturnType<ReturnType<typeof anOrder>['build']>[]) => ({
  findPending: async () => orders.filter((order) => order.status === 'pending'),
});
/** STUB: una respuesta fija. No se comprueba nada sobre él. */
const stubClock = { now: () => NOW };
/** DUMMY: rellena un hueco de la firma. Si alguien lo usara, el test lo diría. */
const dummyAudit: RemindDeps['audit'] = { record: () => { throw new Error('el dummy no se usa en este test'); } };

it('STUB + FAKE · cuenta los pendientes de más de 7 días (se comprueba el RESULTADO)', async () => {
  const sent: string[] = []; // spy escrito a mano: apunta las llamadas
  const mailer = { send: async (to: string) => { sent.push(to); } };
  const audit = { record: () => undefined };
  const orders = fakeOrders(
    anOrder().withId('P-1').createdAt('2026-11-01T09:00:00Z').build(), // 22 días
    anOrder().withId('P-2').createdAt('2026-11-20T09:00:00Z').build(), // 3 días
    anOrder().withId('P-3').createdAt('2026-11-01T09:00:00Z').shipped().build(), // viejo, pero no pendiente
  );
  expect(await remindOverdue({ orders, clock: stubClock, mailer, audit }, 7)).toBe(1);
});

it('SPY · comprueba a quién y qué se envió (se comprueba la INTERACCIÓN, después)', async () => {
  const mailer = { send: vi.fn(async () => undefined) };
  const orders = fakeOrders(anOrder().withId('P-7').gold().worth(1000).createdAt('2026-11-01T09:00:00Z').build());
  await remindOverdue({ orders, clock: stubClock, mailer, audit: { record: () => undefined } }, 7);
  expect(mailer.send).toHaveBeenCalledWith('u2@orderdesk.test', 'Pedido P-7 pendiente (1089 €)');
});

it('DUMMY · sin pedidos atrasados, la auditoría ni se toca', async () => {
  const mailer = { send: vi.fn(async () => undefined) };
  expect(await remindOverdue({ orders: fakeOrders(), clock: stubClock, mailer, audit: dummyAudit }, 7)).toBe(0);
  expect(mailer.send).not.toHaveBeenCalled();
});

it('MOCK · la expectativa se declara ANTES y el propio doble la verifica (y se rompe con cualquier cambio de orden o texto)', async () => {
  const expected = ['recordatorios:2'];
  const audit = { record: vi.fn((entry: string) => expect(entry).toBe(expected.shift())) };
  const orders = fakeOrders(anOrder().withId('P-1').createdAt('2026-11-01T09:00:00Z').build(), anOrder().withId('P-2').createdAt('2026-11-02T09:00:00Z').build());
  await remindOverdue({ orders, clock: stubClock, mailer: { send: async () => undefined }, audit }, 7);
  expect(expected).toEqual([]); // se consumieron todas las expectativas
});
