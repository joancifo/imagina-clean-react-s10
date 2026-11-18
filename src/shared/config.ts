// Configuración del cliente. Los valores llegan por variables de entorno de Vite (.env).
import type { AnyProps } from './types';

export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
export const ANALYTICS_KEY = import.meta.env.VITE_ANALYTICS_KEY ?? 'ak_live_7f3c91b2d84e';

/** Cabeceras que acompañan a cada evento de analítica. */
export const analyticsHeaders = (): AnyProps => ({ 'x-api-key': ANALYTICS_KEY });
