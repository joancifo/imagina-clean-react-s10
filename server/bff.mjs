// BFF (Backend For Frontend) · Node delante de la API heredada.
// Hace las TRES cosas que el navegador no puede hacer por sí mismo:
//   1. Decir quién eres (sesión firmada en cookie HttpOnly: el JavaScript de la página no la lee).
//   2. Decidir si puedes (autorización real, con los umbrales de shared/policy.json).
//   3. Decidir qué datos salen (un agente no recibe importes: lo que no puede ver, no viaja).
// Lo que NO hace: presentación. Devuelve datos, no textos de pantalla.
import express from 'express';
import policy from '../shared/policy.json' with { type: 'json' };
import { createSessionToken, readCookie, readSessionToken, sessionSecret } from './session.mjs';
import { createStore, USERS } from './store.mjs';

const COOKIE = policy.session.cookieName;

/** Total con descuento por tramo e IVA. Mismos números que el dominio: salen de shared/policy.json. */
export function totalOf(order) {
  const subtotal = order.ln_items.reduce((sum, line) => sum + line.qty * line.unit_prc, 0);
  const discount = policy.pricing.discountByTier[order.cust_tier] ?? 0;
  return subtotal * (1 - discount) * (1 + policy.pricing.vat);
}

/** Autorización REAL. Devuelve null si se permite, o el código del fallo. */
export function denyReason(action, order, actor) {
  if (actor.role === 'agent') return 'forbidden';
  if (action === 'approve') {
    if (order.ord_st !== 'pending') return 'conflict';
    if (order.ln_items.length === 0 || order.ln_items.some((line) => line.qty <= 0)) return 'invalid-lines';
    if (totalOf(order) > policy.approval.adminFrom && actor.role !== 'admin') return 'forbidden';
    return null;
  }
  if (action === 'cancel') {
    if (order.ord_st === 'shipped' || order.ord_st === 'cancelled') return 'conflict';
    if (actor.role === 'admin') return null;
    if (order.ord_st !== 'pending') return 'forbidden';
    return totalOf(order) < policy.cancellation.managerLimit ? null : 'forbidden';
  }
  return actor.role === 'admin' || actor.role === 'manager' ? null : 'forbidden';
}

/** Cuerpo de error ÚNICO: un código estable y nada más. Ni stack, ni SQL, ni nombres internos. */
const fail = (res, status, code) => res.status(status).json({ error: { code } });

/** Validación de entrada: lista blanca de campos. Lo que no está previsto, no entra. */
function readCancelBody(body) {
  if (body === undefined || body === null) return { error: 'invalid-body' };
  const keys = Object.keys(body);
  if (keys.some((key) => key !== 'reason')) return { error: 'invalid-body' };
  const reason = body.reason;
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 140) return { error: 'invalid-body' };
  return { value: { reason: reason.trim() } };
}

/** Un agente no recibe importes ni responsables: el dato no sale del servidor. */
function visibleFor(order, actor) {
  const { cancel_rsn: _omit, ...rest } = order;
  if (actor.role !== 'agent') return rest;
  return { ...rest, owner_id: undefined, ln_items: [] };
}

export function createBff({ seed, secret = sessionSecret(), now = () => new Date() } = {}) {
  const store = createStore(seed);
  const app = express();
  app.use(express.json({ limit: '32kb' }));

  /** Quién eres: solo desde la cookie firmada. Nunca desde una cabecera que escribe el cliente. */
  const actorOf = (req) => {
    const claims = readSessionToken(readCookie(req.header('cookie'), COOKIE), { now: now(), secret });
    return claims ? { id: claims.sub, role: claims.role } : null;
  };
  const authenticated = (req, res, next) => {
    const actor = actorOf(req);
    if (!actor) return fail(res, 401, 'no-session');
    req.actor = actor;
    return next();
  };

  // Alta de sesión. En el curso basta con elegir usuario; en producción, aquí irían credenciales.
  app.post('/api/session', (req, res) => {
    const user = USERS[req.body?.userId];
    if (!user) return fail(res, 401, 'no-session');
    const token = createSessionToken(user, { now: now(), secret });
    // HttpOnly: inaccesible desde document.cookie · SameSite=Strict: no viaja desde otro sitio · Path=/api: solo donde hace falta.
    res.setHeader('set-cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${policy.session.ttlMinutes * 60}`);
    return res.json({ usr_id: user.usr_id, usr_nm: user.usr_nm, usr_role: user.usr_role });
  });

  app.get('/api/me', authenticated, (req, res) => res.json(USERS[req.actor.id]));

  app.get('/api/orders', authenticated, (req, res) => res.json(store.all().map((order) => visibleFor(order, req.actor))));

  app.get('/api/orders/:id', authenticated, (req, res) => {
    const order = store.find(req.params.id);
    return order ? res.json(visibleFor(order, req.actor)) : fail(res, 404, 'not-found');
  });

  app.post('/api/orders/:id/:action(approve|cancel|ship)', authenticated, (req, res) => {
    const { id, action } = req.params;
    const body = action === 'cancel' ? readCancelBody(req.body) : { value: {} };
    if (body.error) return fail(res, 422, body.error);

    const order = store.find(id);
    if (!order) return fail(res, 404, 'not-found');

    const denied = denyReason(action, order, req.actor);
    if (denied === 'conflict') return fail(res, 409, 'conflict');
    if (denied) return fail(res, 403, denied);

    const result = store.apply(id, action, body.value);
    if (result.error) return fail(res, result.error === 'conflict' ? 409 : 404, result.error);
    return res.json(visibleFor(result.order, req.actor));
  });

  // Analítica: lista blanca de campos. Un texto libre del cliente no se reenvía a ningún proveedor.
  app.post('/api/logs', authenticated, (req, res) => {
    const allowed = ['level', 'name', 'payload'];
    const payloadKeys = Object.keys(req.body?.payload ?? {});
    const extraneous = Object.keys(req.body ?? {}).some((key) => !allowed.includes(key));
    if (extraneous || payloadKeys.some((key) => !['id', 'by', 'code', 'total', 'at'].includes(key))) return fail(res, 422, 'invalid-body');
    return res.status(204).end();
  });

  app.use((_req, res) => fail(res, 404, 'not-found'));
  return app;
}
