// SHELL · Mapa de rutas de la aplicación. Único lugar que relaciona URL, permiso y pantalla.
// Las pantallas no comprueban si se puede entrar: eso lo decide una regla del dominio a través del guard.
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { canViewDashboard, canViewOrders, DashboardScreen, OrdersListPage } from '../orders';
import { NotFoundPage } from './NotFoundPage';
import { OrderDetailRoute } from './OrderDetailRoute';
import { RequireAccess } from './RequireAccess';
import type { Session } from '../session';

// Sesión 10 · Devoluciones: pantalla HEREDADA, cargada bajo demanda. Es el código del laboratorio (docs/ejercicio-s10.md).
const LegacyReturnsPage = lazy(() => import('../pages/ReturnsPage'));

type Props = { session: Session; onNotify: (message: string) => void };

export function AppRoutes({ session, onNotify }: Props) {
  return (
    <Routes>
      <Route path="/" element={<RequireAccess session={session} can={canViewOrders}>{(actor) => <OrdersListPage actor={actor} onNotify={onNotify} />}</RequireAccess>} />
      {/* Sesión 7 · el detalle elige versión con un flag; el panel ya es solo el nuevo */}
      <Route path="/orders/:id" element={<OrderDetailRoute session={session} onNotify={onNotify} />} />
      <Route path="/orders/:id/returns" element={<Suspense fallback={<main className="page">Cargando…</main>}><LegacyReturnsPage /></Suspense>} />
      <Route path="/dashboard" element={<RequireAccess session={session} can={canViewDashboard}>{(actor) => <DashboardScreen actor={actor} />}</RequireAccess>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
