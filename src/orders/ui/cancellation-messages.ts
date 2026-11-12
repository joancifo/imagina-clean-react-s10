// PRESENTACIÓN · Traduce los errores previsibles a mensajes para la persona usuaria.
// El dominio y la aplicación devuelven códigos estables ('too-short', 'conflict'); el texto es una decisión de UX y vive aquí.
// satisfies Record<CancelOrderError, …>: si el caso de uso añade un código nuevo, npm run typecheck avisa de que falta su mensaje.
import type { CancellationDenied } from '../domain/cancellation';
import { REASON_MAX_LENGTH, REASON_MIN_LENGTH, type ReasonError } from '../domain/cancellation-reason';
// Parte C · paso 2: cambia el satisfies a Record<CancelOrderError, string> (de '../application/cancel-order').

export const CANCELLATION_MESSAGES = {
  'too-short': `El motivo debe tener al menos ${REASON_MIN_LENGTH} caracteres`,
  'too-long': `El motivo no puede superar los ${REASON_MAX_LENGTH} caracteres`,
  'no-session': 'Debes iniciar sesión',
  'already-closed': 'Este pedido ya está cerrado y no se puede cancelar',
  forbidden: 'Tu rol no permite cancelar este pedido',
  'over-manager-limit': 'Este pedido solo lo puede cancelar un administrador',
} satisfies Record<ReasonError | CancellationDenied, string>;

/** Para lo que NO es previsible (un bug): la pantalla no se rompe, pero tampoco finge saber qué ha pasado. */
export const UNEXPECTED_ERROR = 'No se pudo cancelar el pedido por un error inesperado';
