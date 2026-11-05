#!/usr/bin/env node
/* Explainer Studio CLI: build the prompt from an answers file (the one "Export answers" downloads) or from flags. */
"use strict";
var fs = require("fs");
var path = require("path");
var C = require("../src/core.js");
var S = C.schema;

var HELP = [
  "Usage: explainer-studio [answers.json] [options]",
  "",
  "Builds the prompt and prints it to stdout.",
  "",
  "Options:",
  "  --preset <name>     Start from a preset: " + Object.keys(S.presets).join(", "),
  "  --level <1-4>       Level of detail (default 2)",
  "  --lang <pt|en>      Prompt language (default en)",
  "  --why               Include the rationale behind each rule",
  "  --off <ids>         Comma-separated optional sections to leave out",
  "  --set <id=value>    Set a field; repeatable. Lists use commas, switches true/false",
  "  --out <file>        Write to a file instead of stdout",
  "  --fields            Print every field id, type, level and option, then exit",
  "  -h, --help          Show this help",
  "",
  "Examples:",
  "  explainer-studio --preset course --level 3 --lang pt",
  "  explainer-studio answers.json --why --out prompt.md",
  "  explainer-studio --set name=\"Photosynthesis 101\" --set langs=en,pt --set attribution=invisible"
].join("\n");

function fail(msg) { process.stderr.write("explainer-studio: " + msg + "\n"); process.exit(1); }

function parse(argv) {
  var o = { file: null, sets: [] };
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    var next = function () { if (i + 1 >= argv.length) fail("missing value for " + a); return argv[++i]; };
    if (a === "-h" || a === "--help") o.help = true;
    else if (a === "--fields") o.fields = true;
    else if (a === "--why") o.why = true;
    else if (a === "--preset") o.preset = next();
    else if (a === "--level") o.level = next();
    else if (a === "--lang") o.lang = next();
    else if (a === "--off") o.off = next().split(",").filter(Boolean);
    else if (a === "--set") o.sets.push(next());
    else if (a === "--out") o.out = next();
    else if (a.charAt(0) === "-") fail("unknown option " + a + " (see --help)");
    else if (!o.file) o.file = a;
    else fail("only one answers file is accepted");
  }
  return o;
}

function fieldsReference(lang) {
  var out = [];
  S.sections.forEach(function (sec) {
    out.push("## " + sec.id + " · " + sec.title[lang] + (sec.optional ? " (optional)" : "") + (sec.level > 1 ? " · level " + sec.level : ""), "");
    sec.fields.forEach(function (f) {
      var line = "- `" + f.id + "` " + f.type + ", level " + f.level + ": " + f.label[lang];
      if (f.def !== undefined) line += " · default " + JSON.stringify(f.def);
      out.push(line);
      if (f.options) out.push("  " + f.options.map(function (op) { return "`" + op.v + "`"; }).join(" "));
    });
    out.push("");
  });
  return out.join("\n");
}

function coerceSet(spec) {
  var eq = spec.indexOf("=");
  if (eq < 1) fail("--set expects id=value, got " + spec);
  var id = spec.slice(0, eq), raw = spec.slice(eq + 1), f = C.fields[id];
  if (!f) fail("unknown field " + id + " (see --fields)");
  if (f.type === "multi") return [id, raw ? raw.split(",").map(function (s) { return s.trim(); }) : []];
  if (f.type === "switch") {
    if (raw !== "true" && raw !== "false") fail(id + " is a switch: use true or false");
    return [id, raw === "true"];
  }
  if (f.options && !f.options.some(function (op) { return op.v === raw; })) {
    fail(id + " must be one of: " + f.options.map(function (op) { return op.v; }).join(", "));
  }
  return [id, raw];
}

var o = parse(process.argv.slice(2));
if (o.help) { process.stdout.write(HELP + "\n"); process.exit(0); }
if (o.lang && S.uiLanguages.indexOf(o.lang) < 0) fail("--lang must be one of " + S.uiLanguages.join(", "));
if (o.fields) { process.stdout.write(fieldsReference(o.lang || "en")); process.exit(0); }

var input = {};
if (o.file) {
  try { input = JSON.parse(fs.readFileSync(path.resolve(o.file), "utf8")); }
  catch (e) { fail("cannot read " + o.file + ": " + e.message); }
}
if (o.preset) {
  if (!S.presets[o.preset]) fail("unknown preset " + o.preset + " (" + Object.keys(S.presets).join(", ") + ")");
  input.preset = o.preset;
}
if (o.level) {
  if (!/^[1-4]$/.test(o.level)) fail("--level must be 1, 2, 3 or 4");
  input.level = +o.level;
}
if (o.lang) input.lang = o.lang;
if (o.why) input.why = true;
if (o.off) {
  o.off.forEach(function (id) { if (!C.sections[id] || !C.sections[id].optional) fail(id + " is not an optional section"); });
  input.off = o.off;
}
if (o.sets.length) {
  input.values = Object.assign({}, input.values || {});
  o.sets.forEach(function (spec) { var kv = coerceSet(spec); input.values[kv[0]] = kv[1]; });
}

var prompt = C.build(input);
if (o.out) fs.writeFileSync(path.resolve(o.out), prompt);
else process.stdout.write(prompt);
