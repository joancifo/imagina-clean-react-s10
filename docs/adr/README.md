# Architecture Decision Records de OrderDesk

Un ADR registra **una** decisión de arquitectura: el contexto que la provocó, lo que se decidió, las alternativas que se descartaron y lo que cuesta. Formato basado en M. Nygard, «Documenting Architecture Decisions» (2011).

## Índice
| ADR | Decisión | Sesión | Estado |
|---|---|---|---|
| [001](001-estructura-pedidos.md) | Estructura de la feature Pedidos | 3 | aceptado |
| [002](002-inyeccion-de-dependencias.md) | Inyección de dependencias y Composition Root | 4 | aceptado |
| [003](003-estado-y-presentacion.md) | Estado y capa de presentación | 5 | aceptado |
| [004](004-bff-sesion-y-seguridad.md) | BFF, sesión y límites de confianza | 6 | aceptado |
| [005](005-migracion-y-observabilidad.md) | Migración incremental y observabilidad | 7 | aceptado |
| [006](006-estrategia-de-pruebas.md) | Validación en la frontera y estrategia de pruebas | 8 | aceptado |
| [007](007-e2e-y-ci.md) | E2E críticos y pipeline de CI | 9 | propuesto |
| [008](008-devoluciones.md) | Devoluciones: feature propia, importe y autorización en el BFF, migración detrás de un flag | 10 | propuesto |

## Cuándo se escribe uno
Cuando la decisión cumple al menos una de estas condiciones:
- Es **cara de revertir** (estructura de carpetas, límites de capa, contrato con el backend).
- Alguien la va a **cuestionar dentro de seis meses** («¿por qué los E2E van en un solo worker?»).
- Introduce una **excepción** a una regla del equipo (un `vi.mock` aceptado, una dependencia nueva en la primera pantalla).
- La pide una revisión de código: «esto necesita un ADR» es un comentario válido en un PR.

No se escribe un ADR para lo que dice una herramienta (formato, orden de imports) ni para decisiones que caben en el mensaje de un commit.

## Plantilla
```markdown
# ADR-NNN · <decisión en una frase>

- **Estado:** propuesto | aceptado | sustituido por ADR-NNN · **Fecha:** dd/mm/aaaa · **Autoría:** <nombre>

## Contexto
Qué problema hay, con evidencia (`ruta:línea`, salida de un comando, un incidente). Sin la solución.

## Decisión
Qué se hace, en presente y en una o dos frases. Después, los detalles.

| Opción | A favor | En contra |
|---|---|---|

## Consecuencias
Lo que se gana, lo que cuesta y lo que queda pendiente. Qué control automático vigila que se cumpla.

## Cuándo revisarla
La señal concreta que haría cambiar esta decisión.
```

## Reglas del equipo
1. Un ADR aceptado **no se edita**: se sustituye por otro que lo cita («sustituido por ADR-012»). La historia de por qué se decidió algo es parte del valor.
2. El ADR viaja en el **mismo PR** que el cambio que describe. Un ADR sin código es una propuesta; un cambio de arquitectura sin ADR es una sorpresa.
3. Cada decisión dice **qué la vigila**: un test, una regla de ESLint, un paso del pipeline. Si nada la vigila, se degradará.
4. Si Copilot escribe el borrador, una persona comprueba cada afirmación contra el código antes de aceptarlo.
