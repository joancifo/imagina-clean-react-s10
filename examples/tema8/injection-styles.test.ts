// @vitest-environment node
import { createPendingLabel, locator, PendingCounter, pendingLabel, pendingLabelFromLocator, pendingLabelWithDefault, type PendingSource } from './injection-styles';

const three: PendingSource = { countPending: async () => 3 };

it('constructor, parámetro y factory: el doble de prueba entra por la puerta principal', async () => {
  expect(await new PendingCounter(three).label()).toBe('3 pendientes');
  expect(await pendingLabel(three)).toBe('3 pendientes');
  expect(await createPendingLabel(three)()).toBe('3 pendientes');
});

it('parámetro por defecto: si el test olvida pasarlo, habla con la «red» sin avisar', async () => {
  expect(await pendingLabelWithDefault(three)).toBe('3 pendientes');
  await expect(pendingLabelWithDefault()).rejects.toThrow('llamaría a la red');
});

it('service locator: la firma no dice nada; el fallo llega en tiempo de ejecución', async () => {
  locator.reset();
  await expect(pendingLabelFromLocator()).rejects.toThrow('Servicio no registrado: pendingSource');
  locator.register('pendingSource', three); // estado global compartido por TODOS los tests
  expect(await pendingLabelFromLocator()).toBe('3 pendientes');
  locator.reset();
});
