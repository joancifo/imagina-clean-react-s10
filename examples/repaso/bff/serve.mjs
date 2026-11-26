// Repaso · BFF · Arranca el BFF mínimo para verlo en el navegador o con curl:
//   node examples/repaso/bff/serve.mjs  →  http://localhost:3201/api/return-screen/P-1004
import { createApis } from './apis.mjs';
import { createMiniBff } from './01-bff-minimo.mjs';

const port = Number(process.env.PORT ?? 3201);
createMiniBff({ apis: createApis() }).listen(port, () => console.log(`BFF mínimo en http://localhost:${port}/api/return-screen/P-1004`));
