// TEMA 9 · Un hook se prueba cuando tiene lógica propia. renderHook lo ejecuta dentro de un componente de prueba.
import { act, renderHook } from '@testing-library/react';
import { normalizeSearch, useDebouncedValue, useDisclosure } from './hooks';

it('la lógica pura se prueba sin React', () => {
  expect(normalizeSearch('  Hotel   BRISA ')).toBe('hotel brisa');
});

it('useDisclosure: abre, cierra y sus funciones son estables entre renders', () => {
  const { result } = renderHook(() => useDisclosure());
  const { open } = result.current;
  act(() => result.current.open());
  expect(result.current.isOpen).toBe(true);
  act(() => result.current.close());
  expect(result.current.isOpen).toBe(false);
  expect(result.current.open).toBe(open);
});

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('solo publica el último valor cuando pasan 300 ms sin cambios', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'h' } });
    rerender({ value: 'ho' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'hot' }); // el temporizador anterior se cancela en la limpieza del efecto
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('h');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('hot');
  });
});
