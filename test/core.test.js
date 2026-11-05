"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var execFileSync = require("child_process").execFileSync;
var C = require("../src/core.js");
var UI = require("../src/i18n.js");
var S = C.schema;

var LANGS = S.uiLanguages;
var TYPES = ["choice", "multi", "switch", "select", "text", "area"];

function allFields() {
  var out = [];
  S.sections.forEach(function (s) { s.fields.forEach(function (f) { out.push(f); }); });
  return out;
}

/* ---------------------------------------------------------------- schema */

test("field ids are unique and types are known", function () {
  var seen = {};
  allFields().forEach(function (f) {
    assert.ok(!seen[f.id], "duplicate field id " + f.id);
    seen[f.id] = true;
    assert.ok(TYPES.indexOf(f.type) > -1, f.id + " has unknown type " + f.type);
    assert.ok(f.level >= 1 && f.level <= 4, f.id + " level");
  });
});

test("every label, option and placeholder is translated", function () {
  S.sections.forEach(function (s) {
    LANGS.forEach(function (l) { assert.ok(s.title[l], s.id + " title " + l); });
  });
  allFields().forEach(function (f) {
    LANGS.forEach(function (l) {
      assert.ok(f.label[l], f.id + " label " + l);
      if (f.ph && typeof f.ph === "object") assert.ok(typeof f.ph[l] === "string", f.id + " placeholder " + l);
      (f.options || []).forEach(function (o) {
        assert.ok(o.label[l], f.id + "." + o.v + " label " + l);
        assert.ok(typeof o.say[l] === "string", f.id + "." + o.v + " phrase " + l);
      });
    });
  });
  Object.keys(S.presets).forEach(function (k) {
    LANGS.forEach(function (l) { assert.ok(S.presets[k].name[l], "preset " + k + " name " + l); });
  });
});

test("defaults and presets only use valid option values", function () {
  function check(f, v, where) {
    if (!f.options) return;
    var ok = f.options.map(function (o) { return o.v; });
    (Array.isArray(v) ? v : [v]).forEach(function (x) { assert.ok(ok.indexOf(x) > -1, where + ": " + f.id + " = " + x); });
  }
  allFields().forEach(function (f) { if (f.def !== undefined) check(f, f.def, "default"); });
  Object.keys(S.presets).forEach(function (k) {
    var vals = S.presets[k].values;
    Object.keys(vals).forEach(function (id) {
      assert.ok(C.fields[id], "preset " + k + " sets unknown field " + id);
      check(C.fields[id], vals[id], "preset " + k);
    });
  });
});

test("interface strings exist in every language", function () {
  var keys = Object.keys(UI[LANGS[0]]).sort();
  LANGS.forEach(function (l) {
    assert.deepEqual(Object.keys(UI[l]).sort(), keys, "UI keys for " + l);
    keys.forEach(function (k) { assert.ok(UI[l][k], l + "." + k); });
  });
});

/* ----------------------------------------------------------------- state */

test("normalize repairs bad input", function () {
  var st = C.normalize({ level: 9, lang: "xx", why: "yes", off: ["source", "analytics", "nope"], values: { goal: "nope", langs: ["en", "zz"], honesty: "on", name: 5, extra: "hi" } });
  assert.equal(st.level, 2);
  assert.equal(st.lang, "en");
  assert.equal(st.why, false);
  assert.deepEqual(Object.keys(st.off), ["analytics"]);
  assert.equal(st.values.goal, "teach");
  assert.deepEqual(st.values.langs, ["en"]);
  assert.equal(st.values.honesty, true);
  assert.equal(st.values.name, "");
  assert.equal(st.values.extra, "hi");
});

test("values layer over the chosen preset", function () {
  var st = C.normalize({ preset: "light", values: { name: "X" } });
  assert.equal(st.values.anim, "calm");
  assert.equal(st.values.name, "X");
});

/* --------------------------------------------------------------- builder */

