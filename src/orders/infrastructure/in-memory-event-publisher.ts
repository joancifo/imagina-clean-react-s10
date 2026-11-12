// INFRAESTRUCTURA · Publicador en memoria: guarda los eventos para poder comprobarlos (tests, demos, Storybook).
import type { DomainEvent, EventPublisher } from '../application/ports';

export function createInMemoryEventPublisher(): EventPublisher & { readonly published: DomainEvent[] } {
  const published: DomainEvent[] = [];
  return {
    published,
    async publish(event) {
      published.push(event);
    },
  };
}
