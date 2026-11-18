// TEMA 12 · Cinco patrones que aparecen de verdad en un frontend, y uno que casi nunca compensa.
// Cada uno resuelve un problema concreto. Un patrón sin problema detrás es ceremonia.

// ── STRATEGY · varía el algoritmo, no el código que lo usa ─────────────────────────
// Problema: el descuento depende del tramo del cliente y la lista crece cada trimestre.
export type Discount = (amount: number) => number;
export const DISCOUNTS: Record<string, Discount> = {
  gold: (amount) => amount * 0.9,
  silver: (amount) => amount * 0.95,
  standard: (amount) => amount,
};
// Añadir «platinum» es una línea en la tabla. Sin Strategy, un if más en cada sitio que calcule precios.
export const priceFor = (tier: string, amount: number): number => (DISCOUNTS[tier] ?? DISCOUNTS.standard)(amount);

// ── FACTORY · construir algo válido, siempre de la misma manera ────────────────────
export type Reference = { value: string };
export function createReference(raw: string): Reference | null {
  const value = raw.trim().toUpperCase();
  return /^P-\d{4}$/.test(value) ? { value } : null; // no hay otra forma de tener una Reference válida
}

// ── ADAPTER + FACADE · aislar una librería ancha detrás de lo que tú necesitas ─────
export type Tracker = { track(event: string, data: Record<string, unknown>): void };
type SdkAncho = { init(): void; identify(id: string): void; logEvent(name: string, props: unknown): void; flush(): void };
/** La aplicación usa dos métodos; el SDK tiene veinte. El adapter decide cuáles existen para nosotros. */
export const createTracker = (sdk: SdkAncho): Tracker => ({ track: (event, data) => sdk.logEvent(event, data) });

// ── COMMAND · una acción con validación y ejecución separadas ──────────────────────
export type Command<T> = { check(): string | null; run(): T };
export function approveCommand(order: { status: string }, onRun: () => string): Command<string> {
  return {
    check: () => (order.status === 'pending' ? null : 'not-pending'),
    run: onRun,
  };
}

// ── OBSERVER · avisar sin saber quién escucha ──────────────────────────────────────
export function createBus<T>() {
  const listeners = new Set<(event: T) => void>();
  return {
    subscribe(listener: (event: T) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener); // devolver la baja evita fugas
    },
    emit(event: T) {
      listeners.forEach((listener) => listener(event));
    },
  };
}

// ── SINGLETON · el que casi nunca compensa ─────────────────────────────────────────
// Un módulo con estado global es cómodo hasta el primer test: dos tests comparten el mismo contador.
let contador = 0;
export const contadorGlobal = { inc: () => ++contador, value: () => contador };
// Alternativa: createContador() y que lo componga quien arranca la aplicación (Sesión 4).
export const createContador = () => {
  let propio = 0;
  return { inc: () => ++propio, value: () => propio };
};
