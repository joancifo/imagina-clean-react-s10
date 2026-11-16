// Mapa de estado y efectos: ¿dónde se guarda estado y dónde se sincroniza con efectos?
// Pregunta que responde: ¿qué archivos concentran useState y useEffect? Un componente con muchos de los dos
// suele estar guardando estado DERIVADO y sincronizándolo a mano (react.dev · «You Might Not Need an Effect»).
// Da CANDIDATOS: un useEffect que habla con algo externo (red, temporizador) es legítimo.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve('src');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(root).filter((f) => /\.tsx?$/.test(f) && !/\.test\.|setupTests/.test(f));

const KINDS = {
  useState: /\buseState\s*[<(]/g,
  useEffect: /\buseEffect\s*\(/g,
  useReducer: /\buseReducer\s*\(/g,
  storeGlobal: /\buseAppStore\s*\(/g,
  url: /\buseSearchParams\s*\(|\buseParams\s*\(|window\.location/g,
  storage: /\blocalStorage\./g,
};

const rows = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, ''); // sin comentarios de línea
  const counts = Object.fromEntries(Object.entries(KINDS).map(([kind, re]) => [kind, (source.match(re) ?? []).length]));
  if (Object.values(counts).some((n) => n > 0)) rows.push({ archivo: relative('.', file).replaceAll('\\', '/'), ...counts });
}
rows.sort((a, b) => b.useEffect + b.useState - (a.useEffect + a.useState));
console.table(rows);
const total = (kind) => rows.reduce((sum, row) => sum + row[kind], 0);
console.log(`Totales · useState: ${total('useState')} · useEffect: ${total('useEffect')} · useReducer: ${total('useReducer')} · store global: ${total('storeGlobal')} · localStorage: ${total('storage')}`);
