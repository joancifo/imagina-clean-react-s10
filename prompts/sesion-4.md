# Prompts de la Sesión 4 — GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). Usa **Ask** para analizar y **Edit/Agent** solo cuando decidas aplicar un cambio.

## P1 · Esqueleto de un caso de uso a partir de una intención (Tema 7)
```
#file:src/orders/application/ports.ts #file:src/orders/application/cancel-order.ts
Intención de producto: "un manager o un admin aprueba un pedido pendiente;
por encima de 10.000 € con IVA solo puede aprobarlo un admin".
Genera SOLO el esqueleto de createApproveOrder(deps) con el estilo de cancel-order.ts:
tipo Command de entrada, salida Result con códigos de error estables, y deps tipadas con puertos.
Usa los puertos existentes; si falta alguno, propón la interfaz mínima y explica por qué.
Sin implementación, sin React, sin fetch, sin new Date().
```
Revisa: ¿cada dependencia se usa? ¿los códigos de error son estables y sin textos de UI? ¿es un caso de uso con intención o un reenvío?

## P2 · Adapter, fake y contrato a partir de un puerto (Tema 8)
```
#file:src/orders/application/ports.ts #file:src/orders/infrastructure/order-gateway.contract.ts
Para un puerto ApprovalGateway { approve(orderId: string, approverId: string): Promise<void> } genera:
1) un adapter HTTP (POST /api/orders/:id/approve) que normalice 404/409/5xx y red caída a OrderGatewayError,
2) un fake en memoria,
3) una suite de contrato ejecutada contra los dos, como order-gateway.contract.test.ts.
No modifiques los puertos existentes ni añadas librerías.
```
Después: `npm test && npm run lint:arch`. Comprueba que el fake no «aprueba» cosas que el backend rechazaría.

## P3 · Cazar dependencias ocultas
```
#codebase Localiza dependencias ocultas en src/: instancias globales exportadas, parámetros por
defecto con instancias globales, accesos a localStorage, window o fetch fuera de infraestructura,
componentes que importan servicios concretos y cualquier registro global tipo service locator.
Para cada una: ruta:línea, qué depende de qué, cómo se sustituye hoy en un test y si merece un
puerto (o por qué no). Separa hechos de hipótesis.
```
Contrasta con `grep -rn "localStorage\|window\.\|fetch(" src --include=*.ts --include=*.tsx`.

## P4 · Revisar el Composition Root
```
#file:src/orders/composition.ts #file:src/main.tsx
Revisa la composición: ¿se crea algún adapter fuera de estos archivos? ¿algún caso de uso recibe
puertos que no usa (ISP)? Si esto se ejecutara en un BFF de Node, ¿qué debería ser singleton y qué
por petición? No propongas un contenedor IoC salvo que justifiques su coste frente a la inyección manual.
```

## Criterio de revisión de las respuestas
1. ¿El caso de uso conoce HTTP, React, `localStorage` o `new Date()`? (`npm run lint:arch`)
2. ¿Ha creado interfaces con una sola implementación que no cruzan ningún límite?
3. ¿El fake cumple el mismo contrato que el adapter real? (test de contrato)
4. ¿Ha introducido un contenedor, un registro global o un `useService('…')`?
5. ¿Los errores previsibles son códigos estables y los inesperados siguen siendo excepciones?
