/* Explainer Studio · browser app: renders the form from the schema, keeps state, shows the live prompt. */
(function () {
  "use strict";
  var C = window.EXPLAINER, S = C.schema, UI = window.EXPLAINER_UI;
  var KEY = "explainer-studio:v1", UI_KEY = "explainer-studio:ui", MINE_KEY = "explainer-studio:presets";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------------------------------------------------------------- state */
  var ui = read(UI_KEY);
  if (S.uiLanguages.indexOf(ui) < 0) {
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    ui = /^pt\b/i.test(nav) ? "pt" : "en";
  }
  var st = null;
  try { var saved = JSON.parse(read(KEY)); if (saved) st = C.normalize(saved); } catch (e) { st = null; }
  if (!st) st = C.fresh(ui);

  /* Personal presets ("My starting points"): [{ id, kind, version, name, groups }] */
  var mine = [], activeMine = "";
  try {
    (JSON.parse(read(MINE_KEY)) || []).forEach(function (raw) {
      var p = C.normalizePersonal(raw);
      if (p && raw && typeof raw.id === "string") { p.id = raw.id; mine.push(p); }
    });
  } catch (e) { mine = []; }
  function saveMine() { write(MINE_KEY, JSON.stringify(mine)); }
  function findMine(id) { return mine.filter(function (p) { return p.id === id; })[0]; }

  function t(k) { return UI[ui][k]; }
  function snapshot() {
    return { version: S.version, level: st.level, lang: st.lang, why: st.why, off: Object.keys(st.off), preset: st.preset, values: st.values };
  }
  var saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { write(KEY, JSON.stringify(snapshot())); }, 200);
  }

  /* --------------------------------------------------------------- chrome */
  function seg(box, name, current, items) {
    box.innerHTML = items.map(function (it) {
      return '<label><input type="radio" name="' + name + '" value="' + it.v + '"' + (it.v === current ? " checked" : "") + '><span>' + esc(it.l) + "</span></label>";
    }).join("");
  }
  var LANG_ITEMS = S.uiLanguages.map(function (l) { return { v: l, l: l.toUpperCase() }; });

  function renderChrome() {
    document.documentElement.lang = ui === "pt" ? "pt-BR" : "en";
    $('meta[name="description"]').setAttribute("content", t("description"));
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    var labels = {
      levels: t("level"), preset: t("preset"), uiLang: t("uiLang"), promptLang: t("promptLang"), menuBtn: t("more"),
      stepsNav: t("sections"), preview: t("prompt"), code: t("prompt"), closeSheet: t("close"), personalClose: t("close")
    };
    Object.keys(labels).forEach(function (id) { $("#" + id).setAttribute("aria-label", labels[id]); });
    $("#preset").title = t("preset");
    $("#menuBtn").title = t("more");
    seg($("#uiLang"), "uiLang", ui, LANG_ITEMS);
    seg($("#promptLang"), "promptLang", st.lang, LANG_ITEMS);
    $("#why").checked = st.why;
  }

  function renderLevels() {
    $("#levels").innerHTML = S.levels.map(function (l) {
      return '<label class="level"><input type="radio" name="level" value="' + l.n + '"' + (st.level === l.n ? " checked" : "") + "><span>" + esc(l.name[ui]) + "</span></label>";
    }).join("");
    $("#levels").style.setProperty("--i", st.level - 1);
  }

  function renderPresets() {
    if (activeMine && !findMine(activeMine)) activeMine = "";
    var sel = activeMine ? "my:" + activeMine : st.preset;
    function opt(v, l) { return '<option value="' + esc(v) + '"' + (sel === v ? " selected" : "") + ">" + esc(l) + "</option>"; }
    var html = Object.keys(S.presets).map(function (k) { return opt(k, S.presets[k].name[ui]); }).join("");
    if (mine.length) {
      html = '<optgroup label="' + esc(t("builtIn")) + '">' + html + "</optgroup>" +
        '<optgroup label="' + esc(t("personal")) + '">' + mine.map(function (p) { return opt("my:" + p.id, p.name); }).join("") + "</optgroup>";
    }
    if (!sel) html += '<option value="" selected disabled>' + esc(t("custom")) + "</option>";
    $("#preset").innerHTML = html;
  }

  /* ----------------------------------------------------------------- form */
  function fieldHTML(f) {
    var val = st.values[f.id], id = "f-" + f.id, h = "";
    var label = esc(f.label[ui]);
    if (f.type === "choice" || f.type === "multi") {
      var multi = f.type === "multi";
      h += '<p class="field__label" id="lb-' + f.id + '">' + label + "</p>";
      h += '<div class="pills" role="' + (multi ? "group" : "radiogroup") + '" aria-labelledby="lb-' + f.id + '">';
      f.options.forEach(function (o) {
        var checked = multi ? val.indexOf(o.v) > -1 : val === o.v;
        h += '<label class="pill' + (multi ? " chip" : "") + '"><input type="' + (multi ? "checkbox" : "radio") + '" name="' + f.id + '" value="' + esc(o.v) + '"' +
          (checked ? " checked" : "") + "><span>" + esc(o.label[ui]) + "</span></label>";
      });
      h += "</div>";
    } else if (f.type === "switch") {
      h += '<label class="switch"><input type="checkbox" role="switch" name="' + f.id + '"' + (val ? " checked" : "") + '><span class="track" aria-hidden="true"></span><span class="lbl">' + label + "</span></label>";
    } else if (f.type === "select") {
      h += '<label class="field__label" for="' + id + '">' + label + "</label>";
      h += '<select class="select" id="' + id + '" name="' + f.id + '">' + f.options.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (val === o.v ? " selected" : "") + ">" + esc(o.label[ui]) + "</option>";
      }).join("") + "</select>";
    } else {
      var ph = f.ph ? esc(typeof f.ph === "string" ? f.ph : f.ph[ui]) : "";
      h += '<label class="field__label" for="' + id + '">' + label + "</label>";
      h += f.type === "area"
        ? '<textarea class="input" id="' + id + '" name="' + f.id + '" rows="2" placeholder="' + ph + '">' + esc(val) + "</textarea>"
        : '<input class="input" type="text" id="' + id + '" name="' + f.id + '" value="' + esc(val) + '" placeholder="' + ph + '">';
    }
    return '<div class="field" data-field="' + f.id + '">' + h + "</div>";
  }

  function groupOf(f) {
    if (f.type === "switch") return "switches";
    if (f.short) return "row2";
    return null;
  }

  function renderForm() {
    var html = "";
    S.sections.forEach(function (sec) {
      html += '<section class="card" id="sec-' + sec.id + '" data-sec="' + sec.id + '" aria-labelledby="h-' + sec.id + '">';
      html += '<div class="card__head"><span class="card__num" aria-hidden="true"></span><h2 id="h-' + sec.id + '">' + esc(sec.title[ui]) + "</h2>";
      if (sec.optional) {
        var name = esc(t("include") + ": " + sec.title[ui]);
        html += '<label class="card-switch" title="' + esc(t("include")) + '"><input type="checkbox" role="switch" data-include="' + sec.id + '" aria-label="' + name + '"' +
          (st.off[sec.id] ? "" : " checked") + '><span class="track" aria-hidden="true"></span></label>';
      }
      html += '</div><div class="card__body">';
      var group = null;
      sec.fields.forEach(function (f) {
        var g = groupOf(f);
        if (g !== group) { if (group) html += "</div>"; if (g) html += '<div class="' + g + '">'; group = g; }
        html += fieldHTML(f);
      });
      if (group) html += "</div>";
      html += "</div></section>";
    });
    $("#form").innerHTML = html;
    $("#steps").innerHTML = S.sections.map(function (sec) {
      return '<li data-sec="' + sec.id + '"><a href="#sec-' + sec.id + '"><span class="num"></span><span>' + esc(sec.title[ui]) + "</span></a></li>";
    }).join("");
    applyVisibility(false);
    observeSections();
  }

  function applyVisibility(animate) {
    var n = 0;
    S.sections.forEach(function (sec) {
      var card = $("#sec-" + sec.id), li = $('#steps li[data-sec="' + sec.id + '"]');
      var shown = C.sectionShown(st, sec);
      card.hidden = !shown; li.hidden = !shown;
      if (!shown) return;
      n++;
      var num = (n < 10 ? "0" : "") + n;
      $(".card__num", card).textContent = num;
      $(".num", li).textContent = num;
      var off = !!(sec.optional && st.off[sec.id]);
      card.classList.toggle("is-off", off);
      $("a", li).classList.toggle("is-off", off);
      sec.fields.forEach(function (f) {
        var el = $('[data-field="' + f.id + '"]', card);
        var vis = f.level <= st.level && C.applies(st, f);
        if (vis && el.hidden && animate) { el.classList.remove("rise"); void el.offsetWidth; el.classList.add("rise"); }
        el.hidden = !vis;
      });
      $$(".switches, .row2", card).forEach(function (g) { g.hidden = !$$(".field:not([hidden])", g).length; });
    });
  }

  function readField(name) {
    var f = C.fields[name];
    if (f.type === "multi") st.values[name] = $$('input[name="' + name + '"]:checked').map(function (i) { return i.value; });
    else if (f.type === "switch") st.values[name] = $('input[name="' + name + '"]').checked;
    else if (f.type === "choice") { var c = $('input[name="' + name + '"]:checked'); st.values[name] = c ? c.value : f.def; }
    else st.values[name] = $('[name="' + name + '"]').value;
  }

  function onEdit(e) {
    var el = e.target;
    if (el.hasAttribute("data-include")) {
      var id = el.getAttribute("data-include");
      if (el.checked) delete st.off[id]; else st.off[id] = true;
    } else if (el.name && C.fields[el.name]) {
      readField(el.name);
      if (st.preset || activeMine) { st.preset = ""; activeMine = ""; renderPresets(); }
    } else return;
    applyVisibility(true);
    schedule(); save();
  }
  $("#form").addEventListener("input", onEdit);
  $("#form").addEventListener("change", function (e) { if (e.target.type !== "text" && e.target.tagName !== "TEXTAREA") onEdit(e); });

  /* ------------------------------------------------------ section tracking */
  var io;
  function observeSections() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute("data-sec");
        $$("#steps a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#sec-" + id); });
        var act = $("#steps a.is-active"), ol = $("#steps");
        if (act && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: act.offsetLeft - 40, behavior: "smooth" });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    $$(".card").forEach(function (c) { io.observe(c); });
  }

  /* -------------------------------------------------------------- preview */
  var text = "", prevLines = null, raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }

  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/ _((?:Por quê|Why): [^_]+)_/g, ' <span class="why">$1</span>');
  }
  function span(cls, html) { return '<span class="ln' + (cls ? " " + cls : "") + '">' + (html || " ") + "</span>"; }
  function mk(s) { return '<span class="mk">' + esc(s) + "</span>"; }
  function lineHTML(l) {
    var m;
    if (/^# /.test(l)) return span("h1", inline(l.slice(2)));
    if (/^## /.test(l)) return span("h2", mk("## ") + inline(l.slice(3)));
    if (/^> /.test(l)) return span("q", mk("> ") + inline(l.slice(2)));
    if ((m = l.match(/^(\s*)(- \[ \] )(.*)$/))) return span("ck", m[1] + mk(m[2]) + inline(m[3]));
    if ((m = l.match(/^(\s*)(- |\d+\. )(.*)$/))) return span("li", m[1] + mk(m[2]) + inline(m[3]));
    return span("", inline(l));
  }

  function previewVisible() {
    var p = $("#preview");
    return getComputedStyle(p).position !== "fixed" || p.classList.contains("is-open");
  }

  function update() {
    text = C.build(st);
    var ls = text.replace(/\n$/, "").split("\n");
    var seen = prevLines ? new Set(prevLines) : null;
    var code = $("#code");
    code.innerHTML = ls.map(function (l) {
      var h = lineHTML(l);
      return seen && l && !seen.has(l) ? h.replace('class="ln', 'class="ln new') : h;
    }).join("");
    prevLines = ls;
    var first = $(".ln.new", code);
    if (first && previewVisible()) {
      var top = first.offsetTop - code.offsetTop;
      if (top < code.scrollTop || top > code.scrollTop + code.clientHeight - 40) code.scrollTo({ top: Math.max(0, top - 80), behavior: "smooth" });
    }
    var tokens = C.stats(text).tokens.toLocaleString(ui === "pt" ? "pt-BR" : "en");
    $("#stats").textContent = "~" + tokens + " " + t("tokens");
    $("#fabCount").textContent = "~" + tokens;
  }

  function renderAll() {
    renderChrome(); renderLevels(); renderPresets(); renderForm(); renderMine();
    prevLines = null; update(); save();
  }

  /* ------------------------------------------------------------- controls */
  $("#levels").addEventListener("change", function (e) {
    st.level = +e.target.value;
    $("#levels").style.setProperty("--i", st.level - 1);
    applyVisibility(true); update(); save();
  });

  $("#uiLang").addEventListener("change", function (e) {
    var next = e.target.value;
    if (st.lang === ui) st.lang = next;
    ui = next; write(UI_KEY, ui);
    renderAll();
  });
  $("#promptLang").addEventListener("change", function (e) { st.lang = e.target.value; prevLines = null; update(); save(); });
  $("#why").addEventListener("change", function (e) { st.why = e.target.checked; update(); save(); });

  $("#preset").addEventListener("change", function (e) {
    var k = e.target.value;
    if (k.indexOf("my:") === 0) { var p = findMine(k.slice(3)); if (p) applyMine(p); return; }
    if (!S.presets[k]) return;
    var prev = JSON.stringify(snapshot());
    st.values = C.presetValues(k); st.preset = k; st.off = {}; activeMine = "";
    renderPresets(); renderForm(); update(); save();
    toast(t("presetDone"), prev);
  });

  /* Personal presets: lay saved groups over the current answers, keeping the rest. */
  function applyMine(p, groups) {
    var prev = JSON.stringify(snapshot());
    st = C.applyPersonal(st, p, groups);
    activeMine = p.id;
    renderPresets(); renderForm(); update(); save();
    toast(t("personalApplied"), prev);
  }

  var dlg = $("#personal");
  function chips(name, ids, checked) {
    return ids.map(function (gid) {
      return '<label class="pill chip"><input type="checkbox" name="' + esc(name) + '" value="' + gid + '"' + (checked ? " checked" : "") + "><span>" +
        esc(C.personalGroups[gid].title[ui]) + "</span></label>";
    }).join("");
  }
  function checkedGroups(box) { return $$("input:checked", box).map(function (i) { return i.value; }); }
  function syncButtons() {
    $("#pSave").disabled = !$("#pName").value.trim() || !checkedGroups($("#pGroups")).length;
    $$("#pList li").forEach(function (li) { $('[data-p="apply"]', li).disabled = !checkedGroups(li).length; });
  }
  function renderMine() {
    var keep = $("#pGroups").children.length ? checkedGroups($("#pGroups")) : Object.keys(C.personalGroups);
    $("#pGroups").innerHTML = chips("pg-new", Object.keys(C.personalGroups), false);
    $$("#pGroups input").forEach(function (i) { i.checked = keep.indexOf(i.value) > -1; });
    $("#pList").innerHTML = mine.map(function (p) {
      var hid = "pn-" + esc(p.id);
      return '<li data-id="' + esc(p.id) + '"><h3 id="' + hid + '">' + esc(p.name) + "</h3>" +
        '<div class="pills" role="group" aria-labelledby="' + hid + '">' + chips("pg-" + p.id, Object.keys(p.groups), true) + "</div>" +
        '<div class="dialog__actions">' +
        '<button type="button" class="primary" data-p="apply" aria-describedby="' + hid + '">' + esc(t("apply")) + "</button>" +
        '<button type="button" class="ghost" data-p="export" aria-describedby="' + hid + '">' + esc(t("exportPreset")) + "</button>" +
        '<button type="button" class="ghost" data-p="remove" aria-describedby="' + hid + '">' + esc(t("remove")) + "</button>" +
        "</div></li>";
    }).join("");
    $("#pList").hidden = !mine.length;
    syncButtons();
  }
  function addMine(p) {
    var same = mine.filter(function (m) { return m.name.toLowerCase() === p.name.toLowerCase(); })[0];
    if (same) { p.id = same.id; mine[mine.indexOf(same)] = p; }
    else { p.id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); mine.push(p); }
    saveMine(); renderMine(); renderPresets();
  }
  function plain(p) { return { kind: p.kind, version: p.version, name: p.name, groups: p.groups }; }

  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { document.body.appendChild($("#toast")); });
  $("#personalClose").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("input", syncButtons);
  dlg.addEventListener("change", syncButtons);
  $("#pName").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#pSave").click(); } });
  $("#pSave").addEventListener("click", function () {
    if (this.disabled) return;
    var p = C.capturePersonal(st, $("#pName").value, checkedGroups($("#pGroups")));
    if (!p) return;
    addMine(p);
    $("#pName").value = ""; syncButtons();
    toast(t("personalSaved"));
  });
  $("#pList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-p]"); if (!b) return;
    var li = b.closest("li"), p = findMine(li.getAttribute("data-id")); if (!p) return;
    var act = b.getAttribute("data-p");
    if (act === "apply") {
      dlg.close();
      applyMine(p, checkedGroups(li));
    } else if (act === "export") {
      download("starting-point" + (slug(p.name) ? "-" + slug(p.name) : "") + ".json", JSON.stringify(plain(p), null, 2) + "\n", "application/json");
    } else if (act === "remove") {
      var at = mine.indexOf(p);
      mine.splice(at, 1);
      saveMine(); renderMine(); renderPresets();
      toast(t("personalRemoved"), function () {
        mine.splice(Math.min(at, mine.length), 0, p);
        saveMine(); renderMine(); renderPresets();
      });
    }
  });
  $("#pImport").addEventListener("click", function () { $("#pImportFile").click(); });
  $("#pImportFile").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var p;
      try { p = C.normalizePersonal(JSON.parse(reader.result)); } catch (err) { p = null; }
      if (!p) { toast(t("personalInvalid")); return; }
      addMine(p);
      toast(t("personalSaved"));
    };
    reader.readAsText(file);
  });
  /* Another tab changed the saved list. */
  window.addEventListener("storage", function (e) {
    if (e.key !== MINE_KEY) return;
    mine = [];
    try {
      (JSON.parse(e.newValue) || []).forEach(function (raw) {
        var p = C.normalizePersonal(raw);
        if (p && raw && typeof raw.id === "string") { p.id = raw.id; mine.push(p); }
      });
    } catch (err) { mine = []; }
    renderMine(); renderPresets();
  });

  /* Copy / download */
  function flash(btn, label) {
    var s = $("span", btn);
    btn.classList.add("done"); s.textContent = label;
    setTimeout(function () { btn.classList.remove("done"); s.textContent = t("copy"); }, 1600);
  }
  $("#copy").addEventListener("click", function () {
    var btn = this;
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      if (ok) flash(btn, t("copied")); else toast(t("copyFailed"));
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { flash(btn, t("copied")); }, fallback);
    else fallback();
  });

  function slug(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function download(name, content, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  $("#download").addEventListener("click", function () {
    var s = slug(st.values.name);
    download("prompt" + (s ? "-" + s : "") + ".md", text, "text/markdown;charset=utf-8");
  });

  /* Menu: export, import, reset */
  var menu = $("#menu");
  function closeMenu() { if (menu.open) { menu.open = false; } }
  document.addEventListener("click", function (e) { if (!menu.contains(e.target)) closeMenu(); });
  menu.addEventListener("toggle", function () { if (menu.open) { var b = $(".menu__list button", menu); if (b) b.focus(); } });
  menu.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeMenu(); $("#menuBtn").focus(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var items = $$(".menu__list button", menu), i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
    }
  });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]"); if (!b) return;
    var action = b.getAttribute("data-action");
    closeMenu();
    if (action === "personal") {
      renderMine();
      dlg.showModal();
      $("#pName").focus();
    } else if (action === "export") {
      download("explainer-answers.json", JSON.stringify(snapshot(), null, 2) + "\n", "application/json");
    } else if (action === "import") {
      $("#importFile").click();
    } else if (action === "reset") {
      var prev = JSON.stringify(snapshot());
      st = C.fresh(ui); activeMine = "";
      renderAll();
      toast(t("resetDone"), prev);
    }
  });
  $("#importFile").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var raw;
      try { raw = JSON.parse(reader.result); } catch (err) { raw = null; }
      if (!raw || typeof raw !== "object" || !raw.values) { toast(t("importFailed")); return; }
      var prev = JSON.stringify(snapshot());
      st = C.normalize(raw); activeMine = "";
      renderAll();
      toast(t("imported"), prev);
    };
    reader.readAsText(file);
  });

  /* Toast with optional undo: a saved state (JSON string) to restore, or a function to call */
  var toastTimer, undoState = null;
  function toast(msg, undo) {
    var el = $("#toast");
    var host = dlg.open ? dlg : document.body; /* a modal dialog hides everything outside it */
    if (el.parentNode !== host) host.appendChild(el);
    undoState = undo || null;
    el.innerHTML = "<span>" + esc(msg) + "</span>" + (undo ? '<button type="button">' + esc(t("undo")) + "</button>" : "");
    el.style.pointerEvents = undo ? "auto" : "none";
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); el.style.pointerEvents = "none"; }, undo ? 6000 : 2400);
  }
  $("#toast").addEventListener("click", function (e) {
    if (!e.target.closest("button") || !undoState) return;
    var undo = undoState; undoState = null;
    if (typeof undo === "function") undo();
    else { st = C.normalize(JSON.parse(undo)); activeMine = ""; renderAll(); }
    $("#toast").classList.remove("show");
  });

  /* Mobile sheet */
  var sheet = $("#preview"), fab = $("#fab");
  function setSheet(open) {
    sheet.classList.toggle("is-open", open);
    document.body.classList.toggle("sheet-open", open);
    fab.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(function () { $("#closeSheet").focus({ preventScroll: true }); }, 150);
    else fab.focus({ preventScroll: true });
  }
  fab.addEventListener("click", function () { setSheet(true); });
  $("#closeSheet").addEventListener("click", function () { setSheet(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) setSheet(false);
  });

  renderAll();
})();
