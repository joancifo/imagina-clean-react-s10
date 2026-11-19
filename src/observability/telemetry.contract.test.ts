// @vitest-environment node
// Material S7 · El navegador y el BFF filtran con la MISMA lista blanca. Si alguien añade un campo en un lado, falla aquí.
import telemetry from '../../shared/telemetry.json';
import { LOG_FIELDS } from './port';

it('los campos permitidos del cliente y del BFF son los mismos', () => {
  expect([...LOG_FIELDS].sort()).toEqual([...telemetry.fields].sort());
});
