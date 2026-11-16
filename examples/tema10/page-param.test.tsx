import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { parsePage, usePageParam, withPage } from './page-param';

it.each([['', 1], ['page=3', 3], ['page=abc', 1], ['page=-3', 1], ['page=2.5', 1], ['page=0', 1]])('parsePage("%s") → %d', (search, expected) => {
  expect(parsePage(new URLSearchParams(search))).toBe(expected);
});

it('withPage conserva el resto de parámetros y no escribe la página 1', () => {
  expect(withPage(new URLSearchParams('status=pending'), 2).toString()).toBe('status=pending&page=2');
  expect(withPage(new URLSearchParams('status=pending&page=2'), 1).toString()).toBe('status=pending');
});

it('el botón Atrás del navegador vuelve a la página anterior sin código adicional', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/?status=pending']}>{children}</MemoryRouter>;
  const { result } = renderHook(() => ({ page: usePageParam(), location: useLocation(), navigate: useNavigate() }), { wrapper });

  act(() => result.current.page[1](2));
  act(() => result.current.page[1](3));
  expect(result.current.location.search).toBe('?status=pending&page=3');

  act(() => result.current.navigate(-1)); // Atrás
  expect(result.current.page[0]).toBe(2);
});
