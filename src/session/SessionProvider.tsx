// SESIÓN · Composición y acceso desde React.
// «Todavía no sé quién eres» (loading) NO es lo mismo que «no hay sesión» (ready con actor null):
// un guard que los confunde expulsa a la persona usuaria mientras carga.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Actor } from '../orders';
import type { SessionGateway, SessionUser } from './port';

export type Session =
  | { status: 'loading' }
  | { status: 'ready'; actor: Actor | null; name?: string | null };

type SessionContextValue = { session: Session; signIn: (userId: string) => Promise<void> };

const Ctx = createContext<SessionContextValue | null>(null);

export function SessionProvider({ gateway, children }: { gateway: SessionGateway; children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });

  const apply = useCallback((user: SessionUser | null) => {
    setSession({ status: 'ready', actor: user?.actor ?? null, name: user?.name ?? null });
  }, []);

  useEffect(() => {
    let active = true;
    gateway.me().then((user) => active && apply(user));
    return () => { active = false; };
  }, [gateway, apply]);

  const signIn = useCallback(async (userId: string) => apply(await gateway.signIn(userId)), [gateway, apply]);
  const value = useMemo(() => ({ session, signIn }), [session, signIn]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useSessionContext(): SessionContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useSession fuera de <SessionProvider>');
  return value;
}

export const useSession = (): Session => useSessionContext().session;
export const useSignIn = (): ((userId: string) => Promise<void>) => useSessionContext().signIn;
