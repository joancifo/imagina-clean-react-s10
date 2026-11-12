---
applyTo: "src/orders/domain/**,src/orders/application/**"
---
# Núcleo de pedidos (dominio y aplicación)

- Código TypeScript puro: sin React, router, axios, fetch, `window` ni `localStorage`.
- El dominio usa el lenguaje del negocio (`status`, `customerName`), nunca nombres del backend.
- Un caso de uso es una función con una intención de producto, entrada y salida explícitas, y sus dependencias como parámetros tipados con puertos de `application/ports.ts`.
- Cada caso de uso nuevo llega con tests en entorno `node` que usan un doble de prueba del puerto.

## Modelado de dominio (Sesión 3)
- Reglas de negocio como funciones puras en `domain/`. Nunca en JSX, handlers, efectos ni stores.
- Errores previsibles con `Result` (`domain/result.ts`) y códigos estables (`'too-short'`, `'forbidden'`); los textos para la persona usuaria viven en `ui/`.
- Value objects con factory: el cast al branded type solo se permite dentro de la factory.
- Transiciones inmutables: devuelven un objeto nuevo; los eventos de dominio llevan la fecha recibida por parámetro (nada de `new Date()` dentro del dominio).
- No introduzcas Aggregates, Specifications ni Domain Events si una función pura resuelve el caso.

## Casos de uso (Sesión 4)
- Un caso de uso es una factory `createX(deps)` que devuelve una función con entrada (`Command`) y salida (`Result`) explícitas.
- Orden: validar la entrada (sin E/S) → cargar → decidir con el dominio → ejecutar → notificar.
- Errores previsibles por origen: entrada, regla de dominio e infraestructura normalizada (`OrderGatewayError`). Los errores inesperados se propagan.
- La hora llega por el puerto `Clock` (`npm run lint:arch` prohíbe `new Date()` y `Date.now()` en el núcleo).
- No escribas casos de uso que solo reenvían una llamada a un puerto.
