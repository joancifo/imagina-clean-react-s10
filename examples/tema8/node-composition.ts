// TEMA 8 · Composición en Node (BFF, scripts, SSR) y ciclos de vida.
// En el navegador hay UNA persona usuaria por proceso; en un servidor Node hay MUCHAS peticiones a la vez.
//   - singleton: uno por proceso (configuración, cliente HTTP con pool de conexiones).
//   - scoped: uno por petición (quién llama, id de correlación).
//   - transient: uno nuevo cada vez que se pide.
export type Config = { apiUrl: string };
export type Actor = { id: string };

export function createRootScope(config: Config) {
  let httpClientsCreated = 0;
  const httpClient = { id: ++httpClientsCreated, baseUrl: config.apiUrl }; // singleton
  return { config, httpClient, stats: () => ({ httpClientsCreated }) };
}

type RootScope = ReturnType<typeof createRootScope>;

/** Se llama al empezar cada petición. Nada de lo que depende de la petición puede vivir en el root. */
export function createRequestScope(root: RootScope, headers: Record<string, string | undefined>) {
  const actor: Actor | null = headers['x-user-id'] ? { id: headers['x-user-id'] } : null; // scoped
  let sequence = 0;
  const newOperationId = () => `${headers['x-request-id'] ?? 'req'}-${++sequence}`; // transient
  return { ...root, actor, newOperationId };
}
