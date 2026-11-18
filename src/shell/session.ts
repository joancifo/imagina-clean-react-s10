// SHELL · Sesión de la aplicación como unión discriminada.
// «Todavía no sé quién eres» (loading) NO es lo mismo que «no puedes pasar»: un guard que los confunde
// expulsa a la persona usuaria mientras carga su sesión.
import useCurrentUser from '../hooks/useCurrentUser';
import { toActor, type Actor } from '../orders';

export type Session = { status: 'loading' } | { status: 'ready'; actor: Actor | null };

/** Puente con el heredado: useCurrentUser devuelve null mientras carga. Un rol desconocido da actor null (fail closed). */
export function useSession(): Session {
  const user = useCurrentUser();
  return user ? { status: 'ready', actor: toActor(user) } : { status: 'loading' };
}
