import { ETIQUETA_ESTADO, fecha, fechaLarga, normalizar } from "./contenido.mjs";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const dos = (n) => String(n).padStart(2, "0");

const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23000000'/%3E%3Crect x='19' y='7' width='7' height='7' fill='%23F9F72E'/%3E%3C/svg%3E";

/* ------------------------------------------------------------------ fragmentos */

export function chip(estado) {
  return `<span class="chip chip--${estado}">${ETIQUETA_ESTADO[estado]}</span>`;
}

export function textoVigencia(p) {
  const n = Math.abs(p.restantes);
  const medida = n > 60 ? `${Math.round(n / 30)} meses` : `${n} día${n === 1 ? "" : "s"}`;
  if (p.estado === "caducado") return `Caducó hace ${medida}`;
  if (p.estado === "toca") return `Quedan ${medida}`;
  return `Caduca en ${medida}`;
}

function cabecera(config, raiz, conImprimir) {
  return `
  <header class="cabecera">
    <div class="envoltura cabecera__interior">
      <a class="marca" href="${raiz}index.html">
        <span class="marca__punto" aria-hidden="true"></span>
        <span class="marca__nombre">${esc(config.nombre)}</span>
        <span class="marca__raya" aria-hidden="true"></span>
        <span class="marca__manual">${esc(config.manual)}</span>
      </a>
      <div class="cabecera__acciones">
        <button class="disparo" type="button" data-abrir-paleta>
          <span>Buscar</span>
          <kbd>Ctrl K</kbd>
        </button>
        ${conImprimir ? '<button class="boton-texto" type="button" data-imprimir>Imprimir</button>' : ""}
      </div>
    </div>
  </header>`;
}

function pie(config, raiz) {
  return `
  <footer class="pie">
    <div class="envoltura pie__interior">
      <div class="pie__marca">
        <span class="marca__nombre">${esc(config.nombre)}</span>
        <span class="pie__detalle">${esc(config.manual)} · edición ${esc(config.edicion)}</span>
      </div>
      <nav class="pie__nav" aria-label="Enlaces del manual">
        <a href="${raiz}index.html">Todos los procesos</a>
        <a href="${raiz}como-se-actualiza/index.html">Cómo se actualiza</a>
        <a href="mailto:${esc(config.email)}">${esc(config.email)}</a>
      </nav>
      <p class="pie__nota">Pensado para consultarse de pie, con prisa y desde el móvil.</p>
    </div>
  </footer>`;
}

function paleta() {
  return `
  <div class="paleta" data-paleta hidden>
    <div class="paleta__velo" data-cerrar-paleta></div>
    <div class="paleta__panel" role="dialog" aria-modal="true" aria-label="Buscar procesos">
      <div class="paleta__campo">
        <span class="paleta__etq">Buscar</span>
        <input type="text" data-paleta-campo placeholder="Una tarea, un rol, una palabra" autocomplete="off" spellcheck="false">
        <kbd>Esc</kbd>
      </div>
      <ul class="paleta__lista" data-paleta-lista></ul>
      <div class="paleta__pie">
        <span><kbd>↑</kbd><kbd>↓</kbd> moverte</span>
        <span><kbd>↵</kbd> abrir</span>
        <span class="paleta__cuenta" data-paleta-cuenta></span>
      </div>
    </div>
  </div>`;
}

