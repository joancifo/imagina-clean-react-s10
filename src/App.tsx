import { NavLink } from 'react-router-dom';
import { AppRoutes } from './shell/AppRoutes';
import { useSession } from './shell/session';
import { ToastHost } from './shell/ToastHost';
import { useAppStore } from './store/appStore';

export default function App() {
  const session = useSession();
  const { user, setToast } = useAppStore();
  return (
    <div className="app">
      <header className="app__header">
        <strong>OrderDesk</strong>
        <nav>
          <NavLink to="/">Pedidos</NavLink> <NavLink to="/dashboard">Panel</NavLink>
        </nav>
        <span className="app__user">{user ? user.usr_nm : '...'}</span>
      </header>
      <AppRoutes session={session} onNotify={setToast} />
      <ToastHost />
    </div>
  );
}
