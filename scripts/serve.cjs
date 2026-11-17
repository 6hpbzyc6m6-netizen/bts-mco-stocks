/* Serveur local de développement uniquement ; non requis sur GitHub Pages. */
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const args = process.argv.slice(2),
  option = (key, fallback) =>
    args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const root = path.resolve(__dirname, "..");
http
  .createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const target = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!target.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end();
      }
      fs.readFile(target, (error, data) => {
        if (error) {
          res.writeHead(404);
          return res.end("Introuvable");
        }
        res.setHeader(
          "Content-Type",
          {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css",
            ".js": "text/javascript",
            ".json": "application/json",
          }[path.extname(target)] || "application/octet-stream",
        );
        res.end(data);
      });
    } catch (e) {
      res.writeHead(400);
      res.end();
    }
  })
  .listen(Number(option("--port", 8000)), option("--host", "127.0.0.1"));
