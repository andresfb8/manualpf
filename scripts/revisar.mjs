/* Revisión estructural del manual construido.
   Comprueba: enlaces y recursos que existen de verdad, clases usadas sin estilo,
   restos de plantilla (undefined/NaN) y etiquetas sin cerrar a lo bruto. */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { existsSync } from "node:fs";
import { join, dirname, extname, resolve } from "node:path";

const raiz = resolve(process.argv[2] ?? "dist");
const problemas = [];

const recorrer = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) recorrer(p, acc);
    else acc.push(p);
  }
  return acc;
};

const ficheros = recorrer(raiz);
const htmls = ficheros.filter((f) => extname(f) === ".html");
const css = readFileSync(join(raiz, "estilos.css"), "utf8");

/* clases definidas en la hoja de estilos */
const clasesCss = new Set();
for (const m of css.matchAll(/\.([a-zA-Z_][\w-]*)/g)) clasesCss.add(m[1]);

const clasesHtml = new Map();
let totalClases = 0;

for (const f of htmls) {
  const rel = f.slice(raiz.length + 1).replace(/\\/g, "/");
  const html = readFileSync(f, "utf8");

  for (const patron of ["undefined", "NaN", "[object Object]", "``"]) {
    if (html.includes(patron)) problemas.push(`${rel}: contiene «${patron}»`);
  }

  /* enlaces y recursos */
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const destino = m[1];
    if (/^(https?:|mailto:|data:|#)/.test(destino)) continue;
    const limpio = destino.split("#")[0].split("?")[0];
    if (!limpio) continue;
    const absoluto = limpio.startsWith("/")
      ? join(raiz, limpio)
      : resolve(dirname(f), limpio);
    if (!existsSync(absoluto)) problemas.push(`${rel}: enlace roto → ${destino}`);
  }

  /* clases usadas */
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/).filter(Boolean)) {
      totalClases++;
      clasesHtml.set(c, (clasesHtml.get(c) ?? 0) + 1);
    }
  }

  /* comprobaciones de estructura */
  const abre = (html.match(/<div\b/g) ?? []).length;
  const cierra = (html.match(/<\/div>/g) ?? []).length;
  if (abre !== cierra) problemas.push(`${rel}: ${abre} <div> abiertos y ${cierra} cerrados`);
}

const sinEstilo = [...clasesHtml.keys()].filter(
  (c) => !clasesCss.has(c) && !["pagina-indice", "pagina-proceso", "pagina-documento", "proceso"].includes(c)
);

console.log(`\n  Revisión de ${htmls.length} páginas · ${totalClases} usos de clase\n`);

if (sinEstilo.length) {
  console.log("  Clases sin regla en el CSS:");
  for (const c of sinEstilo.sort()) console.log(`   · ${c} (${clasesHtml.get(c)} usos)`);
} else {
  console.log("  Todas las clases tienen regla en el CSS.");
}

if (problemas.length) {
  console.log("\n  Problemas:");
  for (const p of problemas) console.log(`   × ${p}`);
  process.exit(1);
}

console.log("  Sin enlaces rotos ni restos de plantilla.\n");
