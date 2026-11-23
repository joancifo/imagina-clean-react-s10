// @vitest-environment node
// Ejercicio S4 · Parte B · El mismo contrato contra las dos implementaciones del puerto.
//
// Sesión 8 · Hasta hoy, el adapter HTTP se ejecutaba aquí contra `server/app.mjs`: la API heredada, la que
// NO autoriza y NO valida. El navegador nunca habla con ella —habla con el BFF (`server/bff.mjs`)—, así que
// el contrato llevaba cuatro sesiones comprobando un backend que nadie usa. Un test de contrato ejecutado
// contra el servidor equivocado no es más seguro que no tenerlo: es menos, porque además tranquiliza.
import { describeOrderGatewayContract } from './order-gateway.contract';
import { createHttpOrderGateway } from './http-order-gateway';
import { createInMemoryOrderGateway } from './in-memory-order-gateway';
import { SEED_ORDERS_IN_DOMAIN, USER_IDS } from '../testing';
import { startBff } from '../testing/bff';
import { OrderGatewayError } from '../application/ports';
import { createCancellationReason, type CancellationReason } from '../domain/cancellation-reason';

// 1 · El fake en memoria, con los mismos datos que el backend.
describeOrderGatewayContract('fake en memoria', async () => ({
  gateway: createInMemoryOrderGateway([...SEED_ORDERS_IN_DOMAIN]),
}));

// 2 · El adapter HTTP contra el BFF REAL, con sesión de administrador (el rol que puede todo:
//     así el contrato habla de la capacidad del PUERTO y no de los permisos de un rol concreto).
describeOrderGatewayContract('adapter HTTP + server/bff.mjs', async () => {
  const { baseUrl, withSession, dispose } = await startBff(USER_IDS.admin);
  return { gateway: createHttpOrderGateway(withSession, baseUrl), dispose };
});

// 3 · Lo que el fake NO puede estar: sin sesión. No es un caso del contrato del puerto
//     (una implementación en memoria no tiene sesión), sino del adapter HTTP.
describe('adapter HTTP sin sesión', () => {
  const reason = createCancellationReason('Cliente duplicado en el ERP');
  if (!reason.ok) throw new Error('motivo de prueba no válido');
  const REASON: CancellationReason = reason.value;

  let baseUrl: string;
  let dispose: () => Promise<void>;
  beforeEach(async () => {
    ({ baseUrl, dispose } = await startBff(USER_IDS.admin));
  });
  afterEach(async () => {
    await dispose();
  });

  const failureOf = async (promise: Promise<unknown>) => {
    try {
      await promise;
      return 'no-error';
    } catch (error) {
      return error instanceof OrderGatewayError ? error.failure : 'other-error';
    }
  };

  it('leer sin sesión es forbidden, no un pedido vacío', async () => {
    const gateway = createHttpOrderGateway(fetch, baseUrl);
    expect(await failureOf(gateway.findById('P-1005'))).toBe('forbidden');
  });

  it('cancelar sin sesión es forbidden', async () => {
    const gateway = createHttpOrderGateway(fetch, baseUrl);
    expect(await failureOf(gateway.cancel({ orderId: 'P-1005', reason: REASON, cancelledBy: 'u1' }))).toBe('forbidden');
  });

  it('aprobar sin sesión es forbidden', async () => {
    const gateway = createHttpOrderGateway(fetch, baseUrl);
    expect(await failureOf(gateway.approve({ orderId: 'P-1005', approvedBy: 'u1' }))).toBe('forbidden');
  });
});
