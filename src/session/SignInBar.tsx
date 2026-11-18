// SESIÓN · Entrada de sesión para el entorno de formación: tres usuarios, ningún formulario de credenciales.
// Lo importante no es cómo se entra, sino que quien decide el rol es el SERVIDOR: aquí solo se pide.
import { useSession, useSignIn } from './SessionProvider';

const USERS = [
  { id: 'u1', label: 'Marta (admin)' },
  { id: 'u2', label: 'Pau (manager)' },
  { id: 'u3', label: 'Iris (agente)' },
];

export function SignInBar() {
  const session = useSession();
  const signIn = useSignIn();
  if (session.status === 'loading' || session.actor !== null) return null;
  return (
    <div className="signin" role="region" aria-label="Entrar">
      <span>Sin sesión. Entra como:</span>
      {USERS.map((user) => (
        <button key={user.id} onClick={() => void signIn(user.id)}>{user.label}</button>
      ))}
    </div>
  );
}