test("every preset × level × language builds clean Markdown", function () {
  Object.keys(S.presets).forEach(function (p) {
    [1, 2, 3, 4].forEach(function (level) {
      LANGS.forEach(function (lang) {
        [false, true].forEach(function (why) {
          var out = C.build({ preset: p, level: level, lang: lang, why: why });
          var where = p + "/" + level + "/" + lang + "/" + why;
          assert.match(out, /^# /, where);
          assert.doesNotMatch(out, /undefined|null|NaN|\[object/, where);
          assert.doesNotMatch(out, /^- $/m, where + " empty bullet");
          assert.doesNotMatch(out, /\n{3,}/, where + " blank runs");
          var nums = (out.match(/^## (\d+)\./gm) || []).map(function (h) { return +h.slice(3, -1); });
          nums.forEach(function (n, i) { assert.equal(n, i + 1, where + " section numbering"); });
        });
      });
    });
  });
});

test("a fully loaded configuration builds in both languages", function () {
  var values = {};
  allFields().forEach(function (f) {
    if (f.type === "multi") values[f.id] = f.options.map(function (o) { return o.v; });
    else if (f.type === "switch") values[f.id] = true;
    else if (f.type === "text" || f.type === "area") values[f.id] = "sample " + f.id;
  });
  values.langs = ["pt", "en", "es"];
  values.an_tool = "ga4";
  values.deploy_now = "now";
  values.domain = "learn.example.com";
  LANGS.forEach(function (lang) {
    var out = C.build({ level: 4, lang: lang, why: true, values: values });
    assert.doesNotMatch(out, /undefined|null|NaN|\[object/);
    assert.match(out, /learn\.example\.com/);
    assert.match(out, /`\/es\/`/);
  });
});

test("fields above the level stay out of the prompt", function () {
  var values = { prereq: "knows algebra", palette: "#123456" };
  assert.doesNotMatch(C.build({ level: 2, values: values }), /knows algebra|#123456/);
  var full = C.build({ level: 4, values: values });
  assert.match(full, /knows algebra/);
  assert.match(full, /#123456/);
});

test("sections switched off disappear", function () {
  var on = C.build({ level: 2, values: { an_tool: "plausible" } });
  var off = C.build({ level: 2, off: ["analytics"], values: { an_tool: "plausible" } });
  assert.match(on, /Plausible/);
  assert.doesNotMatch(off, /Plausible|## \d+\. Analytics/);
});

test("conditional fields only apply when relevant", function () {
  var out = C.build({ level: 3, values: { domain: "", dns: "Cloudflare" } });
  assert.doesNotMatch(out, /Cloudflare/);
  out = C.build({ level: 3, values: { domain: "learn.example.com", dns: "Cloudflare" } });
  assert.match(out, /DNS at Cloudflare/);
});

test("rationale only appears when requested", function () {
  assert.doesNotMatch(C.build({ level: 3 }), /_Why: /);
  assert.match(C.build({ level: 3, why: true }), /_Why: /);
  assert.match(C.build({ level: 3, why: true, lang: "pt" }), /_Por quê: /);
});

test("agent credit: co-author", function () {
  ["pt", "en"].forEach(function (lang) {
    var out = C.build({ level: 1, lang: lang, values: { attribution: "coauthor" } });
    assert.match(out, /Co-Authored-By:/);
    assert.doesNotMatch(out, /user\.name/);
  });
});

test("agent credit: invisible", function () {
  ["pt", "en"].forEach(function (lang) {
    var out = C.build({ level: 1, lang: lang, values: { attribution: "invisible" } });
    assert.match(out, /user\.name/);
    assert.match(out, /`Co-Authored-By`/);
    assert.match(out, lang === "pt" ? /sem trailers/ : /no `Co-Authored-By` trailers/);
  });
});

/* ------------------------------------------------------------------- CLI */

var CLI = path.join(__dirname, "..", "bin", "explainer-studio.js");
function cli(args) { return execFileSync(process.execPath, [CLI].concat(args), { encoding: "utf8" }); }

test("CLI builds the same prompt as the core", function () {
  assert.equal(cli(["--preset", "course", "--level", "3", "--lang", "pt"]), C.build({ preset: "course", level: 3, lang: "pt" }));
});

test("CLI --set coerces lists and switches", function () {
  var out = cli(["--set", "langs=en,pt", "--set", "honesty=false", "--set", "attribution=invisible"]);
  assert.match(out, /Brazilian Portuguese/);
  assert.doesNotMatch(out, /Synthesis/);
  assert.match(out, /user\.name/);
});

test("CLI rejects unknown fields and values", function () {
  assert.throws(function () { execFileSync(process.execPath, [CLI, "--set", "nope=1"], { stdio: "pipe" }); });
  assert.throws(function () { execFileSync(process.execPath, [CLI, "--set", "goal=fly"], { stdio: "pipe" }); });
});

test("CLI --fields lists every field", function () {
  var out = cli(["--fields"]);
  allFields().forEach(function (f) { assert.ok(out.indexOf("`" + f.id + "`") > -1, f.id); });
});

test("single-language sites skip language checks", function () {
  assert.doesNotMatch(C.build({ level: 3 }), /Language switching and detection/);
  assert.match(C.build({ level: 3, values: { langs: ["en", "pt"] } }), /Language switching and detection/);
});

test("full text is only requested when the block is chosen", function () {
  assert.doesNotMatch(C.build({ level: 3 }), /the full text/);
  assert.match(C.build({ level: 3, values: { blocks: ["hero", "fulltext"] } }), /generate the full text/);
});
