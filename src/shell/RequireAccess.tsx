// SHELL · Guard de ruta. No sabe de roles: pregunta a una regla (`can`) y pinta uno de tres estados.
// Los hijos son una función: reciben un Actor que ya NO puede ser null (el tipo demuestra que hay sesión).
import type { ReactNode } from 'react';
import type { Actor } from '../orders';
import { ForbiddenPage } from './ForbiddenPage';
import type { Session } from './session';

type Props = { session: Session; can: (actor: Actor | null) => boolean; children: (actor: Actor) => ReactNode };

export function RequireAccess({ session, can, children }: Props) {
  if (session.status === 'loading') return <main className="page">Cargando…</main>;
  if (session.actor === null || !can(session.actor)) return <ForbiddenPage />;
  return <>{children(session.actor)}</>;
}
