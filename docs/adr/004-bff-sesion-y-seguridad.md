# ADR-004 · BFF, sesión y límites de confianza

- **Estado:** propuesto
- **Fecha:** 19/11/2026
- **Autoría:** <tu nombre>

> Hito del proyecto final de la Sesión 6. Complétalo con las decisiones que tomes hoy sobre tu feature.
> La versión de referencia del profesor está en el repositorio de la solución.

## Contexto
- ¿Dónde confía hoy tu backend en el cliente? (identidad, permisos, importes, campos del cuerpo)
- ¿Qué viaja al navegador que no debería? (secretos, datos que la persona usuaria no puede ver)
- ¿Qué datos personales salen hacia logs o analítica?
- Tamaño del equipo, del producto y de lo que se puede cambiar del backend.

## Opciones consideradas
| Opción | A favor | En contra |
|---|---|---|
| 1. Arreglar el backend heredado |  |  |
| 2. Reforzar solo el cliente |  |  |
| 3. BFF propio en Node |  |  |
| 4. Gateway del proveedor |  |  |

## Decisión
<Qué decides, con qué responsabilidades exactas, y dónde se comprueba cada cosa.>

### Reglas duplicadas
<¿Qué reglas existen en dos sitios (navegador y servidor)? ¿Cómo evitas que se separen: código compartido, dato compartido o test de contrato? ¿Qué coste tiene cada opción en tu caso?>

## Consecuencias
- Positivas:
- Aceptadas:
- Controles automáticos:
- Revisaremos la decisión si:

## Lo que decidimos NO hacer
<Con el motivo. Por ejemplo: token en localStorage, compartir el dominio como paquete, quitar los permisos del cliente.>
