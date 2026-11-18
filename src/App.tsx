import { NavLink } from 'react-router-dom';
import { SignInBar, useSession } from './session';
import { AppRoutes } from './shell/AppRoutes';
import { ToastHost } from './shell/ToastHost';
import { useAppStore } from './store/appStore';

export default function App() {
  const session = useSession();
  const { setToast } = useAppStore();
  return (
    <div className="app">
      <header className="app__header">
        <strong>OrderDesk</strong>
        <nav>
          <NavLink to="/">Pedidos</NavLink> <NavLink to="/dashboard">Panel</NavLink>
        </nav>
        <span className="app__user">{session.status === 'ready' ? (session.name ?? 'Sin sesión') : '...'}</span>
      </header>
      <SignInBar />
      <AppRoutes session={session} onNotify={setToast} />
      <ToastHost />
    </div>
  );
}
