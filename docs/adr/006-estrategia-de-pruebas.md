# ADR-006 · Validación en la frontera y estrategia de pruebas de Pedidos

- **Estado:** aceptado (versión de referencia del profesor)
- **Fecha:** 25/11/2026
- **Autoría:** Joan Cifo

## Contexto
- Todo lo que llega del backend entraba al dominio por `infrastructure/order-mapper.ts`, un archivo **sin un solo test**, y los adapters lo tipaban con `as`: `const dto: OrderDto = await response.json()`. TypeScript comprueba lo que escribimos nosotros; no comprueba la red.
- Desde la Sesión 6, el BFF recorta la respuesta de un agente: no envía `owner_id` ni `ln_items`. El mapper metía ese `undefined` en un campo declarado `string`. Consecuencia visible: un agente que marcaba «Solo míos» veía la lista vacía, siempre. Ningún test lo detectaba, porque todos los tests construían pedidos completos.
- `order-gateway.contract.test.ts` ejecutaba el contrato contra `server/app.mjs` —la API heredada, que no autoriza ni valida—. El navegador habla con `server/bff.mjs`. El contrato llevaba cuatro sesiones comprobando un backend que nadie usa.
- El fake en memoria aceptaba motivos de cancelación que el BFF rechaza con 422. Y el dominio permitía 280 caracteres donde el backend corta en 140.
- Los datos de prueba se escribían a mano en cada archivo: cuatro helpers `order(...)` distintos en cuatro archivos, que envejecían por separado.

## Decisión 1 · Validar en la frontera, y solo ahí
`parseOrderDto(raw)` comprueba forma, tipos y valores de vocabulario, y devuelve un objeto **nuevo** con los campos conocidos (lista blanca). `parseOrder` y `parseOrders` encadenan validación y traducción; los adapters no llaman a `toOrder` directamente.

| Opción | A favor | En contra |
|---|---|---|
| 1. `as` sobre la respuesta | Cero código | No comprueba nada; el fallo aparece tres capas más adentro, con otro nombre |
| 2. **Parseo a mano en la frontera** | Sin dependencias; el error dice el campo y el motivo; se prueba con datos hostiles | Hay que escribirlo y mantenerlo |
| 3. Librería de esquemas (zod, valibot) | Menos código, mensajes gratis | Una dependencia más en el bundle para seis campos; se puede adoptar después sin cambiar a quien la usa |

Se elige la 2 por tamaño: seis campos y una lista de líneas. Si el modelo crece o aparecen más DTOs, la 3 se adopta sin tocar a quien llama, porque `parseOrder` ya es la única puerta.

**Qué pasa cuando un dato no es utilizable:** el adapter lanza `OrderGatewayError('invalid')` (o `OrderReadError`), la pantalla enseña su mensaje de error y queda una entrada de telemetría con `errorName`. Lo que no se hace: pintar media lista, enseñar `NaN` o seguir con un `undefined` dentro.

**Lo que NO se valida:** los textos libres (`cust_nm`, `cust_note`) más allá de que sean texto. No es validación, es presentación: se pintan como texto (Sesión 6) y no viajan a logs ni a analítica (Sesión 7).

## Decisión 2 · «No lo sé» se dice con `null`
`Order.ownerId` pasa a ser `string | null`. Un tipo que promete un `string` que el backend no siempre manda es un tipo que miente, y el compilador deja de poder ayudar.

**Cambio de comportamiento declarado:** quien no recibe el responsable tampoco ve el filtro «Solo míos» (`canFilterByOwner`), y un criterio que no se puede aplicar se ignora en vez de vaciar la lista. Antes: lista vacía sin explicación. Ahora: el filtro no existe para ese rol.

