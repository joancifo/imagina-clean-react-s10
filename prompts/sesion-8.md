# Prompts de la Sesión 8 — GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). Usa **Ask** para analizar y **Edit/Agent** solo cuando decidas aplicar un cambio.
Regla de hoy: **un test que la IA escribe es una propuesta, no una comprobación.** Un test generado que pasa a la primera y no falla nunca con el código roto no protege nada. Antes de aceptarlo: rómpelo a mano y comprueba que se pone rojo.

## P1 · Casos límite de la frontera (Tema 17 y 19)
```
#file:src/orders/infrastructure/order-dto.ts #file:src/orders/infrastructure/order-mapper.test.ts
Enumera los datos de entrada que este parser todavía no tiene cubiertos, agrupados por riesgo real
(lo que un backend puede enviar de verdad) frente a riesgo teórico. Para cada uno: qué entrada,
qué debería devolver y por qué importa. NO escribas tests todavía.
```
Criterio: si propone casos imposibles (un campo que el backend no tiene) antes que los posibles (un campo opcional que deja de llegar, un número serializado como texto), está rellenando huecos, no analizando.

## P2 · Builders y madres con nombre de negocio (Tema 17)
```
#file:src/orders/testing/builders.ts #file:src/orders/domain/order.ts #file:shared/policy.json
Propón hasta TRES «object mothers» nuevas que falten, con nombre de negocio y no de datos.
Para cada una: por qué su nombre se entiende sin leer el cuerpo, qué regla del dominio la hace
distinta de las que ya hay y un test donde se usaría. Nada de anOrderWithStatusPendingAndTier gold.
```
Después: comprueba que cada madre cumple su promesa con un test (`examples/tema17` y `builders.test.ts` enseñan cómo). Una madre que miente envenena todos los tests que la usan.

## P3 · Tests de componente orientados al comportamiento (Tema 18)
```
#file:src/orders/ui/components/CancelDialog.tsx
Escribe tests con React Testing Library y userEvent para este componente. Reglas:
- consulta por rol y nombre accesible; recurre a getByTestId solo si no hay otra forma, y dilo;
- cubre los cuatro estados que pueda tener y el comportamiento de teclado y foco;
- nada de snapshots del HTML ni de consultas por clase CSS.
Para cada test, una línea: qué comportamiento protege y qué cambio lo pondría en rojo.
```
Criterio: si el test comprueba que «el componente se renderiza» o busca por `.dialog`, no protege nada. Y si no puede escribir un test sin un `data-testid`, pregúntate si al componente le falta un nombre accesible.

## P4 · Qué le falta al contrato (Tema 19)
```
#file:src/orders/infrastructure/order-gateway.contract.ts #file:server/bff.mjs
Compara lo que el BFF puede responder con lo que este contrato comprueba.
Lista lo que el BFF hace y el contrato NO pregunta, separando:
 (a) lo que cualquier implementación del puerto debería cumplir;
 (b) lo que solo puede cumplir el adapter HTTP (sesión, red, códigos de estado).
Para cada punto, en qué archivo iría el test. No escribas código.
```
Después: añade solo los de (a) al contrato compartido. Meter en el contrato algo que un fake no puede cumplir convierte el contrato en una lista de excepciones.

## Criterio de revisión de las respuestas
1. ¿El test generado falla si rompo el código a propósito? Si no, no es un test: es una línea de cobertura.
2. ¿Usa `toBeDefined`, `toBeTruthy` o `toBeGreaterThan(0)` donde cabe un valor exacto? (`npm run test:weak`)
3. ¿Propone `vi.mock` para algo que el diseño ya permite pasar por parámetro?
4. ¿Consulta el DOM por clase, por estructura o con snapshots del HTML completo?
5. ¿Mete en el contrato compartido algo que solo puede cumplir una de las implementaciones?
6. ¿Genera una fixture copiada a mano en vez de usar `src/orders/testing`?
7. ¿Valida datos de fuera con `as` en vez de parsearlos?
