// @vitest-environment node
// Material S7 · Los flags llegan por la URL: se parsean como cualquier dato de fuera.
import { DEFAULT_FLAGS, readFlags } from './flags';

it('sin parámetro, los valores por defecto', () => {
  expect(readFlags('')).toEqual(DEFAULT_FLAGS);
});

it('«-nombre» apaga y «nombre» enciende', () => {
  expect(readFlags('?flags=-newOrderDetail').newOrderDetail).toBe(false);
  expect(readFlags('?flags=newOrderDetail', { newOrderDetail: false }).newOrderDetail).toBe(true);
});

it('un flag desconocido no se inventa', () => {
  expect(readFlags('?flags=isAdmin,-cualquierCosa')).toEqual(DEFAULT_FLAGS);
});
