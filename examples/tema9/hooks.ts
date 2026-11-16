// TEMA 9 · Hooks de UI: estado y comportamiento VISUAL reutilizable. No conocen pedidos, casos de uso ni red.
import { useCallback, useEffect, useState } from 'react';

/** Hook de UI sin efectos: abrir y cerrar algo (diálogo, menú, panel). Nombre orientado a intención. */
export function useDisclosure(initiallyOpen = false) {
  const [isOpen, setOpen] = useState(initiallyOpen);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  return { isOpen, open, close };
}

/** Lógica pura FUERA del hook: se prueba sin React. */
export function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Hook de UI con efecto: sincroniza con algo EXTERNO a React (un temporizador).
 * Ese es el uso legítimo de useEffect. La limpieza cancela el temporizador anterior.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
