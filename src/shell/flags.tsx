// SHELL · Feature flags (Sesión 7). Permiten tener las DOS versiones de una pantalla desplegadas a la vez
// y elegir cuál se usa sin desplegar: es la «rama por abstracción» de la migración del detalle.
// Son flags de LANZAMIENTO: viven poco. Cuando la versión nueva se queda, el flag y la versión vieja se borran.
// Referencia: P. Hodgson, «Feature Toggles (aka Feature Flags)», martinfowler.com (2017).
import { createContext, useContext, type ReactNode } from 'react';

export type FeatureFlags = { newOrderDetail: boolean };
export type FlagName = keyof FeatureFlags;

export const DEFAULT_FLAGS: FeatureFlags = { newOrderDetail: true };

/** ?flags=-newOrderDetail apaga · ?flags=newOrderDetail enciende. Lo desconocido se ignora (la URL llega de fuera). */
export function readFlags(search: string, defaults: FeatureFlags = DEFAULT_FLAGS): FeatureFlags {
  const flags = { ...defaults };
  const raw = new URLSearchParams(search).get('flags') ?? '';
  for (const token of raw.split(',').map((part) => part.trim()).filter(Boolean)) {
    const off = token.startsWith('-');
    const name = (off ? token.slice(1) : token) as FlagName;
    if (name in flags) flags[name] = !off;
  }
  return flags;
}

const FlagsContext = createContext<FeatureFlags>(DEFAULT_FLAGS);

export function FlagsProvider({ flags, children }: { flags: FeatureFlags; children: ReactNode }) {
  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}

export const useFlag = (name: FlagName): boolean => useContext(FlagsContext)[name];
