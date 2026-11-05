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

El panel ya está montado en `/admin`. No hay que venir a esta conversación ni ejecutar
nada: se abre en el navegador, se elige un proceso y se publica.

### Publicarlo la primera vez (una tarde)

1. **GitHub.** Crea un repositorio privado y sube el proyecto:

   ```
   git remote add origin git@github.com:TU-USUARIO/manual-planet-fitness.git
   git push -u origin main
   ```

2. **Netlify.** *Add new site → Import an existing project → GitHub*. Elige el
   repositorio y no toques nada: `netlify.toml` ya trae el comando de construcción
   (`node scripts/construir.mjs`) y la carpeta que se publica (`dist`).

3. **La línea que falta.** En el repositorio, abre `publico/admin/config.yml` y cambia
   `repo: CAMBIAR-usuario/manual-planet-fitness` por tu usuario real. Guarda y sube.

4. **El permiso.** Entra en `https://TU-SITIO.netlify.app/admin`. La primera vez pide
   autorizar a GitHub: se concede una vez por persona y no vuelve a preguntar.

### El día a día

`/admin` → Procesos → elegir el proceso → editar → **Publicar**.

En un minuto está en el manual. Si intentas guardar sin responsable o sin fecha, no te
deja: los campos obligatorios del formulario son los mismos que exige la construcción.
Y cada cambio queda en el histórico con quién lo hizo.

### Probarlo en tu ordenador, sin cuentas

```
npx decap-server          # una terminal, en la carpeta del proyecto
node scripts/servir.mjs   # otra terminal
```

Y abrir `http://127.0.0.1:5177/admin/`. Ahí está activado `local_backend`, así que el
panel escribe directamente en los archivos: sirve para probar sin tocar GitHub.

### Si el permiso falla

El panel depende de un OAuth de GitHub. Si Netlify dejara de ofrecer su pasarela, se
resuelve con un pequeño worker (unas veinte líneas) sin tocar ni el contenido ni el
diseño. Es el único punto externo de todo el montaje.

---

## Publicarlo

`netlify.toml` ya está preparado: al conectar el repositorio, Netlify construye con
`node scripts/construir.mjs` y publica `dist/`.

- **Netlify** (recomendado): gratis para este tamaño, HTTPS y despliegue automático en
  cada cambio.
- **Cloudflare Pages**: también gratis; hay que indicar a mano el comando y la carpeta.
- **Servidor propio**: ejecutar `node scripts/construir.mjs` y copiar `dist/` por FTP.
- **Solo intranet**: igual, con contraseña o detrás de la VPN del club.

El panel va marcado con `noindex` y cabeceras que impiden incrustarlo en otro sitio.

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

---

## Decisiones que conviene conocer

- **Sin dependencias en el manual.** No hay `node_modules`, ni framework, ni
  actualizaciones que rompan el sitio en dos años. Node solo lee archivos y escribe
  HTML. El panel de edición es lo único externo: carga Decap desde un CDN y solo se
  abre cuando alguien va a editar.
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
