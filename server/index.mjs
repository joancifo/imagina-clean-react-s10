// Arranque de OrderDesk (npm run dev): el navegador habla SOLO con el BFF (server/bff.mjs).
// La API heredada (server/app.mjs) queda detrás; en el curso comparten proceso y almacén.
import { createBff } from './bff.mjs';

createBff().listen(3001, () => console.log('BFF de OrderDesk en http://localhost:3001'));
