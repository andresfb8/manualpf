import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cargarProcesos, resumen, ETIQUETA_ESTADO, normalizar } from "./lib/contenido.mjs";
import { paginaIndice, paginaProceso, paginaMantenimiento } from "./lib/plantillas.mjs";

const raizProyecto = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirContenido = join(raizProyecto, "contenido", "procesos");
const dirPublico = join(raizProyecto, "publico");
const dirSalida = join(raizProyecto, "dist");

const config = JSON.parse(readFileSync(join(raizProyecto, "sitio.config.json"), "utf8"));

const hoy = new Date();
const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(
  hoy.getDate()
).padStart(2, "0")}`;

let procesos;
try {
  procesos = cargarProcesos(dirContenido, hoyISO);
} catch (e) {
  console.error("\n  No se puede construir el manual.\n");
  for (const d of e.detalles ?? [e.message]) console.error(`   × ${d}`);
  console.error("\n  Corrige las fichas y vuelve a intentarlo.\n");
  process.exit(1);
}

if (procesos.length === 0) {
  console.error("No hay ningún proceso en contenido/procesos.");
  process.exit(1);
}

const cuenta = resumen(procesos);

/* limpiar y copiar estáticos */
rmSync(dirSalida, { recursive: true, force: true });
mkdirSync(dirSalida, { recursive: true });
if (existsSync(dirPublico)) cpSync(dirPublico, dirSalida, { recursive: true });

const escribir = (ruta, contenido) => {
  const destino = join(dirSalida, ruta);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido, "utf8");
};

/* portada */
escribir("index.html", paginaIndice({ config, procesos, resumen: cuenta, hoy: hoyISO, raiz: "./" }));

/* fichas de proceso */
for (const p of procesos) {
  escribir(
    join("procesos", p.slug, "index.html"),
    paginaProceso({ config, p, todos: procesos, raiz: "../../" })
  );
}

/* página de mantenimiento */
escribir(
  join("como-se-actualiza", "index.html"),
  paginaMantenimiento({ config, procesos, resumen: cuenta, raiz: "../" })
);

/* índice de búsqueda */
const indice = procesos.map((p) => ({
  n: String(p.numero).padStart(2, "0"),
  t: p.titulo,
  s: `procesos/${p.slug}/index.html`,
  z: p.zona,
  c: p.cuando,
  e: p.etiquetas,
  r: p.roles,
  bus: normalizar([p.titulo, p.cuando, p.zona, p.dueno, ...p.roles, ...p.etiquetas].join(" ")),
}));
escribir("buscar.json", JSON.stringify(indice, null, 0));

/* informe */
const linea = (p) =>
  `  ${String(p.numero).padStart(2, "0")}  ${p.titulo.padEnd(42, " ")} ${p.dueno.padEnd(16, " ")} ${ETIQUETA_ESTADO[p.estado]}`;

console.log(`\n  Manual construido · ${config.nombre} · ${hoyISO}\n`);
for (const p of procesos) console.log(linea(p));
console.log(
  `\n  ${cuenta.total} procesos · ${cuenta.aldia} al día · ${cuenta.toca} por revisar · ${cuenta.caducado} caducados`
);
console.log(`  Salida: ${dirSalida}\n`);
