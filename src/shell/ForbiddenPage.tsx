import { Link } from 'react-router-dom';

/** Estado «no autorizado» (403): la URL no cambia, para que el enlace siga siendo válido con otro usuario. */
export function ForbiddenPage() {
  return (
    <main className="page">
      <h1>No tienes acceso a esta página</h1>
      <p>Tu rol no permite ver este contenido. <Link to="/">Volver a Pedidos</Link></p>
    </main>
  );
}
