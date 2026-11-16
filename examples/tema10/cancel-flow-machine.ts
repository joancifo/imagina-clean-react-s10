// TEMA 10 · Estado complejo como máquina de estados: unión discriminada + reducer.
// El flujo «cancelar pedido» con booleanos sueltos (isOpen, isSubmitting, hasError…) permite estados imposibles:
// enviando con el diálogo cerrado, error sin haber enviado… Aquí solo existen los estados que tienen sentido.
export type CancelFlow =
  | { step: 'closed' }
  | { step: 'editing'; orderId: string; reason: string; error: string | null }
  | { step: 'submitting'; orderId: string; reason: string }
  | { step: 'done'; orderId: string };

export type CancelFlowEvent =
  | { type: 'open'; orderId: string }
  | { type: 'type'; reason: string }
  | { type: 'submit' }
  | { type: 'rejected'; message: string }
  | { type: 'confirmed' }
  | { type: 'close' };

export const CLOSED: CancelFlow = { step: 'closed' };

/** Cada estado decide a qué eventos responde. Un evento que no toca se IGNORA (devuelve el mismo estado). */
export function cancelFlowReducer(state: CancelFlow, event: CancelFlowEvent): CancelFlow {
  switch (state.step) {
    case 'closed':
      return event.type === 'open' ? { step: 'editing', orderId: event.orderId, reason: '', error: null } : state;
    case 'editing':
      if (event.type === 'type') return { ...state, reason: event.reason, error: null };
      if (event.type === 'submit') return { step: 'submitting', orderId: state.orderId, reason: state.reason };
      if (event.type === 'close') return CLOSED;
      return state;
    case 'submitting':
      // Mientras se envía no se puede cerrar ni volver a enviar: el doble clic no existe.
      if (event.type === 'rejected') return { step: 'editing', orderId: state.orderId, reason: state.reason, error: event.message };
      if (event.type === 'confirmed') return { step: 'done', orderId: state.orderId };
      return state;
    case 'done':
      return event.type === 'close' ? CLOSED : state;
  }
}
