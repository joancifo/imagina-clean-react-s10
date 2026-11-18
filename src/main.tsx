import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppStoreProvider } from './store/appStore';
import { createHttpAdapters, createOrdersModule, OrdersProvider } from './orders';
import './styles.css';

// COMPOSITION ROOT de la aplicación: lo más cerca posible del punto de entrada.
// Aquí, y solo aquí, se decide que Pedidos habla HTTP con el backend heredado.
const orders = createOrdersModule(createHttpAdapters((input, init) => fetch(input, init)));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppStoreProvider>
        <OrdersProvider module={orders}>
          <App />
        </OrdersProvider>
      </AppStoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
