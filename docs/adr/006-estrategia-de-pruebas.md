# ADR-006 · Validación en la frontera y estrategia de pruebas de Pedidos

- **Estado:** propuesto · **Fecha:** 25/11/2026 · **Autoría:** <tu nombre>

> Plantilla del hito de la Sesión 8. Rellena cada sección con lo que hayas decidido TÚ, con la evidencia
> (`ruta:línea`, salida de un comando o un test). «Sí» sin evidencia cuenta como «no lo sé».

## Contexto
- ¿Por dónde entran hoy los datos de fuera y quién los comprueba? (ruta del archivo)
- ¿Qué había antes y qué fallo concreto permitió? (el síntoma que vio la persona usuaria, no la causa técnica)
- ¿Contra qué backend se estaban ejecutando los tests de contrato y contra cuál habla el navegador?

## Decisión 1 · Validar en la frontera
- Qué se comprueba y qué se deja pasar:
- Qué pasa cuando un dato no es utilizable (¿error al usuario?, ¿lista vacía?, ¿rastro en los logs?):
- Lo que NO validamos, y por qué:

| Opción | A favor | En contra |
|---|---|---|
| 1. `as` sobre la respuesta | | |
| 2. Parseo a mano en la frontera | | |
| 3. Librería de esquemas (zod, valibot…) | | |

## Decisión 2 · Qué significa «no lo sé» en el modelo
- Campos que el backend puede no enviar y cómo se representan:
- Qué hace la interfaz cuando falta uno (¿se oculta la función?, ¿se pinta un hueco?):
- Cambio de comportamiento declarado:

## Decisión 3 · Niveles de prueba
Rellena con la forma que tiene HOY tu suite (`npm run test:map`) y la que quieres que tenga.

| Riesgo | Nivel elegido | Por qué ahí | Archivo |
|---|---|---|---|
| | | | |

- Qué se prueba con dobles escritos a mano y qué con red simulada (MSW):
- Qué se prueba contra el backend de verdad, y cuál:
- Qué NO se prueba, a propósito:

## Decisión 4 · Fidelidad de los fakes
- Cómo se evita que un fake acepte lo que el backend rechaza:
- Qué pasa cuando el contrato y el fake no coinciden:

## Consecuencias
- A favor:
- En contra / coste:
- Cómo se comprueba que se cumple (comandos):
- Qué habría que revisar si cambia el backend:
