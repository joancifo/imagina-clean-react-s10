// SHELL · Mapa de rutas de la aplicación. Único lugar que relaciona URL, permiso y pantalla.
// Las pantallas no comprueban si se puede entrar: eso lo decide una regla del dominio a través del guard.
import { Route, Routes } from 'react-router-dom';
import { canViewDashboard, canViewOrders, OrdersListPage } from '../orders';
import DashboardPage from '../pages/DashboardPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import { NotFoundPage } from './NotFoundPage';
import { RequireAccess } from './RequireAccess';
import type { Session } from './session';

type Props = { session: Session; onNotify: (message: string) => void };

export function AppRoutes({ session, onNotify }: Props) {
  return (
    <Routes>
      <Route path="/" element={<RequireAccess session={session} can={canViewOrders}>{(actor) => <OrdersListPage actor={actor} onNotify={onNotify} />}</RequireAccess>} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/dashboard" element={<RequireAccess session={session} can={canViewDashboard}>{() => <DashboardPage />}</RequireAccess>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
