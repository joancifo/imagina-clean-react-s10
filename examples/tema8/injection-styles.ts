// TEMA 8 · Cuatro formas de dar a un módulo lo que necesita (y una que NO).
// Todas resuelven lo mismo: «¿cuántos pedidos pendientes hay?» a partir de un puerto PendingSource.
export interface PendingSource {
  countPending(): Promise<number>;
}

// 1 · Constructor (clase). Natural si el equipo ya trabaja con clases.
export class PendingCounter {
  constructor(private readonly source: PendingSource) {}
  async label(): Promise<string> {
    return `${await this.source.countPending()} pendientes`;
  }
}

// 2 · Parámetro de función. Lo más simple: la dependencia viaja en cada llamada.
export async function pendingLabel(source: PendingSource): Promise<string> {
  return `${await source.countPending()} pendientes`;
}

// 3 · Factory (closure). Se inyecta una vez y se usa muchas: es la forma de createCancelOrder(deps).
export function createPendingLabel(source: PendingSource): () => Promise<string> {
  return async () => `${await source.countPending()} pendientes`;
}

// 4 · Parámetro por defecto con una instancia global. CÓMODO, pero es una dependencia OCULTA:
//     quien llama sin argumentos no ve que habla con el backend real.
//     (Era el caso de useOrderSummary(reader = orderReader) hasta la Sesión 3.)
export const httpPendingSource: PendingSource = { countPending: async () => { throw new Error('llamaría a la red'); } };
export async function pendingLabelWithDefault(source: PendingSource = httpPendingSource): Promise<string> {
  return `${await source.countPending()} pendientes`;
}

// ✗ · SERVICE LOCATOR. El módulo PIDE sus dependencias a un registro global por nombre.
//     La firma no dice qué necesita; el error aparece en tiempo de ejecución; los tests se pisan entre sí.
const registry = new Map<string, unknown>();
export const locator = {
  register: (name: string, service: unknown) => registry.set(name, service),
  get: <T>(name: string): T => {
    if (!registry.has(name)) throw new Error(`Servicio no registrado: ${name}`);
    return registry.get(name) as T;
  },
  reset: () => registry.clear(),
};
export async function pendingLabelFromLocator(): Promise<string> {
  return `${await locator.get<PendingSource>('pendingSource').countPending()} pendientes`;
}
