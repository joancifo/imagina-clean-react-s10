// INFRAESTRUCTURA · Publica los eventos de dominio en el endpoint de analítica heredado (POST /api/logs).
// Sustituye a trackEvent('order_cancelled', …) de src/shared/utils.ts para este flujo.
// Traduce el evento de dominio al formato del proveedor: si mañana cambia el proveedor, cambia este archivo.
import type { DomainEvent, EventPublisher } from '../application/ports';

const NAMES: Record<DomainEvent['type'], string> = { OrderCancelled: 'order_cancelled' };

export function createAnalyticsEventPublisher(fetchFn: typeof fetch = fetch, baseUrl = '/api'): EventPublisher {
  return {
    async publish(event) {
      const response = await fetchFn(`${baseUrl}/logs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ level: 'info', name: NAMES[event.type], payload: { id: event.orderId, by: event.cancelledBy, reason: event.reason, at: event.occurredAt } }),
      });
      if (!response.ok) throw new Error(`Analítica no disponible (HTTP ${response.status})`);
    },
  };
}
