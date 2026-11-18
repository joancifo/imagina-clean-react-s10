// SESIÓN · Adapter del puerto contra el BFF.
// La sesión viaja en una cookie HttpOnly que pone el servidor: aquí no se guarda nada, ni en localStorage ni en memoria.
// `credentials: 'include'` es lo único que hace falta para que la cookie viaje.
import { toActor } from '../orders';
import type { SessionGateway, SessionUser } from './port';

type MeDto = { usr_id: string; usr_nm: string; usr_role: string };

function toSessionUser(dto: MeDto | null): SessionUser | null {
  const actor = toActor(dto);
  return actor && dto ? { actor, name: dto.usr_nm } : null;
}

export function createHttpSessionGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): SessionGateway {
  const read = async (response: Response) => (response.ok ? toSessionUser(await response.json()) : null);
  return {
    async signIn(userId) {
      try {
        return await read(
          await fetchFn(`${baseUrl}/session`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ userId }),
          }),
        );
      } catch {
        return null; // sin red no hay sesión: fail closed
      }
    },
    async me() {
      try {
        return await read(await fetchFn(`${baseUrl}/me`, { credentials: 'include' }));
      } catch {
        return null;
      }
    },
  };
}
