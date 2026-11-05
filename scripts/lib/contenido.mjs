import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

/* ---------------------------------------------------------------- frontmatter */

export function leerFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("falta el bloque --- del principio");

  const datos = {};
  const lineas = m[1].split(/\r?\n/);

  /* acepta las listas en las dos formas: [a, b] y
     clave:
       - a
       - b
     La segunda es la que escribe el panel de edición. */
  const valorSuelto = (v) => {
    const t = v.trim();
    if (/^".*"$/.test(t) || /^'.*'$/.test(t)) return t.slice(1, -1);
    if (t === "true") return true;
    if (t === "false") return false;
    if (/^-?\d+$/.test(t)) return Number(t);
    return t;
  };

  for (let i = 0; i < lineas.length; i++) {
    const limpia = lineas[i].trim();
    if (!limpia || limpia.startsWith("#")) continue;

    const corte = limpia.indexOf(":");
    if (corte < 0) throw new Error(`línea sin «clave: valor» → ${limpia}`);
    const clave = limpia.slice(0, corte).trim();
    const valor = limpia.slice(corte + 1).trim();

    if (valor === "") {
      const items = [];
      let j = i + 1;
      while (j < lineas.length) {
        const siguiente = lineas[j];
        if (siguiente.trim() === "") {
          j++;
          continue;
        }
        const item = siguiente.match(/^\s*-\s+(.*)$/);
        if (!item) break;
        items.push(valorSuelto(item[1]));
        j++;
      }
      if (items.length) {
        datos[clave] = items;
        i = j - 1;
        continue;
      }
      // clave vacía de verdad
      datos[clave] = "";
      continue;
    }

    if (/^\[.*\]$/.test(valor)) {
      datos[clave] = valor
        .slice(1, -1)
        .split(",")
        .map((v) => valorSuelto(v))
        .filter((v) => v !== "");
    } else {
      datos[clave] = valorSuelto(valor);
    }
  }
  return { datos, cuerpo: m[2] };
}

/* ------------------------------------------------------------------- markdown */

