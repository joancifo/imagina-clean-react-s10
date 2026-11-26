// PRUEBAS · Kit de pruebas de Devoluciones. Los tests de aplicación y de pantalla importan de aquí,
// no de infrastructure/ (las capas internas no conocen las externas, tampoco en los tests).
export { createInMemoryReturnsGateway, type InMemoryReturnsGateway } from '../infrastructure/in-memory-returns-gateway';
export { P1004, GOLD, IN_TRANSIT, at, CLASS_DAY } from './returnable-orders';
