// PRESENTACIÓN · Context de React como mecanismo de COMPOSICIÓN, no como Service Locator.
// - Ofrece un único tipo conocido (OrdersModule): casos de uso, nunca adapters ni un «get('loquesea')».
// - El módulo se crea fuera (src/main.tsx o el test) y entra por props: el Provider no decide nada.
import { createContext, useContext, type ReactNode } from 'react';
import type { OrdersModule } from '../composition';

const OrdersContext = createContext<OrdersModule | null>(null);

export function OrdersProvider({ module, children }: { module: OrdersModule; children: ReactNode }) {
  return <OrdersContext.Provider value={module}>{children}</OrdersContext.Provider>;
}

/** Falla en voz alta si falta el Provider: una dependencia que falta no se sustituye en silencio por otra. */
export function useOrdersModule(): OrdersModule {
  const module = useContext(OrdersContext);
  if (!module) throw new Error('useOrdersModule fuera de <OrdersProvider>: crea el módulo en src/main.tsx (o en el test)');
  return module;
}
