// TEMA 13 · Los logs se guardan, se exportan y los lee gente que no estaba en la conversación.
// Regla práctica: lista blanca. Se decide qué SE PUBLICA, no qué se esconde: lo que se esconde siempre se queda corto.
const PUBLISHABLE = ['id', 'by', 'code', 'total', 'at'] as const;
type Publishable = (typeof PUBLISHABLE)[number];

export function publishablePayload(payload: Record<string, unknown>): Partial<Record<Publishable, unknown>> {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => (PUBLISHABLE as readonly string[]).includes(key)));
}

/** Para los mensajes de error que sí se guardan: recorta lo que suele colarse. */
export function redact(message: string): string {
  return message
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[correo]')
    .replace(/\b\d{8}[A-Za-z]\b/g, '[dni]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[tarjeta]')
    .replace(/(authorization|cookie|token)\s*[:=]\s*[^\n,;]+/gi, '$1: [oculto]');
}