## Decisión 3 · Niveles de prueba (`npm run test:map`)
| Riesgo | Nivel | Por qué ahí | Archivo |
|---|---|---|---|
| Una regla de negocio mal escrita | Unitario de dominio | Es donde vive; cuesta milisegundos | `src/orders/domain/*.test.ts` |
| El dominio y el BFF deciden distinto | Contrato de datos | Dos implementaciones de la misma regla | `src/orders/policy.contract.test.ts` |
| **El backend envía algo que no esperábamos** | **Unitario de frontera** | El fallo está en la traducción, no en la red | `infrastructure/order-mapper.test.ts` |
| **Reaccionamos mal a un código de estado** | **Integración con red simulada (MSW)** | Hace falta una respuesta HTTP de verdad, no un backend de verdad | `http-order-gateway.integration.test.ts` |
| **El fake acepta lo que el backend rechaza** | **Contrato del puerto, contra el BFF** | Solo se ve ejecutando lo mismo contra las dos implementaciones | `order-gateway.contract.test.ts` |
| La pantalla enseña algo falso | View model + componente (RTL) | Lo ve la persona usuaria | `orders-*-view-model.test.ts`, `components/*.test.tsx` |
| Un formulario no se puede usar sin ver | Componente (RTL + jest-dom) | Es comportamiento, no estilo | `ApproveDialog.test.tsx` (`toHaveAccessibleDescription`) |
| Una respuesta tardía pisa a otra | Hook | Es un problema de orden en React | `useOrderDetail.test.tsx` |
| Login, aprobar y cancelar de punta a punta | E2E (Sesión 9) | Pocos y críticos | `e2e/` |

**Red simulada frente a backend real.** MSW dice qué hacemos con cada respuesta; el contrato contra `server/bff.mjs` dice qué respuestas existen. Los dos hacen falta: con solo MSW, los tests demuestran lo que nosotros creemos del backend.

## Decisión 4 · Fidelidad de los fakes
- El contrato del puerto se ejecuta contra **toda** implementación: fake en memoria y adapter HTTP contra el BFF. Lo que solo puede cumplir el adapter (sesión, códigos de estado) vive en su propio `describe`, fuera del contrato compartido.
- Cuando el contrato y el fake no coinciden, se arregla **el fake**. Bajarle la exigencia al contrato convierte el contrato en una lista de excusas.
- Los números duplicados entre cliente y servidor viven en `shared/policy.json` (`cancellation.reasonMaxLength`), y los leen el dominio, el BFF y el fake. Se comparte el dato, no la implementación.
- Los datos de prueba salen de `src/orders/testing`: builders con valores por defecto válidos, madres con nombre de negocio y fixtures importadas de `server/store.mjs`. `builders.test.ts` comprueba que el kit no produce datos imposibles.

## Consecuencias
**A favor**
- Un cambio del backend se nota en la frontera, con el nombre del campo, y no tres capas más adentro.
- El contrato se ejecuta contra el backend que usa el navegador; el fake se mantiene fiel porque un test lo obliga.
- Cuando `Order` gane un campo obligatorio, se cambia un archivo y no noventa.
- Los tests de componente comprueban lo que recibe quien no ve la pantalla, no la maquetación.

**En contra / coste**
- Hay un parser que mantener (unas 40 líneas) y un contrato que crece con el backend.
- El contrato contra el BFF levanta un servidor por caso: la suite de `infrastructure` tarda unos 200 ms más.
- `null` en `ownerId` obliga a decidir en cada sitio que lo use. Es el coste de que el tipo diga la verdad.

**Cómo se comprueba**
```bash
npm test && npm run test:contract && npm run test:policy
npm run test:weak
npm run mutate -- src/orders/infrastructure/order-dto.ts --tests "src/orders/infrastructure/order-mapper.test.ts"
```

**Qué revisar si cambia el backend:** `order-dto.ts` (campos y valores), `order-gateway.contract.ts` (lo que promete el puerto) y `shared/policy.json` (los números compartidos). Si un campo nuevo tiene que llegar al dominio, entra por la lista blanca y no por un `...source`.
