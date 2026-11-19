# ADR-005 · Migración incremental de las pantallas heredadas y observabilidad de Pedidos

- **Estado:** propuesto
- **Fecha:** 
- **Autoría:** 

> Hito del proyecto final (Sesión 7). Rellena cada apartado con evidencia: rutas, comandos y números.
> La versión de referencia del profesor está en el repositorio de solución.

## Contexto
<!-- ¿Qué código heredado queda? ¿Qué sabemos de lo que pasa en producción? ¿Qué pesa el JavaScript inicial?
     Pistas: npm run state · npm run perf:budget · lo que encontraste con el test de analítica contra el BFF -->
- 

## Opciones consideradas
| Opción | A favor | En contra |
|---|---|---|
| Reescribir las pantallas en un solo PR | | |
| Caracterizar, migrar detrás de una abstracción y borrar | | |
| Dejarlas como están | | |

| Observabilidad | A favor | En contra |
|---|---|---|
| `console.log` en los casos de uso | | |
| SDK de un proveedor en cada pantalla | | |
| Puerto `Logger` + decoradores en la composición + BFF | | |

## Decisión
<!-- Pasos de la migración. ¿Qué pantalla lleva flag y cuál no, y por qué? ¿Dónde se añaden los logs? -->

## Consecuencias
- Positivas:
- Aceptadas:
- Controles (comandos que lo vigilan):
- Revisaremos la decisión si:

## Lo que decidimos NO hacer
- 
