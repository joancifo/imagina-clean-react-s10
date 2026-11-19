#!/usr/bin/env node
// MUTATION TESTING mínimo (Sesión 7 · Tema 16). Uso:
//   npm run mutate -- src/orders/ui/orders-dashboard.ts
//   npm run mutate -- examples/tema16/discount.ts --tests "examples/tema16/discount.*test.ts"
//   npm run mutate -- <archivo> --check     # sale con código 1 si sobrevive algún mutante (para CI)
//
// Qué hace: introduce UN cambio pequeño en el código (un «mutante»: === por !==, && por ||, 'pending' por ''…),
// ejecuta los tests de ese archivo y mira si alguno falla. Si fallan, el mutante MUERE: los tests protegen esa línea.
// Si todos siguen en verde, el mutante SOBREVIVE: esa línea se ejecuta (cuenta en la cobertura) pero nadie comprueba
// lo que hace. Al terminar, el archivo original se restaura SIEMPRE.
//
// Es una versión didáctica y transparente de lo que hace Stryker (https://stryker-mutator.io), con un subconjunto
// de sus operadores y los mismos nombres. En un proyecto real, usad Stryker: es incremental, paralelo y más completo.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('--') && args[args.indexOf(arg) - 1] !== '--tests');
const testsIndex = args.indexOf('--tests');
const check = args.includes('--check');

if (!target || !existsSync(target)) {
  console.error('Uso: npm run mutate -- <archivo.ts> [--tests "<patrón de tests>"] [--check]');
  process.exit(2);
}

const defaultTests = target.replace(/\.(tsx?|mjs)$/, '.test.$1');
const tests = testsIndex >= 0 ? args[testsIndex + 1] : defaultTests;
const original = readFileSync(target, 'utf8');
const source = ts.createSourceFile(target, original, ts.ScriptTarget.Latest, true, target.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

// ── Operadores (mismos nombres que Stryker) ──────────────────────────────────────────
const K = ts.SyntaxKind;
const BINARY = {
  [K.EqualsEqualsEqualsToken]: ['EqualityOperator', '!=='],
  [K.ExclamationEqualsEqualsToken]: ['EqualityOperator', '==='],
  [K.LessThanToken]: ['EqualityOperator', '<='],
  [K.LessThanEqualsToken]: ['EqualityOperator', '<'],
  [K.GreaterThanToken]: ['EqualityOperator', '>='],
  [K.GreaterThanEqualsToken]: ['EqualityOperator', '>'],
  [K.AmpersandAmpersandToken]: ['LogicalOperator', '||'],
  [K.BarBarToken]: ['LogicalOperator', '&&'],
  [K.QuestionQuestionToken]: ['LogicalOperator', '&&'],
  [K.PlusToken]: ['ArithmeticOperator', '-'],
  [K.MinusToken]: ['ArithmeticOperator', '+'],
  [K.AsteriskToken]: ['ArithmeticOperator', '/'],
  [K.SlashToken]: ['ArithmeticOperator', '*'],
  [K.PlusEqualsToken]: ['AssignmentOperator', '-='],
  [K.MinusEqualsToken]: ['AssignmentOperator', '+='],
  [K.AsteriskEqualsToken]: ['AssignmentOperator', '/='],
};

const mutants = [];
const add = (node, start, end, replacement, mutator) => {
  const { line, character } = source.getLineAndCharacterOfPosition(start);
  mutants.push({ start, end, replacement, mutator, original: original.slice(start, end), where: `${line + 1}:${character + 1}` });
};

/** No se mutan tipos, imports, claves de objetos ni nombres: solo código que se ejecuta. */
const inTypePosition = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isTypeNode(current) || ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) return true;
  }
  return false;
};

