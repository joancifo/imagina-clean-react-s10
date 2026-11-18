// BOUNDARIES ENTRE FEATURES · El código de fuera de src/orders solo usa Pedidos a través de su API pública.
// Así src/orders puede reorganizarse por dentro (capas, slices…) sin romper a quien la usa.
// Documentación: https://eslint.org/docs/latest/rules/no-restricted-imports
import tseslint from 'typescript-eslint';

// Sesión 6 · src/session es código nuevo, pero también usa Pedidos desde fuera: misma regla.
const LEGACY = ['pages', 'components', 'store', 'shared', 'services', 'shell', 'session'].map((dir) => `src/${dir}/**/*.{ts,tsx}`);

export default tseslint.config(
  // El plugin se registra para que los comentarios «eslint-disable» del heredado se reconozcan.
  { files: ['src/**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser }, plugins: { '@typescript-eslint': tseslint.plugin }, linterOptions: { reportUnusedDisableDirectives: 'off' } },

  // CÓDIGO HEREDADO: «../orders» sí; «../orders/domain/…», «../orders/infrastructure/…» no.
  {
    files: LEGACY,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['**/orders/**'], message: 'Usa Pedidos a través de su API pública: import { … } from "../orders".' }],
      }],
    },
  },
);
