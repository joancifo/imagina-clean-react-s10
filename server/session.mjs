// SESIÓN FIRMADA · El servidor decide quién eres; el navegador solo guarda un papel sellado que no puede falsificar.
// Formato: base64url(JSON).HMAC-SHA256. Sin secreto no hay firma válida, y el secreto solo vive en Node.
import { createHmac, timingSafeEqual } from 'node:crypto';
import policy from '../shared/policy.json' with { type: 'json' };

const b64url = (buffer) => Buffer.from(buffer).toString('base64url');

/** El secreto llega por variable de entorno. El valor por defecto solo sirve en desarrollo. */
export const sessionSecret = (env = process.env) => env.SESSION_SECRET ?? 'solo-para-desarrollo';

const sign = (payload, secret) => createHmac('sha256', secret).update(payload).digest('base64url');

export function createSessionToken(user, { now = new Date(), secret = sessionSecret() } = {}) {
  const expiresAt = now.getTime() + policy.session.ttlMinutes * 60_000;
  const payload = b64url(JSON.stringify({ sub: user.usr_id, role: user.usr_role, exp: expiresAt }));
  return `${payload}.${sign(payload, secret)}`;
}

/** Devuelve el contenido del token o null. Nunca lanza: una cookie manipulada es un caso previsible. */
export function readSessionToken(token, { now = new Date(), secret = sessionSecret() } = {}) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature ?? '');
  // Comparación en tiempo constante: una comparación normal filtra, por el tiempo de respuesta, cuántos bytes acertó quien lo intenta.
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.exp > now.getTime() ? claims : null;
  } catch {
    return null;
  }
}

/** Lee una cookie de la cabecera sin dependencias. */
export function readCookie(header, name) {
  return (header ?? '')
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === name)?.[1] ?? null;
}