function visit(node) {
  if (ts.isBinaryExpression(node) && BINARY[node.operatorToken.kind]) {
    const [mutator, replacement] = BINARY[node.operatorToken.kind];
    // + entre textos (concatenación) no es aritmética: se deja.
    const isText = (side) => ts.isStringLiteral(side) || ts.isTemplateExpression(side) || ts.isNoSubstitutionTemplateLiteral(side);
    if (!(node.operatorToken.kind === K.PlusToken && (isText(node.left) || isText(node.right)))) {
      add(node, node.operatorToken.getStart(source), node.operatorToken.getEnd(), replacement, mutator);
    }
  }
  if ((ts.isIfStatement(node) || ts.isConditionalExpression(node)) && !inTypePosition(node)) {
    const condition = ts.isIfStatement(node) ? node.expression : node.condition;
    add(node, condition.getStart(source), condition.getEnd(), 'true', 'ConditionalExpression');
    add(node, condition.getStart(source), condition.getEnd(), 'false', 'ConditionalExpression');
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === K.ExclamationToken) {
    add(node, node.getStart(source), node.operand.getStart(source), '', 'UnaryOperator');
  }
  if (node.kind === K.TrueKeyword || node.kind === K.FalseKeyword) {
    if (!inTypePosition(node)) add(node, node.getStart(source), node.getEnd(), node.kind === K.TrueKeyword ? 'false' : 'true', 'BooleanLiteral');
  }
  if (ts.isStringLiteral(node) && !inTypePosition(node) && node.text !== '') {
    const parent = node.parent;
    const isKey = (ts.isPropertyAssignment(parent) && parent.name === node) || ts.isElementAccessExpression(parent);
    const isModule = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent);
    if (!isKey && !isModule) add(node, node.getStart(source), node.getEnd(), "''", 'StringLiteral');
  }
  ts.forEachChild(node, visit);
}
visit(source);

if (mutants.length === 0) {
  console.log(`Sin mutantes posibles en ${target}.`);
  process.exit(0);
}

// ── Ejecución ─────────────────────────────────────────────────────────────────────
const vitest = path.join('node_modules', '.bin', process.platform === 'win32' ? 'vitest.cmd' : 'vitest');
const runTests = () => {
  try {
    execFileSync(vitest, ['run', ...tests.split(' ')], { stdio: 'pipe', shell: process.platform === 'win32' });
    return true; // todo en verde
  } catch {
    return false; // algún test falla (o el mutante no compila: también cuenta como muerto)
  }
};

const restore = () => writeFileSync(target, original);
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

console.log(`\nMutation testing · ${target}`);
console.log(`Tests: ${tests}`);
if (!runTests()) {
  console.error('\nLos tests NO están en verde sin mutar nada. Arréglalos antes de medir.');
  process.exit(2);
}
console.log(`${mutants.length} mutantes. Cada uno ejecuta los tests (puede tardar un poco).\n`);

const survivors = [];
try {
  mutants.forEach((mutant, index) => {
    writeFileSync(target, original.slice(0, mutant.start) + mutant.replacement + original.slice(mutant.end));
    const survived = runTests();
    const label = survived ? 'SOBREVIVE' : 'muerto   ';
    const shownReplacement = mutant.replacement === '' ? '(nada)' : mutant.replacement;
    console.log(`${String(index + 1).padStart(3)}  ${label}  L${mutant.where.padEnd(7)} ${mutant.mutator.padEnd(22)} ${mutant.original.slice(0, 40)}  ->  ${shownReplacement}`);
    if (survived) survivors.push(mutant);
  });
} finally {
  restore();
}

const killed = mutants.length - survivors.length;
const score = Math.round((killed / mutants.length) * 100);
console.log(`\nPuntuación de mutación: ${score} % (${killed} muertos de ${mutants.length})`);
if (survivors.length > 0) {
  console.log('Cada superviviente es un comportamiento que ningún test comprueba. Escribe el test que lo mata,');
  console.log('o justifica en el PR por qué es un mutante equivalente (no cambia el comportamiento observable).');
}
if (check && survivors.length > 0) process.exit(1);
