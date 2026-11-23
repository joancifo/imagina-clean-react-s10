// REGLAS DE ARQUITECTURA · Protegen la regla de dependencia en src/orders (código nuevo).
// El código heredado (src/pages, src/services…) se migra poco a poco; estas reglas no lo bloquean.
// Documentación: https://eslint.org/docs/latest/rules/no-restricted-imports
import tseslint from 'typescript-eslint';

const FRAMEWORKS = {
  group: ['react', 'react-dom', 'react-dom/*', 'react-router', 'react-router-dom', 'axios'],
  message: 'El núcleo (dominio y aplicación) no depende de frameworks ni de clientes HTTP.',
};
const BROWSER_GLOBALS = ['window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'alert'].map((name) => ({
  name,
  message: `"${name}" es un detalle del entorno: accede a él desde infraestructura, detrás de un puerto.`,
}));
// Sesión 4 · El reloj es un puerto (Clock): el núcleo no lee la hora del sistema.
const NO_SYSTEM_CLOCK = [
  { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'El núcleo no lee la hora del sistema: recibe un Clock (application/ports.ts) o la fecha por parámetro.' },
  { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'El núcleo no lee la hora del sistema: recibe un Clock (application/ports.ts) o la fecha por parámetro.' },
];
const layer = (name) => ({ group: [`**/${name}`, `**/${name}/**`], message: `Esta capa no puede importar de "${name}".` });
const composition = { group: ['**/composition'], message: 'Solo la presentación usa la composición.' };
// Sesión 7 · El núcleo no sabe que lo miden: la observabilidad se añade en composition.ts con decoradores.
const observability = { group: ['**/observability', '**/observability/**'], message: 'Dominio y aplicación no registran logs: la medición se añade en la composición (traced, observePublisher).' };

export default tseslint.config(
  { files: ['src/orders/**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },

  // DOMINIO: no importa nada de otras capas ni de frameworks, ni usa globales del navegador.
  {
    files: ['src/orders/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [FRAMEWORKS, layer('application'), layer('infrastructure'), layer('ui'), composition, observability] }],
      'no-restricted-globals': ['error', ...BROWSER_GLOBALS],
      'no-restricted-syntax': ['error', ...NO_SYSTEM_CLOCK],
    },
  },

  // APLICACIÓN: solo dominio y sus propios puertos.
  {
    files: ['src/orders/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [FRAMEWORKS, layer('infrastructure'), layer('ui'), composition, observability] }],
      'no-restricted-globals': ['error', ...BROWSER_GLOBALS],
      'no-restricted-syntax': ['error', ...NO_SYSTEM_CLOCK],
    },
  },

  // INFRAESTRUCTURA: implementa puertos; nunca conoce la presentación.
  {
    files: ['src/orders/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [layer('ui'), composition] }],
    },
  },

  // Sesión 5 · PRESENTACIÓN PURA: view models, criterios, estado y navegación (ui/orders-*.ts) no dependen de React ni del router.
  {
    files: ['src/orders/ui/orders-*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [layer('infrastructure'), { group: ['react', 'react-dom', 'react-dom/*', 'react-router', 'react-router-dom'], message: 'Un view model es una función pura: sin React y sin router. Así se prueba sin renderizar.' }] }],
    },
  },

  // Sesión 5 · COMPONENTES PRESENTACIONALES: reciben datos y callbacks por props; no se conectan a nada.
  // Sesión 8 · Sus TESTS quedan fuera: un test de componente sí usa la librería de pruebas y el kit de datos.
  {
    files: ['src/orders/ui/components/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        layer('infrastructure'), layer('application'), composition,
        { group: ['react-router', 'react-router-dom'], message: 'Un componente presentacional no navega: avisa con un callback (onOpen, onChange…).' },
        { group: ['**/OrdersProvider', '**/use[A-Z]*'], message: 'Un componente presentacional no se conecta a datos ni a casos de uso: los recibe por props.' },
      ] }],
    },
  },

  // PRESENTACIÓN: usa casos de uso y la composición; nunca un adapter concreto.
  {
    files: ['src/orders/ui/**/*.{ts,tsx}'],
    ignores: ['src/orders/ui/orders-*.ts', 'src/orders/ui/components/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [layer('infrastructure'), { group: ['axios'], message: 'La presentación no habla HTTP: usa un caso de uso.' }] }],
    },
  },
);
