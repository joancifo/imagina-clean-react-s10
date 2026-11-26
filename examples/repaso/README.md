# Repaso · Adapters y BFF, desde cero

Sesión 10 · 17:10 – 17:55. Cada archivo es un nivel; cada nivel resuelve el problema que deja el anterior. Se leen en orden.

| Nivel | Adapter (`adapter/`) | BFF (`bff/`) |
|---|---|---|
| 1 · El problema | `01-sin-adapter.ts`: los nombres del backend en cada pantalla | `src/pages/ReturnsPage.tsx`: el navegador calcula el importe y dice su rol |
| 2 · La idea | `02-mapper.ts`: el patrón Adapter, DTO frente a dominio | `01-bff-minimo.mjs`: agregar en paralelo y recortar |
| 3 · En la arquitectura | `03-puerto.ts`: puerto, dos adapters y Composition Root | `02-confianza.mjs`: cookie firmada, lista blanca, cálculo y autorización en el servidor |
| 4 · Senior | `04-frontera.ts`: parsear, lector tolerante, traducir errores, capa anticorrupción | `03-fallos-parciales.mjs`: `allSettled`, tiempos máximos y respuestas parciales |

```bash
npm run repaso:adapter   # 12 tests, uno por idea
npm run repaso:bff       # 9 tests
node examples/repaso/bff/serve.mjs   # el BFF mínimo: http://localhost:3201/api/return-screen/P-1004
```

Dinámica final: `adapter-o-bff.md`.

## Fuentes
- E. Gamma, R. Helm, R. Johnson y J. Vlissides, *Design Patterns* (1994): patrón Adapter.
- A. Cockburn, «Hexagonal Architecture» (2005): puertos y adaptadores.
- E. Evans, *Domain-Driven Design* (2003): capa anticorrupción.
- M. Fowler, «TolerantReader» (2011).
- S. Newman, «Backends For Frontends» (2015) y *Building Microservices*, 2.ª ed. (2021).
- OWASP, *Cross-Site Request Forgery Prevention Cheat Sheet*: cookies SameSite y peticiones que cambian estado.
