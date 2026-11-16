// PRESENTACIÓN · Traduce los errores previsibles a mensajes para la persona usuaria.
// El dominio y la aplicación devuelven códigos estables ('too-short', 'conflict'); el texto es una decisión de UX y vive aquí.
// satisfies Record<CancelOrderError, …>: si el caso de uso añade un código nuevo, npm run typecheck avisa de que falta su mensaje.
import type { CancelOrderError } from '../application/cancel-order';
import { REASON_MAX_LENGTH, REASON_MIN_LENGTH } from '../domain/cancellation-reason';

export const CANCELLATION_MESSAGES = {
  'too-short': `El motivo debe tener al menos ${REASON_MIN_LENGTH} caracteres`,
  'too-long': `El motivo no puede superar los ${REASON_MAX_LENGTH} caracteres`,
  'no-session': 'Debes iniciar sesión',
  'already-closed': 'Este pedido ya está cerrado y no se puede cancelar',
  forbidden: 'Tu rol no permite cancelar este pedido',
  'over-manager-limit': 'Este pedido solo lo puede cancelar un administrador',
  'not-found': 'Este pedido ya no existe',
  conflict: 'Otra persona ha cambiado este pedido. Recarga la lista y vuelve a intentarlo',
  unavailable: 'No hay conexión con el servidor. Inténtalo de nuevo en unos segundos',
} satisfies Record<CancelOrderError, string>;

/** Para lo que NO es previsible (un bug): la pantalla no se rompe, pero tampoco finge saber qué ha pasado. */
export const UNEXPECTED_ERROR = 'No se pudo cancelar el pedido por un error inesperado';
