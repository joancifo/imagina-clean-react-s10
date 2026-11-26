// @vitest-environment node
// Sesión 10 · Paso 5 · El view model da los MISMOS textos que fijó la caracterización de la heredada, sin montar nada.
import { GOLD, P1004 } from '../testing';
import { buildReturnFormViewModel, initialDraft } from './return-form-view-model';

const plain = (text: string | null) => (text ?? '').replace(/\s+/g, ' ');
const view = (order = P1004, draft = initialDraft(order), role = 'manager') => buildReturnFormViewModel(order, draft, role);

describe('buildReturnFormViewModel', () => {
  it('cabecera, subtítulo y opciones como la heredada', () => {
    const vm = view();
    expect([vm.title, vm.subtitle, vm.lines]).toEqual([
      'Devolución del pedido P-1004',
      'Clínica Dental Mar · entregado el 12/11/2026 · seguimiento TRK-88412',
      [{ value: 'E-50', label: 'E-50 (3 uds.)' }],
    ]);
  });

  it('lo que queda: «Ya devueltas: 1 · Puedes devolver hasta 2»', () => {
    expect([view().remaining, view().max]).toEqual(['Ya devueltas: 1 · Puedes devolver hasta 2', 2]);
  });

  it.each([
    ['NO_LONGER_NEEDED', 'Reembolso: 148,40 €', 'Incluye gastos de reposición del 15 %'],
    ['DEFECTIVE', 'Reembolso: 169,40 €', null],
    ['WRONG_ITEM', 'Reembolso: 148,40 €', 'Incluye gastos de reposición del 15 %'],
  ] as const)('motivo %s → %s', (reason, refund, note) => {
    const vm = view(P1004, { sku: 'E-50', quantity: 1, reason });
    expect([plain(vm.refund), vm.restockingNote]).toEqual([refund, note]);
  });

  it('un manager con 5 × D-40 gold (517,28 €) necesita a un admin y no puede enviar', () => {
    const vm = view(GOLD, { sku: 'D-40', quantity: 5, reason: 'NO_LONGER_NEEDED' });
    expect([plain(vm.refund), vm.needsAdmin, vm.canSubmit]).toEqual(['Reembolso: 517,28 €', true, false]);
  });

  it('un admin con el mismo importe sí puede', () => {
    const vm = view(GOLD, { sku: 'D-40', quantity: 5, reason: 'NO_LONGER_NEEDED' }, 'admin');
    expect([vm.needsAdmin, vm.canSubmit]).toEqual([false, true]);
  });

  it('una línea ya devuelta del todo no se puede enviar', () => {
    const vm = view({ ...P1004, lines: [{ ...P1004.lines[0], alreadyReturned: 3 }] });
    expect([vm.max, vm.canSubmit]).toEqual([0, false]);
  });
});
