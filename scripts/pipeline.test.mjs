// @vitest-environment node
// Ejercicio S9 · Parte B · El pipeline, como especificación ejecutable.
// No ejecuta GitHub Actions: lee .github/workflows/ci.yml y comprueba DECISIONES que se pueden leer en él.
// Lo que no se puede leer (que los tests pasen de verdad en el runner) lo dice la pestaña Actions.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8'));
const jobs = workflow.jobs ?? {};
const stepsOf = (job) => jobs[job]?.steps ?? [];
const commandsOf = (job) => stepsOf(job).map((step) => step.run ?? '').join('\n');
const allSteps = Object.values(jobs).flatMap((job) => job.steps ?? []);
const usesOf = (job, action) => stepsOf(job).find((step) => (step.uses ?? '').startsWith(`${action}@`));

describe.skip('cuándo se ejecuta', () => {
  it('en cada pull request a main y en cada push a main, y en nada más', () => {
    expect(workflow.on).toEqual({ pull_request: { branches: ['main'] }, push: { branches: ['main'] } });
  });

  it('un push nuevo a un PR cancela la ejecución anterior de ese PR', () => {
    expect(workflow.concurrency?.group).toContain('${{ github.ref }}');
    expect(workflow.concurrency?.['cancel-in-progress']).toBe("${{ github.event_name == 'pull_request' }}");
  });
});

describe.skip('qué puede hacer', () => {
  it('el token del workflow solo puede leer el repositorio', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
  });

  it('ningún script interpola datos del evento: van por variable de entorno', () => {
    const injected = allSteps.filter((step) => /\$\{\{\s*github\.event\./.test(step.run ?? ''));
    expect(injected.map((step) => step.name ?? step.run)).toEqual([]);
  });

  it('el título del PR se sigue mostrando, pero entra como variable de entorno', () => {
    const context = stepsOf('quality').find((step) => step.name === 'Contexto del PR');
    expect(context?.env).toEqual({ PR_TITLE: '${{ github.event.pull_request.title }}' });
    expect(context?.run).toContain('$PR_TITLE');
  });

  it('cada job tiene un tiempo máximo', () => {
    const withoutTimeout = Object.entries(jobs).filter(([, job]) => typeof job['timeout-minutes'] !== 'number').map(([name]) => name);
    expect(withoutTimeout).toEqual([]);
  });
});

describe.skip('calidad', () => {
  it('instala exactamente el lockfile, con la versión de Node del repositorio y la caché de npm', () => {
    expect(commandsOf('quality')).toMatch(/^npm ci$/m);
    expect(commandsOf('quality')).not.toMatch(/npm install/);
    expect(usesOf('quality', 'actions/setup-node')?.with).toEqual({ 'node-version-file': '.nvmrc', cache: 'npm' });
  });

  it('ejecuta los controles en este orden: arquitectura, tipos, tests, secretos, build y presupuesto', () => {
    const order = ['lint:arch', 'lint:boundaries', 'typecheck', 'test', 'audit:secrets', 'build', 'perf:budget'];
    const found = stepsOf('quality').map((step) => /^npm (?:run )?([\w:]+)$/.exec(step.run ?? '')?.[1]).filter((name) => order.includes(name));
    expect(found).toEqual(order);
  });

  it('ningún control puede fallar en silencio', () => {
    const silenced = allSteps.filter((step) => step['continue-on-error'] === true || /\|\|\s*true/.test(step.run ?? ''));
    expect(silenced.map((step) => step.run ?? step.uses)).toEqual([]);
  });
});

describe.skip('E2E', () => {
  it('esperan a que calidad esté en verde e instalan solo Chromium, con sus dependencias', () => {
    expect(jobs.e2e?.needs).toBe('quality');
    expect(commandsOf('e2e')).toMatch(/^npx playwright install --with-deps chromium$/m);
    expect(commandsOf('e2e')).toMatch(/^npm run test:e2e$/m);
  });

  it('guardan el informe aunque fallen, pero no si alguien cancela la ejecución', () => {
    const upload = usesOf('e2e', 'actions/upload-artifact');
    expect(upload?.if).toBe('${{ !cancelled() }}');
    expect(upload?.with).toMatchObject({ name: 'playwright-report', path: 'playwright-report/' });
  });
});
