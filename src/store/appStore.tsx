import { createContext, ReactNode, useContext, useState } from 'react';

// Sesión 6: en el store global queda SOLO el aviso.
//   toast → lo lanza cualquier pantalla y lo pinta el shell (src/shell/ToastHost.tsx).
// Ha salido user: la sesión tiene su propio slice (src/session), con su puerto y su Provider.
// Historial: en la Sesión 5 salieron orders (estado de servidor), filters (estado de URL) y selectedOrderId.
type Store = { toast: string | null; setToast: (toast: string | null) => void };

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  return <Ctx.Provider value={{ toast, setToast }}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error('useAppStore fuera del provider');
  return store;
}
