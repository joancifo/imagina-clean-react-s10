# ADR-007 · E2E de los journeys críticos y pipeline de CI

- **Estado:** propuesto · **Fecha:** 26/11/2026 · **Autoría:** <tu nombre>

> Plantilla del hito de la Sesión 9. Formato y reglas en `docs/adr/README.md`. Cada afirmación del Contexto,
> con evidencia (`ruta:línea`, salida de un comando o un test). «Sí» sin evidencia cuenta como «no lo sé».

## Contexto
- ¿Qué test comprobaba, antes de hoy, que pantalla, caso de uso, adapter, BFF y sesión funcionan enchufados?
- ¿Qué podía fallar en el pipeline heredado sin ponerlo en rojo? (líneas de `examples/tema21/ci-heredado.yml`)
- ¿Qué dato del evento entraba en un script, y qué riesgo tenía?
- ¿Dónde viven los datos del BFF y qué pasa si dos tests los tocan?

## Decisión 1 · Qué merece un E2E
| Journey | Archivo | Qué capas cruza que ningún otro test cruza |
|---|---|---|
| | | |

- Lo que NO se prueba con E2E, y qué test lo cubre ya:

## Decisión 2 · Cómo se escriben
- Localizadores:
- Esperas:
- Fixtures:

## Decisión 3 · Datos y aislamiento
| Opción | A favor | En contra |
|---|---|---|
| 1. Sin reinicio; tests que no se pisan | | |
| 2. Reinicio por test y un solo worker | | |
| 3. Un BFF por worker | | |

- Elegida, y la señal medible que haría cambiarla:
- Cómo se garantiza que el reinicio de datos no llega a producción:

## Decisión 4 · El pipeline
- Cuándo se ejecuta:
- Qué puede hacer su token:
- Qué controles ejecuta, y en qué orden (y por qué ese orden):
- Qué hace con un E2E que falla a veces:

## Consecuencias
- Qué se gana:
- Qué cuesta (tiempo de pipeline, mantenimiento):
- Qué configuración del repositorio hace falta para que proteja `main`, y quién la hace:

## Cuándo revisarla
- 
