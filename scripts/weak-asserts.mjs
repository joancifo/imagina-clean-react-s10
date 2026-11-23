#!/usr/bin/env node
// ASERCIONES DÉBILES (Sesión 8 · Temas 17 y 18). Uso: npm run test:weak
//
// Busca en los archivos de test las comprobaciones que EJECUTAN código sin comprobar casi nada.
// Son las que explican la paradoja de la Sesión 7: 100 % de cobertura y 19 % de mutantes muertos.
// No es un linter: es una lista para mirarla con criterio. Algunas son legítimas (comprobar que algo
// NO lanza es un comportamiento), pero cada una debería poder justificarse en una línea.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'examples', 'server'];

/** Cada patrón, con lo que casi siempre debería escribirse en su lugar. */
const WEAK = [
  ['toBeDefined()', /\.toBeDefined\(\)/g, 'el valor exacto: toBe / toEqual'],
  ['toBeTruthy()', /\.toBeTruthy\(\)/g, 'el valor exacto, o toBe(true)'],
  ['toBeFalsy()', /\.toBeFalsy\(\)/g, 'toBe(false), toBeNull() o toBe(0): no son lo mismo'],
  ['toBeGreaterThan(0)', /\.toBeGreaterThan\(0\)/g, 'el número que se espera'],
  ['not.toThrow()', /\.not\.toThrow\(\)/g, 'lo que devuelve cuando no lanza'],
  ['toHaveLength(0) sobre un resultado', /\.toHaveLength\(0\)/g, 'comprobar también el caso con elementos'],
  ['expect(…).toBe(expect.anything())', /expect\.anything\(\)/g, 'el valor concreto'],
];

/** Dependencias que el diseño no deja sustituir por parámetro: cada una es una pregunta para el PR. */
const MOCKS = [['vi.mock(', /vi\.mock\(/g, 'pasar la dependencia por parámetro (puerto)']];

function* testFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* testFiles(full);
    else if (/\.test\.(ts|tsx|mjs)$/.test(entry)) yield full;
  }
}

const rows = [];
let total = 0;
let mocks = 0;

for (const root of ROOTS) {
  for (const file of testFiles(root)) {
    const source = readFileSync(file, 'utf8');
    const found = [];
    for (const [label, pattern] of [...WEAK, ...MOCKS]) {
      const count = (source.match(pattern) ?? []).length;
      if (count === 0) continue;
      found.push(`${label} × ${count}`);
      if (label === 'vi.mock(') mocks += count;
      else total += count;
    }
    if (found.length > 0) rows.push([file, found.join(' · ')]);
  }
}

const width = Math.max(10, ...rows.map(([file]) => file.length));
console.log('\nArchivo'.padEnd(width + 3) + 'Qué se ha encontrado');
console.log('-'.repeat(width + 3 + 40));
for (const [file, found] of rows.sort()) console.log(file.padEnd(width + 2) + ' ' + found);

console.log(`\nAserciones débiles: ${total} · vi.mock: ${mocks}`);
console.log('\nQué poner en su lugar:');
for (const [label, , better] of [...WEAK, ...MOCKS]) console.log(`  ${label.padEnd(34)} → ${better}`);
console.log('\nUna aserción débil no es un error: es una pregunta. Si no sabes responderla, el test no comprueba nada.');
