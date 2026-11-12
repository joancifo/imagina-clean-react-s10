// Tipos mínimos para importar la API ficticia desde los tests de contrato escritos en TypeScript.
import type { Server } from 'node:http';

export type LegacyOrderJson = Record<string, unknown>;
export interface FakeApi {
  listen(port: number, hostname: string, callback?: () => void): Server;
}
export declare const SEED_ORDERS: ReadonlyArray<LegacyOrderJson>;
export declare function createApp(seed?: ReadonlyArray<LegacyOrderJson>): FakeApi;
