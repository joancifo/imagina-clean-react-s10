// Arranque de la API ficticia de OrderDesk (npm run dev). La lógica vive en app.mjs.
import { createApp } from './app.mjs';

createApp().listen(3001, () => console.log('API de OrderDesk en http://localhost:3001'));
