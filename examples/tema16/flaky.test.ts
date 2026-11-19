// @vitest-environment node
// TEMA 16 · Tests FRÁGILES (flaky): pasan o fallan sin que cambie el código. Tres causas típicas y su arreglo.
// Las versiones frágiles están en los comentarios: ejecutarlas haría que este archivo fallase según el día.
// Para cazarlos: npx vitest run --sequence.shuffle (orden aleatorio) y repetir la suite varias veces.
import { anOrder } from './builders';
import { remindOverdue } from './remind-overdue';

// 1 · DEPENDE DE LA HORA.
//   FRÁGIL: const orders = [anOrder().createdAt('2026-11-20T09:00:00Z').build()];
//           expect(await remindOverdue({ …, clock: { now: () => new Date() } }, 7)).toBe(0);
//   Pasa hasta el 27 de noviembre. El 28, falla «sin que nadie haya tocado nada».
//   ARREGLO: la hora es una dependencia (el puerto Clock de la Sesión 4). El test la fija.
it('1 · hora fija: el resultado no depende del día en que se ejecuta', async () => {
  const orders = { findPending: async () => [anOrder().createdAt('2026-11-20T09:00:00Z').build()] };
  const clock = { now: () => new Date('2026-11-23T09:00:00Z') };
  expect(await remindOverdue({ orders, clock, mailer: { send: async () => undefined }, audit: { record: () => undefined } }, 7)).toBe(0);
});

// 2 · DEPENDE DEL ORDEN DE LOS TESTS (estado compartido).
//   FRÁGIL: const shared = anOrder().build();   // fuera de los tests
//           it('A', () => { shared.status = 'shipped'; … });
//           it('B', () => { expect(shared.status).toBe('pending'); });   // pasa solo si B va antes que A
//   ARREGLO: cada test construye sus datos. El builder devuelve una copia nueva cada vez.
it('2 · datos nuevos por test: el builder nunca devuelve el mismo objeto', () => {
  const builder = anOrder();
  const first = builder.build();
  first.status = 'shipped';
  expect(builder.build().status).toBe('pending');
});

// 3 · ESPERAS DE VERDAD (setTimeout real, red real).
//   FRÁGIL: await new Promise((r) => setTimeout(r, 100)); expect(…)   // en un portátil cargado o en CI, 100 ms no bastan
//   ARREGLO: temporizadores falsos (o esperar a una condición con waitFor/findBy, nunca a un tiempo fijo).
it('3 · temporizadores falsos: «esperar 10 segundos» tarda 0', () => {
  vi.useFakeTimers();
  const flushed: number[] = [];
  setInterval(() => flushed.push(Date.now()), 10_000); // como el flush periódico del logger en main.tsx
  vi.advanceTimersByTime(30_000);
  expect(flushed).toHaveLength(3);
  vi.useRealTimers();
});
