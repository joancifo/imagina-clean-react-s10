// PRUEBAS · API del kit de pruebas de la feature Pedidos.
// Los tests importan de aquí: `import { anOrder, aManager, renderOrders } from '../testing';`
// Igual que `src/orders/index.ts` es la API pública de la feature para la aplicación,
// esto es su API pública para los tests: por dentro se puede reorganizar sin tocar 90 archivos.
export { aDto, aLine, aCancelledOrder, aHugeOrder, anActor, anAdmin, anAgent, anApprovedOrder, anOrder, anOrderWithoutOwner, anUrgentOrder, aManager, aShippedOrder, aTrimmedDto } from './builders';
export { aDummyClock, aFailingGateway, aFixedClock, aGatewayThatFailsOnce, anIdSequence, aPublisherThatMustNotBeCalled, aRecordingPublisher, aRecordingSink } from './doubles';
export { SEED_DTOS, SEED_ORDERS_IN_DOMAIN, USER_IDS, dtoFor, orderFor } from './fixtures';
export { API, failsWith, networkIsDown, ordersHandlers, ordersServer, recordRequests, respondsWithJson, respondsWithText } from './msw';
export { destination, renderOrders, type RenderOrdersOptions, type RenderedOrders } from './render-orders';
