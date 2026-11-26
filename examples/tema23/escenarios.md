# Tema 23 · Juicio rápido: cinco escenarios

Dinámica por parejas (10 min). Para cada escenario, decidid con `docs/guia-de-decision.md`:
1. **Aproximación**: A) sencilla · B) por features / Vertical Slice · C) feature con capas internas · D) Ports & Adapters en una frontera · E) BFF. Se pueden combinar.
2. **Una cosa que NO aplicaríais**, y por qué.
3. **La señal** (sección 2 de la guía) que os ha hecho decidir.

Una pareja por escenario lo defiende en 1 minuto. El resto puede rebatir con una señal o un coste.

## 1 · Reserva de salas de RR. HH.
Dos pantallas (calendario y formulario) sobre una API interna estable. Lo mantiene una persona. Se usará seis meses, hasta que llegue la herramienta corporativa.

## 2 · Checkout de una tienda online
Dos pasarelas de pago (una de ellas se cambiará el año que viene), impuestos distintos por país, cupones con reglas que cambia Marketing cada mes. Cuatro equipos tocan el mismo frontend.

## 3 · Backoffice de catálogo
Veinticinco pantallas de alta, edición y listado sobre la misma API REST. Casi sin reglas: validaciones de formulario. Diseño cambia los formularios cada sprint.

## 4 · Panel de operaciones
Una sola pantalla con gráficos que combina cuatro APIs internas (pedidos, stock, incidencias, facturación). Hoy hace 14 peticiones al cargar y tarda 6 segundos. Dos de las APIs exigen una clave.

## 5 · Devoluciones de OrderDesk
El código del laboratorio (`src/pages/ReturnsPage.tsx`): reembolsos con dinero y descuentos, un plazo, límites por rol, un transportista que habla su propio formato y una API heredada que guarda lo que le envían.
