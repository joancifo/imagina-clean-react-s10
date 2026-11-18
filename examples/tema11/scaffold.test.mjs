// @vitest-environment node
import { createSlice, sliceFiles } from './scaffold.mjs';

it('crea la estructura acordada por el equipo', () => {
  expect(sliceFiles('billing').map((file) => file.path)).toEqual([
    'src/billing/domain/billing.ts', 'src/billing/application/ports.ts', 'src/billing/index.ts',
  ]);
});

it('convierte el nombre a PascalCase en el código generado', () => {
  expect(sliceFiles('credit-notes')[0].content).toContain('export type CreditNotes');
});

it('un nombre con mayúsculas o espacios no pasa', () => {
  expect(() => sliceFiles('Credit Notes')).toThrow(/no válido/);
});

it('se prueba sin tocar el disco: el efecto llega por parámetro', () => {
  const escritos = new Map();
  const rutas = createSlice('billing', { write: (path, content) => escritos.set(path, content) });
  expect(rutas).toHaveLength(3);
  expect(escritos.get('src/billing/index.ts')).toContain('API pública');
});
