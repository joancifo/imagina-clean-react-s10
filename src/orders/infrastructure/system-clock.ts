// INFRAESTRUCTURA · El reloj del sistema. El único sitio de src/orders donde se permite new Date().
import type { Clock } from '../application/ports';

export const systemClock: Clock = { now: () => new Date() };

/** Reloj fijo para tests, demos y capturas de pantalla reproducibles. */
export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });
