#!/usr/bin/env node
// PRESUPUESTO DE RENDIMIENTO (Sesión 7 · Tema 14). Uso: npm run build && npm run perf:budget
// Mide lo que el navegador descarga ANTES de la primera pantalla: el JavaScript de entrada que enlaza dist/index.html
// (script de módulo y modulepreload), comprimido con gzip. Compara con perf-budget.json y sale con 1 si se pasa.
// Por qué gzip: es lo que viaja por la red. Por qué solo la entrada: lo perezoso (import()) solo se descarga si se usa.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('No hay build. Ejecuta antes: npm run build');
  process.exit(2);
}

const budget = JSON.parse(readFileSync('perf-budget.json', 'utf8'));
const html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const entry = new Set([...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((match) => match[1]));

const kb = (bytes) => bytes / 1000; // kB como los cuenta Vite
const chunks = readdirSync(path.join(DIST, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const content = readFileSync(path.join(DIST, 'assets', file));
    return { file: `assets/${file}`, raw: kb(content.length), gzip: kb(gzipSync(content).length) };
  })
  .sort((a, b) => b.gzip - a.gzip);

console.log('\nChunk                                       Tamaño    gzip   Carga');
for (const chunk of chunks) {
  const kind = entry.has(chunk.file) ? 'inicial' : 'bajo demanda';
  console.log(`${chunk.file.padEnd(42)} ${chunk.raw.toFixed(1).padStart(7)} kB ${chunk.gzip.toFixed(1).padStart(6)} kB   ${kind}`);
}

const initial = chunks.filter((chunk) => entry.has(chunk.file)).reduce((sum, chunk) => sum + chunk.gzip, 0);
const ok = initial <= budget.entryGzipKb;
console.log(`\nJavaScript inicial (gzip): ${initial.toFixed(1)} kB · presupuesto ${budget.entryGzipKb} kB · ${ok ? 'DENTRO' : 'FUERA'}`);
if (!ok) {
  console.log('Pistas: ¿qué dependencias pesadas arrastra la primera pantalla? ¿Hay pantallas que se podrían cargar con import()?');
  process.exit(1);
}
