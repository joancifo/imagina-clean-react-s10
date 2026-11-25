# Tema 21 · IA aplicada al flujo de CI/CD existente

Material para trabajar sobre un pipeline **que ya existe**. No se empieza por «cómo se crea un workflow»: se empieza por leer el que hay, entender qué protege de verdad y cambiarlo en pasos pequeños y revisables.

## `ci-heredado.yml` · Lo que el verde esconde
Copia del pipeline con el que arranca la Sesión 9 (`.github/workflows/ci.yml` en la rama `main`). Lleva meses en verde. Antes de tocarlo, recórrelo con estas preguntas:

| Pregunta | Dónde mirar |
|---|---|
| ¿Cuándo se ejecuta, y cuántas veces por cada push a un PR? | `on:` |
| ¿Qué puede hacer el token con el que corre? | `permissions:` (si no está, se aplican los permisos por defecto del repositorio) |
| ¿Algún control puede fallar sin que el pipeline se ponga rojo? | `continue-on-error`, `\|\| true` |
| ¿Instala lo que dice el lockfile o lo que encuentre ese día? | `npm install` frente a `npm ci` |
| ¿Con qué Node se ejecuta, y es el mismo con el que desarrollamos? | `node-version` frente a `.nvmrc` |
| ¿Hay datos que escribe un tercero metidos dentro de un script? | `${{ github.event.… }}` dentro de `run:` |
| ¿Qué controles del repositorio NO ejecuta? | Compara con los scripts de `package.json` |
| ¿Cuánto puede tardar antes de que alguien lo pare? | `timeout-minutes` |

## `logs/` · Diagnostica el log
Cinco fallos de CI. Son **salidas reales** de las herramientas del repositorio, capturadas en local provocando cada fallo a propósito; solo se han cambiado las rutas absolutas por las de un runner de GitHub y el nombre del archivo de test.

| Log | Paso que falla |
|---|---|
| `01-typecheck.log` | `npm run typecheck` |
| `02-npm-ci.log` | `npm ci` |
| `03-e2e.log` | `npm run test:e2e` |
| `04-actionlint.log` | revisión del workflow con actionlint |
| `05-perf-budget.log` | `npm run perf:budget` |

Para cada uno, en este orden y **antes** de preguntar a Copilot:
1. **Tipo de fallo:** código · test · dependencias · configuración del pipeline · rendimiento · seguridad.
2. **Causa probable**, citando la línea del log que lo demuestra.
3. **Cómo reproducirlo en local** (un comando).
4. **Cambio mínimo** que lo arregla sin desactivar nada.
5. **Quién tiene que validarlo** (tú, quien revisa el PR, quien administra el repositorio).

Después, pide el mismo diagnóstico con la skill `/diagnosticar-fallo-ci` (`.github/skills/diagnosticar-fallo-ci/SKILL.md`) y compara. La pregunta que importa no es «¿ha acertado?», sino «¿cómo lo sabría si no lo supiera ya?».

## Comprobaciones deterministas antes que IA
- `npm run test:pipeline` · el pipeline como especificación (`scripts/pipeline.test.mjs`).
- `actionlint` ([rhysd/actionlint](https://github.com/rhysd/actionlint)) · errores de sintaxis, expresiones y datos no fiables en scripts. No forma parte del repositorio: se instala aparte.
- La extensión **GitHub Actions** de Visual Studio Code valida el YAML mientras se escribe.

La IA interpreta y propone. Lo que se puede comprobar con una herramienta determinista, se comprueba con ella.
