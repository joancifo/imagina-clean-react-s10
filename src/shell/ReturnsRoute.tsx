// SHELL · Ruta de Devoluciones durante la migración (Sesión 10 · paso 5): RAMA POR ABSTRACCIÓN, como el detalle (Sesión 7).
// Las dos versiones conviven desplegadas; el flag newReturns elige. Nace apagado: ?flags=newReturns enciende la nueva.
//   · La nueva: protegida por el guard (un agente ve el 403 del shell), dentro de un límite de error.
//   · La heredada: carga perezosa, como hasta ahora.
// Cuando la nueva se dé por buena (paso 7), este archivo, el flag y src/pages/ReturnsPage.tsx se borran.
import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { FeatureBoundary } from '../observability';
import { canManageReturns, ReturnsScreen } from '../returns';
import type { Actor } from '../orders';
import type { Session } from '../session';
import { useFlag } from './flags';
import { RequireAccess } from './RequireAccess';

const LegacyReturnsPage = lazy(() => import('../pages/ReturnsPage'));
const canReturn = (actor: Actor | null) => actor !== null && canManageReturns(actor.role);

type Props = { session: Session; onNotify: (message: string) => void };

export function ReturnsRoute({ session, onNotify }: Props) {
  const { id = '' } = useParams();
  const useNewReturns = useFlag('newReturns');

  if (!useNewReturns) {
    return (
      <Suspense fallback={<main className="page">Cargando…</main>}>
        <LegacyReturnsPage />
      </Suspense>
    );
  }

  return (
    <RequireAccess session={session} can={canReturn}>
      {(actor) => (
        <FeatureBoundary feature="returns">
          <ReturnsScreen key={id} orderId={id} role={actor.role} onNotify={onNotify} />
        </FeatureBoundary>
      )}
    </RequireAccess>
  );
}
