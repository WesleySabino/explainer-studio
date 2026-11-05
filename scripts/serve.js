#!/usr/bin/env node
/* Zero-dependency static server for local development: `npm start` (PORT=4173 by default). */
"use strict";
var http = require("http");
var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var PORT = +process.env.PORT || 4173;
var TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8"
};

http.createServer(function (req, res) {
  var url = decodeURIComponent(req.url.split("?")[0]);
  var file = path.normalize(path.join(ROOT, url.endsWith("/") ? url + "index.html" : url));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, function () {
  process.stdout.write("Explainer Studio running at http://localhost:" + PORT + "/\n");
});
