// Sesión 10 · Paso 5 · La ruta de Devoluciones elige versión con el flag newReturns: rama por abstracción.
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInMemoryReturnsGateway, createReturnsModule, ReturnsProvider, type ReturnableOrder } from '../returns';
import type { Session } from '../session';
import { AppStoreProvider } from '../store/appStore';
import { DEFAULT_FLAGS, FlagsProvider } from './flags';
import { ReturnsRoute } from './ReturnsRoute';

// Desde fuera de src/returns, solo su API pública: los datos se escriben aquí (como en AppRoutes.test.tsx).
const P1004: ReturnableOrder = { orderId: 'P-1004', customerName: 'Clínica Dental Mar', tier: 'standard', lines: [{ sku: 'E-50', ordered: 3, unitPrice: 140, alreadyReturned: 1 }], delivery: { trackingNumber: 'TRK-88412', deliveredAt: '2026-11-12T10:00:00Z' } };
const CLASS_DAY = { now: () => new Date('2026-11-30T17:00:00Z') };
const as = (role: 'admin' | 'manager' | 'agent'): Session => ({ status: 'ready', actor: { id: 'u', role }, name: null });

function renderAt(session: Session, newReturns: boolean) {
  const module = createReturnsModule({ returns: createInMemoryReturnsGateway({ orders: [P1004], role: session.status === 'ready' ? (session.actor?.role ?? '') : '', clock: CLASS_DAY }), clock: CLASS_DAY });
  return render(
    <MemoryRouter initialEntries={['/orders/P-1004/returns']}>
      <FlagsProvider flags={{ ...DEFAULT_FLAGS, newReturns }}>
        <AppStoreProvider>
          <ReturnsProvider module={module}>
            <Routes>
              <Route path="/orders/:id/returns" element={<ReturnsRoute session={session} onNotify={() => undefined} />} />
            </Routes>
          </ReturnsProvider>
        </AppStoreProvider>
      </FlagsProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

it('flag apagado (por defecto): la heredada, que pide /api/me por su cuenta', async () => {
  const requested: string[] = [];
  vi.stubGlobal('fetch', (url: string) => {
    requested.push(url);
    return new Promise(() => undefined); // sin respuesta: aquí solo importa QUIÉN pide
  });
  renderAt(as('manager'), false);
  await vi.waitFor(() => expect(requested).toContain('/api/me'));
  expect(screen.getByText('Cargando…')).toBeInTheDocument();
});

it('flag encendido: la nueva', async () => {
  renderAt(as('manager'), true);
  expect(await screen.findByRole('heading', { name: 'Devolución del pedido P-1004' })).toBeInTheDocument();
});

it('flag encendido y un agente: el 403 del shell (la heredada pintaba su propio texto)', () => {
  renderAt(as('agent'), true);
  expect(screen.getByRole('heading', { name: 'No tienes acceso a esta página' })).toBeInTheDocument();
});
