import { Link } from 'react-router-dom';

/** Estado «no existe» (404): cualquier ruta que no coincide con ninguna otra. */
export function NotFoundPage() {
  return (
    <main className="page">
      <h1>Página no encontrada</h1>
      <p><Link to="/">Volver a Pedidos</Link></p>
    </main>
  );
}
