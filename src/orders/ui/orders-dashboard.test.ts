// @vitest-environment node
// Ejercicio S7 · Parte C · Métricas del panel.
// Estos dos tests ejecutan el 100 % de las líneas de orders-dashboard.ts (npm run coverage)… y aun así
// dejan comportamientos sin comprobar. Compruébalo: npm run mutate -- src/orders/ui/orders-dashboard.ts
// Tu trabajo: añadir los tests que matan a TODOS los mutantes supervivientes.
import type { Actor } from '../domain/cancellation';
import type { Order } from '../domain/order';
import { buildDashboardMetrics } from './orders-dashboard';

const order = (id: string, status: Order['status'], unitPrice = 100): Order => ({
  id, customerName: 'Cliente', customerTier: 'standard', status, ownerId: 'u2', createdAt: '2026-11-01T09:00:00Z', lines: [{ sku: 'A', quantity: 1, unitPrice }],
});
const ADMIN: Actor = { id: 'u1', role: 'admin' };

describe('Parte C · buildDashboardMetrics', () => {
  it('sin pedidos, todo a cero', () => {
    const metrics = buildDashboardMetrics([], ADMIN);
    expect(metrics.pending).toBe(0);
    expect(metrics.cancellable).toBe(0);
  });

  it('calcula las tres métricas', () => {
    const metrics = buildDashboardMetrics([order('P-1', 'pending'), order('P-2', 'approved')], ADMIN);
    expect(metrics.pending).toBeGreaterThan(0);
    expect(metrics.revenue).toBeDefined();
  });
});

