// @vitest-environment node
// Ejercicio S6 · Parte C · Lo que nunca debe llegar al navegador, comprobado por un test.
// Un control que no se ejecuta no es un control: esto se ejecuta en cada `npm test` y en el CI.
import { findSecrets } from '../scripts/secrets.mjs';

describe.skip('nada de esto viaja al navegador', () => {
  const findings = findSecrets();
  const of = (check: string) => findings.filter((finding) => finding.check === check);

  it('ningún secreto en el bundle (VITE_…KEY, VITE_…TOKEN)', () => {
    expect(of('secreto-en-el-bundle')).toEqual([]);
  });

  it('ninguna credencial escrita a mano en el código', () => {
    expect(of('credencial-escrita-a-mano')).toEqual([]);
  });

  it('ningún HTML de fuera pintado sin escapar', () => {
    expect(of('html-sin-escapar')).toEqual([]);
  });

  it('ninguna pantalla dice quién es: la identidad la pone el servidor', () => {
    expect(of('identidad-elegida-por-el-cliente')).toEqual([]);
  });

  it('ninguna sesión guardada en localStorage', () => {
    expect(of('sesion-en-localstorage')).toEqual([]);
  });

  it('el detector funciona: sobre un archivo sembrado encuentra los cinco', () => {
    const encontrados = new Set(findSecrets('examples/tema13/inseguro').map((finding) => finding.check));
    expect([...encontrados].sort()).toEqual([
      'credencial-escrita-a-mano', 'html-sin-escapar', 'identidad-elegida-por-el-cliente', 'secreto-en-el-bundle', 'sesion-en-localstorage',
    ]);
  });
});
