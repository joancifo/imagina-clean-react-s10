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

/**
 * PARTE C · Adapter del puerto SessionGateway contra el BFF.
 * Reglas (las fijan los tests de http-session-gateway.test.ts):
 *   · signIn: POST {baseUrl}/session con { userId } en JSON · me: GET {baseUrl}/me.
 *   · Las dos llamadas llevan credentials: 'include' para que viaje la cookie de sesión.
 *   · Una respuesta que no es ok (401…) significa «no hay sesión»: null, no excepción.
 *   · Sin red tampoco hay sesión: null (fail closed).
 *   · Aquí no se guarda NADA: ni en localStorage, ni en sessionStorage, ni en una variable de módulo.
 */
export function createHttpSessionGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): SessionGateway {
  void fetchFn;
  void baseUrl;
  void toSessionUser;
  return {
    async signIn() {
      throw new Error('Por implementar · Ejercicio S6, Parte C');
    },
    async me() {
      throw new Error('Por implementar · Ejercicio S6, Parte C');
    },
  };
}
