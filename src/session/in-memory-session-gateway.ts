// SESIÓN · Fake del puerto para tests, demos y desarrollo sin backend.
import type { Actor } from '../orders';
import type { SessionGateway, SessionUser } from './port';

const USERS: Record<string, SessionUser> = {
  u1: { actor: { id: 'u1', role: 'admin' }, name: 'Marta (admin)' },
  u2: { actor: { id: 'u2', role: 'manager' }, name: 'Pau (manager)' },
  u3: { actor: { id: 'u3', role: 'agent' }, name: 'Iris (agente)' },
};

export function createInMemorySessionGateway(initial: Actor | null = null): SessionGateway {
  let current: SessionUser | null = initial ? (USERS[initial.id] ?? { actor: initial, name: initial.id }) : null;
  return {
    async signIn(userId) {
      current = USERS[userId] ?? null;
      return current;
    },
    async me() {
      return current;
    },
  };
}
