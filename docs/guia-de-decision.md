# Guía de decisión arquitectónica · OrderDesk

Sesión 10 · Tema 23. Lo que el curso ha trabajado, convertido en criterios para decidir **cuánta** arquitectura necesita un desarrollo. Es para llevársela al trabajo: aplícala a código nuevo y a código heredado.

> Ninguna abstracción es gratis. Cada capa, puerto o slice se paga con archivos, indirección y tiempo de onboarding. Se introduce cuando el coste de **no** tenerla ya es mayor y se puede señalar con evidencia.

## 1 · Matriz de decisión
Tres preguntas, por este orden: ¿cuánta **lógica de negocio** hay? ¿Cuántas **dependencias externas que cambian**? ¿Cuántas **personas y cuánto tiempo** va a vivir?

| Situación | Aproximación | Qué sí | Qué no (todavía) |
|---|---|---|---|
| Poca lógica, una API estable, un equipo pequeño, vida corta | **Sencilla**: componentes + hooks + funciones puras para las reglas | Tests de las funciones puras, tipos en la frontera | Puertos, BFF, capas, contenedor IoC |
| Muchas pantallas parecidas (CRUD), poca lógica, cambios frecuentes de UI | **Por features / Vertical Slice** ligera: cada feature con lo suyo | Carpeta por feature, API pública, reglas de importación | Dominio rico, Aggregates, CQRS |
| Lógica de negocio con dinero, permisos o estados; reglas que cambian | **Feature con capas internas** (dominio → aplicación → infraestructura / UI) | Dominio puro, casos de uso, tests unitarios rápidos | Capas en las features que no tienen lógica |
| Dependencias externas que cambian o se sustituyen (pasarelas, proveedores, APIs heredadas) | **Ports & Adapters** en esas fronteras | Puerto en el lenguaje del caso de uso, adapter que parsea y traduce errores, fake para tests | Puertos para lo que nunca se va a sustituir |
| Varias APIs para una pantalla, secretos, autorización real, recorte de datos | **BFF** en Node delante | Identidad, autorización, agregación y recorte en el servidor | Lógica de presentación en el BFF |

Las filas se combinan: OrderDesk es «feature con capas» en Pedidos, «Ports & Adapters» en la frontera con el backend y «BFF» delante.

## 2 · Señales
| Justifican una abstracción | Señalan sobrediseño |
|---|---|
| La misma regla aparece en dos sitios y ya se ha separado una vez (bug real) | Una interfaz con una sola implementación que no cruza ningún límite |
| Un test necesita navegador, red o reloj para probar una regla de negocio | Un caso de uso que solo reenvía la llamada al repositorio |
| Se ha cambiado o se va a cambiar de proveedor, API o librería | Capas idénticas en una feature sin lógica («por si acaso») |
| El cliente decide algo que debe decidir el servidor (importe, rol, permiso) | Patrones con nombre (Aggregate, Specification, CQRS) sin un problema concreto |
| Cambiar una pantalla obliga a tocar archivos de otras features | Más tiempo explicando la estructura que el cambio |
| Los `useEffect` sincronizan estado que se podría calcular | Un contenedor IoC para diez dependencias que caben en `composition.ts` |

## 3 · Coste de cada patrón
| Patrón | Coste | Beneficio | Se paga cuando… |
|---|---|---|---|
| Dominio puro (funciones y tipos) | Bajo: mover código y nombrarlo | Tests en milisegundos, reglas legibles | Hay reglas con dinero, permisos, estados o fechas |
| Casos de uso | Medio: un archivo por intención y sus tests | Orquestación explícita, errores tipados | Hay más de un paso con E/S (cargar, decidir, guardar, notificar) |
| Puerto + adapter | Medio: contrato, adapter, parser y fake | Frontera estable, backend sustituible en tests | El backend habla otro idioma, falla de formas previsibles o cambia |
| Composition Root manual | Bajo | Un sitio para elegir implementaciones | Hay más de un entorno (producción, tests, demo) |
| Contenedor IoC | Alto: magia, decoradores, curva | Ciclos de vida complejos | Rara vez en frontend. Necesita un ADR |
| Vertical Slice | Bajo a medio | Cambios locales, menos acoplamiento entre features | Hay muchas features independientes |
| BFF | Alto: otro servicio que desplegar y operar | Seguridad real, menos peticiones, contrato a medida | Hay secretos, autorización, varias APIs o datos que no deben salir |

## 4 · Decisiones deliberadas de NO aplicar
Escribirlas en un ADR es tan importante como las que sí se aplican. En OrderDesk:
- Sin contenedor IoC: inyección manual en `composition.ts` (ADR-002).
- Sin CQRS: lecturas y escrituras pasan por los mismos puertos; no hay modelos de lectura distintos.
- Sin Aggregates ni Domain Events reales: las reglas caben en funciones puras (Tema 6).
- Sin TanStack Query ni librería de estado global: estado de servidor local a cada pantalla y la URL como fuente de verdad; se revisará cuando una segunda pantalla comparta los mismos datos (ADR-003).

## 5 · Checklist de revisión arquitectónica
Para **código nuevo** y para cada paso de una **migración de código heredado**. Si una respuesta es «no», el PR explica por qué.

**Lugar**
- [ ] ¿Cada regla de negocio vive en un módulo puro con nombre de negocio, y no en JSX, handlers, efectos o stores?
- [ ] ¿El código de fuera de la feature usa solo su API pública? (`npm run lint:boundaries`)
- [ ] ¿Las dependencias apuntan hacia dentro? (`npm run lint:arch`)

**Fronteras**
- [ ] ¿Lo que llega de fuera se parsea antes de llegar al dominio (lista blanca, sin `as`)?
- [ ] ¿Los nombres del backend se quedan en el adapter?
- [ ] ¿Lo que decide dinero, identidad o permisos lo decide el servidor?
- [ ] ¿Los números del negocio salen de un solo sitio (`shared/policy.json`) y un test comprueba que cliente y servidor deciden igual?

**Tests**
- [ ] ¿Las reglas tienen tests unitarios sin React, red ni reloj?
- [ ] ¿El código heredado que se toca tiene antes una red de caracterización?
- [ ] ¿Las aserciones comprueban valores exactos? (`npm run test:weak`)

**Proporción**
- [ ] ¿Cada abstracción nueva resuelve un problema que se puede señalar (señales de la sección 2)?
- [ ] ¿Hay un ADR para cada decisión que cambia la estructura, incluidas las de NO aplicar algo?
- [ ] ¿El PR se revisa en 15 minutos? Si no, ¿se puede partir?

## Referencias
- R. C. Martin, *Clean Architecture* (2017): regla de dependencia y entidades, casos de uso, adaptadores y frameworks.
- A. Cockburn, «Hexagonal Architecture» (2005): puertos y adaptadores.
- J. Bogard, «Vertical Slice Architecture» (2018).
- S. Newman, «Backends For Frontends» (2015).
- M. Nygard, «Documenting Architecture Decisions» (2011): ADR.
- M. Feathers, *Working Effectively with Legacy Code* (2004): tests de caracterización y puntos de separación.
