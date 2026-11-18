// Ejercicio S6 · Parte C · La sesión la decide el servidor, no el navegador.
import { fireEvent, render, screen } from '@testing-library/react';
import type { SessionGateway } from './port';
import { createInMemorySessionGateway, SessionProvider, useSession, useSignIn } from '.';

function Pantalla() {
  const session = useSession();
  const signIn = useSignIn();
  if (session.status === 'loading') return <p>Cargando…</p>;
  return (
    <div>
      <p>{session.actor ? `${session.actor.role}:${session.actor.id}` : 'sin sesión'}</p>
      <button onClick={() => void signIn('u1')}>Entrar como admin</button>
    </div>
  );
}

const renderWith = (gateway: SessionGateway) => render(<SessionProvider gateway={gateway}><Pantalla /></SessionProvider>);

describe.skip('Parte C · la sesión la decide el servidor', () => {
  it('mientras el servidor no contesta, la sesión está «cargando»: no es «sin permiso»', () => {
    renderWith({ signIn: async () => null, me: () => new Promise(() => {}) });
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('recupera la sesión que ya existe en el servidor', async () => {
    renderWith(createInMemorySessionGateway({ id: 'u2', role: 'manager' }));
    expect(await screen.findByText('manager:u2')).toBeInTheDocument();
  });

  it('sin sesión en el servidor, la respuesta es «sin sesión» (fail closed)', async () => {
    renderWith(createInMemorySessionGateway(null));
    expect(await screen.findByText('sin sesión')).toBeInTheDocument();
  });

  it('al entrar, el actor lo dice el servidor', async () => {
    renderWith(createInMemorySessionGateway(null));
    await screen.findByText('sin sesión');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar como admin' }));
    expect(await screen.findByText('admin:u1')).toBeInTheDocument();
  });

  it('el navegador no guarda nada: ni token, ni rol, ni identificador', async () => {
    renderWith(createInMemorySessionGateway({ id: 'u1', role: 'admin' }));
    await screen.findByText('admin:u1');
    expect(localStorage.length).toBe(0);
    expect(document.cookie).toBe(''); // la cookie de sesión es HttpOnly: ni siquiera se ve desde aquí
  });

});
