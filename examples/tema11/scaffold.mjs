// TEMA 11 · Node como herramienta: un script de scaffolding que crea un slice con la estructura del equipo.
// Devuelve ARCHIVOS (datos), no los escribe: así se puede probar sin tocar el disco (inyección por parámetro).
const pascal = (name) => name.replace(/(^|-)(\w)/g, (_, __, letter) => letter.toUpperCase());

export function sliceFiles(name) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Nombre de slice no válido: ${name}`);
  const Name = pascal(name);
  return [
    { path: `src/${name}/domain/${name}.ts`, content: `// DOMINIO de ${name}\nexport type ${Name} = { id: string };\n` },
    { path: `src/${name}/application/ports.ts`, content: `// PUERTOS de ${name}\nexport interface ${Name}Reader {\n  findAll(): Promise<unknown[]>;\n}\n` },
    { path: `src/${name}/index.ts`, content: `// API pública de ${name}\nexport type { ${Name} } from './domain/${name}';\n` },
  ];
}

/** El efecto (escribir) se inyecta: en producción, fs; en el test, un objeto que guarda lo escrito. */
export function createSlice(name, { write }) {
  const files = sliceFiles(name);
  files.forEach((file) => write(file.path, file.content));
  return files.map((file) => file.path);
}
