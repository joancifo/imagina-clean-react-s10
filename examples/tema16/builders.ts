// TEMA 16 · Builder de datos de prueba. Cada test dice SOLO lo que le importa; el resto, valores válidos por defecto.
// Ventaja frente a copiar objetos enteros en cada test: si el modelo gana un campo obligatorio, se cambia aquí y en ningún otro sitio.
// Referencia: N. Pryce, «Test Data Builders» (2007) · G. Meszaros, «xUnit Test Patterns» (2007), Object Mother.
import type { Order } from '../../src/orders/domain/order';

export function anOrder(overrides: Partial<Order> = {}) {
  let order: Order = {
    id: 'P-1',
    customerName: 'Cliente de prueba',
    customerTier: 'standard',
    status: 'pending',
    ownerId: 'u2',
    createdAt: '2026-11-01T09:00:00Z',
    lines: [{ sku: 'A-10', quantity: 1, unitPrice: 100 }],
    ...overrides,
  };
  const builder = {
    withId: (id: string) => ((order = { ...order, id }), builder),
    gold: () => ((order = { ...order, customerTier: 'gold' }), builder),
    shipped: () => ((order = { ...order, status: 'shipped' }), builder),
    createdAt: (iso: string) => ((order = { ...order, createdAt: iso }), builder),
    worth: (unitPrice: number) => ((order = { ...order, lines: [{ sku: 'A-10', quantity: 1, unitPrice }] }), builder),
    build: (): Order => structuredClone(order),
  };
  return builder;
}
