// @vitest-environment node
import { cancelFlowReducer, CLOSED, type CancelFlow, type CancelFlowEvent } from './cancel-flow-machine';

const run = (events: CancelFlowEvent[], from: CancelFlow = CLOSED) => events.reduce(cancelFlowReducer, from);
const OPEN: CancelFlowEvent = { type: 'open', orderId: 'P-1' };
const TYPED: CancelFlowEvent = { type: 'type', reason: 'Cliente duplicado' };

it('camino feliz: abrir → escribir → enviar → confirmado → cerrar', () => {
  expect(run([OPEN, TYPED, { type: 'submit' }])).toEqual({ step: 'submitting', orderId: 'P-1', reason: 'Cliente duplicado' });
  expect(run([OPEN, TYPED, { type: 'submit' }, { type: 'confirmed' }])).toEqual({ step: 'done', orderId: 'P-1' });
  expect(run([OPEN, TYPED, { type: 'submit' }, { type: 'confirmed' }, { type: 'close' }])).toEqual(CLOSED);
});

it('rechazo: vuelve a edición con el error y SIN perder lo escrito', () => {
  expect(run([OPEN, TYPED, { type: 'submit' }, { type: 'rejected', message: 'Este pedido ya está cerrado' }]))
    .toEqual({ step: 'editing', orderId: 'P-1', reason: 'Cliente duplicado', error: 'Este pedido ya está cerrado' });
});

it('al volver a escribir, el error desaparece', () => {
  const state = run([OPEN, TYPED, { type: 'submit' }, { type: 'rejected', message: 'Error' }, { type: 'type', reason: 'Otro motivo' }]);
  expect(state).toMatchObject({ step: 'editing', error: null });
});

it('transiciones imposibles: se ignoran', () => {
  expect(run([{ type: 'submit' }])).toEqual(CLOSED); //                              enviar con el diálogo cerrado
  const submitting = run([OPEN, TYPED, { type: 'submit' }]);
  expect(cancelFlowReducer(submitting, { type: 'submit' })).toBe(submitting); //     doble clic en Confirmar
  expect(cancelFlowReducer(submitting, { type: 'close' })).toBe(submitting); //      cerrar a mitad del envío
});
