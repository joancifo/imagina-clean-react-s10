// EJEMPLO SEMBRADO A PROPÓSITO · Tema 13. Cinco errores de seguridad en veinte líneas.
// No es código que se use: existe para que el detector (scripts/secrets.mjs) tenga algo que encontrar
// y para mirarlo en clase. La versión correcta de cada uno está en examples/tema13/seguro.tsx.
/* eslint-disable */
const ANALYTICS_KEY = import.meta.env.VITE_ANALYTICS_SECRET_KEY; // 1 · todo VITE_ viaja en el bundle
const SOPORTE_TOKEN = 'sk_live_9f2b7c41aa83'; //                   2 · credencial escrita a mano

export function PanelInseguro({ nota, userId }: { nota: string; userId: string }) {
  localStorage.setItem('token', SOPORTE_TOKEN); //                 3 · la sesión al alcance de cualquier script

  const aprobar = (id: string) =>
    fetch(`/api/orders/${id}/approve`, {
      method: 'POST',
      headers: { 'x-user-id': userId, 'x-api-key': ANALYTICS_KEY }, // 4 · el cliente dice quién es
    });

  // 5 · nota escrita por otra persona, pintada como HTML
  return <div onClick={() => aprobar('P-1001')} dangerouslySetInnerHTML={{ __html: nota }} />;
}