function documento({ config, titulo, descripcion, raiz, clase, cuerpo }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · ${esc(config.nombre)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="theme-color" content="#000000">
<meta name="color-scheme" content="light">
<link rel="icon" href="${favicon}">
<link rel="preload" href="${raiz}fuentes/Archivo-800.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="${raiz}fuentes/Archivo-400.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="${raiz}estilos.css">
<script>document.documentElement.classList.add("js");</script>
</head>
<body class="${clase}" data-raiz="${raiz}">
<a class="salto" href="#contenido">Saltar al contenido</a>
${cabecera(config, raiz, clase === "pagina-proceso")}
<main id="contenido">
${cuerpo}
</main>
${pie(config, raiz)}
${paleta()}
<script src="${raiz}app.js" defer></script>
</body>
</html>`;
}

/* ---------------------------------------------------------------------- índice */

export function paginaIndice({ config, procesos, resumen, hoy, raiz }) {
  const roles = [...new Set(procesos.flatMap((p) => p.roles))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
  const ultima = [...procesos].sort((a, b) => b.revisado.localeCompare(a.revisado))[0];
  const numeros = procesos.map((p) => Number(p.numero));
  const maximo = Math.max(...numeros);

  const filas = procesos
    .map((p) => {
      const texto = normalizar(
        [p.titulo, p.cuando, p.zona, p.roles.join(" "), p.etiquetas.join(" "), p.dueno].join(" ")
      );
      return `
      <li class="ficha" data-proceso data-estado="${p.estado}"
          data-roles="${esc(p.roles.join("|"))}" data-texto="${esc(texto)}">
        <a class="ficha__enlace" href="${raiz}procesos/${p.slug}/index.html">
          <span class="ficha__num" aria-hidden="true">${dos(p.numero)}</span>
          <span class="ficha__cuerpo">
            <span class="ficha__linea">
              <span class="ficha__titulo">${esc(p.titulo)}</span>
              ${p.critico ? '<span class="chip chip--critico">Crítico</span>' : ""}
            </span>
            <span class="ficha__cuando">${esc(p.cuando)}</span>
            <span class="ficha__meta">
              <span class="ficha__zona">${esc(p.zona)}</span>
              <span class="ficha__sep" aria-hidden="true">/</span>
              <span class="ficha__dueno">${esc(p.dueno)}</span>
              ${chip(p.estado)}
            </span>
          </span>
          <span class="ficha__flecha" aria-hidden="true">→</span>
        </a>
      </li>`;
    })
    .join("");

  const porDueno = Object.values(
    procesos.reduce((acc, p) => {
      acc[p.dueno] ??= { nombre: p.dueno, rol: p.duenoRol, email: p.email, procesos: [] };
      acc[p.dueno].procesos.push(p);
      return acc;
    }, {})
  );

  const duenos = porDueno
    .map(
      (d) => `
      <article class="dueno">
        <p class="rotulo">${esc(d.rol)}</p>
        <h3 class="dueno__nombre">${esc(d.nombre)}</h3>
        <ul class="dueno__lista">
          ${d.procesos
            .map(
              (p) =>
                `<li><a href="${raiz}procesos/${p.slug}/index.html"><span class="dueno__num">${dos(
                  p.numero
                )}</span>${esc(p.titulo)}</a></li>`
            )
            .join("")}
        </ul>
        <a class="dueno__mail" href="mailto:${esc(d.email)}">${esc(d.email)}</a>
      </article>`
    )
    .join("");

  const cuerpo = `
  <section class="portada">
    <div class="envoltura portada__rejilla">
      <div class="portada__texto revelar">
        <p class="rotulo">${esc(config.edicion)} · versión ${esc(config.version)}</p>
        <h1 class="portada__titulo">El club,<br>por escrito.</h1>
        <p class="entradilla">Los procesos que usamos cada día, con quién los responde y cuándo se revisaron por última vez.</p>
        <a class="ancla-abajo" href="#indice">Ver los ${resumen.total} procesos<span aria-hidden="true"> ↓</span></a>
      </div>

      <aside class="marcador revelar" aria-label="Estado del manual">
        <div class="marcador__cabecera">
          <span class="marcador__total">${dos(resumen.total)}</span>
          <span class="marcador__etq">procesos<br>documentados</span>
        </div>
        <dl class="marcador__filas">
          <div class="marcador__fila">
            <dt>Al día</dt><dd>${dos(resumen.aldia)}</dd>
          </div>
          <div class="marcador__fila marcador__fila--toca">
            <dt>Toca revisar</dt><dd>${dos(resumen.toca)}</dd>
          </div>
          <div class="marcador__fila marcador__fila--caducado">
            <dt>Caducados</dt><dd>${dos(resumen.caducado)}</dd>
          </div>
        </dl>
        <p class="marcador__pie">Última revisión: ${fecha(ultima.revisado)}</p>
        <div class="marcador__regla" aria-hidden="true"></div>
      </aside>
    </div>
  </section>

  <section class="indice" id="indice">
    <div class="envoltura">
      <div class="indice__barra">
        <div class="roles" role="group" aria-label="Filtrar por rol">
          <button class="rol es-activo" type="button" data-rol="todos" aria-pressed="true">Todo</button>
          ${roles
            .map(
              (r) =>
                `<button class="rol" type="button" data-rol="${esc(r)}" aria-pressed="false">${esc(r)}</button>`
            )
            .join("")}
        </div>
        <div class="filtro">
          <label class="visualmente-oculto" for="filtro">Buscar en el manual</label>
          <input id="filtro" class="filtro__campo" type="search" placeholder="Filtrar por tarea o palabra" data-filtro autocomplete="off">
          <span class="filtro__cuenta" data-cuenta aria-live="polite">${resumen.total} procesos</span>
        </div>
      </div>

      <ol class="lista" data-lista>
        ${filas}
      </ol>
      <p class="vacio" data-vacio hidden>
        <strong>Ningún proceso coincide.</strong>
        Prueba con otra palabra o quita el filtro de rol. Si el proceso no existe, pídelo a <a href="mailto:${esc(config.email)}">${esc(config.email)}</a>.
      </p>
    </div>
  </section>

  <section class="quien" id="quien">
    <div class="envoltura">
      <div class="quien__cabecera">
        <p class="rotulo">Quién responde</p>
        <h2 class="quien__titulo">Cada proceso tiene un nombre y una fecha.</h2>
        <p class="quien__texto">Nadie tiene que acordarse de revisarlo: si una ficha se queda vieja, aparece marcada aquí y le llega el aviso a quien la mantiene.</p>
      </div>
      <div class="quien__rejilla">
        ${duenos}
      </div>
      <a class="quien__enlace" href="${raiz}como-se-actualiza/index.html">
        Cómo se actualiza este manual
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </section>`;

  return documento({
    config,
    titulo: config.manual,
    descripcion: `${config.manual} de ${config.nombre}: ${resumen.total} procesos con responsable y fecha de revisión.`,
    raiz,
    clase: "pagina-indice",
    cuerpo,
  });
}

/* ---------------------------------------------------------------------- proceso */

export function paginaProceso({ config, p, todos, raiz }) {
  const relacionados = (p.relacionados ?? [])
    .map((n) => todos.find((x) => Number(x.numero) === Number(n)))
    .filter(Boolean);

  const renderBloques = (bloques) =>
    bloques
      .map((b) => {
        if (b.tipo === "p") return `<p class="texto">${b.items.join(" ")}</p>`;
        if (b.tipo === "nota")
          return `<p class="nota"><span>${b.items.join(" ")}</span></p>`;
        if (b.tipo === "ul")
          return `<ul class="lista-puntos">${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
        if (b.tipo === "ol")
          return `<ol class="lista-numerada">${b.items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
        return "";
      })
      .join("");

  const secciones = p.secciones
    .map((s) => {
      if (s.tipo === "pasos") {
        return `
        <section class="seccion" aria-labelledby="s-${normalizar(s.titulo).replace(/\W+/g, "-")}">
          <h2 class="seccion__titulo" id="s-${normalizar(s.titulo).replace(/\W+/g, "-")}">
            <span>${esc(s.titulo)}</span>
            <span class="seccion__meta">${s.pasos.length} paso${s.pasos.length === 1 ? "" : "s"}</span>
          </h2>
          <ol class="pasos">
            ${s.pasos
              .map(
                (paso, i) => `
              <li class="paso">
                <span class="paso__num" aria-hidden="true">${dos(i + 1)}</span>
                <div class="paso__cuerpo">
                  <h3 class="paso__titulo">${esc(paso.titulo)}</h3>
                  ${renderBloques(paso.bloques)}
                </div>
              </li>`
              )
              .join("")}
          </ol>
        </section>`;
      }
      return `
      <section class="seccion">
        <h2 class="seccion__titulo">${esc(s.titulo)}</h2>
        ${renderBloques(s.bloques)}
      </section>`;
    })
    .join("");

  const asunto = encodeURIComponent(`Revisar proceso ${p.numero}: ${p.titulo}`);
  const cuerpoMail = encodeURIComponent(
    `Hola:\n\nHe visto la ficha «${p.titulo}» (proceso ${p.numero}) y creo que algo ha cambiado.\n\nQué ha cambiado:\n\n\nGracias.`
  );

  const cuerpo = `
  <article class="proceso">
    <div class="envoltura">
      <nav class="miga" aria-label="Migas de pan">
        <a href="${raiz}index.html">Manual</a>
        <span aria-hidden="true">/</span>
        <span>${esc(p.zona)}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${esc(p.titulo)}</span>
      </nav>

      <div class="proceso__rejilla">
        <div class="proceso__principal">
          <header class="proceso__cab">
            <div class="proceso__placa">
              <span class="proceso__num">${dos(p.numero)}</span>
              <span class="proceso__zona">${esc(p.zona)}</span>
            </div>
            <h1 class="proceso__titulo">${esc(p.titulo)}</h1>
            <p class="proceso__cuando">${esc(p.cuando)}</p>
            ${p.critico
              ? `<p class="alerta alerta--critico"><strong>Protocolo crítico.</strong> Si hay una persona lesionada, no improvises: si dudas, llama a ${esc(
                  p.dueno
                )} antes de actuar.</p>`
              : ""}
            ${p.estado === "caducado"
              ? `<p class="alerta alerta--caducado"><strong>Esta ficha está caducada.</strong> Se revisó por última vez el ${fecha(
                  p.revisado
                )} y su revisión tocaba el ${fecha(p.caduca)}. Confirma lo que vas a hacer con ${esc(
                  p.dueno
                )}.</p>`
              : ""}
          </header>

          <div class="proceso__cuerpo">
            ${secciones}
          </div>

          ${
            relacionados.length
              ? `<aside class="relacionados">
                  <p class="rotulo">Suele ir con</p>
                  <ul>${relacionados
                    .map(
                      (r) =>
                        `<li><a href="${raiz}procesos/${r.slug}/index.html"><span class="relacionados__num">${dos(
                          r.numero
                        )}</span>${esc(r.titulo)}</a></li>`
                    )
                    .join("")}</ul>
                </aside>`
              : ""
          }
        </div>

        <aside class="rail" aria-label="Datos de la ficha">
          <div class="rail__bloque">
            <p class="rotulo">Responsable</p>
            <p class="rail__nombre">${esc(p.dueno)}</p>
            <p class="rail__detalle">${esc(p.duenoRol)}</p>
            <a class="rail__enlace" href="mailto:${esc(p.email)}">${esc(p.email)}</a>
          </div>

          <div class="rail__bloque">
            <p class="rotulo">Vigencia</p>
            <div class="rail__estado">${chip(p.estado)}</div>
            <p class="rail__vigencia">${textoVigencia(p)}</p>
            <dl class="rail__datos">
              <div><dt>Revisado</dt><dd>${fecha(p.revisado)}</dd></div>
              <div><dt>Caduca</dt><dd>${fecha(p.caduca)}</dd></div>
              <div><dt>Cadencia</dt><dd>${p.cadencia} meses</dd></div>
              <div><dt>Versión</dt><dd>${p.version}</dd></div>
            </dl>
          </div>

          <div class="rail__bloque">
            <p class="rotulo">Quién lo usa</p>
            <ul class="rail__roles">${p.roles.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          </div>

          <div class="rail__acciones">
            <button class="boton" type="button" data-imprimir>Imprimir esta ficha</button>
            <a class="boton boton--vacio" href="mailto:${esc(config.email)}?subject=${asunto}&body=${cuerpoMail}">Esto ha cambiado</a>
          </div>
          <p class="rail__nota">El aviso llega a ${esc(p.dueno)} con copia a dirección.</p>
        </aside>
      </div>
    </div>
  </article>`;

  return documento({
    config,
    titulo: `${p.numero} · ${p.titulo}`,
    descripcion: p.cuando,
    raiz,
    clase: "pagina-proceso",
    cuerpo,
  });
}

/* --------------------------------------------------------------- actualización */

export function paginaMantenimiento({ config, procesos, resumen, raiz }) {
  const filas = procesos
    .map(
      (p) => `
      <tr>
        <td class="tabla__num">${dos(p.numero)}</td>
        <td>${esc(p.titulo)}</td>
        <td>${esc(p.dueno)}</td>
        <td class="tabla__fecha">${fecha(p.revisado)}</td>
        <td class="tabla__fecha">${fecha(p.caduca)}</td>
        <td>${chip(p.estado)}</td>
      </tr>`
    )
    .join("");

  const cuerpo = `
  <article class="documento">
    <div class="envoltura documento__envoltura">
      <p class="rotulo">Para quien mantiene el manual</p>
      <h1 class="documento__titulo">Cómo se actualiza</h1>
      <p class="documento__entradilla">Un proceso se cambia en un sitio y solo en uno: su ficha. No hay que tocar el diseño, ni avisar a nadie para que lo suba.</p>

      <div class="documento__rejilla">
        <section class="documento__bloque">
          <h2 class="documento__h2"><span class="documento__n">01</span>Se edita la ficha</h2>
          <p class="texto">Cada proceso es un archivo de texto con su ficha delante: título, cuándo se usa, pasos, responsable y fecha de revisión. Se edita desde el panel del manual o directamente en el archivo, da igual: es el mismo contenido.</p>
        </section>
        <section class="documento__bloque">
          <h2 class="documento__h2"><span class="documento__n">02</span>Se comprueba</h2>
          <p class="texto">Si a una ficha le falta el responsable, la fecha o la cadencia, el manual no se publica y dice exactamente qué falta. No se puede dejar un proceso a medias sin darse cuenta.</p>
        </section>
        <section class="documento__bloque">
          <h2 class="documento__h2"><span class="documento__n">03</span>Se publica</h2>
          <p class="texto">Al guardar, el manual se reconstruye solo en menos de un minuto. Queda el histórico: quién cambió qué y cuándo, y se puede volver atrás.</p>
        </section>
      </div>

      <h2 class="documento__h2 documento__h2--suelto">El estado de cada ficha</h2>
      <dl class="leyenda">
        <div><dt>${chip("aldia")}</dt><dd>Revisada dentro de plazo. No hay que hacer nada.</dd></div>
        <div><dt>${chip("toca")}</dt><dd>Quedan menos de dos meses para su caducidad. Hay que revisarla y actualizar la fecha.</dd></div>
        <div><dt>${chip("caducado")}</dt><dd>Pasó su fecha. Se sigue mostrando, pero avisando de que puede estar desfasada.</dd></div>
      </dl>

      <h2 class="documento__h2 documento__h2--suelto">El manual, ficha por ficha</h2>
      <table class="tabla">
        <caption class="visualmente-oculto">Procesos, responsable y estado de revisión</caption>
        <thead>
          <tr><th scope="col">Nº</th><th scope="col">Proceso</th><th scope="col">Responsable</th><th scope="col">Revisado</th><th scope="col">Caduca</th><th scope="col">Estado</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <div class="documento__cierre">
        <p class="documento__cifra">${dos(resumen.total)} procesos · ${dos(resumen.caducado)} caducados</p>
        <p class="texto">Hoy el manual está en este punto. La cifra de la derecha es la que hay que vigilar: mientras esté en cero, cualquiera puede fiarse de lo que lee.</p>
        <a class="boton" href="${raiz}index.html">Volver al manual</a>
      </div>
    </div>
  </article>`;

  return documento({
    config,
    titulo: "Cómo se actualiza",
    descripcion: "El flujo de mantenimiento del manual de operaciones.",
    raiz,
    clase: "pagina-documento",
    cuerpo,
  });
}
