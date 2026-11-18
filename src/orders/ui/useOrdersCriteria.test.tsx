// Ejercicio S5 · Parte B · El hook conecta los criterios con la URL.
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom';
import { useOrdersCriteria } from './useOrdersCriteria';

function renderAt(url: string) {
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/anterior', url]}>{children}</MemoryRouter>;
  return renderHook(() => ({ criteria: useOrdersCriteria(), location: useLocation(), navigationType: useNavigationType() }), { wrapper });
}

describe('useOrdersCriteria', () => {
  it('lee los criterios de la URL (deep link)', () => {
    const { result } = renderAt('/?status=pending&mine=1');
    expect(result.current.criteria[0]).toEqual({ text: '', status: 'pending', onlyMine: true, sort: 'date' });
  });

  it('un cambio parcial se escribe en la URL y conserva el resto de criterios y los parámetros ajenos', () => {
    const { result } = renderAt('/?debug=1&status=pending');
    act(() => result.current.criteria[1]({ text: 'hotel' }));
    expect(result.current.criteria[0]).toMatchObject({ text: 'hotel', status: 'pending' });
    expect(Object.fromEntries(new URLSearchParams(result.current.location.search))).toEqual({ debug: '1', status: 'pending', q: 'hotel' });
  });

  it('volver al valor por defecto limpia el parámetro', () => {
    const { result } = renderAt('/?status=pending');
    act(() => result.current.criteria[1]({ status: 'all' }));
    expect(result.current.location.search).toBe('');
  });

  it('reemplaza la entrada del historial: una tecla no es una página nueva', () => {
    const { result } = renderAt('/');
    act(() => result.current.criteria[1]({ text: 'h' }));
    act(() => result.current.criteria[1]({ text: 'ho' }));
    expect(result.current.navigationType).toBe('REPLACE');
    expect(result.current.location.search).toBe('?q=ho');
  });
});
