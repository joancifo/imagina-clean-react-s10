import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppStoreProvider } from './store/appStore';
import { createHttpAdapters, createOrdersModule, OrdersProvider } from './orders';
import { createHttpSessionGateway, SessionProvider } from './session';
import './styles.css';

// COMPOSITION ROOT de la aplicación: lo más cerca posible del punto de entrada.
// Aquí, y solo aquí, se decide que Pedidos y la sesión hablan HTTP con el BFF (server/bff.mjs).
const fetchFn: typeof fetch = (input, init) => fetch(input, init);
const orders = createOrdersModule(createHttpAdapters(fetchFn));
const sessionGateway = createHttpSessionGateway(fetchFn);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionProvider gateway={sessionGateway}>
        <AppStoreProvider>
          <OrdersProvider module={orders}>
            <App />
          </OrdersProvider>
        </AppStoreProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
