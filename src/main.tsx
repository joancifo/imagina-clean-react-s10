import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppStoreProvider } from './store/appStore';
import { createBufferedLogger, createHttpLogSink, ObservabilityProvider } from './observability';
import { createHttpAdapters, createOrdersModule, OrdersProvider } from './orders';
import { createHttpReturnsAdapters, createReturnsModule, ReturnsProvider } from './returns';
import { createHttpSessionGateway, SessionProvider } from './session';
import { DEFAULT_FLAGS, FlagsProvider, readFlags } from './shell/flags';
import './styles.css';

// COMPOSITION ROOT de la aplicación: lo más cerca posible del punto de entrada.
// Aquí, y solo aquí, se decide que Pedidos y la sesión hablan HTTP con el BFF (server/bff.mjs).
const fetchFn: typeof fetch = (input, init) => fetch(input, init);

// Sesión 7 · Observabilidad: lotes de 20 entradas o cada 10 segundos, y lo pendiente al cerrar la pestaña.
const logger = createBufferedLogger({ sink: createHttpLogSink(fetchFn), clock: { now: () => new Date() } });
setInterval(() => void logger.flush(), 10_000);
window.addEventListener('pagehide', () => void logger.flush());

const orders = createOrdersModule(createHttpAdapters(fetchFn, logger));
// Sesión 10 · Devoluciones habla con el BFF (server/returns.mjs) por su propio adapter.
const returns = createReturnsModule(createHttpReturnsAdapters(fetchFn));
const sessionGateway = createHttpSessionGateway(fetchFn);
// Sesión 7 · Flags: por defecto, el detalle nuevo. ?flags=-newOrderDetail vuelve al heredado (vuelta atrás sin desplegar).
const flags = readFlags(window.location.search, DEFAULT_FLAGS);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ObservabilityProvider logger={logger}>
        <FlagsProvider flags={flags}>
          <SessionProvider gateway={sessionGateway}>
            <AppStoreProvider>
              <OrdersProvider module={orders}>
                <ReturnsProvider module={returns}>
                  <App />
                </ReturnsProvider>
              </OrdersProvider>
            </AppStoreProvider>
          </SessionProvider>
        </FlagsProvider>
      </ObservabilityProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
