// Busca en el código del NAVEGADOR lo que nunca debería llegar al navegador.
// No sustituye a una auditoría: es un detector de los cinco errores que más se repiten.
// Uso: npm run audit:secrets
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const CHECKS = [
  { id: 'secreto-en-el-bundle', re: /import\.meta\.env\.VITE_[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)/g, why: 'Todo lo que empieza por VITE_ se publica en el bundle: cualquiera lo lee.' },
  { id: 'credencial-escrita-a-mano', re: /['"`](?:sk|ak|pk)_(?:live|test)_[A-Za-z0-9]{8,}['"`]/g, why: 'Una credencial escrita en el código viaja al repositorio y al navegador.' },
  { id: 'html-sin-escapar', re: /dangerouslySetInnerHTML/g, why: 'HTML de fuera pintado tal cual: XSS. React escapa por defecto; esto lo desactiva.' },
  { id: 'identidad-elegida-por-el-cliente', re: /['"]x-user-id['"]/g, why: 'Si el cliente dice quién es, cualquiera puede decir que es otro. La identidad la pone el servidor.' },
  { id: 'sesion-en-localstorage', re: /localStorage\.(?:set|get)Item\(\s*['"](?:token|jwt|auth|userId|session)['"]/g, why: 'Lo que guarda localStorage lo lee cualquier script de la página. La sesión va en una cookie HttpOnly.' },
];

const files = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return files(full);
    // Los tests no se publican: pueden nombrar lo que buscan sin ser un hallazgo.
    return full.match(/\.(ts|tsx|js|jsx)$/) && !full.includes('.test.') ? [full] : [];
  });

/** Devuelve los hallazgos como datos: el test los comprueba y la terminal los imprime. */
export function findSecrets(root = SRC) {
  return files(root).flatMap((file) => {
    const lines = readFileSync(file, 'utf8').split('\n');
    return CHECKS.flatMap(({ id, re, why }) =>
      lines.flatMap((line, index) => ([...line.matchAll(re)].map(() => ({ check: id, why, file: relative(ROOT, file), line: index + 1, text: line.trim().slice(0, 100) })))),
    );
  });
}

if (process.argv[1]?.endsWith('secrets.mjs')) {
  const findings = findSecrets();
  for (const finding of findings) console.log(`${finding.file}:${finding.line}  [${finding.check}]  ${finding.text}\n    → ${finding.why}`);
  console.log(findings.length === 0 ? 'Sin hallazgos en src/.' : `\n${findings.length} hallazgo(s).`);
}
