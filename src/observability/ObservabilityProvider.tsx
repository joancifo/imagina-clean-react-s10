// OBSERVABILIDAD · Provider: el Composition Root (src/main.tsx) elige el logger y React lo reparte.
// Es composición, no un Service Locator: solo entrega UN puerto conocido, con su tipo.
import { createContext, useContext, type ReactNode } from 'react';
import type { Logger } from './port';

const LoggerContext = createContext<Logger | null>(null);

export function ObservabilityProvider({ logger, children }: { logger: Logger; children: ReactNode }) {
  return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>;
}

/** Sin Provider no se rompe nada: medir es opcional para quien mide, nunca un requisito para funcionar. */
const SILENT: Logger = { log: () => undefined };

export function useLogger(): Logger {
  return useContext(LoggerContext) ?? SILENT;
}
