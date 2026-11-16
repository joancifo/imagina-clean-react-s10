# Prompts de la Sesión 5 — GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). Usa **Ask** para analizar y **Edit/Agent** solo cuando decidas aplicar un cambio.

## P1 · Detectar responsabilidades mezcladas en un componente (Tema 9)
```
#file:src/pages/OrderDetailPage.tsx Lista cada responsabilidad de este componente con ruta:línea
y clasifícala: carga de datos, estado derivado, regla de negocio, formato, navegación,
analítica o render. Para cada una, di a qué pieza iría: hook de datos, view model puro,
caso de uso o componente presentacional. No propongas código todavía.
```
Contrasta con `npm run state`: cada `useEffect` que llama a un `set…` es un candidato a estado derivado.

## P2 · Clasificar el estado de una pantalla (Tema 10)
```
#file:src/pages/DashboardPage.tsx #file:src/store/appStore.tsx
Para cada useState, useEffect y lectura del store: ¿es estado local de UI, de servidor,
global, de URL o derivado? Señala el estado derivado que se guarda y se sincroniza a mano,
y el estado que debería estar en la URL para que la pantalla se pueda compartir.
Separa hechos de hipótesis.
```

## P3 · Extraer un view model conservando el comportamiento
```
#file:src/pages/DashboardPage.tsx #file:src/orders/ui/orders-list-view-model.ts
Extrae un view model puro para el panel en src/orders/ui/orders-dashboard-view-model.ts,
con el mismo estilo que orders-list-view-model.ts. Usa las reglas que YA existen en
src/orders/domain (calculateTotal, canCancel…); no las reescribas.
Antes, escribe tests que fijen lo que el panel muestra hoy. No modifiques DashboardPage todavía.
```
Después: `npm test && npm run lint:arch`. Revisa: el panel heredado calcula el total **sin descuento**. ¿El test que propone Copilot fija ese error o lo corrige sin decirlo?

## P4 · Revisar rutas y permisos
```
#file:src/shell/AppRoutes.tsx #file:src/orders/domain/permissions.ts
Revisa el mapa de rutas: ¿qué rutas no tienen guard?, ¿qué pasa mientras la sesión carga?,
¿qué URL no coincide con ninguna ruta? Propón los tests que faltan en AppRoutes.test.tsx
buscando por rol y texto visible. No cambies la implementación.
```

## Criterio de revisión de las respuestas
1. ¿El view model propuesto importa React o guarda estado? (`npm run lint:arch`)
2. ¿Reescribe una regla que ya existe en `src/orders/domain`?
3. ¿Propone `useEffect` + `useState` para algo que se puede calcular?
4. ¿Añade una librería (Zustand, Redux, XState, TanStack Query) sin que haya un problema que la justifique?
5. ¿Los tests buscan por rol y texto, o por clases CSS y estructura del DOM?
