// @vitest-environment node
// TEMA 19 · MSW en tres minutos: interceptar la red en el nivel del PROTOCOLO, no de la librería.
//
// Un `fetch` falso prueba que llamamos a nuestra propia función falsa. MSW deja intacto el código del
// adapter —su URL, su método, sus cabeceras— y responde como respondería un servidor.
// Documentación: https://mswjs.io/docs/
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const API = 'http://ejemplo.test/api';

const server = setupServer(
  http.get(`${API}/pedidos/:id`, ({ params }) =>
    params.id === 'P-1' ? HttpResponse.json({ id: 'P-1', estado: 'pendiente' }) : HttpResponse.json({ error: { code: 'not-found' } }, { status: 404 }),
  ),
);

// onUnhandledRequest: 'error' · una petición que nadie esperaba es un fallo del test, no un silencio.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers()); // los handlers de un test no se filtran al siguiente
afterAll(() => server.close());

/** El código que se quiere probar. No sabe que hay un MSW delante: usa fetch y ya está. */
async function leerPedido(id: string) {
  const response = await fetch(`${API}/pedidos/${id}`, { credentials: 'include' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

it('el camino feliz', async () => {
  expect(await leerPedido('P-1')).toEqual({ id: 'P-1', estado: 'pendiente' });
});

it('un 404 es «no existe», no una excepción', async () => {
  expect(await leerPedido('P-9')).toBeNull();
});

it('un error del servidor se instala solo para ESTE test', async () => {
  server.use(http.get(`${API}/pedidos/:id`, () => new HttpResponse(null, { status: 500 })));
  await expect(leerPedido('P-1')).rejects.toThrow('HTTP 500');
});

it('sin respuesta: fetch RECHAZA, no devuelve un 500', async () => {
  server.use(http.get(`${API}/pedidos/:id`, () => HttpResponse.error()));
  await expect(leerPedido('P-1')).rejects.toThrow();
});

it('se puede mirar la petición que ha salido de verdad', async () => {
  const peticiones: Request[] = [];
  server.use(
    http.get(`${API}/pedidos/:id`, ({ request }) => {
      peticiones.push(request.clone());
      return HttpResponse.json({ id: 'P-1', estado: 'pendiente' });
    }),
  );

  await leerPedido('P-1');

  expect(peticiones[0].credentials).toBe('include');
  expect(peticiones[0].url).toBe(`${API}/pedidos/P-1`);
});
