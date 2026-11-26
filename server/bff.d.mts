// Tipos mínimos para usar el BFF desde tests escritos en TypeScript.
import type { Server } from 'node:http';
import type { LegacyOrderJson } from './app.d.mts';

export interface BffApp {
  listen(port: number, hostname: string, callback?: () => void): Server;
}
export type BffActor = { id: string; role: 'admin' | 'manager' | 'agent' };
export type BffAction = 'approve' | 'cancel' | 'ship';
export type BffDenial = 'forbidden' | 'conflict' | 'invalid-lines' | null;

export declare function createBff(options?: { seed?: ReadonlyArray<LegacyOrderJson>; returnsSeed?: { shipments?: Record<string, unknown>; returns?: ReadonlyArray<Record<string, unknown>> }; secret?: string; now?: () => Date; telemetrySink?: (line: Record<string, unknown>) => void; testing?: boolean }): BffApp;
export declare function totalOf(order: LegacyOrderJson): number;
export declare function denyReason(action: BffAction, order: LegacyOrderJson, actor: BffActor): BffDenial;
