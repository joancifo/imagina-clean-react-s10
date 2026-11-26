// Tipos mínimos para usar las reglas de devoluciones del BFF desde tests escritos en TypeScript.
import type { LegacyOrderJson } from './app.d.mts';

export type ReturnDenial = 'forbidden' | 'not-returnable' | 'invalid-body' | 'quantity-exceeded' | 'needs-admin' | null;
export declare const RETURN_REASONS: ReadonlyArray<string>;
export declare function refundOf(input: { unitPrice: number; quantity: number; tier: string; reason: string }): number;
export declare function withinWindow(deliveredAt: string, now: Date): boolean;
export declare function returnDenial(input: {
  order: LegacyOrderJson;
  shipment: { trk_no: string; sts_cd: string; dlv_ts: string | null } | null;
  previous: ReadonlyArray<{ sku: string; qty: number }>;
  actor: { id: string; role: string };
  sku: string;
  quantity: number;
  reason: string;
  now: Date;
}): ReturnDenial;
