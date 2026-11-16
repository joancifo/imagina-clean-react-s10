// TEMA 9 · Composición en lugar de configuración.
// ANTES (src/components/OrderRow.tsx, heredado): 15 props, 10 booleanas → 2^10 = 1024 variantes posibles.
//   <OrderRow showTotal showDate showOwner isAdmin isManager isCompact isHighlighted canApprove canCancel disabled … />
// DESPUÉS: el componente pinta una estructura y deja HUECOS (children, actions). Quien lo usa decide qué va dentro.
import type { ReactNode } from 'react';

type OrderCardProps = { title: string; tone?: 'normal' | 'urgent'; actions?: ReactNode; children: ReactNode };

export function OrderCard({ title, tone = 'normal', actions, children }: OrderCardProps) {
  return (
    <article className={tone === 'urgent' ? 'card card--urgent' : 'card'} aria-label={title}>
      <h3>{title}</h3>
      <div>{children}</div>
      {actions && <footer>{actions}</footer>}
    </article>
  );
}

/** Piezas pequeñas con una intención clara. Cada una se entiende sola. */
export const OrderAmount = ({ value }: { value: string }) => <p className="order-row__total">{value}</p>;
export const OrderOwner = ({ name }: { name: string }) => <p>Responsable: {name}</p>;

// Dos pantallas, dos composiciones, cero flags:
export const ManagerOrderCard = ({ onApprove }: { onApprove: () => void }) => (
  <OrderCard title="P-1003" tone="urgent" actions={<button onClick={onApprove}>Aprobar</button>}>
    <OrderOwner name="Iris" />
    <OrderAmount value="6.207,30 €" />
  </OrderCard>
);

export const AgentOrderCard = () => (
  <OrderCard title="P-1003">
    <p>Construcciones Vega</p>
  </OrderCard>
);
