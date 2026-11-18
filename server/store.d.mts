// Tipos mínimos del almacén compartido para usarlo desde tests escritos en TypeScript.
import type { LegacyOrderJson } from './app.d.mts';

export declare const SEED_ORDERS: ReadonlyArray<LegacyOrderJson>;
export declare const USERS: Record<string, { usr_id: string; usr_nm: string; usr_role: string }>;
