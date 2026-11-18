// Ejercicio S6 · Parte C · El adapter de sesión: la cookie viaja, el token no se toca.
import { createHttpSessionGateway } from './http-session-gateway';

const ME = { usr_id: 'u2', usr_nm: 'Pau (manager)', usr_role: 'manager' };
const respond = (status: number, body: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe.skip('Parte C · adapter de sesión', () => {
  afterEach(() => localStorage.clear());

  it('me() devuelve el actor y el nombre que dice el servidor', async () => {
    expect(await createHttpSessionGateway(respond(200, ME)).me()).toEqual({ actor: { id: 'u2', role: 'manager' }, name: 'Pau (manager)' });
  });

  it('las peticiones llevan la cookie: credentials include', async () => {
    const fetchFn = respond(200, ME);
    await createHttpSessionGateway(fetchFn, '/api').me();
    const [url, init] = vi.mocked(fetchFn).mock.calls[0] as unknown as [string, RequestInit];
    expect([url, init.credentials]).toEqual(['/api/me', 'include']);
  });

  it('un 401 es «no hay sesión», no una excepción', async () => {
    expect(await createHttpSessionGateway(respond(401, { error: { code: 'no-session' } })).me()).toBeNull();
  });

  it('sin red, tampoco hay sesión (fail closed)', async () => {
    const offline = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    expect(await createHttpSessionGateway(offline).signIn('u1')).toBeNull();
  });

  it('un rol que el dominio no conoce no concede nada', async () => {
    expect(await createHttpSessionGateway(respond(200, { ...ME, usr_role: 'superadmin' })).me()).toBeNull();
  });

  it('el adapter no guarda nada en el navegador', async () => {
    await createHttpSessionGateway(respond(200, ME)).signIn('u2');
    expect(localStorage.length).toBe(0);
  });

});
