// OBSERVABILIDAD · Adapter del puerto LogSink contra el BFF (POST /api/telemetry).
// El BFF vuelve a aplicar la lista blanca: lo que filtra el cliente ayuda; lo que filtra el servidor protege.
import type { LogSink } from './port';

export function createHttpLogSink(fetchFn: typeof fetch, baseUrl = '/api'): LogSink {
  return {
    async send(entries) {
      const response = await fetchFn(`${baseUrl}/telemetry`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      if (!response.ok) throw new Error(`Telemetría no disponible (HTTP ${response.status})`);
    },
  };
}
