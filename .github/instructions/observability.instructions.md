---
applyTo: "src/observability/**,src/orders/composition.ts,src/main.tsx"
---
# Observabilidad (Sesión 7)

- `Logger.log()` es síncrono y nunca lanza. Un `LogSink` sí puede fallar; el logger con búfer lo absorbe.
- Lista blanca: `LOG_FIELDS` en `port.ts` y `fields` en `shared/telemetry.json` son la misma lista (`telemetry.contract.test.ts`). Para añadir un campo, se cambian las dos y se justifica en el PR.
- Un evento por operación (`orders.cancel`, `orders.approve`, `orders.load_detail`), con `outcome` (`ok`, `error`, `exception`), `code` si lo hay y `durationMs`.
- Errores: `errorName`, nunca `message` ni `stack`.
- Los decoradores (`traced`, `observePublisher`) se aplican en `composition.ts`. No importes `observability` desde `src/orders/domain` ni `src/orders/application` (`npm run lint:arch`).
- Cada pantalla nueva va dentro de un `FeatureBoundary` con el nombre de su feature.
