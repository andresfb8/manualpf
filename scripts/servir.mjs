import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const puerto = Number(process.argv[2] ?? 5177);

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const servidor = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let ruta = normalize(join(raiz, url));
    if (!ruta.startsWith(raiz)) {
      res.writeHead(403).end("Prohibido");
      return;
    }
    let info = await stat(ruta).catch(() => null);
    if (info?.isDirectory()) {
      ruta = join(ruta, "index.html");
      info = await stat(ruta).catch(() => null);
    }
    if (!info) {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1><p>No encuentro esa página.</p>");
      return;
    }
    const cuerpo = await readFile(ruta);
    res.writeHead(200, {
      "content-type": tipos[extname(ruta)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(cuerpo);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

servidor.listen(puerto, "127.0.0.1", () => {
  console.log(`Manual en http://127.0.0.1:${puerto}`);
});
