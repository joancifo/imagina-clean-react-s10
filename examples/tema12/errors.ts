// TEMA 12 · Errores por origen. Quien los trata necesita saber TRES cosas: de quién es la culpa,
// qué se le dice a la persona usuaria y si tiene sentido reintentar.
export type Origin = 'usuario' | 'dominio' | 'red' | 'programación';
export type AppError = { origin: Origin; code: string; message: string; retryable: boolean };

const USER_MESSAGES: Record<string, string> = {
  'reason-too-short': 'El motivo necesita al menos 5 caracteres',
  forbidden: 'No tienes permisos para esta acción',
  conflict: 'Otra persona ha cambiado este pedido. Recarga y vuelve a intentarlo',
  offline: 'No hay conexión con el servidor. Inténtalo de nuevo en unos segundos',
};

export function classify(error: unknown): AppError {
  if (error instanceof TypeError) return { origin: 'red', code: 'offline', message: USER_MESSAGES.offline, retryable: true };
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (code in USER_MESSAGES) {
      const origin: Origin = code === 'reason-too-short' ? 'usuario' : 'dominio';
      return { origin, code, message: USER_MESSAGES[code], retryable: code === 'conflict' };
    }
  }
  // Lo que no se reconoce es un fallo de programación: mensaje genérico y a los logs. Nunca el texto crudo en pantalla.
  return { origin: 'programación', code: 'unexpected', message: 'Ha ocurrido un error inesperado', retryable: false };
}

/** Reintento con espera creciente, solo para lo que tiene sentido reintentar. */
export async function withRetry<T>(run: () => Promise<T>, { attempts = 3, wait = async (ms: number) => { await new Promise((r) => setTimeout(r, ms)); } } = {}): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= attempts || !classify(error).retryable) throw error;
      await wait(attempt * 100);
    }
  }
}
