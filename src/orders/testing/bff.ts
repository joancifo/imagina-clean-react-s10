// PRUEBAS · Levantar el BFF de verdad y hablar con él como lo haría el navegador.
//
// Solo para tests en entorno `node` (// @vitest-environment node). A propósito NO se exporta desde
// `src/orders/testing/index.ts`: así un test de pantalla no arrastra Express sin necesitarlo.
import type { AddressInfo } from 'node:net';
import { createBff } from '../../../server/bff.mjs';

export type RunningBff = {
  /** Base de la API, con el puerto que haya quedado libre. */
  baseUrl: string;
  /** `fetch` con la cookie de sesión puesta. En el navegador esto lo hace el navegador. */
  withSession: typeof fetch;
  dispose: () => Promise<void>;
};

/**
 * Arranca el BFF en un puerto libre, abre sesión con el usuario indicado y devuelve un `fetch`
 * que lleva la cookie. Datos nuevos en cada llamada: dos tests nunca comparten estado.
 */
export async function startBff(userId: string): Promise<RunningBff> {
  const server = createBff().listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  const login = await fetch(`${baseUrl}/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  // La cookie es HttpOnly: el JavaScript de la página no la lee. Aquí sí, porque somos el navegador.
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];

  const withSession: typeof fetch = (input, init) =>
    fetch(input, { ...init, headers: { ...((init?.headers as Record<string, string>) ?? {}), cookie } });

  return { baseUrl, withSession, dispose: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}
