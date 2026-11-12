// @vitest-environment node
import { createRequestScope, createRootScope } from './node-composition';

it('dos peticiones comparten el singleton pero no el actor', () => {
  const root = createRootScope({ apiUrl: 'http://legacy' });
  const a = createRequestScope(root, { 'x-user-id': 'u1', 'x-request-id': 'A' });
  const b = createRequestScope(root, { 'x-user-id': 'u2', 'x-request-id': 'B' });
  expect(a.httpClient).toBe(b.httpClient);
  expect(root.stats().httpClientsCreated).toBe(1);
  expect([a.actor, b.actor]).toEqual([{ id: 'u1' }, { id: 'u2' }]);
});

it('transient: un valor nuevo cada vez', () => {
  const scope = createRequestScope(createRootScope({ apiUrl: 'x' }), { 'x-request-id': 'A' });
  expect([scope.newOperationId(), scope.newOperationId()]).toEqual(['A-1', 'A-2']);
});

it('el error típico: si el actor vive en estado compartido del proceso, la petición B actúa como A', () => {
  const shared: { actor: { id: string } | null } = { actor: null }; // ✗ «singleton» mutable
  const handle = (headers: Record<string, string | undefined>) => {
    if (headers['x-user-id']) shared.actor = { id: headers['x-user-id'] };
    return shared.actor;
  };
  handle({ 'x-user-id': 'u1' });          // petición A, de u1
  expect(handle({})).toEqual({ id: 'u1' }); // petición B, SIN sesión… y actúa como u1
});
