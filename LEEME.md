# Manual de operaciones · prototipo

Manual interno para el club: cada proceso en una ficha, con su responsable, su fecha
de revisión y una marca visible cuando se queda viejo.

Este documento está pensado para quien vaya a mantenerlo, no para quien lo lee.

---

## Verlo

```bash
node scripts/servir.mjs 5177
```

Y abrir `http://127.0.0.1:5177`. No hay que instalar nada: el proyecto no tiene
dependencias, solo Node.

Para reconstruirlo después de tocar el contenido:

```bash
node scripts/construir.mjs
```

Y para reconstruir y comprobar que no hay enlaces rotos ni clases sueltas:

```bash
node scripts/construir.mjs && node scripts/revisar.mjs
```

---

## Cómo está montado

```
contenido/procesos/*.md   ← el manual. Un archivo por proceso. Aquí se edita todo.
publico/estilos.css       ← el diseño. No hace falta tocarlo para cambiar contenido.
publico/app.js            ← filtro, buscador y atajos.
scripts/construir.mjs     ← convierte los .md en páginas. Valida antes de publicar.
scripts/revisar.mjs       ← control de calidad del resultado.
dist/                     ← lo que se publica. Nunca se edita a mano.
```

**La regla:** si algo no está en `contenido/procesos/`, no existe. No hay una segunda
copia del manual en ningún otro sitio, ni un PDF suelto, ni una carpeta compartida.

---

## Añadir o cambiar un proceso

1. Crea un archivo en `contenido/procesos/` con el nombre en minúsculas y con guiones:
   `06-apertura-de-vestuarios.md`. El número del principio ordena la lista.
2. Copia la cabecera de otro proceso y cámbiala.
3. Escribe el cuerpo con esta estructura:

```markdown
## Antes de empezar
- Lo que hay que tener a mano.

## Pasos
### Título del primer paso
Qué se hace, en una o dos frases.

> Una nota: el detalle que evita el error típico.

### Título del segundo paso
...

## Si algo no cuadra
- A quién se avisa y qué no se hace.
```

4. Reconstruye y comprueba: `node scripts/construir.mjs && node scripts/revisar.mjs`.

### Los campos de la cabecera

| Campo | Qué es | Ejemplo |
|---|---|---|
| `numero` | Orden en la lista | `06` |
| `titulo` | Nombre del proceso | `Apertura de vestuarios` |
| `zona` | Dónde ocurre | `Sala`, `Recepción`, `Peluquería` |
| `roles` | Quién lo usa, como lista | `[Recepción, Entrenadores]` |
| `dueno` | La persona responsable de que esté al día | `Iván Serrano` |
| `duenoRol` | Su puesto | `Entrenador jefe` |
| `email` | Dónde llegan los avisos | `ivan@planetfitness.es` |
| `critico` | `true` si un error hace daño a alguien | `true` |
| `version` | Número de versión de la ficha | `3` |
| `revisado` | Última revisión, en formato `AAAA-MM-DD` | `2026-06-20` |
| `cadencia` | Cada cuántos meses hay que revisarlo | `12` |
| `cuando` | La duda del empleado, en sus palabras | `Alguien se hace daño…` |
| `etiquetas` | Palabras por las que se busca | `[lesión, seguro, partes]` |
| `relacionados` | Números de procesos que suelen ir juntos | `[03]` |

**Obligatorios todos menos `critico` y `relacionados`.** Si falta el responsable, la
fecha o la cadencia, el manual no se construye y dice qué ficha y qué campo fallan.
Es a propósito: un proceso sin dueño es un proceso que se queda viejo.

---

## Cómo se mantiene sin que se olvide

Tres capas, y solo la primera es obligatoria:

1. **La fecha dentro de la ficha.** Cada proceso lleva `revisado` y `cadencia`. El
   manual calcula la caducidad solo y la enseña en la portada, en la lista y en la ficha.
   Un proceso caducado sigue visible, pero avisando: nunca se esconde la información,
   se marca.
2. **El aviso automático.** Un proceso programado (GitHub Actions o el cron que sea)
   recorre las fichas y abre un aviso al `dueno` cuando faltan 60 días o cuando ya
   ha caducado. Treinta líneas de script; no hace falta contratar nada.
3. **El botón «Esto ha cambiado».** Cualquiera que use el manual puede avisar desde la
   propia ficha. El mensaje llega ya con el proceso identificado, así que el
   responsable no tiene que adivinar de qué le hablan.

---

## Editar sin tocar archivos

El contenido es Markdown plano, así que cualquier CMS basado en Git puede escribir en
él sin cambiar nada del diseño. Lo más directo es **Decap CMS**, que añade un panel en
`/admin` sobre el mismo repositorio:

```yaml
# publico/admin/config.yml (extracto)
backend:
  name: github
  repo: vuestra-cuenta/manual-planet-fitness
  branch: main
media_folder: "publico/imagenes"
collections:
  - name: procesos
    label: Procesos
    folder: contenido/procesos
    extension: md
    format: frontmatter
    create: true
    fields:
      - { name: titulo, label: Título, widget: string }
      - { name: dueno, label: Responsable, widget: string }
      - { name: revisado, label: Última revisión, widget: date }
      - { name: cadencia, label: Cadencia (meses), widget: number, default: 12 }
      - { name: body, label: Contenido, widget: markdown }
```

Necesita que alguien conceda el acceso OAuth del repositorio una sola vez. A partir de
ahí, recepción o peluquería editan con formularios y el manual se reconstruye solo.

---

## Publicarlo

El resultado de `dist/` es estático: se sube a Netlify, Cloudflare Pages, Vercel o
cualquier servidor de la empresa. Opciones, de menos a más control:

- **Netlify o Cloudflare Pages**, gratis, con despliegue automático en cada cambio.
- **Servidor propio**, copiando `dist/` por FTP. Funciona igual, sin despliegue automático.
- **Solo intranet**, con contraseña o detrás de la VPN del club.

Si el manual es interno, protégelo: no hay nada sensible dentro, pero tampoco hace
falta que sea público.

---

## Lo que falta para producción

Esto es un prototipo, y hay cuatro cosas que no están hechas a propósito:

- **Códigos QR** en los puestos de trabajo, que abran la ficha exacta. Es lo que más
  se usa en sala y almacén, y es un añadido de una tarde.
- **Fotos reales** de la sala, la máquina concreta o el mostrador. Un manual con una
  foto del sitio correcto ahorra tres párrafos.
- **Historial visible** en la propia ficha: quién cambió qué y cuándo.
- **Acceso con la cuenta del club** (Google Workspace, Microsoft), si se publica fuera
  de la intranet.

---

## Decisiones que conviene conocer

- **Sin dependencias.** No hay `node_modules`, ni framework, ni actualizaciones que
  rompan el manual en dos años. Node solo lee archivos y escribe HTML.
- **Contenido separado del diseño.** Cambiar los pasos de un proceso no toca ni una
  línea de CSS.
- **El estado se calcula, no se escribe.** Nadie marca «caducado» a mano: sale de la
  fecha de revisión y de la cadencia.
- **Sin JavaScript se sigue leyendo.** El filtro y el buscador rápido lo necesitan,
  pero la lista y todas las fichas están completas en el HTML.
- **Un tema, cuatro colores con oficio.** Morado para la identidad y las acciones
  principales, amarillo para lo que pide atención (siempre con texto negro encima,
  porque el amarillo sobre blanco no se lee), negro para el texto y las reglas, y
  blanco para el fondo. El morado no es señal de nada: si aparece, es marca.
