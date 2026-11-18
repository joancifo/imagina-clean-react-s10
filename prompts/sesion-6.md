# Prompts de la Sesión 6 — GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). Usa **Ask** para analizar y **Edit/Agent** solo cuando decidas aplicar un cambio.
Regla de hoy: **nunca pegues secretos, cookies, tokens ni datos reales en el chat.** Lo que escribes en un prompt sale de tu máquina.

## P1 · Mapa de confianza de una petición (Tema 11)
```
#file:src/services/api.ts #file:server/app.mjs
Recorre una petición de aprobar un pedido desde el clic hasta el cambio de estado.
En cada paso di: qué dato viaja, quién lo controla (persona usuaria, navegador, servidor)
y qué pasaría si ese dato fuese falso. Marca los pasos donde el servidor CONFÍA en el cliente.
No propongas código todavía.
```
Contrasta con `npm run audit:secrets`: el detector encuentra patrones; el mapa encuentra decisiones.

## P2 · Elegir patrón con un problema detrás (Tema 12)
```
#file:src/orders/infrastructure/gateway-failure.ts #file:examples/tema12/patterns.ts
Tengo que traducir respuestas HTTP del BFF a fallos del puerto. Compara tres formas:
cadena de if, tabla (Strategy) y clases por tipo de error. Para cada una: qué cuesta añadir
un código nuevo, qué cuesta leerla en una revisión y cómo se prueba. Recomienda una y di
en qué caso cambiarías de opinión.
```
Criterio: si la respuesta propone una jerarquía de clases para cinco códigos estables, es ceremonia.

## P3 · Revisión de seguridad de un cambio (Tema 13)
```
Revisa este diff con criterios de seguridad de frontend: secretos en el bundle,
identidad decidida por el cliente, datos sensibles en almacenamiento del navegador,
HTML sin escapar, datos externos usados sin validar y datos personales en logs o analítica.
Para cada hallazgo: archivo:línea, por qué es un riesgo y la corrección mínima.
No reescribas el código.
```
Después: compara con `npm run audit:secrets`. ¿Qué encontró el detector y Copilot no? ¿Y al revés?

## P4 · Esquema de formulario a partir del comportamiento esperado
```
#file:src/orders/ui/approval-form.test.ts
Escribe parseApprovalForm para que pasen estos tests. Requisitos: módulo puro (sin React),
devuelve todos los errores de campo a la vez, y las reglas de negocio (qué pedido necesita
justificación) vienen del dominio, no del formulario.
```
Criterio de revisión: ¿añade una librería de validación sin que nadie se la haya pedido? ¿Corta por el primer error?

## Criterio de revisión de las respuestas
1. ¿Propone comprobar permisos **solo** en el cliente?
2. ¿Deja la identidad en manos del navegador (cabecera, `localStorage`, parámetro)?
3. ¿Sugiere guardar un token donde cualquier script lo pueda leer?
4. ¿Devuelve en los errores el texto del servidor tal cual (rutas, SQL, stack)?
5. ¿Reescribe en Node una regla que ya existe en `src/orders/domain` en vez de compartir el umbral?
