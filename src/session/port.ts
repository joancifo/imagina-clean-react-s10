// SESIÓN · Puerto. Quien lo usa no sabe si por debajo hay una cookie, una cabecera o un SDK.
// El token NO forma parte del contrato: si el JavaScript de la página no puede leerlo, no se lo pueden robar.
import type { Actor } from '../orders';

/** Quién es la persona usuaria SEGÚN EL SERVIDOR, más su nombre para la cabecera. */
export type SessionUser = { actor: Actor; name: string };

export interface SessionGateway {
  /** Abre sesión. Devuelve el usuario o null si las credenciales no valen. */
  signIn(userId: string): Promise<SessionUser | null>;
  /** Recupera la sesión existente. null si no hay ninguna válida. */
  me(): Promise<SessionUser | null>;
}
