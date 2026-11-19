// TEMA 14 · Antes de optimizar, contar. Este test es la medición: renders de filas por cada tecla.
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoList, NaiveList, type Row } from './render-count';

const ROWS: Row[] = Array.from({ length: 50 }, (_, index) => ({ id: `P-${1000 + index}`, customer: `Cliente ${index}` }));
const noop = () => undefined;

function rowRendersWhileTyping(List: typeof NaiveList, text: string) {
  let renders = 0;
  const onRender = () => { renders += 1; };
  render(<List rows={ROWS} onRender={onRender} onOpen={noop} />);
  renders = 0; // el primer pintado no cuenta: medimos lo que cuesta ESCRIBIR
  for (let index = 1; index <= text.length; index += 1) {
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: text.slice(0, index) } });
  }
  return renders;
}

it('ingenua: escribir 5 letras repinta 50 filas × 5 = 250 veces', () => {
  expect(rowRendersWhileTyping(NaiveList, 'norte')).toBe(250);
});

it('memo + useCallback: escribir no repinta ninguna fila', () => {
  expect(rowRendersWhileTyping(MemoList, 'norte')).toBe(0);
});
