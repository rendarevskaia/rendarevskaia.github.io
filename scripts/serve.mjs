import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  let target = path.join(root, pathname);
  if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, "index.html");
  if (!existsSync(target)) target = path.join(root, "404.html");
  response.writeHead(target.endsWith("404.html") ? 404 : 200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
  createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Локальный сайт: http://127.0.0.1:${port}`);
});
