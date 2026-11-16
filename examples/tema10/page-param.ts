// TEMA 10 · La URL como fuente de verdad: paginación.
// Parte pura (leer y escribir el parámetro) separada del hook que la conecta con el router.
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** La URL la escribe cualquiera: ?page=abc, ?page=-3 o ?page=2.5 no rompen la pantalla. */
export function parsePage(params: URLSearchParams): number {
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** La página 1 es el valor por defecto: no se escribe. Los demás parámetros se conservan. */
export function withPage(params: URLSearchParams, page: number): URLSearchParams {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete('page');
  else next.set('page', String(page));
  return next;
}

/** Sin useState: el estado ES la URL. Atrás/adelante, recargar y compartir el enlace funcionan sin más código. */
export function usePageParam(): [number, (page: number) => void] {
  const [params, setParams] = useSearchParams();
  const setPage = useCallback((page: number) => setParams((current) => withPage(current, page)), [setParams]);
  return [parsePage(params), setPage];
}
