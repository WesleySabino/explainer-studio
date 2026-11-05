/* Explainer Studio · core
 *
 * State handling and the prompt builder. Pure functions, no DOM, so the same
 * code runs in the browser (window.EXPLAINER), in the CLI and in the tests.
 *
 * State (also the format of an exported answers file):
 *   { version, level: 1..4, lang: "pt"|"en", why: bool, off: { sectionId: true }, preset, values: { fieldId: value } }
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./schema.js"));
  else root.EXPLAINER = factory(root.EXPLAINER_SCHEMA);
})(typeof globalThis !== "undefined" ? globalThis : this, function (S) {
  "use strict";

  var FIELD = {}, SECTION = {}, SECTION_OF = {};
  S.sections.forEach(function (sec) {
    SECTION[sec.id] = sec;
    sec.fields.forEach(function (f) { FIELD[f.id] = f; SECTION_OF[f.id] = sec; });
  });

  /* ---------------------------------------------------------------- state */

  function clone(x) { return Array.isArray(x) ? x.slice() : x; }

  function emptyOf(f) {
    if (f.def !== undefined) return clone(f.def);
    return f.type === "switch" ? false : f.type === "multi" ? [] : "";
  }

  function defaults() {
    var v = {};
    Object.keys(FIELD).forEach(function (id) { v[id] = emptyOf(FIELD[id]); });
    return v;
  }

  function presetValues(key) {
    var v = defaults(), p = S.presets[key];
    if (!p) return v;
    Object.keys(p.values).forEach(function (k) { if (FIELD[k]) v[k] = clone(p.values[k]); });
    return v;
  }

  function coerce(f, x) {
    var values = f.options ? f.options.map(function (o) { return o.v; }) : null;
    switch (f.type) {
      case "choice":
      case "select": return values.indexOf(x) > -1 ? x : clone(f.def);
      case "multi": return Array.isArray(x) ? values.filter(function (v) { return x.indexOf(v) > -1; }) : clone(f.def);
      case "switch": return typeof x === "boolean" ? x : emptyOf(f);
      default: return typeof x === "string" ? x : emptyOf(f);
    }
  }

  function fresh(lang) {
    return {
      version: S.version, level: 2, lang: S.uiLanguages.indexOf(lang) > -1 ? lang : "en",
      why: false, off: {}, preset: "recommended", values: defaults()
    };
  }

  /* Accepts anything (a saved state, a partial answers file) and returns a complete, valid state.
     Values are layered over the preset named in `preset` (default: recommended). */
  function normalize(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    var st = fresh(raw.lang);
    var lv = parseInt(raw.level, 10);
    if (lv >= 1 && lv <= 4) st.level = lv;
    st.why = raw.why === true;

    var off = raw.off;
    if (Array.isArray(off)) off.forEach(function (id) { if (SECTION[id] && SECTION[id].optional) st.off[id] = true; });
    else if (off && typeof off === "object") Object.keys(off).forEach(function (id) { if (off[id] && SECTION[id] && SECTION[id].optional) st.off[id] = true; });

    var preset = typeof raw.preset === "string" && (raw.preset === "" || S.presets[raw.preset]) ? raw.preset : "recommended";
    st.preset = preset;
    var base = presetValues(preset || "recommended");
    var given = raw.values && typeof raw.values === "object" ? raw.values : {};
    Object.keys(FIELD).forEach(function (id) {
      st.values[id] = id in given ? coerce(FIELD[id], given[id]) : base[id];
    });
    return st;
  }

  /* ----------------------------------------------------------- visibility */

  function sectionOn(st, sec) {
    if (typeof sec === "string") sec = SECTION[sec];
    return (sec.level || 1) <= st.level && !(sec.optional && st.off[sec.id]);
  }
  function sectionShown(st, sec) { return (sec.level || 1) <= st.level; }

  function applies(st, f) { return !f.when || !!f.when(st.values); }

  function fieldVisible(st, f) {
    if (typeof f === "string") f = FIELD[f];
    return sectionOn(st, SECTION_OF[f.id]) && f.level <= st.level && applies(st, f);
  }

  /* -------------------------------------------------------------- builder */

  function build(input) {
    var st = normalize(input);
    var lang = st.lang, level = st.level, A = st.values;

    function L(pt, en) { return lang === "pt" ? pt : en; }
    function why(pt, en) { return st.why ? " _" + L("Por quê: ", "Why: ") + L(pt, en) + "_" : ""; }
    function vis(id) { return fieldVisible(st, FIELD[id]); }
    function v(id) { return vis(id) ? A[id] : undefined; }
    function str(id) { var x = v(id); return typeof x === "string" ? x.trim() : ""; }
    function on(id) { return v(id) === true; }
    function option(id, val) { return FIELD[id].options.filter(function (o) { return o.v === val; })[0]; }
    function say(id, val) {
      var x = val === undefined ? v(id) : val;
      if (x === undefined) return "";
      var o = option(id, x);
      return o ? o.say[lang] : "";
    }
    function picked(id) {
      var x = v(id);
      return Array.isArray(x) ? FIELD[id].options.filter(function (o) { return x.indexOf(o.v) > -1; }) : [];
    }
    function has(id, val) { var x = v(id); return Array.isArray(x) && x.indexOf(val) > -1; }
    function says(id) { return picked(id).map(function (o) { return o.say[lang]; }); }
    function join(arr) {
      if (arr.length < 2) return arr.join("");
      return arr.slice(0, -1).join(", ") + L(" e ", " and ") + arr[arr.length - 1];
    }
    function lines(t) { return String(t || "").split(/\n+/).map(function (s) { return s.trim().replace(/^[-•*]\s*/, ""); }).filter(Boolean); }
    function sub(x) { return "  - " + x; }
    function subs(arr) { return arr.map(sub); }
    function nums(arr, indent) { return arr.map(function (x, i) { return (indent ? "  " : "") + (i + 1) + ". " + x; }); }
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function sec(id) { return sectionOn(st, SECTION[id]); }

    var out = [], n = 0;
    function section(title, items) {
      items = items.filter(Boolean);
      if (!items.length) return;
      n++;
      out.push("## " + n + ". " + title, "");
      items.forEach(function (it) { out.push(/^(\s|\d+\. |- \[ \] )/.test(it) ? it : "- " + it); });
      out.push("");
    }

    /* Facts used across sections */
    var teach = A.goal === "teach";
    var langs = sec("i18n") ? picked("langs") : [];
    var multi = langs.length > 1;
    var tool = sec("analytics") && A.an_tool !== "none" ? A.an_tool : "";
    var ga = tool === "ga4";
    var publishing = sec("deploy");
    var publishNow = publishing && A.deploy_now === "now";
    var domain = publishing ? str("domain").replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "";
    var blocksOn = sec("structure");
    var credits = blocksOn && has("blocks", "credits");
    var fulltext = blocksOn && has("blocks", "fulltext");
    var pilot = (v("first_delivery") || "pilot") === "pilot";
    var parts = sec("teaching") && teach ? (v("chapter_parts") || []) : [];
    var calm = A.anim === "calm";

    /* Title and mission */
    var name = str("name");
    out.push("# " + (name || L("Site explicativo a partir de um material", "Explainer website from source material")), "");
    out.push(
      L("Transforme o material abaixo num site cujo objetivo é ", "Turn the material below into a website whose goal is to ") + say("goal") +
      L(". Ele deve ser visualmente impressionante, leve e simples de usar, manter e publicar.", ". It must be visually stunning, lightweight, and simple to use, maintain and publish.") +
      (teach ? L(" O site **ensina**: conduz o leitor por explicações, interações e verificações de entendimento, em vez de só exibir o texto.",
                 " The site **teaches**: it walks the reader through explanations, interactions and checks for understanding instead of just displaying the text.") : ""),
      ""
    );
    var path = str("source_path");
    out.push("> " + L("Material: ", "Material: ") + (path ? "`" + path + "`" : L("anexado a esta mensagem", "attached to this message")), "");

    /* 1. Source */
    var srcLang = A.source_lang !== "auto" ? say("source_lang") : "";
    var author = str("author"), links = str("author_links");
    section(L("Material de origem", "Source material"), [
      L("O material é ", "The material is ") + say("source_type") + (srcLang ? L(", em ", ", in ") + srcLang : "") +
        L(". Leia-o inteiro antes de planejar: ele é a fonte da verdade.", ". Read all of it before planning: it is the source of truth."),
      author
        ? L("Autoria: **" + author + "**. Dê crédito visível na abertura e no rodapé", "Author: **" + author + "**. Credit them visibly in the hero and the footer") +
          (credits ? L(", e na seção de créditos.", ", and in the credits section.") : ".")
        : L("Identifique a autoria no material e dê crédito visível no site.", "Identify the author from the material and credit them visibly on the site."),
      links ? L("Links para os créditos: ", "Links for the credits: ") + lines(links).join(" · ") : "",
      say("fidelity"),
      on("honesty") ? L(
        "Separe o que vem do material do que é síntese sua: rotule como “Síntese” ou “Ilustrativo” todo número, escala ou exemplo que não esteja no material.",
        "Keep what comes from the material apart from your own synthesis: label any figure, scale or example that is not in the material as “Synthesis” or “Illustrative”.") +
        why("o leitor não distingue síntese de fato se ninguém rotular.", "readers cannot tell synthesis from fact unless it is labelled.") : "",
      v("rights") ? say("rights") + (A.rights === "unknown" ? why("dúvidas de direitos (como fotos de terceiros) costumam aparecer só depois de publicado.", "rights questions (such as third-party photos) tend to surface only after publishing.") : "") : "",
      say("third_images"),
      on("verify_refs") ? L(
        "Verifique cada estudo, livro ou fonte citada e adicione links confiáveis (DOI, PMID, ISBN). Nunca invente uma referência; se não encontrar, diga.",
        "Check every study, book or source cited and add reliable links (DOI, PMID, ISBN). Never invent a reference; if you can't find one, say so.") +
        why("uma referência errada derruba a credibilidade de um site explicativo.", "one wrong reference undermines an explainer site's credibility.") : "",
      on("extract_images") ? L(
        "Extraia as imagens do material e otimize-as: WebP, dimensões adequadas e carregamento adiado fora da primeira tela.",
        "Extract the images from the material and optimise them: WebP, sensible dimensions, lazy-loading below the first screen.") : "",
      on("keep_private") ? L("Não coloque o arquivo original num repositório público (adicione-o ao `.gitignore`).", "Do not put the original file in a public repository (add it to `.gitignore`).") +
        why("publicar o arquivo inteiro é redistribuir o material.", "publishing the whole file redistributes the material.") : ""
    ]);

    /* 2. Goal and audience */
    var aud = str("audience"), prereq = str("prereq"), outcomes = lines(str("outcomes"));
    var goalItems = [
      aud ? L("Público: ", "Audience: ") + aud.replace(/[.!?]$/, "") + "." : "",
      prereq ? L("Conhecimento prévio esperado: " + prereq.replace(/[.!?]$/, "") + ". Não explique o que vem antes disso; explique tudo o que vem depois.",
                 "Assumed knowledge: " + prereq.replace(/[.!?]$/, "") + ". Do not explain what comes before that; explain everything after it.") : ""
    ];
    if (outcomes.length) {
      goalItems.push(L("Ao final, o leitor deve conseguir:", "By the end, the reader should be able to:"));
      goalItems = goalItems.concat(subs(outcomes));
    } else if (teach && level >= 2) {
      goalItems.push(L("Derive do material 4 a 6 resultados de aprendizagem verificáveis e mostre-os na abertura.", "Derive 4–6 verifiable learning outcomes from the material and show them on the home page.") +
        why("sem resultados explícitos, o site vira vitrine do texto, não um curso.", "without explicit outcomes the site becomes a showcase of the text, not a course."));
    }
    goalItems.push(say("tone"));
    goalItems.push(say("device") + (A.device === "mobile" && vis("device") ? why("o primeiro acesso real a um site costuma ser pelo celular.", "a site's first real visit usually comes from a phone.") : ""));
    goalItems.push(L("Simplicidade acima de tudo: sem login, sem cadastro, sem backend.", "Simplicity first: no login, no sign-up, no backend."));
    section(L("Objetivo e público", "Goal and audience"), goalItems);

    /* 3. Structure */
    if (blocksOn) {
      var ch = str("chapters");
      section(L("Estrutura", "Structure"), [
        say("layout"),
        say("order"),
        ch ? L("Cerca de " + ch + " capítulos.", "About " + ch + " chapters.") : "",
        says("blocks").length ? L("Inclua:", "Include:") : ""
      ].concat(subs(says("blocks").map(cap))));
    }

    /* 4. Teaching and interactions */
    if (sec("teaching")) {
      var ti = [];
      ti.push(teach
        ? L("Prefira interações e animações a tabelas: cada tabela do material vira uma interação ou um gráfico", "Prefer interactions and motion to tables: every table in the material becomes an interaction or a chart") +
          (fulltext ? L(", e a tabela original fica no texto integral.", ", and the original table stays in the full text.") : ".")
        : L("Use interações onde elas explicarem melhor do que o texto.", "Use interactions wherever they explain better than text."));
      if (parts.length) {
        ti.push(L("Cada capítulo segue esta estrutura:", "Every chapter follows this structure:"));
        ti = ti.concat(nums(picked("chapter_parts").map(function (o) {
          return o.say[lang] + (o.v === "quiz"
            ? (on("quiz_explain") ? L(", com a explicação de por que cada alternativa está certa ou errada.", ", explaining why each option is right or wrong.") : ".")
            : "");
        }), true));
      }
      var reps = picked("interactions");
      if (reps.length) {
        ti.push(L("Repertório (escolha a que melhor explica cada ideia; não force todas):", "Repertoire (pick whichever best explains each idea; don't force them all):"));
        ti = ti.concat(subs(reps.map(function (o) { return "**" + o.label[lang] + "**: " + o.say[lang] + "."; })));
      }
      var d = v("density");
      if (d) {
        var dn = +d;
        ti.push(L("Mire em " + dn + (dn > 1 ? " interações" : " interação") + " por capítulo", "Aim for " + dn + (dn > 1 ? " interactions" : " interaction") + " per chapter") +
          (parts.indexOf("quiz") > -1 ? L(", além do quiz.", ", besides the quiz.") : "."));
      }
      if (on("clarity")) ti.push(L(
        "Regra de clareza: antes de o leitor agir, toda interação diz (1) o que demonstra, (2) o que fazer e (3) onde olhar o resultado. O resultado aparece em palavras, não só em cor ou animação. Botões descrevem a ação e o efeito (“Simular falha nesta etapa”, não “Quebrar”).",
        "Clarity rule: before the reader acts, every interaction states (1) what it demonstrates, (2) what to do and (3) where to look for the result. The result is spelled out in words, not only in colour or motion. Buttons describe the action and its effect (“Simulate a failure at this step”, not “Break”).") +
        why("um botão vago deixa o leitor sem saber o que vai acontecer nem onde olhar, e a interação não ensina.", "a vague button leaves readers unsure what will happen or where to look, so the interaction teaches nothing."));
      if (says("aids").length) ti = ti.concat([L("Apoio ao estudo:", "Study aids:")], subs(says("aids").map(cap)));
      if (on("persist")) ti.push(L("Progresso, respostas, planos e checklists ficam salvos no navegador (localStorage), sem backend.", "Progress, answers, plans and checklists are saved in the browser (localStorage), with no backend."));
      section(L("Ensino e interações", "Teaching and interactions"), ti);
    }

    /* 5. Look and motion */
    var fx = picked("effects").filter(function (o) { return !(calm && (o.v === "pinned" || o.v === "horizontal")); }).map(function (o) { return o.say[lang]; });
    var pal = str("palette"), fonts = str("fonts"), inspo = lines(str("inspo"));
    section(L("Visual e movimento", "Look and motion"), [
      L("Estilo ", "Style: ") + say("style") + ". " + L(
        "Deve parecer obra de um estúdio, não um template: hierarquia tipográfica forte, ritmo entre as seções e imagens bem enquadradas.",
        "It should feel studio-made, not templated: strong typographic hierarchy, rhythm between sections and well-framed images."),
      say("anim") + (calm ? "" : why("cada cena fixada a mais é mais uma fonte de bugs de rolagem e de lentidão no celular.", "every extra pinned scene adds scroll bugs and mobile jank.")),
      say("brand"),
      pal ? L("Cores obrigatórias: ", "Required colours: ") + pal + "." : "",
      fonts ? L("Fontes: ", "Fonts: ") + fonts + "." : "",
      fx.length ? L("Efeitos bem-vindos, dentro do orçamento de movimento: ", "Welcome effects, within the motion budget: ") + join(fx) + "." : "",
      say("libs"),
      sec("a11y") ? "" : L("O conteúdo nunca depende de JavaScript ou de animação para aparecer, e `prefers-reduced-motion` é respeitado.", "Content never depends on JavaScript or motion to appear, and `prefers-reduced-motion` is honoured."),
      inspo.length ? L("Referências visuais:", "Visual references:") : ""
    ].concat(subs(inspo)));

    /* 6. Data and charts */
    if (sec("data")) {
      section(L("Dados e gráficos", "Data and charts"), [
        on("rebuild_charts") ? L("Reconstrua as tabelas e gráficos do material como gráficos nativos em SVG/HTML, com os números exatos do material (nunca estimados a olho).", "Rebuild the material's tables and charts as native SVG/HTML charts using its exact figures (never eyeballed).") : "",
        on("chart_table") ? L("Cada gráfico tem uma versão em tabela, disponível sob demanda e para leitores de tela.", "Every chart has a table version, available on demand and to screen readers.") : "",
        on("chart_tooltips") ? L("Mostre os valores ao passar o mouse ou tocar.", "Show values on hover or tap.") : "",
        on("chart_rules") ? L("Um eixo por gráfico, marcas finas, poucas cores com significado, contraste e separação para daltonismo verificados por cálculo.", "One axis per chart, thin marks, few meaningful colours, contrast and colour-blind separation checked by calculation.") : ""
      ]);
    }

    /* 7. Languages */
    if (sec("i18n")) {
      var names = langs.map(function (o) { return o.say[lang]; });
      if (!langs.length) {
        section(L("Idioma", "Language"), [L("O site fica no idioma do material.", "The site stays in the material's language.")]);
      } else if (!multi) {
        section(L("Idioma", "Language"), [L("O site será em " + names[0] + ". Se o material estiver em outro idioma, traduza com qualidade nativa.", "The site will be in " + names[0] + ". If the material is in another language, translate it to native quality.")]);
      } else {
        var codes = langs.map(function (o) { return o.v; });
        var fb = codes.indexOf(A.fallback) > -1 ? A.fallback : codes[0];
        var others = codes.filter(function (c) { return c !== fb; }).map(function (c) { return "`/" + c + "/`"; });
        var terms = lines(str("glossary_terms"));
        section(L("Idiomas", "Languages"), [
          L("Idiomas: ", "Languages: ") + join(names) + L(
            ". Traduza com qualidade nativa, adaptando expressões em vez de traduzir palavra por palavra. Interface, conteúdo, quizzes e metadados existem em todos os idiomas.",
            ". Translate to native quality, adapting idioms rather than translating word for word. Interface, content, quizzes and metadata exist in every language."),
          vis("fallback") ? L("O idioma padrão é o " + say("fallback", fb) + ": fica na raiz (`/`) e os demais em subpastas (" + others.join(", ") + ").",
                              "The default language is " + say("fallback", fb) + ": it lives at the root (`/`) and the others in subfolders (" + others.join(", ") + ").") : "",
          on("translate_first") ? L(
            "Se o material não existir em algum idioma, traduza-o primeiro para um arquivo próprio ao lado do original, com a mesma estrutura de títulos, âncoras e referências, e confira que as contagens batem. Esse arquivo vira a fonte daquele idioma.",
            "If the material doesn't exist in a language, translate it first into its own file next to the original, with the same headings, anchors and references, and check that the counts match. That file becomes the source for that language.") +
            why("uma tradução em arquivo próprio é verificável e evita reconstruir o site depois.", "a translation in its own file can be checked and avoids rebuilding the site later.") : "",
          on("autodetect") ? L(
            "Ao abrir a raiz, leve o visitante ao primeiro idioma do navegador que o site tiver; se nenhum servir, fique no padrão. Uma escolha anterior e links diretos para um idioma são sempre respeitados.",
            "When someone opens the root, send them to the first of their browser languages the site has; if none match, stay on the default. A previous choice and direct links to a language are always respected.") : "",
          on("switch_keep") ? L("O seletor de idioma (cabeçalho e rodapé) lembra a escolha e abre a página equivalente no outro idioma, nunca a página inicial.", "The language switcher (header and footer) remembers the choice and opens the equivalent page in the other language, never the home page.") : "",
          on("slugs") ? L("Use URLs traduzidas (ex.: `/pt/fundamentos/` e `/en/fundamentals/`).", "Use translated URLs (e.g. `/pt/fundamentos/` and `/en/fundamentals/`).") : "",
          on("one_template") ? L("Gere todas as versões a partir de um único template e de arquivos de tradução; o build para e lista qualquer texto sem tradução.", "Generate every version from one template plus translation files; the build stops and lists any untranslated text.") +
            why("assim o layout é idêntico em todos os idiomas e nenhum fica para trás.", "the layout stays identical in every language and none falls behind.") : "",
          on("localise_all") ? L("Traduza também os textos criados por JavaScript (rótulos, botões, tooltips), os formatos de número (1,4 × 1.4) e a imagem de compartilhamento de cada idioma. Nos créditos, diga de que idioma o texto foi traduzido.", "Also translate text created by JavaScript (labels, buttons, tooltips), number formats (1,4 vs 1.4) and each language's share image. In the credits, say which language the text was translated from.") : "",
          terms.length ? L("Termos preferidos:", "Preferred terms:") : ""
        ].concat(subs(terms)));
      }
    }

    /* 8. Accessibility */
    if (sec("a11y") && says("a11y").length) {
      section(L("Acessibilidade", "Accessibility"), [
        L("Garanta:", "Guarantee:") + why("a animação é uma camada por cima de uma página que já funciona sozinha.", "motion is a layer on top of a page that already works on its own.")
      ].concat(subs(says("a11y").map(cap))));
    }

    /* 9. Technology and SEO */
    if (sec("tech")) {
      var seo = picked("seo").map(function (o) {
        if (o.v === "canonical" && !multi) return L("URL canônica absoluta no endereço final", "an absolute canonical URL on the final address");
        return o.say[lang];
      });
      var kw = str("keywords"), w = v("weight");
      section(L("Tecnologia e SEO", "Technology and SEO"), [
        say("stack"),
        seo.length ? L("Desde o primeiro deploy:", "From the first deploy:") : ""
      ].concat(subs(seo.map(cap)), [
        kw ? L("Termos de busca principais: ", "Main search terms: ") + kw + "." : "",
        on("readme") ? L("Escreva um README com o que é o site, a estrutura de pastas, como editar o conteúdo", "Write a README covering what the site is, the folder structure, how to edit the content") +
          (multi ? L(" e as traduções", " and translations") : "") + L(", como visualizar localmente e como publicar.", ", how to preview locally and how to publish.") : "",
        on("vendor") ? L("Bibliotecas e fontes ficam dentro do projeto, com as licenças, sem depender de CDN.", "Libraries and fonts live inside the project, with their licences, with no CDN dependency.") : "",
        on("portable") ? L(
          "Tudo que depende de onde o site roda vem de configuração (ex.: `SITE_URL`, `BASE_PATH`) e os recursos usam caminhos relativos: o site funciona em `usuario.github.io/repo/` ou num domínio próprio sem mudar código.",
          "Everything that depends on where the site runs comes from configuration (e.g. `SITE_URL`, `BASE_PATH`) and assets use relative paths: the site works at `user.github.io/repo/` or on a custom domain without code changes.") +
          why("trocar o endereço provisório pelo domínio final não deve exigir mexer no código.", "moving from the temporary address to the final domain should not require code changes.") : "",
        on("build_source") ? L("Leia o material no build (por exemplo, dividindo-o pelos títulos) para gerar " + (fulltext ? "o texto integral, " : "") + "as referências e o glossário.", "Read the material at build time (for example, splitting it by headings) to generate " + (fulltext ? "the full text, " : "") + "the references and glossary.") +
          why("editar o material e rebuildar deve bastar para atualizar o site.", "editing the material and rebuilding should be enough to update the site.") : "",
        on("components") ? L("Metadados dos capítulos num só módulo, textos de interface num módulo de i18n e componentes interativos genéricos, alimentados por dados (um simulador genérico, não um por capítulo).", "Chapter metadata in one module, interface strings in an i18n module, and generic, data-driven interactive components (one generic simulator, not one per chapter).") : "",
        w && w !== "free" ? L("Peso máximo por página: " + say("weight") + " (imagens em WebP, fontes só com os caracteres usados).", "Maximum page weight: " + say("weight") + " (WebP images, fonts subset to the characters used).") : ""
      ]));
    }

    /* 10. Publishing */
    if (publishing) {
      var host = v("host"), repo = str("repo"), dns = str("dns"), log = str("domain_log");
      var gh = host === "ghpages";
      var pub = [say("deploy_now")];
      if (host) {
        pub.push(L("Hospedagem: ", "Hosting: ") + say("host") + (repo ? L(", repositório `" + repo + "`", ", repository `" + repo + "`") : "") +
          (vis("visibility") ? " (" + say("visibility") + ")" : "") +
          L(", com deploy automático a cada push na `main`", ", with automatic deploys on every push to `main`") + (gh ? L(" via GitHub Actions.", " via GitHub Actions.") : "."));
        if (gh && A.visibility === "private" && vis("visibility")) pub.push(L("GitHub Pages em repositório privado exige plano pago: confirme comigo antes.", "GitHub Pages on a private repository needs a paid plan: check with me first."));
      } else if (publishNow) {
        pub.push(L("Use uma hospedagem estática com deploy automático a cada push e me diga qual escolheu.", "Use a static host with automatic deploys on every push and tell me which one you chose."));
      }
      if (domain) pub.push(L("Endereço final: `" + domain + "`", "Final address: `" + domain + "`") + (dns ? L(", com DNS em " + dns + ".", ", with DNS at " + dns + ".") : "."));
      var skel = [L("deploy automático", "automatic deploys")];
      if (domain) skel.push(L("domínio", "domain"), "HTTPS");
      if (tool) skel.push("analytics");
      if (on("skeleton")) pub.push(L("Comece com um esqueleto no ar: uma página “olá mundo” publicada no endereço final, com ", "Start with a live skeleton: a “hello world” page published at the final address, with ") +
        join(skel) + L(", antes de qualquer conteúdo.", ", before any content.") +
        why("problemas de domínio, HTTPS e analytics aparecem cedo, quando ainda são baratos.", "domain, HTTPS and analytics problems show up early, while they are still cheap."));
      if (on("safe_order")) {
        var labels = domain.split(".");
        var rec = labels.length > 2
          ? L("um CNAME de `" + labels[0] + "` para o host", "a CNAME from `" + labels[0] + "` to the host")
          : L("os registros do domínio raiz (A/AAAA ou ALIAS) indicados pelo host", "the apex records (A/AAAA or ALIAS) the host specifies");
        var verify = on("verify_domain");
        var steps = [
          L("Criar os registros DNS" + (dns ? " no " + dns : "") + ": " + rec + (verify ? ", mais o TXT de verificação." : "."),
            "Create the DNS records" + (dns ? " at " + dns : "") + ": " + rec + (verify ? ", plus the verification TXT." : ".")),
          L("Confirmar que o DNS público (1.1.1.1 e 8.8.8.8) já responde.", "Confirm that public DNS (1.1.1.1 and 8.8.8.8) already answers.")
        ];
        if (verify) steps.push(L("Verificar o domínio na conta do GitHub (o TXT fica para sempre).", "Verify the domain on the GitHub account (the TXT stays permanently)."));
        steps.push(L("Só então associar o domínio no host.", "Only then attach the domain in the host."));
        steps.push(L("Esperar o certificado HTTPS e ativar “forçar HTTPS”.", "Wait for the HTTPS certificate and turn on “enforce HTTPS”."));
        steps.push(L("Rodar o deploy, para que as URLs canônicas já saiam com `https://` e o domínio final.", "Run the deploy, so canonical URLs already use `https://` and the final domain."));
        steps.push(L("Só então me passar o link.", "Only then send me the link."));
        pub.push(L("Para o domínio, siga esta ordem, sem publicar com o endereço provisório no meio do caminho:", "For the domain, follow this order, without publishing with the temporary address halfway through:") +
          why("associar antes do DNS impede o certificado, e abrir o endereço cedo demais faz o celular guardar “não existe” em cache por até uma hora.", "attaching before DNS exists blocks the certificate, and opening the address too early makes phones cache “does not exist” for up to an hour."));
        pub = pub.concat(nums(steps, true));
      }
      if (log) pub.push(L("Anote cada registro DNS criado em `" + log + "`, com data e finalidade.", "Log every DNS record you create in `" + log + "`, with date and purpose."));
      if (on("accounts")) pub.push(L("Antes de mexer em contas (hospedagem, DNS, analytics), confirme em qual navegador e máquina está operando e peça que eu já esteja logado. Você nunca digita senhas.", "Before touching any account (hosting, DNS, analytics), confirm which browser and machine you are operating and ask me to be signed in already. You never type passwords."));
      if (publishNow && level >= 2) pub.push(L("Depois do deploy, verifique o site no ar: as URLs respondem 200, os redirecionamentos (http→https, endereço antigo→novo) funcionam e as tags canônicas apontam para o endereço final.", "After deploying, check the live site: URLs return 200, redirects (http→https, old→new address) work and canonical tags point to the final address."));
      pub.push(L("Nunca coloque senhas, tokens ou chaves no código, no repositório ou em arquivos de registro.", "Never put passwords, tokens or keys in the code, the repository or any log file."));
      section(L("Publicação", "Publishing"), pub);
    }

    /* 11. Analytics */
    if (sec("analytics")) {
      if (!tool) {
        section("Analytics", [L("Sem analytics e sem cookies.", "No analytics and no cookies.")]);
      } else {
        var toolName = say("an_tool"), id = str("an_id"), qs = picked("an_questions").map(function (o) { return o.v; });
        var events = [];
        if (level >= 3) {
          if (qs.indexOf("read") > -1 || qs.indexOf("drop") > -1) events.push(L("`section_view` (com `section_id`) quando um capítulo fica 2 s no centro da tela", "`section_view` (with `section_id`) when a chapter stays in the middle of the screen for 2 s"));
          if (qs.indexOf("end") > -1) events.push(L("`reached_end` ao chegar ao fim", "`reached_end` on reaching the end"));
          if (qs.indexOf("langs") > -1 && multi) events.push(L("o parâmetro `content_language` em todos os eventos", "a `content_language` parameter on every event"));
          if (qs.indexOf("switch") > -1 && multi) events.push(L("`language_switch` com `from_language` e `to_language`", "`language_switch` with `from_language` and `to_language`"));
          if (qs.indexOf("quiz") > -1) events.push(L("`quiz_answer` com capítulo, pergunta e acerto", "`quiz_answer` with chapter, question and correctness"));
          if (qs.indexOf("out") > -1) events.push(L("cliques em links externos", "outbound link clicks"));
        }
        var tz = str("an_tz");
        section("Analytics", [
          L("Ferramenta: ", "Tool: ") + toolName + (id ? " (`" + id + "`)" : (ga && level >= 2 ? L(". Crie uma propriedade própria para este site e um fluxo web para o endereço final", ". Create a dedicated property for this site and a web stream for the final address") : "")) +
            L(". Ela entra junto com o lançamento, não depois.", ". It ships with the launch, not afterwards.") +
            why("visitas do lançamento que não são medidas não voltam.", "launch visits that go unmeasured never come back."),
          qs.length ? L("Quero saber ", "I want to know ") + says("an_questions").join("; ") + L(". Para cada pergunta, defina o evento, os parâmetros e onde ler a resposta antes de escrever o código.", ". For each question, define the event, the parameters and where to read the answer before writing code.") : "",
          events.length ? L("Sugestão de eventos: ", "Suggested events: ") + join(events) + "." : "",
          on("an_consent") ? (ga
            ? L("Banner de consentimento discreto, no idioma da página: analytics só depois de aceitar (Consent Mode v2), anúncios sempre negados, escolha lembrada e reabrível por um link no rodapé.", "A discreet consent banner in the page's language: analytics only after Accept (Consent Mode v2), ads always denied, the choice remembered and reopenable from a footer link.")
            : L("Se a ferramenta não usar cookies, dispense o banner e diga no rodapé o que é medido; se usar, peça consentimento antes.", "If the tool is cookieless, skip the banner and state in the footer what is measured; if it uses cookies, ask for consent first.")) : "",
          on("an_prod_only") ? L("O script só entra no build de produção, com o ID vindo de variável de ambiente; desenvolvimento local nunca envia dados.", "The script is only included in the production build, with the ID from an environment variable; local development never sends data.") : "",
          on("an_dashboard") ? (ga
            ? L("No painel do GA4: registre os parâmetros como dimensões personalizadas, aumente a retenção de dados de eventos para 14 meses e crie uma Exploração com uma aba por pergunta.", "In the GA4 admin: register the parameters as custom dimensions, raise event data retention to 14 months and build an Exploration with one tab per question.")
            : L("No painel: crie os eventos ou metas e uma visão por pergunta.", "In the dashboard: set up the events or goals and one view per question.")) : "",
          tz ? L("Fuso horário e moeda da propriedade: ", "Property time zone and currency: ") + tz + "."
             : (vis("an_tz") ? L("Pergunte o fuso horário e a moeda da propriedade; não copie de outra propriedade.", "Ask for the property's time zone and currency; do not copy them from another property.") : ""),
          on("an_verify") ? L("Com o site no ar, confirme no Tempo real que cada evento chega, antes e depois do consentimento.", "With the site live, confirm in Realtime that every event arrives, before and after consent.") +
            why("só o Tempo real mostra, por exemplo, se a primeira página é contada depois do aceite.", "only Realtime shows, for example, whether the first page is counted after consent.") : ""
        ]);
      }
    }

    /* 12. Way of working */
    var proc = [say("ask")];
    var ms = [];
    if (on("skeleton")) ms.push(L("esqueleto no ar", "live skeleton"));
    if (pilot) ms.push(L("fatia vertical: abertura e um capítulo completos (visual, interações, idiomas, testes); **pare e me mostre** antes de escalar", "vertical slice: the hero and one complete chapter (look, interactions, languages, tests); **stop and show me** before scaling"));
    ms.push(pilot
      ? L("os demais capítulos, em lotes, reutilizando os padrões aprovados", "the remaining chapters, in batches, reusing the approved patterns")
      : L("todos os capítulos, em lotes", "all chapters, in batches"));
    if (publishNow) ms.push(L("publicação e verificação no ar", "publishing and live checks"));
    if (tool && !on("skeleton")) ms.push("analytics");
    proc.push((pilot ? L("Trabalhe por marcos:", "Work in milestones:") : L("Entregue o site completo, em marcos:", "Deliver the complete site, in milestones:")) +
      why("decisões que chegam tarde custam retrabalho; ver o visual cedo evita refazer o site.", "late decisions cause rework; seeing the look early avoids rebuilding the site."));
    proc = proc.concat(nums(ms.map(cap), true));
    if (on("commits")) proc.push(L("Use git desde o primeiro passo: um commit por marco ou capítulo, com mensagem clara.", "Use git from the first step: one commit per milestone or chapter, with a clear message."));
    proc.push(say("attribution"));
    if (on("plan_md")) proc.push(L("Mantenha um `PLAN.md` com o que está feito, o que vem a seguir, as decisões e as pendências; atualize a cada marco.", "Keep a `PLAN.md` with what is done, what comes next, decisions and open items; update it at every milestone.") +
      why("ele permite retomar o trabalho do zero se o contexto se perder.", "it lets the work resume from scratch if context is lost."));
    if (on("review_list")) proc.push(L("Ao final, entregue a lista de tudo o que você sintetizou, simplificou ou ilustrou, por capítulo, para eu revisar a precisão.", "At the end, hand me a list of everything you synthesised, simplified or illustrated, by chapter, so I can review its accuracy."));
    if (on("debt")) proc.push(L("Mantenha no README uma seção “Dívida conhecida” (bundles grandes, avisos do CI, testes faltando).", "Keep a “Known debt” section in the README (large bundles, CI warnings, missing tests)."));
    if (v("report")) proc.push(L("No fim, entregue um relatório ", "At the end, give me a report that is ") + say("report") + L(": o que foi feito, como foi testado, decisões tomadas e o que ficou pendente.", ": what was done, how it was tested, decisions made and what is still open."));
    if (vis("reply_lang")) {
      var rl = A.reply_lang === "auto" ? L("português", "English") : say("reply_lang");
      proc.push(L("Responda-me em " + rl + ".", "Reply to me in " + rl + "."));
    }
    if (!sec("qa")) proc.push(L("Só diga que algo está pronto depois de testar como um visitante faria, no celular e no computador.", "Only call something done after testing it as a visitor would, on a phone and a computer."));
    proc.push(L("Para o que não estiver especificado, decida com bom senso, priorizando clareza, leveza e acessibilidade, e registre as decisões no ", "For anything not specified, decide sensibly, favouring clarity, lightness and accessibility, and record the decisions in ") +
      (on("plan_md") ? "`PLAN.md`." : L("README.", "the README.")));
    section(L("Forma de trabalho", "Way of working"), proc);

    /* 13. Testing + definition of done */
    if (sec("qa")) {
      var checks = picked("qa_checks").filter(function (o) { return multi || o.v !== "langs"; }).map(function (o) { return o.say[lang]; });
      section(L("Testes", "Testing"), [
        on("qa_auto") ? L("Teste num navegador real em modo headless (Playwright ou Puppeteer), com scripts que possam ser rodados de novo.", "Test in a real headless browser (Playwright or Puppeteer), with scripts that can be re-run.") : "",
        on("qa_in_repo") ? L("Os testes moram no repositório e rodam no CI a cada push.", "Tests live in the repository and run in CI on every push.") +
          why("testes em pasta temporária se perdem e não protegem a próxima mudança.", "tests in a temp folder get lost and don't protect the next change.") : "",
        checks.length ? L("Verifique:", "Check:") + (has("qa_checks", "resize") ? why("bugs de menu em páginas com cenas fixadas costumam aparecer só depois de redimensionar ou dar zoom.", "menu bugs on pages with pinned scenes often appear only after resizing or zooming.") : "") : ""
      ].concat(subs(checks.map(cap)), [
        on("qa_phone") ? L("Ao final, me peça para abrir no meu celular; só considere pronto depois disso.", "At the end, ask me to open it on my phone; it is only done after that.") : "",
        L("Relate resultados com fidelidade: se algo falhou ou foi pulado, diga, com a saída do erro.", "Report results faithfully: if something failed or was skipped, say so, with the error output.")
      ]));

      var done = [L("Todo o conteúdo do material está no site, com crédito à autoria.", "All of the material's content is on the site, with credit to the author.")];
      if (teach && sec("teaching")) {
        done.push(L("Cada capítulo ensina com ao menos uma interação", "Every chapter teaches with at least one interaction") +
          (blocksOn && has("blocks", "summary") ? L(" e termina com pontos-chave", " and ends with key points") : "") +
          (parts.indexOf("quiz") > -1 ? L(" e quiz.", " and a quiz.") : "."));
      }
      if (multi) done.push(L("Todas as páginas existem em ", "Every page exists in ") + join(langs.map(function (o) { return o.say[lang]; })) +
        L(", e a troca de idioma leva à página equivalente.", ", and switching language leads to the equivalent page."));
      done.push(publishNow
        ? L("Site publicado", "Site published") + (domain ? L(" em `https://" + domain + "/`", " at `https://" + domain + "/`") : "") + L(", com todas as URLs respondendo 200.", ", with every URL returning 200.")
        : L("O site builda sem erros e roda localmente.", "The site builds without errors and runs locally."));
      done.push(L("Funciona bem no celular, sem rolagem lateral.", "It works well on a phone, with no sideways scrolling."));
      if (on("readme")) done.push(L("O README explica como rodar, editar o conteúdo e publicar.", "The README explains how to run it, edit the content and publish it."));
      done.push(L("Os testes passaram e os resultados foram relatados.", "The tests passed and the results were reported."));
      if (sec("tech") && picked("seo").length) done.push(L("Os itens de busca e compartilhamento estão no HTML gerado.", "The search and sharing items are in the generated HTML."));
      if (tool && publishNow) done.push(L("Os eventos aparecem no analytics", "Events show up in analytics") + (on("an_consent") ? L(", respeitando o consentimento.", ", respecting consent.") : "."));
      if (on("review_list")) done.push(L("A lista de síntese e ilustrações foi entregue para revisão.", "The list of synthesis and illustrations was handed over for review."));
      if (on("plan_md")) done.push(L("`PLAN.md` atualizado.", "`PLAN.md` is up to date."));
      if (has("qa_checks", "lighthouse")) done.push(L("Lighthouse ≥ 90 nas páginas principais.", "Lighthouse ≥ 90 on the main pages."));
      lines(str("qa_done")).forEach(function (x) { done.push(cap(x.replace(/[.!?]$/, "")) + "."); });
      section(L("Definição de pronto", "Definition of done"), done.map(function (x) { return "- [ ] " + x; }));
    }

    /* 14. Known pitfalls */
    if (on("pitfalls")) {
      var effects = A.effects || [];
      var pit = [];
      if (!calm && (effects.indexOf("pinned") > -1 || effects.indexOf("horizontal") > -1)) pit.push(L(
        "Cenas fixadas e rolagem horizontal mudam a altura da página quando são criadas ou recriadas (inclusive ao redimensionar). Posições guardadas ficam erradas por milhares de pixels: calcule o item ativo do menu pela posição real na tela, recalcule os gatilhos na ordem da página e teste depois de redimensionar e dar zoom.",
        "Pinned scenes and horizontal scrolling change the page height when they are created or rebuilt (including on resize). Stored positions end up thousands of pixels off: compute the active menu item from live on-screen positions, refresh triggers in page order, and test after resizing and zooming."));
      if (effects.indexOf("reveal") > -1 || effects.indexOf("kinetic") > -1) pit.push(L(
        "Máscaras de texto animado cortam acentos (É, Ç, Ã): dê folga vertical às linhas.",
        "Animated text masks clip accents (É, Ç, Ã): give lines vertical headroom."));
      if (multi) pit.push(L("Números soltos no HTML (1,4 / 2.000) também precisam do formato de cada idioma, não só os textos.", "Bare numbers in the HTML (1,4 / 2.000) also need each language's format, not just the text."));
      if (domain) pit.push(L("Não abra nem compartilhe o endereço antes de o DNS público responder: o celular guarda “não existe” em cache.", "Do not open or share the address before public DNS answers: phones cache “does not exist”."));
      if (publishing && A.host === "ghpages") pit.push(L("Use as versões atuais das actions oficiais do GitHub Pages, para o CI não acumular avisos de runtime depreciado.", "Use the current versions of the official GitHub Pages actions, so CI doesn't pile up deprecated-runtime warnings."));
      if (ga) {
        pit.push(L("Com consentimento, a primeira `page_view` sai sem cookies; quando o visitante aceita, envie de novo a `page_view` da página atual.", "With consent mode, the first `page_view` goes out without cookies; when the visitor accepts, send the current page's `page_view` again."));
        pit.push(L("Não use parâmetros com nomes reservados do GA4 (como `language`); use nomes próprios, como `content_language`.", "Do not use parameter names GA4 reserves (such as `language`); use your own, such as `content_language`."));
        pit.push(L("Dimensões personalizadas só valem a partir de quando são criadas, e a retenção padrão é de 2 meses: configure as duas antes do lançamento.", "Custom dimensions only apply from when they are created, and default retention is 2 months: set both before launch."));
        pit.push(L("Se a raiz redireciona para outro idioma, não conte a visita duas vezes.", "If the root redirects to another language, don't count the visit twice."));
      }
      if (level >= 4) pit.push(L("Modais e elementos fixos ficam fora de ancestrais com `transform` (use um portal), e animações de entrada limpam o `transform` ao terminar.", "Modals and fixed elements live outside ancestors with `transform` (use a portal), and entrance animations clear `transform` when they finish."));
      pit.push(L("Fixe as versões das ferramentas no projeto (por exemplo `.nvmrc`) e use as mesmas no CI.", "Pin tool versions in the project (for example `.nvmrc`) and use the same ones in CI."));
      section(L("Armadilhas conhecidas", "Known pitfalls"), pit);
    }

    /* 15. Additional requests */
    var extra = str("extra");
    if (extra) {
      n++;
      out.push("## " + n + ". " + L("Pedidos adicionais", "Additional requests"), "", extra, "");
    }

    /* 16. Before you start */
    var first = [L("Leia o material por completo.", "Read the whole material.")];
    if (A.ask === "plan") {
      first.push(L("Responda numa só mensagem com a divisão proposta em capítulos (uma linha cada" + (sec("teaching") ? ", com a interação central" : "") + "), a stack e as bibliotecas que vai usar, e as perguntas que tiver.",
                   "Reply in a single message with the proposed chapter split (one line each" + (sec("teaching") ? ", with its core interaction" : "") + "), the stack and libraries you will use, and any questions you have."));
      first.push(L("Espere meu ok e comece pelo primeiro marco.", "Wait for my go-ahead, then start with the first milestone."));
    } else {
      first.push(L("Comece pelo primeiro marco.", "Start with the first milestone."));
    }
    section(L("Antes de começar", "Before you start"), nums(first));

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function stats(text) {
    return {
      words: (text.match(/\S+/g) || []).length,
      tokens: Math.round(text.length / 4),
      sections: (text.match(/^## /gm) || []).length
    };
  }

  return {
    schema: S, fields: FIELD, sections: SECTION, sectionOf: SECTION_OF,
    defaults: defaults, presetValues: presetValues, fresh: fresh, normalize: normalize,
    sectionOn: sectionOn, sectionShown: sectionShown, fieldVisible: fieldVisible, applies: applies,
    build: build, stats: stats
  };
});
