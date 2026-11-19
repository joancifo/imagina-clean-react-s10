# Estrategia de testing de mi feature (hito de la Sesión 7)

**Objetivo:** que cada riesgo importante tenga un test que lo detecte, en el nivel más barato que lo pueda detectar.
La distribución no se copia de un dibujo (pirámide, trofeo, panal): sale de la arquitectura y de los riesgos.

## 1 · Qué hay hoy
Ejecuta `npm run test:map` y copia aquí las filas que importan para tu feature.

| Capa | Tests | Tiempo | Con `vi.mock` | Lectura |
|---|---|---|---|---|
| Dominio | | | | |
| | | | | |

## 2 · Riesgo → nivel
| Riesgo | Nivel | Por qué ahí | Archivo |
|---|---|---|---|
| Una regla de negocio mal escrita (umbral, rol, estado) | Unitario de dominio | Es donde vive; un test cuesta milisegundos | `src/orders/domain/*.test.ts` |
| | | | |

## 3 · Calidad, no solo cantidad
- Mutación de mi módulo más crítico (`npm run mutate -- <archivo>`): antes … % · después … %.
- Tests frágiles encontrados con `npx vitest run --sequence.shuffle`: …

## 4 · Decisiones
- Distribución elegida y por qué:
- Dónde acepto `vi.mock` y dónde no:
- Lo que decido NO probar:
