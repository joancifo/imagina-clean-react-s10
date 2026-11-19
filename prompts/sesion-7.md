# Prompts de la Sesión 7 — GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). Usa **Ask** para analizar y **Edit/Agent** solo cuando decidas aplicar un cambio.
Regla de hoy: **la IA propone hipótesis; la medición decide.** Ninguna optimización ni ningún refactor entra sin un número o un test que lo respalde.

## P1 · Interpretar una medición, no adivinar (Tema 14)
```
Pego la salida de `npm run perf:budget` y de `npm run build`.
#file:src/shell/AppRoutes.tsx #file:src/main.tsx
¿Qué módulos explican el JavaScript inicial? Propón como máximo DOS cambios para reducirlo,
ordenados por kB ahorrados estimados y por riesgo. Para cada uno: qué archivo cambia,
qué deja de descargarse y cómo comprobarías el resultado. No escribas código.
```
Criterio: si propone `memo` o `useMemo` para reducir el bundle, confunde dos problemas distintos (tiempo de render frente a bytes descargados).

## P2 · Hipótesis a partir de logs (Tema 14)
```
Estas son entradas de telemetría reales (sin datos personales) de los últimos minutos:
<pega 10–20 líneas JSON de la salida del BFF>
Agrúpalas por evento y outcome. Dame como máximo tres hipótesis de causa raíz, cada una con
la evidencia que la apoya y la prueba que la confirmaría o la descartaría. Marca qué es hecho
y qué es suposición. No propongas cambios de código todavía.
```
Después: comprueba cada hipótesis tú. Una hipótesis sin una prueba que la pueda descartar no sirve.

## P3 · Plan de refactor incremental con red (Tema 15)
```
#file:src/pages/OrderDetailPage.tsx #file:src/pages/order-detail.characterization.test.tsx
Quiero sustituir esta pantalla por una versión en src/orders sin cambiar su comportamiento visible.
1) ¿Qué comportamientos de la pantalla NO cubren todavía los tests de caracterización?
2) Propón el refactor en pasos de un PR pequeño cada uno. Para cada paso: qué cambia,
   qué test lo protege y cómo se vuelve atrás.
3) Señala cualquier comportamiento que parezca un bug: NO lo arregles, márcalo como decisión de producto.
```
Criterio: si el primer paso es «reescribir la pantalla», o si «arregla» algo sin declararlo, descártalo.

## P4 · Tests que matan mutantes (Tema 16)
```
#file:src/orders/ui/orders-dashboard.ts #file:src/orders/ui/orders-dashboard.test.ts
Estos son los mutantes que sobreviven (salida de npm run mutate):
<pega las líneas SOBREVIVE>
Para cada uno, escribe el test MÍNIMO que lo mata. Usa valores exactos (toBe/toEqual),
datos construidos con la función order() del archivo y nombres que describan comportamiento.
No modifiques orders-dashboard.ts.
```
Después: ejecuta `npm run mutate` otra vez. Si un test generado «mata» un mutante solo porque comprueba un detalle de implementación (el orden interno de un bucle, un nombre de variable), reescríbelo.

## Criterio de revisión de las respuestas
1. ¿Propone optimizar sin decir qué número mejora y cómo se mide?
2. ¿Añade logs dentro de `domain/` o `application/`, o registra `message`, `stack` o el comando entero?
3. ¿Propone un refactor grande en un solo paso, o sin tests previos?
4. ¿«Arregla» un comportamiento durante un refactor sin declararlo?
5. ¿Genera tests con `toBeDefined`, `toBeTruthy` o `toBeGreaterThan(0)` donde cabe un valor exacto?
6. ¿Usa `vi.mock` para algo que el diseño ya permite pasar por parámetro?
