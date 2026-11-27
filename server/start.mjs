import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createApi } from "./api.mjs";
import { FLAVOURS } from "../src/data/flavours.ts";

const root = resolve("dist");
const index = await readFile(resolve(root, "index.html"));
const api = createApi(FLAVOURS);
const types = { js: "text/javascript", css: "text/css" };
const server = createServer((req, res) =>
  api(req, res, async () => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      const path = new URL(req.url, "http://localhost").pathname;
      if (path.startsWith("/assets/")) {
        if (!/^\/assets\/[\w.-]+\.(js|css)$/.test(path)) {
          res.writeHead(404);
          res.end();
          return;
        }
        const file = resolve(root, "." + path);
        const { size } = await stat(file);
        res.writeHead(200, {
          "Content-Type": types[path.split(".").pop()],
          "Content-Length": size,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(req.method === "HEAD" ? undefined : await readFile(file));
        return;
      }
      const known =
        /^\/(?:|shop(?:\/(?:orange|lime|mix|berry))?|flavors|community(?:\/\d+)?|cart|checkout|about|dashboard|contact|sign-in|orders\/[a-f0-9-]+)\/?$/.test(
          path,
        );
      res.writeHead(known ? 200 : 404, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : index);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  }),
);
server.listen(
  Number(process.env.PORT || 4173),
  process.env.HOST || "127.0.0.1",
  () => console.log("Fizz Theory listening on port", server.address().port),
);
