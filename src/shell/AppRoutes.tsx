// SHELL · Mapa de rutas de la aplicación. Único lugar que relaciona URL, permiso y pantalla.
// Ejercicio S5 · Parte C · paso 2. Punto de partida: las rutas heredadas, sin permisos y sin 404.
//   1. «/» pinta OrdersListPage (de '../orders'), que necesita un actor y onNotify.
//   2. «/» y «/dashboard» se protegen con RequireAccess y una regla de permisos del dominio ('../orders').
//   3. Cualquier otra URL pinta NotFoundPage.
import { Route, Routes } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import OrdersPage from '../pages/OrdersPage';
import type { Session } from './session';

type Props = { session: Session; onNotify: (message: string) => void };

export function AppRoutes({ session, onNotify }: Props) {
  void [session, onNotify];
  return (
    <Routes>
      <Route path="/" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
