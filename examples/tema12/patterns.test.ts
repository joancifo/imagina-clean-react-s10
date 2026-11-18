// @vitest-environment node
import { approveCommand, contadorGlobal, createBus, createContador, createReference, createTracker, DISCOUNTS, priceFor } from './patterns';

describe('Strategy', () => {
  it('cambia el cálculo sin tocar a quien lo usa', () => {
    expect(priceFor('gold', 100)).toBe(90);
    expect(priceFor('standard', 100)).toBe(100);
  });
  it('un tramo desconocido no rompe: cae en el valor por defecto', () => {
    expect(priceFor('platinum', 100)).toBe(100);
  });
  it('añadir un tramo es una línea en la tabla', () => {
    DISCOUNTS.platinum = (amount) => amount * 0.8;
    expect(priceFor('platinum', 100)).toBe(80);
    delete DISCOUNTS.platinum;
  });
});

describe('Factory', () => {
  it('normaliza y acepta lo válido', () => {
    expect(createReference('  p-1005 ')).toEqual({ value: 'P-1005' });
  });
  it('devuelve null en lugar de un objeto a medias', () => {
    expect(createReference('pedido 7')).toBeNull();
  });
});

describe('Adapter y Facade', () => {
  it('la aplicación ve dos métodos, no veinte', () => {
    const llamadas: unknown[] = [];
    const sdk = { init() {}, identify() {}, flush() {}, logEvent: (name: string, props: unknown) => llamadas.push([name, props]) };
    createTracker(sdk).track('order_approved', { id: 'P-1' });
    expect(llamadas).toEqual([['order_approved', { id: 'P-1' }]]);
  });
});

describe('Command', () => {
  it('se puede comprobar sin ejecutar', () => {
    const command = approveCommand({ status: 'shipped' }, () => 'ejecutado');
    expect(command.check()).toBe('not-pending');
  });
  it('y ejecutar cuando procede', () => {
    const command = approveCommand({ status: 'pending' }, () => 'ejecutado');
    expect(command.check()).toBeNull();
    expect(command.run()).toBe('ejecutado');
  });
});

describe('Observer', () => {
  it('avisa a quien se ha suscrito', () => {
    const bus = createBus<string>();
    const recibidos: string[] = [];
    const baja = bus.subscribe((event) => recibidos.push(event));
    bus.emit('uno');
    baja();
    bus.emit('dos');
    expect(recibidos).toEqual(['uno']);
  });
});

describe('Singleton: por qué molesta en los tests', () => {
  it('el estado global se arrastra entre pruebas', () => {
    contadorGlobal.inc();
    contadorGlobal.inc();
    expect(contadorGlobal.value()).toBe(2); // este número depende de lo que haya pasado antes
  });
  it('una instancia por quien la necesita empieza siempre igual', () => {
    expect(createContador().inc()).toBe(1);
    expect(createContador().inc()).toBe(1);
  });
});
