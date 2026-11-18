// Tema 10 · El guard se prueba sin montar la aplicación: tres estados, tres tests.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { canViewDashboard } from '../orders';
import { RequireAccess } from './RequireAccess';
import type { Session } from '../session';

const renderGuard = (session: Session) =>
  render(
    <MemoryRouter>
      <RequireAccess session={session} can={canViewDashboard}>{(actor) => <p>Panel de {actor.id}</p>}</RequireAccess>
    </MemoryRouter>,
  );

it('mientras la sesión carga, espera: ni contenido ni «no autorizado»', () => {
  renderGuard({ status: 'loading' });
  expect(screen.getByText('Cargando…')).toBeInTheDocument();
  expect(screen.queryByText(/No tienes acceso/)).toBeNull();
});

it('con permiso, pinta el contenido con un actor que no es null', () => {
  renderGuard({ status: 'ready', actor: { id: 'u2', role: 'manager' } });
  expect(screen.getByText('Panel de u2')).toBeInTheDocument();
});

it.each([
  ['un agente', { id: 'u3', role: 'agent' as const }],
  ['sin sesión', null],
])('%s ve «no autorizado» y el contenido no se llega a montar', (_name, actor) => {
  renderGuard({ status: 'ready', actor });
  expect(screen.getByRole('heading', { name: 'No tienes acceso a esta página' })).toBeInTheDocument();
  expect(screen.queryByText(/Panel de/)).toBeNull();
});
