// @vitest-environment node
import { createDashboardEndpoint } from './bff-aggregation.mjs';

const deps = (calls = []) => ({
  orders: { findAll: async () => (calls.push('orders'), [{ status: 'pending', total: 100 }, { status: 'pending', total: 50 }, { status: 'shipped', total: 10 }]) },
  invoices: { pending: async () => (calls.push('invoices'), [{ overdue: true }, { overdue: false }]) },
  incidents: { openFor: async () => (calls.push('incidents'), [{ id: 'I-1' }]) },
});

it('una sola respuesta con lo que necesita la pantalla', async () => {
  const dashboard = createDashboardEndpoint(deps());
  expect(await dashboard({ id: 'u2', role: 'manager' })).toEqual({ pendingCount: 2, pendingAmount: 150, overdueInvoices: 1, myIncidents: 1 });
});

it('lo que un agente no puede ver, no sale del servidor', async () => {
  const dashboard = createDashboardEndpoint(deps());
  expect((await dashboard({ id: 'u3', role: 'agent' })).pendingAmount).toBeNull();
});

it('las tres fuentes se piden a la vez, no una detrás de otra', async () => {
  const calls = [];
  const lentas = deps(calls);
  await createDashboardEndpoint(lentas)({ id: 'u1', role: 'admin' });
  expect(calls).toHaveLength(3);
});

it('la respuesta no trae textos de pantalla: eso lo decide el frontend', async () => {
  const data = await createDashboardEndpoint(deps())({ id: 'u1', role: 'admin' });
  expect(JSON.stringify(data)).not.toMatch(/pendientes|€|rojo/i);
});
