/* Manual de operaciones · comportamiento
   Sin dependencias. Si el JavaScript falla, el manual se sigue leyendo entero. */

const raiz = document.body.dataset.raiz || "./";
const normalizar = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* ------------------------------------------------------------- teclas visibles */

const esMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
for (const k of document.querySelectorAll(".disparo kbd")) {
  k.textContent = esMac ? "⌘ K" : "Ctrl K";
}

/* ------------------------------------------------------------------- imprimir */

for (const b of document.querySelectorAll("[data-imprimir]")) {
  b.addEventListener("click", () => window.print());
}

/* -------------------------------------------------------------------- filtrar */

const lista = document.querySelector("[data-lista]");
if (lista) {
  const fichas = [...lista.querySelectorAll("[data-proceso]")];
  const campo = document.querySelector("[data-filtro]");
  const cuenta = document.querySelector("[data-cuenta]");
  const vacio = document.querySelector("[data-vacio]");
  const chips = [...document.querySelectorAll("[data-rol]")];
  let rol = "todos";

  const aplicar = () => {
    const palabras = normalizar(campo?.value ?? "").split(/\s+/).filter(Boolean);
    let visibles = 0;

    for (const f of fichas) {
      const cumpleRol = rol === "todos" || (f.dataset.roles ?? "").split("|").includes(rol);
      const texto = f.dataset.texto ?? "";
      const cumpleTexto = palabras.every((p) => texto.includes(p));
      const mostrar = cumpleRol && cumpleTexto;
      f.hidden = !mostrar;
      if (mostrar) visibles++;
    }

    if (cuenta) cuenta.textContent = `${visibles} proceso${visibles === 1 ? "" : "s"}`;
    if (vacio) vacio.hidden = visibles > 0;
  };

  for (const c of chips) {
    c.addEventListener("click", () => {
      rol = c.dataset.rol;
      for (const otro of chips) {
        const activo = otro === c;
        otro.classList.toggle("es-activo", activo);
        otro.setAttribute("aria-pressed", String(activo));
      }
      aplicar();
    });
  }

  campo?.addEventListener("input", aplicar);

  /* la barra "/" lleva al filtro, como en un buscador de verdad */
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? "")) {
      e.preventDefault();
      campo?.focus();
    }
  });
}

/* --------------------------------------------------------------------- paleta */

const paleta = document.querySelector("[data-paleta]");
const campoPaleta = document.querySelector("[data-paleta-campo]");
const listaPaleta = document.querySelector("[data-paleta-lista]");
const cuentaPaleta = document.querySelector("[data-paleta-cuenta]");
let indice = null;
let activo = 0;

async function cargarIndice() {
  if (indice) return indice;
  const respuesta = await fetch(`${raiz}buscar.json`, { cache: "no-store" });
  indice = await respuesta.json();
  return indice;
}

function pintar(items, total) {
  activo = 0;
  if (!items.length) {
    listaPaleta.innerHTML = `<li class="paleta__vacio">Nada coincide. Prueba con otra palabra o pide el proceso a dirección.</li>`;
  } else {
    listaPaleta.innerHTML = items
      .map(
        (p, i) => `
        <li class="paleta__item${i === 0 ? " es-activo" : ""}" data-indice="${i}">
          <a href="${raiz}${p.s}">
            <span class="paleta__item-num">${p.n}</span>
            <span class="paleta__item-titulo">${p.t}</span>
            <span class="paleta__item-zona">${p.z}</span>
          </a>
        </li>`
      )
      .join("");
  }
  if (cuentaPaleta) cuentaPaleta.textContent = `${total} de ${indice?.length ?? 0}`;
}

function mover(delta) {
  const items = [...listaPaleta.querySelectorAll(".paleta__item")];
  if (!items.length) return;
  items[activo]?.classList.remove("es-activo");
  activo = (activo + delta + items.length) % items.length;
  items[activo].classList.add("es-activo");
  items[activo].scrollIntoView({ block: "nearest" });
}

async function abrirPaleta() {
  if (!paleta) return;
  paleta.hidden = false;
  document.body.style.overflow = "hidden";
  if (campoPaleta) {
    campoPaleta.value = "";
    campoPaleta.focus();
  }
  try {
    const datos = await cargarIndice();
    pintar(datos, datos.length);
  } catch {
    listaPaleta.innerHTML = `<li class="paleta__vacio">La búsqueda rápida necesita que el manual se abra desde su dirección web. El filtro de la portada funciona igual.</li>`;
  }
}

function cerrarPaleta() {
  if (!paleta || paleta.hidden) return;
  paleta.hidden = true;
  document.body.style.overflow = "";
  document.querySelector("[data-abrir-paleta]")?.focus();
}

document.querySelector("[data-abrir-paleta]")?.addEventListener("click", abrirPaleta);
document.querySelector("[data-cerrar-paleta]")?.addEventListener("click", cerrarPaleta);

campoPaleta?.addEventListener("input", () => {
  const palabras = normalizar(campoPaleta.value).split(/\s+/).filter(Boolean);
  const datos = (indice ?? []).filter((p) => palabras.every((w) => p.bus.includes(w)));
  pintar(datos, datos.length);
});

document.addEventListener("keydown", (e) => {
  const abierta = paleta && !paleta.hidden;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    abierta ? cerrarPaleta() : abrirPaleta();
    return;
  }
  if (!abierta) return;

  if (e.key === "Escape") {
    e.preventDefault();
    cerrarPaleta();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    mover(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mover(-1);
  } else if (e.key === "Enter") {
    const enlace = listaPaleta.querySelector(".es-activo a");
    if (enlace) {
      e.preventDefault();
      window.location.href = enlace.getAttribute("href");
    }
  }
});

/* ---------------------------------------------------------------- aparición */

const suave = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const piezas = document.querySelectorAll(".revelar");

if (suave || !("IntersectionObserver" in window)) {
  piezas.forEach((p) => p.classList.add("es-visible"));
} else {
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("es-visible");
          observador.unobserve(entrada.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  piezas.forEach((p) => observador.observe(p));
}
