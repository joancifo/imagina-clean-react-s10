// PRESENTACIÓN · Códigos estables → textos para la persona. satisfies: si aparece un código nuevo, typecheck avisa.
import type { RequestReturnError } from '../application/request-return';
import type { ReturnsFailure } from '../application/ports';

export const REQUEST_MESSAGES = {
  'invalid-quantity': 'Cantidad no válida',
  'needs-admin': 'Requiere aprobación de un administrador',
  'not-returnable': 'Este pedido ya no admite devoluciones',
  'quantity-exceeded': 'Otra persona ha registrado una devolución de esta línea. Recarga y vuelve a intentarlo',
  forbidden: 'Tu rol no permite registrar devoluciones',
  'not-found': 'Este pedido ya no existe',
  invalid: 'El servidor no ha aceptado la devolución. Revisa los datos',
  // Declarado (ADR-008): la heredada enseñaba «Error 500».
  unavailable: 'No se ha podido registrar la devolución. Inténtalo de nuevo en unos segundos',
} satisfies Record<RequestReturnError, string>;

/** Declarado (ADR-008): la heredada se quedaba en «Cargando…» para siempre si el transportista no respondía. */
export const LOAD_MESSAGES = {
  unavailable: 'No se ha podido cargar la devolución. Inténtalo de nuevo en unos segundos',
  forbidden: 'Tu rol no permite gestionar devoluciones',
  invalid: 'No se ha podido cargar la devolución. Inténtalo de nuevo en unos segundos',
} satisfies Partial<Record<ReturnsFailure, string>>;
