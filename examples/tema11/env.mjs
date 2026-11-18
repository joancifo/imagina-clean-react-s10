// TEMA 11 · Variables de entorno: dos mundos que no se mezclan.
//   · Node (process.env): el servidor. Puede guardar secretos.
//   · Vite (import.meta.env): el navegador. TODO lo que empieza por VITE_ acaba en el bundle, a la vista.
// Esta función se usa al arrancar el servidor: si falta algo, el proceso NO arranca. Mejor fallar al arrancar que a medias.
export class ConfigError extends Error {}

const REQUIRED = ['SESSION_SECRET'];
const PUBLIC_PREFIX = 'VITE_';
const SECRET_WORDS = /(SECRET|KEY|TOKEN|PASSWORD)/;

export function readServerConfig(env = process.env) {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) throw new ConfigError(`Faltan variables de entorno: ${missing.join(', ')}`);

  // Un secreto publicado por error es peor que un secreto que falta: se detecta aquí.
  const leaked = Object.keys(env).filter((name) => name.startsWith(PUBLIC_PREFIX) && SECRET_WORDS.test(name));
  if (leaked.length > 0) throw new ConfigError(`Estas variables viajarían al navegador: ${leaked.join(', ')}`);

  return { sessionSecret: env.SESSION_SECRET, port: Number(env.PORT ?? 3001) };
}
