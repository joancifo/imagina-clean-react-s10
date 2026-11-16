// @vitest-environment node
// TEMA 9 · El view model se prueba como cualquier función pura: sin render y en milisegundos.
import { formatCurrency } from '../../src/orders/ui/formatters';
import { toOrderDetailViewModel } from './order-detail-view-model';

it('prepara todos los textos de la pantalla de detalle', () => {
  const viewModel = toOrderDetailViewModel({
    id: 'P-1005', customerName: 'Hotel Brisa', customerTier: 'silver', status: 'pending', ownerId: 'u2',
    createdAt: '2026-10-08T10:00:00Z', lines: [{ sku: 'A-10', quantity: 10, unitPrice: 32.5 }],
  });
  expect(viewModel).toEqual({
    title: 'Pedido P-1005',
    subtitle: 'Hotel Brisa · 08/10/2026 · Cliente Silver (5 % dto.)',
    lines: [{ sku: 'A-10', quantity: '10', unitPrice: formatCurrency(32.5), amount: formatCurrency(325) }],
    total: `Total con IVA: ${formatCurrency(373.585)}`,
  });
});
