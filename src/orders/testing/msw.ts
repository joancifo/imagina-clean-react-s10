// PRUEBAS · Red SIMULADA con MSW (Mock Service Worker).
//
// Qué aporta frente a pasar un `fetch` falso al adapter:
//   · se prueba el adapter ENTERO, con su URL, su método, sus cabeceras y sus credenciales;
//   · los tests se escriben en el lenguaje del protocolo («responde 409 con este cuerpo»), no en el de la librería;
//   · el mismo handler sirve para un test de adapter, para uno de pantalla y para el navegador en desarrollo.
//
// Qué NO aporta: fidelidad. Un handler dice lo que nosotros creemos que hace el backend.
// Por eso MSW no sustituye al test de CONTRATO contra el servidor de verdad (order-gateway.contract.test.ts):
// MSW prueba cómo reaccionamos a cada respuesta; el contrato comprueba que esas respuestas existen.
//
// Documentación: https://mswjs.io/docs/
import { http, HttpResponse, type HttpHandler, type JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';
import { SEED_DTOS, dtoFor } from './fixtures';

/** Base ficticia: al ser absoluta, el test no depende de dónde se ejecute. */
export const API = 'http://orderdesk.test/api';

/** El camino feliz, servido desde las MISMAS fixtures que usa el resto de la suite. */
export function ordersHandlers(): HttpHandler[] {
  return [
    http.get(`${API}/orders`, () => HttpResponse.json(SEED_DTOS)),
    http.get(`${API}/orders/:id`, ({ params }) => {
      const dto = dtoFor(String(params.id));
      return dto ? HttpResponse.json(dto) : HttpResponse.json({ error: { code: 'not-found' } }, { status: 404 });
    }),
    http.post(`${API}/orders/:id/cancel`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${API}/orders/:id/approve`, () => new HttpResponse(null, { status: 204 })),
  ];
}

/** Servidor de pruebas. Los handlers extra van DELANTE: el primero que coincide, gana. */
export const ordersServer = (...extra: HttpHandler[]) => setupServer(...extra, ...ordersHandlers());

type Method = 'get' | 'post';

/** Un error del BFF tal y como lo envía: `{ error: { code } }` y nada más. */
export const failsWith = (method: Method, path: string, status: number, code?: string): HttpHandler =>
  http[method](`${API}${path}`, () => HttpResponse.json(code === undefined ? null : { error: { code } }, { status }));

/** Una respuesta sin JSON: el 502 de un proxy, el HTML de un portal de autenticación. */
export const respondsWithText = (method: Method, path: string, status: number, body = '<html>502 Bad Gateway</html>'): HttpHandler =>
  http[method](`${API}${path}`, () => new HttpResponse(body, { status, headers: { 'content-type': 'text/html' } }));

/** Un cuerpo con la forma equivocada: el backend ha cambiado y nadie nos lo ha dicho. */
export const respondsWithJson = (method: Method, path: string, body: JsonBodyType, status = 200): HttpHandler =>
  http[method](`${API}${path}`, () => HttpResponse.json(body, { status }));

/** Sin respuesta: red caída, DNS, CORS. `fetch` RECHAZA; no devuelve un 500. */
export const networkIsDown = (method: Method, path: string): HttpHandler =>
  http[method](`${API}${path}`, () => HttpResponse.error());

/** Deja ver la petición que ha salido de verdad: método, cabeceras y credenciales. */
export function recordRequests(): { requests: Request[]; handler: HttpHandler } {
  const requests: Request[] = [];
  const handler = http.all(`${API}/*`, ({ request }) => {
    requests.push(request.clone());
    return undefined; // sigue hacia el handler siguiente
  });
  return { requests, handler };
}
