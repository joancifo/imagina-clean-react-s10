// @vitest-environment node
// Ejercicio S4 · Parte B · El mismo contrato contra las dos implementaciones del puerto.
import type { AddressInfo } from 'node:net';
import { createApp, SEED_ORDERS } from '../../../server/app.mjs';
import { describeOrderGatewayContract } from './order-gateway.contract';
import { createHttpOrderGateway } from './http-order-gateway';
import { createInMemoryOrderGateway } from './in-memory-order-gateway';
import type { OrderDto } from './order-dto';
import { toOrder } from './order-mapper';

// 1 · El fake en memoria, con los mismos datos que el backend.
describeOrderGatewayContract('fake en memoria', async () => ({
  gateway: createInMemoryOrderGateway((SEED_ORDERS as unknown as OrderDto[]).map(toOrder)),
}));

// 2 · El adapter HTTP contra la API ficticia REAL (Express en un puerto libre, datos nuevos en cada test).
describeOrderGatewayContract('adapter HTTP + server/app.mjs', async () => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const { port } = server.address() as AddressInfo;
  return {
    gateway: createHttpOrderGateway(fetch, `http://127.0.0.1:${port}/api`),
    dispose: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
});
