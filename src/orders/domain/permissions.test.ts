// @vitest-environment node
import type { Actor } from './cancellation';
import { canSeeAmounts, canViewDashboard, canViewOrders } from './permissions';

const cases: { name: string; actor: Actor | null; orders: boolean; dashboard: boolean; amounts: boolean }[] = [
  { name: 'sin sesión', actor: null, orders: false, dashboard: false, amounts: false },
  { name: 'admin', actor: { id: 'u1', role: 'admin' }, orders: true, dashboard: true, amounts: true },
  { name: 'manager', actor: { id: 'u2', role: 'manager' }, orders: true, dashboard: true, amounts: true },
  { name: 'agente', actor: { id: 'u3', role: 'agent' }, orders: true, dashboard: false, amounts: false },
];

it.each(cases)('$name', ({ actor, orders, dashboard, amounts }) => {
  expect(canViewOrders(actor)).toBe(orders);
  expect(canViewDashboard(actor)).toBe(dashboard);
  expect(canSeeAmounts(actor)).toBe(amounts);
});
