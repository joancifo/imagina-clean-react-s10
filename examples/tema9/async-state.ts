// TEMA 9 · Los cuatro estados de cualquier pantalla con datos, como unión discriminada.
// Con booleanos sueltos (loading, error, data) hay 8 combinaciones y la mitad son imposibles.
// Con la unión, el compilador obliga a tratar cada estado y no deja leer `data` si no está cargado.
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; data: T };

/** «Vacío» es una decisión de la pantalla: aquí, una lista sin elementos. */
export function fromList<T>(items: T[]): AsyncState<T[]> {
  return items.length === 0 ? { status: 'empty' } : { status: 'success', data: items };
}
