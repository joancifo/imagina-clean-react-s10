// PRESENTACIÓN · Context como mecanismo de composición (como OrdersProvider): un único tipo conocido, creado fuera.
import { createContext, useContext, type ReactNode } from 'react';
import type { ReturnsModule } from '../composition';

const ReturnsContext = createContext<ReturnsModule | null>(null);

export function ReturnsProvider({ module, children }: { module: ReturnsModule; children: ReactNode }) {
  return <ReturnsContext.Provider value={module}>{children}</ReturnsContext.Provider>;
}

export function useReturnsModule(): ReturnsModule {
  const module = useContext(ReturnsContext);
  if (!module) throw new Error('useReturnsModule fuera de <ReturnsProvider>: crea el módulo en src/main.tsx (o en el test)');
  return module;
}
