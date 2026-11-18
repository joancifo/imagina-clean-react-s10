// @vitest-environment node
import { ConfigError, readServerConfig } from './env.mjs';

it('lee la configuración del servidor', () => {
  expect(readServerConfig({ SESSION_SECRET: 's3cr3t', PORT: '4000' })).toEqual({ sessionSecret: 's3cr3t', port: 4000 });
});

it('sin secreto de sesión, el servidor no arranca', () => {
  expect(() => readServerConfig({})).toThrow(ConfigError);
});

it('una variable VITE_ con pinta de secreto se detecta al arrancar', () => {
  expect(() => readServerConfig({ SESSION_SECRET: 's', VITE_STRIPE_SECRET_KEY: 'sk_live_x' })).toThrow(/viajarían al navegador/);
});

it('una variable VITE_ normal no molesta', () => {
  expect(readServerConfig({ SESSION_SECRET: 's', VITE_API_URL: '/api' }).port).toBe(3001);
});
