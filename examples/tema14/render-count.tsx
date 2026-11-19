// TEMA 14 · Renders innecesarios, MEDIDOS. <Profiler> cuenta cada vez que React vuelve a pintar un componente.
// Escenario: una lista de pedidos con un buscador. Al escribir, ¿cuántas filas se vuelven a pintar?
//   · Versión ingenua: TODAS, en cada tecla (la fila recibe un callback nuevo en cada render del padre).
//   · Versión con memo + useCallback: ninguna fila cuyo dato no ha cambiado.
// Ojo: memo no es gratis (compara props en cada render). Se aplica cuando la medición dice que compensa.
// Referencias: react.dev/reference/react/Profiler · react.dev/reference/react/memo · react.dev/reference/react/useCallback
import { memo, Profiler, useCallback, useState, type ProfilerOnRenderCallback } from 'react';

export type Row = { id: string; customer: string };
type RowProps = { row: Row; onOpen: (id: string) => void; onRender: ProfilerOnRenderCallback };

function OrderRow({ row, onOpen, onRender }: RowProps) {
  return (
    <Profiler id={row.id} onRender={onRender}>
      <li>
        <button onClick={() => onOpen(row.id)}>{row.customer}</button>
      </li>
    </Profiler>
  );
}
const MemoOrderRow = memo(OrderRow);

type ListProps = { rows: Row[]; onRender: ProfilerOnRenderCallback; onOpen: (id: string) => void };

/** Ingenua: el callback se crea en cada render del padre y la fila no está memorizada. */
export function NaiveList({ rows, onRender, onOpen }: ListProps) {
  const [query, setQuery] = useState('');
  return (
    <>
      <input aria-label="Buscar" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>{rows.map((row) => <OrderRow key={row.id} row={row} onOpen={(id) => onOpen(id)} onRender={onRender} />)}</ul>
    </>
  );
}

/** Medida y corregida: fila memorizada y callback estable. Escribir en el buscador ya no repinta las filas. */
export function MemoList({ rows, onRender, onOpen }: ListProps) {
  const [query, setQuery] = useState('');
  const open = useCallback((id: string) => onOpen(id), [onOpen]);
  return (
    <>
      <input aria-label="Buscar" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>{rows.map((row) => <MemoOrderRow key={row.id} row={row} onOpen={open} onRender={onRender} />)}</ul>
    </>
  );
}
