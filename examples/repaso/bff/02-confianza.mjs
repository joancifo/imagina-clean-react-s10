// Repaso · BFF · NIVEL 3 · EN LA ARQUITECTURA: lo que el navegador NO puede decidir.
// Todo lo que se ejecuta en el navegador lo controla el usuario (DevTools, curl, una extensión). Por eso el BFF:
//   1. Sabe QUIÉN eres por una cookie FIRMADA y HttpOnly: el JavaScript de la página no la lee ni la puede fabricar.
//   2. Acepta solo una LISTA BLANCA del cuerpo: qué se devuelve y por qué. Ni importe, ni rol, ni usuario.
//   3. CALCULA lo que vale dinero y AUTORIZA con los mismos números que el dominio (shared/policy.json).
// En OrderDesk: server/session.mjs, server/bff.mjs (denyReason, visibleFor) y, en solucion-s10, server/returns.mjs.
import { createHmac, timingSafeEqual } from 'node:crypto';
import express from 'express';

const SECRET = 'solo-para-el-ejemplo'; // en el BFF de verdad: process.env, nunca en el código ni en VITE_
const sign = (value) => `${value}.${createHmac('sha256', SECRET).update(value).digest('base64url')}`;

/** Lee la cookie y comprueba la firma. Un usuario que se edita la cookie a «u1» no tiene la firma de «u1». */
export function userFrom(cookieHeader = '') {
  const raw = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('sid='))?.slice(4);
  if (!raw) return null;
  const value = raw.slice(0, raw.lastIndexOf('.'));
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(raw);
  return expected.length === given.length && timingSafeEqual(expected, given) ? value : null;
}

const USERS = { u1: 'admin', u2: 'manager', u3: 'agent' };
const PRICES = { 'E-50': 140 };

export function createTrustedBff() {
  const app = express();
  app.use(express.json());

  // Inicio de sesión de juguete: en OrderDesk, POST /api/session. La cookie: HttpOnly, SameSite y firmada.
  // OrderDesk usa SameSite=Strict (no viaja en ninguna petición iniciada desde otro sitio); aquí, Lax, el valor por defecto
  // de los navegadores: viaja al llegar desde un enlace externo, por eso NADA que cambie estado puede ir por GET.
  app.post('/api/session', (req, res) => {
    if (!USERS[req.body?.userId]) return res.status(401).end();
    res.setHeader('set-cookie', `sid=${sign(req.body.userId)}; HttpOnly; SameSite=Lax; Path=/`);
    res.status(204).end();
  });

  app.post('/api/orders/:id/returns', (req, res) => {
    const userId = userFrom(req.headers.cookie);
    if (!userId) return res.status(401).json({ error: { code: 'no-session' } });

    // Lista blanca: exactamente estos tres campos y con estos tipos.
    const body = req.body ?? {};
    const keys = Object.keys(body);
    if (keys.some((key) => !['sku', 'qty', 'reason'].includes(key)) || typeof body.sku !== 'string' || !Number.isInteger(body.qty) || body.qty < 1) {
      return res.status(422).json({ error: { code: 'invalid-body' } });
    }

    const role = USERS[userId]; // de la cookie, no del cuerpo
    if (role === 'agent') return res.status(403).json({ error: { code: 'forbidden' } });
    const refund = Math.round(body.qty * PRICES[body.sku] * 1.21 * 100) / 100; // lo calcula el servidor
    res.status(201).json({ refund, requestedBy: userId });
  });

  return app;
}
