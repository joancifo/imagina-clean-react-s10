#!/usr/bin/env node
// MAPA DE LA SUITE (Sesión 7 · Tema 16). Uso: npm run test:map
// Ejecuta todos los tests una vez y agrupa el resultado por capa: cuántos tests hay en cada sitio, cuánto tardan
// y cuántos archivos usan vi.mock (cada vi.mock es una dependencia que el diseño no deja sustituir por parámetro).
// Sirve para decidir la estrategia con datos: ¿dónde está el grueso? ¿qué es lento? ¿dónde se mockea de más?
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const REPORT = '.vitest-report.json';
const vitest = path.join('node_modules', '.bin', process.platform === 'win32' ? 'vitest.cmd' : 'vitest');
try {
  execFileSync(vitest, ['run', '--reporter=json', `--outputFile=${REPORT}`], { stdio: 'pipe', shell: process.platform === 'win32' });
} catch {
  // Con tests en rojo también hay informe: se enseña igual.
}
const report = JSON.parse(readFileSync(REPORT, 'utf8'));
rmSync(REPORT, { force: true });

/** Capa a la que pertenece un archivo de test, por su ruta. El orden importa: gana la primera que encaja. */
const LAYERS = [
  ['dominio', /src\/orders\/domain\//],
  ['aplicación (casos de uso)', /src\/orders\/application\//],
  ['infraestructura (adapters)', /src\/orders\/infrastructure\//],
  ['presentación pura (view models)', /src\/orders\/ui\/(orders-|approval-form)[^/]*\.test\.ts$/],
  ['presentación React (hooks y pantallas)', /src\/orders\/ui\//],
  ['arquitectura y contratos', /src\/orders\/(architecture|boundaries|policy|observability)/],
  ['observabilidad', /src\/observability\//],
  ['sesión', /src\/session\//],
  ['shell y rutas', /src\/shell\//],
  ['caracterización (heredado)', /src\/pages\//],
  ['BFF (Node)', /server\//],
  ['ejemplos del curso', /examples\//],
  ['otros', /./],
];

const rows = new Map(LAYERS.map(([name]) => [name, { files: 0, tests: 0, ms: 0, mocks: 0 }]));
for (const file of report.testResults) {
  const relative = path.relative(process.cwd(), file.name).split(path.sep).join('/');
  const [layer] = LAYERS.find(([, pattern]) => pattern.test(relative));
  const row = rows.get(layer);
  row.files += 1;
  row.tests += file.assertionResults.length;
  row.ms += file.assertionResults.reduce((sum, test) => sum + (test.duration ?? 0), 0);
  if (/\bvi\.mock\(/.test(readFileSync(file.name, 'utf8'))) row.mocks += 1;
}

console.log('\nCapa                                      Archivos  Tests  Tiempo (ms)  Archivos con vi.mock');
let total = 0;
for (const [name, row] of rows) {
  if (row.files === 0) continue;
  total += row.tests;
  console.log(`${name.padEnd(42)} ${String(row.files).padStart(7)} ${String(row.tests).padStart(6)} ${String(Math.round(row.ms)).padStart(12)} ${String(row.mocks).padStart(10)}`);
}
console.log(`\nTotal: ${total} tests · ${report.numFailedTests} en rojo · ${report.numPendingTests} omitidos`);
