/* Pruebas del contrato de contenido.
   Comprueba que el manual rechaza fichas sin dueño, sin fecha o sin pasos,
   y que calcula bien los estados de vigencia. */

import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { cargarProcesos } from "./lib/contenido.mjs";

let fallos = 0;
const bien = (texto) => console.log(`   ok   ${texto}`);
const mal = (texto) => {
  fallos++;
  console.log(`   FALLA ${texto}`);
};

const base = `---
numero: 09
titulo: Proceso de prueba
zona: Sala
roles: [Entrenadores]
dueno: Alguien
duenoRol: Entrenador
email: alguien@pulso.club
version: 1
revisado: 2026-01-10
cadencia: 12
cuando: Cuando hay que probar algo.
etiquetas: [prueba]
---

## Pasos

### Primer paso

Haz esto.

### Segundo paso

Y luego esto.
`;

const dir = mkdtempSync(join(tmpdir(), "manual-prueba-"));

const conFallos = (nombre, contenido) => {
  const carpeta = mkdtempSync(join(dir, nombre));
  writeFileSync(join(carpeta, `${nombre}.md`), contenido, "utf8");
  try {
    cargarProcesos(carpeta, "2026-11-05");
    return null;
  } catch (e) {
    return (e.detalles ?? [e.message]).join(" | ");
  }
};

console.log("\n  Contrato de contenido\n");

/* 1. una ficha correcta entra */
{
  const carpeta = mkdtempSync(join(dir, "buena"));
  writeFileSync(join(carpeta, "09-buena.md"), base, "utf8");
  try {
    const [p] = cargarProcesos(carpeta, "2026-11-05");
    p.estado === "aldia" && p.slug === "buena"
      ? bien("una ficha completa entra y se le calcula el estado")
      : mal(`estado o slug inesperado: ${p.estado} / ${p.slug}`);
  } catch (e) {
    mal(`una ficha correcta no debería fallar: ${e.message}`);
  }
}

/* 2. falta el responsable */
{
  const roto = base.replace("dueno: Alguien\n", "");
  const error = conFallos("sin-dueno", roto);
  error?.includes("dueno") ? bien("rechaza una ficha sin responsable") : mal(`no detectó la falta de dueño: ${error}`);
}

/* 3. falta la fecha de revisión */
{
  const roto = base.replace("revisado: 2026-01-10\n", "");
  const error = conFallos("sin-fecha", roto);
  error?.includes("revisado") ? bien("rechaza una ficha sin fecha de revisión") : mal(`no detectó la falta de fecha: ${error}`);
}

/* 4. falta la cadencia */
{
  const roto = base.replace("cadencia: 12\n", "");
  const error = conFallos("sin-cadencia", roto);
  error?.includes("cadencia") ? bien("rechaza una ficha sin cadencia") : mal(`no detectó la falta de cadencia: ${error}`);
}

/* 5. no hay pasos */
{
  const roto = base.replace("### Primer paso", "Primer paso").replace("### Segundo paso", "Segundo paso");
  const error = conFallos("sin-pasos", roto);
  error?.includes("paso") ? bien("rechaza una ficha sin pasos") : mal(`no detectó la falta de pasos: ${error}`);
}

/* 6. estados de vigencia */
{
  const carpeta = mkdtempSync(join(dir, "estados"));
  const casos = [
    ["01-vigente.md", "2026-09-01", "aldia"],
    ["02-toca.md", "2026-06-15", "toca"],
    ["03-caducado.md", "2025-01-01", "caducado"],
  ];
  for (const [nombre, fecha, esperado] of casos) {
    const texto = base
      .replace("revisado: 2026-01-10", `revisado: ${fecha}`)
      .replace("cadencia: 12", "cadencia: 6")
      .replace(/numero: \d+/, `numero: ${nombre.slice(0, 2)}`);
    writeFileSync(join(carpeta, nombre), texto, "utf8");
  }
  const leidos = cargarProcesos(carpeta, "2026-11-05");
  const mapa = Object.fromEntries(leidos.map((p) => [p.fichero, p.estado]));
  const ok =
    mapa["01-vigente.md"] === "aldia" &&
    mapa["02-toca.md"] === "toca" &&
    mapa["03-caducado.md"] === "caducado";
  ok
    ? bien("clasifica al día, por revisar y caducado")
    : mal(`estados incorrectos: ${JSON.stringify(mapa)}`);
}

/* 7. el formato que escribe el panel de edición (listas en bloque) */
{
  const carpeta = mkdtempSync(join(dir, "panel"));
  const escritoPorElPanel = `---
numero: "07"
titulo: Proceso escrito desde el panel
zona: Recepción
roles:
  - Recepción
  - Entrenadores
dueno: Diana
duenoRol: Responsable del manual
email: diana@planetfitness.es
critico: false
version: 2
revisado: 2026-02-01
cadencia: 12
cuando: Cuando alguien edita desde el panel y no toca el archivo.
etiquetas:
  - prueba
  - panel
---

## Pasos

### Único paso

Comprobar que entra igual.
`;
  writeFileSync(join(carpeta, "07-panel.md"), escritoPorElPanel, "utf8");
  try {
    const [p] = cargarProcesos(carpeta, "2026-11-05");
    const ok =
      p.roles.length === 2 &&
      p.roles[0] === "Recepción" &&
      p.etiquetas.includes("panel") &&
      p.dueno === "Diana" &&
      p.estado === "aldia";
    ok
      ? bien("entiende el YAML que escribe el panel (listas en bloque)")
      : mal(`no interpretó bien el formato del panel: ${JSON.stringify(p.roles)} / ${JSON.stringify(p.etiquetas)}`);
  } catch (e) {
    mal(`el formato del panel rompe la construcción: ${e.message}`);
  }
}

rmSync(dir, { recursive: true, force: true });

console.log(
  fallos === 0 ? "\n  Todo correcto.\n" : `\n  ${fallos} comprobación(es) fallida(s).\n`
);
process.exit(fallos === 0 ? 0 : 1);
