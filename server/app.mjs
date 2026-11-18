// API ficticia en memoria (backend HEREDADO). Reproduce un backend con nombres de campo poco expresivos.
// Sesión 6: los datos y las transiciones viven en store.mjs, compartidos con el BFF (bff.mjs).
// Este archivo sigue SIN comprobar permisos y confía en la cabecera x-user-id: es el backend que hay, no el que queremos.
import express from 'express';
import { createStore, SEED_ORDERS, USERS } from './store.mjs';

export { SEED_ORDERS } from './store.mjs';

export function createApp(seed = SEED_ORDERS) {
  const store = createStore(seed);
  const app = express();
  app.use(express.json());

  app.get('/api/me', (req, res) => res.json(USERS[req.header('x-user-id')] ?? USERS.u2));
  app.get('/api/orders', (_req, res) => res.json(store.all()));
  app.get('/api/orders/:id', (req, res) => {
    const order = store.find(req.params.id);
    return order ? res.json(order) : res.status(404).json({ err_msg: 'not found' });
  });
  app.post('/api/orders/:id/:action(approve|cancel|ship)', (req, res) => {
    const result = store.apply(req.params.id, req.params.action, { reason: req.body?.reason });
    if (result.error === 'not-found') return res.status(404).json({ err_msg: 'not found' });
    if (result.error === 'conflict') return res.status(409).json({ err_msg: 'invalid transition' });
    return res.json(result.order);
  });
  app.post('/api/logs', (_req, res) => res.status(204).end());
  return app;
}
