import { createContext, ReactNode, useContext, useState } from 'react';
import type { User } from '../shared/types';

// Sesión 5: el store global se queda solo con lo que de verdad es global.
//   user  → sesión: la necesitan la cabecera, las rutas y las pantallas.
//   toast → aviso: lo lanza cualquier pantalla y lo pinta el shell (src/shell/ToastHost.tsx).
// Han salido: orders (estado de servidor → useOrdersList), filters (estado de URL → useOrdersCriteria)
// y selectedOrderId (nadie lo leía).
type Store = {
  user: User | null;
  setUser: (user: User | null) => void;
  toast: string | null;
  setToast: (toast: string | null) => void;
};

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  return <Ctx.Provider value={{ user, setUser, toast, setToast }}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error('useAppStore fuera del provider');
  return store;
}