const escapar = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function enLinea(texto) {
  return escapar(texto)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

const esVacia = (l) => l.trim() === "";

export function leerCuerpo(cuerpo) {
  const lineas = cuerpo.split(/\r?\n/);
  const secciones = [];
  let seccion = null;
  let paso = null;
  let bloque = null;

  const cerrarBloque = () => {
    bloque = null;
  };
  const cerrarPaso = () => {
    paso = null;
  };

  const anadir = (tipo, html) => {
    const destino = paso ? paso.bloques : seccion.bloques;
    if (bloque && bloque.tipo === tipo) {
      bloque.items.push(html);
    } else {
      bloque = { tipo, items: [html] };
      destino.push(bloque);
    }
  };

  for (const linea of lineas) {
    const t = linea.trim();

    if (esVacia(linea)) {
      cerrarBloque();
      continue;
    }

    if (t.startsWith("## ")) {
      cerrarBloque();
      cerrarPaso();
      seccion = { titulo: t.slice(3).trim(), tipo: "texto", bloques: [], pasos: [] };
      if (/^pasos$/i.test(seccion.titulo)) seccion.tipo = "pasos";
      secciones.push(seccion);
      continue;
    }

    if (!seccion) throw new Error(`contenido antes del primer «## » → ${t}`);

    if (t.startsWith("### ")) {
      if (seccion.tipo !== "pasos") {
        throw new Error(`«### » fuera de una sección de pasos → ${t}`);
      }
      cerrarBloque();
      paso = { titulo: t.slice(4).trim(), bloques: [] };
      seccion.pasos.push(paso);
      continue;
    }

    if (t.startsWith("> ")) {
      anadir("nota", enLinea(t.slice(2).trim()));
      continue;
    }

    if (t.startsWith("- ")) {
      anadir("ul", enLinea(t.slice(2).trim()));
      continue;
    }

    const numerada = t.match(/^(\d+)\.\s+(.*)$/);
    if (numerada) {
      anadir("ol", enLinea(numerada[2]));
      continue;
    }

    anadir("p", enLinea(t));
  }

  return secciones;
}

/* ---------------------------------------------------------------------- modelo */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function fecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

export function fechaLarga(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  const nombres = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d} de ${nombres[m - 1]} de ${a}`;
}

const aUTC = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

export function sumarMeses(iso, meses) {
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1 + meses, d));
  return fecha.toISOString().slice(0, 10);
}

const DIAS = 1000 * 60 * 60 * 24;

export function estadoProceso(revisado, cadencia, hoyISO) {
  const caduca = sumarMeses(revisado, cadencia);
  const restantes = Math.round((aUTC(caduca) - aUTC(hoyISO)) / DIAS);
  const desdeRevision = Math.round((aUTC(hoyISO) - aUTC(revisado)) / DIAS);

  let estado = "aldia";
  if (restantes < 0) estado = "caducado";
  else if (restantes <= 60) estado = "toca";

  return { caduca, restantes, desdeRevision, estado };
}

export const OBLIGATORIOS = [
  "numero", "titulo", "zona", "roles", "dueno", "duenoRol",
  "email", "version", "revisado", "cadencia", "cuando", "etiquetas",
];

export function cargarProcesos(dirContenido, hoyISO) {
  const ficheros = readdirSync(dirContenido).filter((f) => f.endsWith(".md")).sort();
  const errores = [];
  const procesos = [];

  for (const fichero of ficheros) {
    const ruta = join(dirContenido, fichero);
    const erroresPrevios = errores.length;
    let datos, cuerpo;
    try {
      const leido = leerFrontmatter(readFileSync(ruta, "utf8"));
      datos = leido.datos;
      cuerpo = leido.cuerpo;
    } catch (e) {
      errores.push(`${fichero}: ${e.message}`);
      continue;
    }

    for (const campo of OBLIGATORIOS) {
      const v = datos[campo];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
        errores.push(`${fichero}: falta el campo obligatorio «${campo}»`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(datos.revisado ?? ""))) {
      errores.push(`${fichero}: «revisado» debe ser una fecha AAAA-MM-DD`);
    }
    if (!Number.isFinite(datos.cadencia) || datos.cadencia <= 0) {
      errores.push(`${fichero}: «cadencia» debe ser un número de meses mayor que cero`);
    }
    if (!Array.isArray(datos.roles)) {
      errores.push(`${fichero}: «roles» debe ser una lista [Rol, Rol]`);
    }
    if (errores.length > erroresPrevios) continue;

    const slug = basename(fichero, ".md").replace(/^\d+-/, "");
    const secciones = leerCuerpo(cuerpo);
    if (!secciones.some((s) => s.tipo === "pasos")) {
      errores.push(`${fichero}: falta la sección «## Pasos» con al menos un «### »`);
    }
    const pasos = secciones.find((s) => s.tipo === "pasos")?.pasos ?? [];
    if (pasos.length === 0) errores.push(`${fichero}: la sección «Pasos» no tiene ningún paso`);

    procesos.push({
      ...datos,
      slug,
      fichero,
      secciones,
      pasos: pasos.length,
      ...estadoProceso(datos.revisado, datos.cadencia, hoyISO),
    });
  }

  procesos.sort((a, b) => String(a.numero).padStart(2, "0").localeCompare(String(b.numero).padStart(2, "0")));

  if (errores.length) {
    const e = new Error(`Contenido inválido (${errores.length} problema${errores.length > 1 ? "s" : ""})`);
    e.detalles = errores;
    throw e;
  }

  return procesos;
}

/* ------------------------------------------------------------------ utilidades */

export const normalizar = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function resumen(procesos) {
  return {
    total: procesos.length,
    aldia: procesos.filter((p) => p.estado === "aldia").length,
    toca: procesos.filter((p) => p.estado === "toca").length,
    caducado: procesos.filter((p) => p.estado === "caducado").length,
  };
}

export const ETIQUETA_ESTADO = {
  aldia: "Al día",
  toca: "Toca revisar",
  caducado: "Caducado",
};
