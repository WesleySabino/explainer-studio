/* Explainer Studio · schema
 *
 * Pure data: levels, sections, fields and presets. No DOM, no logic beyond
 * small `when` predicates. Loaded as a classic script in the browser
 * (window.EXPLAINER_SCHEMA) and with require() in Node.
 *
 * Field:
 *   id      unique key in the answers object
 *   type    choice | multi | switch | select | text | area
 *   level   1..4, shown (and used in the prompt) when level <= chosen level
 *   label   { pt, en }
 *   ph      placeholder example: a string or { pt, en } (text/area only)
 *   def     default value
 *   options [{ v, label: {pt,en}, say: {pt,en} }]; `say` is the phrase the prompt uses
 *   when    optional (values) => boolean; hides the field when it does not apply
 *   short   text fields that sit two per row
 *
 * Section:
 *   id, title {pt,en}, level (default 1), optional (can be left out of the prompt), fields
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EXPLAINER_SCHEMA = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function T(pt, en) { return { pt: pt, en: en }; }
  function O(v, labelPt, labelEn, sayPt, sayEn) {
    return { v: v, label: T(labelPt, labelEn), say: T(sayPt === undefined ? labelPt : sayPt, sayEn === undefined ? labelEn : sayEn) };
  }
  function many(v) { return Array.isArray(v.langs) && v.langs.length > 1; }
  function has(list, x) { return Array.isArray(list) && list.indexOf(x) > -1; }

  var LANGS = [
    O("pt", "Português", "Portuguese", "português do Brasil", "Brazilian Portuguese"),
    O("en", "Inglês", "English", "inglês", "English"),
    O("es", "Espanhol", "Spanish", "espanhol", "Spanish"),
    O("fr", "Francês", "French", "francês", "French"),
    O("de", "Alemão", "German", "alemão", "German"),
    O("it", "Italiano", "Italian", "italiano", "Italian")
  ];

  var levels = [
    { n: 1, name: T("Essencial", "Essential") },
    { n: 2, name: T("Equilibrado", "Balanced") },
    { n: 3, name: T("Detalhado", "Detailed") },
    { n: 4, name: T("Completo", "Complete") }
  ];

  var sections = [
    /* ------------------------------------------------------------------ */
    {
      id: "source", title: T("Material", "Source material"),
      fields: [
        { id: "source_type", type: "choice", level: 1, label: T("Tipo", "Type"), def: "doc", options: [
          O("slides", "Slides", "Slides", "uma apresentação de slides", "a slide deck"),
          O("doc", "Documento ou artigo", "Document or article", "um documento ou artigo", "a document or article"),
          O("book", "Livro", "Book", "um livro", "a book"),
          O("docs", "Documentação técnica", "Technical docs", "uma documentação técnica", "technical documentation"),
          O("transcript", "Aula ou vídeo", "Lecture or video", "a transcrição de uma aula ou vídeo", "a transcript of a lecture or video"),
          O("notes", "Notas", "Notes", "um conjunto de notas", "a set of notes"),
          O("many", "Vários arquivos", "Several files", "um conjunto de arquivos", "a set of files")
        ] },
        { id: "source_path", type: "text", level: 1, label: T("Onde está", "Location"), ph: "~/Downloads/material.pdf" },
        { id: "author", type: "text", level: 1, short: true, label: T("Autoria", "Author") },
        { id: "source_lang", type: "select", level: 2, short: true, label: T("Idioma", "Language"), def: "auto",
          options: [O("auto", "Detectar", "Detect", "", "")].concat(LANGS) },
        { id: "author_links", type: "area", level: 3, label: T("Links da autoria", "Author links"), ph: "https://…" },
        { id: "fidelity", type: "choice", level: 1, label: T("Liberdade com o conteúdo", "Freedom with the content"), def: "faithful", options: [
          O("faithful", "Fiel", "Faithful",
            "Siga fielmente o conteúdo e a argumentação do material. Não invente dados, números nem afirmações.",
            "Follow the material's content and argument faithfully. Do not invent data, figures or claims."),
          O("condense", "Pode resumir", "May condense",
            "Pode resumir e reorganizar para ficar mais claro, sem mudar o sentido nem inventar dados.",
            "You may condense and reorganise for clarity, without changing the meaning or inventing data."),
          O("expand", "Pode complementar", "May expand",
            "Pode complementar com explicações e fontes externas confiáveis, sempre marcando o que não veio do material.",
            "You may add explanations and reliable outside sources, always marking what did not come from the material.")
        ] },
        { id: "rights", type: "choice", level: 2, label: T("Direitos de publicação", "Publishing rights"), def: "unknown", options: [
          O("mine", "É meu", "It's mine", "O conteúdo é meu; pode publicar.", "The content is mine; it can be published."),
          O("allowed", "Tenho permissão", "I have permission", "Tenho permissão da autoria para criar e publicar o site.", "I have the author's permission to build and publish the site."),
          O("unknown", "Não sei", "Not sure",
            "Os direitos ainda não estão confirmados: trate a publicação como pendente e me lembre disso antes de publicar.",
            "Rights are not confirmed yet: treat publishing as pending and remind me before publishing.")
        ] },
        { id: "third_images", type: "choice", level: 3, label: T("Imagens de terceiros", "Third-party images"), def: "flag", options: [
          O("flag", "Usar e listar", "Use and list",
            "Pode usar imagens de terceiros (fotos, marcas, banco de imagens), mas liste-as no README com nomes de arquivo descritivos para que eu possa trocá-las.",
            "You may use third-party images (photos, logos, stock), but list them in the README with descriptive file names so I can replace them."),
          O("replace", "Substituir", "Replace",
            "Substitua imagens de terceiros por ilustrações, gráficos ou composições próprias.",
            "Replace third-party images with your own illustrations, charts or compositions."),
          O("drop", "Não usar", "Don't use", "Não use imagens de terceiros.", "Do not use third-party images.")
        ] },
        { id: "honesty", type: "switch", level: 2, label: T("Rotular síntese e exemplos ilustrativos", "Label synthesis and illustrative examples"), def: true },
        { id: "verify_refs", type: "switch", level: 2, label: T("Verificar e linkar as referências citadas", "Verify and link cited references"), def: true },
        { id: "extract_images", type: "switch", level: 3, label: T("Extrair e otimizar as imagens do material", "Extract and optimise the material's images"), def: true },
        { id: "keep_private", type: "switch", level: 3, label: T("Arquivo original fora do repositório", "Keep the original file out of the repo"), def: true }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "goal", title: T("Objetivo e público", "Goal and audience"),
      fields: [
        { id: "name", type: "text", level: 1, short: true, label: T("Nome do site", "Site name") },
        { id: "audience", type: "text", level: 1, short: true, label: T("Público", "Audience"), ph: T("Estudantes do ensino médio", "High school students") },
        { id: "goal", type: "choice", level: 1, label: T("Objetivo", "Goal"), def: "teach", options: [
          O("teach", "Ensinar", "Teach", "ensinar o conteúdo do material de forma clara e memorável", "teach the material's content in a clear, memorable way"),
          O("persuade", "Convencer", "Persuade", "divulgar as ideias do material e convencer o leitor", "spread the material's ideas and persuade the reader"),
          O("reference", "Consulta", "Reference", "servir de referência rápida para consulta", "serve as a quick reference"),
          O("showcase", "Apresentar", "Showcase", "apresentar um projeto ou trabalho", "present a project or body of work")
        ] },
        { id: "outcomes", type: "area", level: 2, label: T("O que o leitor deve conseguir depois", "What readers should be able to do afterwards"), ph: T("Explicar…\nAplicar…", "Explain…\nApply…") },
        { id: "tone", type: "choice", level: 2, label: T("Tom", "Tone"), def: "source", options: [
          O("source", "O do material", "The material's", "Mantenha o tom do material.", "Keep the material's tone."),
          O("warm", "Didático", "Warm", "Tom didático e caloroso, frases curtas.", "A warm, teacherly tone with short sentences."),
          O("editorial", "Editorial", "Editorial", "Tom editorial e sofisticado, com manchetes fortes.", "A sophisticated editorial tone with strong headlines."),
          O("technical", "Técnico", "Technical", "Tom sóbrio, técnico e direto.", "A sober, technical, direct tone.")
        ] },
        { id: "device", type: "choice", level: 2, label: T("Onde vão ler", "Where they'll read"), def: "mobile", options: [
          O("mobile", "Celular", "Phone", "A maioria vai ler no celular: projete primeiro para telas pequenas.", "Most readers will be on a phone: design mobile-first."),
          O("both", "Ambos", "Both", "Celular e computador têm o mesmo peso.", "Phone and desktop matter equally."),
          O("desktop", "Computador", "Desktop", "A maioria vai ler no computador, mas o celular precisa funcionar bem.", "Most readers will be on desktop, but mobile must work well.")
        ] },
        { id: "prereq", type: "text", level: 4, label: T("Conhecimento prévio", "Assumed knowledge"), ph: T("Álgebra básica", "Basic algebra") }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "structure", title: T("Estrutura", "Structure"), optional: true,
      fields: [
        { id: "layout", type: "choice", level: 1, label: T("Formato", "Format"), def: "auto", options: [
          O("auto", "Pelo tamanho", "By length",
            "Escolha entre página única e várias páginas pelo tamanho do material, e justifique.",
            "Choose between a single page and several pages based on the material's length, and justify it."),
          O("single", "Página única", "Single page", "Uma página única com rolagem, dividida em capítulos.", "A single scrolling page divided into chapters."),
          O("multi", "Várias páginas", "Several pages", "Várias páginas, uma por capítulo, com navegação entre elas.", "Several pages, one per chapter, with navigation between them.")
        ] },
        { id: "blocks", type: "multi", level: 1, label: T("Blocos", "Blocks"), def: ["hero", "menu", "progress", "summary", "refs", "faq", "credits", "top"], options: [
          O("hero", "Abertura", "Hero", "uma abertura (hero) de impacto", "a striking opening hero"),
          O("menu", "Índice", "Index", "um índice de capítulos acessível pelo teclado", "a keyboard-accessible chapter index"),
          O("progress", "Progresso", "Progress", "barra de progresso e capítulo atual no cabeçalho", "a progress bar and the current chapter in the header"),
          O("journey", "Mapa da jornada", "Journey map", "um mapa na abertura que mostra partes e capítulos como um percurso", "an opening map showing parts and chapters as a path"),
          O("timeline", "Linha do tempo", "Timeline", "uma linha do tempo", "a timeline"),
          O("map", "Mapa", "Map", "um mapa quando houver lugares", "a map where places are mentioned"),
          O("refs", "Fontes", "Sources", "cartões para cada estudo ou fonte citada", "cards for each study or source cited"),
          O("cases", "Casos", "Cases", "depoimentos e casos", "testimonials and case stories"),
          O("faq", "Perguntas frequentes", "FAQ", "perguntas frequentes", "an FAQ"),
          O("summary", "Pontos-chave", "Key points", "pontos-chave ao fim de cada capítulo", "key points at the end of each chapter"),
          O("glossary", "Glossário", "Glossary", "um glossário", "a glossary"),
          O("fulltext", "Texto integral", "Full text",
            "o texto integral de cada seção do material, recolhível, para que nada se perca",
            "each section's full original text, collapsible, so nothing is lost"),
          O("readtime", "Tempo de leitura", "Reading time", "tempo estimado de leitura por capítulo", "estimated reading time per chapter"),
          O("credits", "Créditos", "Credits", "uma seção de créditos", "a credits section"),
          O("top", "Voltar ao topo", "Back to top", "um link para voltar ao topo", "a back-to-top link")
        ] },
        { id: "order", type: "choice", level: 2, label: T("Capítulos", "Chapters"), def: "source", options: [
          O("source", "Ordem do material", "Material's order", "Siga a ordem do material: um capítulo por seção.", "Follow the material's order: one chapter per section."),
          O("theme", "Por tema", "By theme", "Reorganize em partes temáticas se isso deixar a leitura mais clara.", "Regroup into thematic parts if that reads more clearly."),
          O("propose", "Proponha", "Propose",
            "Proponha a divisão em capítulos e partes e espere minha aprovação antes de construir.",
            "Propose the split into chapters and parts and wait for my approval before building.")
        ] },
        { id: "chapters", type: "text", level: 3, short: true, label: T("Número de capítulos", "Number of chapters"), ph: "8" }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "teaching", title: T("Ensino e interações", "Teaching and interactions"), optional: true,
      fields: [
        { id: "chapter_parts", type: "multi", level: 1, label: T("Cada capítulo tem", "Every chapter has"),
          when: function (v) { return v.goal === "teach"; },
          def: ["hook", "concept", "interaction", "example", "quiz"], options: [
            O("hook", "Gancho", "Hook", "**Gancho**: uma pergunta ou situação que cria a necessidade do conteúdo.", "**Hook**: a question or situation that creates the need for the content."),
            O("concept", "Conceito", "Concept", "**Conceito**: a ideia central, explicada com voz própria, sem colar trechos do material.", "**Concept**: the core idea in your own words, not pasted from the material."),
            O("interaction", "Interação", "Interaction", "**Interação central**: o leitor faz algo e vê a consequência.", "**Core interaction**: the reader does something and sees the consequence."),
            O("example", "Exemplo", "Example", "**Exemplo concreto**: um caso real ou realista do assunto.", "**Concrete example**: a real or realistic case from the subject."),
            O("quiz", "Quiz", "Quiz", "**Quiz curto**: 2 ou 3 perguntas", "**Short quiz**: 2 or 3 questions")
          ] },
        { id: "interactions", type: "multi", level: 2, label: T("Repertório de interações", "Interaction repertoire"),
          def: ["quiz", "sort", "stepper", "beforeafter", "sliders", "cards", "scenario", "failure"], options: [
            O("quiz", "Quiz", "Quiz", "perguntas com feedback", "questions with feedback"),
            O("sort", "Ordenar e classificar", "Sort and classify", "organizar itens em categorias ou em sequência", "arrange items into categories or a sequence"),
            O("stepper", "Simulador passo a passo", "Step-by-step simulator", "estados avançando com play e passo", "states advancing with play and step"),
            O("beforeafter", "Antes e depois", "Before and after", "alternar dois estados do mesmo cenário", "toggle two states of the same scene"),
            O("sliders", "Calculadora", "Calculator", "parâmetros ajustáveis com resultado na hora", "adjustable parameters with an instant result"),
            O("cards", "Cartas", "Cards", "grade de cartas que abrem explicações", "a grid of cards that open explanations"),
            O("scenario", "Cenário com escolhas", "Branching scenario", "decisões com consequências explicadas", "decisions with explained consequences"),
            O("failure", "Simular falha", "Failure simulation", "quebrar uma etapa de uma cadeia e ver o que se perde depois", "break one step of a chain and see what is lost downstream"),
            O("timeline", "Plano com checklist", "Plan with checklist", "marcos com checklist", "milestones with a checklist"),
            O("explorer", "Explorador filtrável", "Filterable explorer", "busca e filtros sobre listas", "search and filters over lists"),
            O("diagram", "Diagrama clicável", "Clickable diagram", "elementos que revelam relações", "elements that reveal relationships"),
            O("compare", "Comparador", "Comparator", "opções lado a lado com critérios ajustáveis", "options side by side with adjustable criteria")
          ] },
        { id: "density", type: "choice", level: 3, label: T("Interações por capítulo", "Interactions per chapter"), def: "2", options: [
          O("1", "1", "1"), O("2", "2", "2"), O("3", "3", "3"), O("4", "4", "4")
        ] },
        { id: "aids", type: "multi", level: 3, label: T("Apoio ao estudo", "Study aids"),
          when: function (v) { return v.goal === "teach"; },
          def: ["done", "tracks"], options: [
            O("done", "Capítulos concluídos", "Completed chapters", "capítulos concluídos marcados e salvos", "completed chapters marked and saved"),
            O("tracks", "Trilhas por perfil", "Learning paths", "trilhas por perfil na abertura, cada uma com uma ordem de capítulos", "learning paths by profile on the home page, each with a chapter order"),
            O("templates", "Modelos copiáveis", "Copyable templates", "modelos do material com botão de copiar", "templates from the material with a copy button"),
            O("plan", "Plano de estudos", "Study plan", "um plano de estudos com checklist", "a study plan with a checklist"),
            O("self", "Autoavaliação", "Self-assessment", "autoavaliação de competências", "a skills self-assessment")
          ] },
        { id: "clarity", type: "switch", level: 2, label: T("Toda interação diz o que fazer e onde olhar", "Every interaction says what to do and where to look"), def: true },
        { id: "quiz_explain", type: "switch", level: 3, label: T("Quizzes explicam cada alternativa", "Quizzes explain every option"), def: true,
          when: function (v) { return v.goal === "teach" && has(v.chapter_parts, "quiz"); } },
        { id: "persist", type: "switch", level: 3, label: T("Progresso e respostas salvos no navegador", "Progress and answers saved in the browser"), def: true }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "visual", title: T("Visual e movimento", "Look and motion"),
      fields: [
        { id: "style", type: "choice", level: 1, label: T("Estilo", "Style"), def: "cinematic", options: [
          O("cinematic", "Cinematográfico", "Cinematic", "cinematográfico e escuro, com contraste forte e tipografia grande", "cinematic and dark, with strong contrast and big type"),
          O("editorial", "Editorial claro", "Light editorial", "editorial e claro, como uma revista de qualidade", "light and editorial, like a quality magazine"),
          O("minimal", "Minimalista", "Minimal", "minimalista, com muito espaço em branco", "minimal, with generous white space"),
          O("playful", "Lúdico", "Playful", "vibrante e lúdico, com cores vivas", "vibrant and playful, with lively colour"),
          O("tech", "Tech", "Tech", "escuro e técnico, com acentos neon, grades e fonte mono", "dark and technical, with neon accents, grids and a mono face")
        ] },
        { id: "anim", type: "choice", level: 1, label: T("Movimento", "Motion"), def: "balanced", options: [
          O("calm", "Calmo", "Calm", "Movimento contido: só transições suaves de entrada, sem cenas fixadas.", "Restrained motion: gentle entrance transitions only, no pinned scenes."),
          O("balanced", "Equilibrado", "Balanced", "Escolha 2 a 3 cenas de rolagem marcantes, onde o movimento explica algo; o resto calmo.", "Pick 2–3 signature scroll scenes where motion explains something; keep the rest calm."),
          O("showpiece", "Vitrine", "Showpiece", "Vitrine: máximo impacto visual, com várias cenas de rolagem, desde que nada quebre a leitura.", "Showpiece: maximum visual impact with several scroll scenes, as long as reading never breaks.")
        ] },
        { id: "brand", type: "choice", level: 2, label: T("Identidade", "Identity"), def: "source", options: [
          O("source", "A do material", "The material's", "Use as cores e as fontes do material (identifique-as no arquivo).", "Use the material's colours and fonts (identify them from the file)."),
          O("new", "Nova", "New", "Crie uma identidade visual nova, coerente com o tema.", "Create a new visual identity that fits the subject.")
        ] },
        { id: "effects", type: "multi", level: 2, label: T("Efeitos", "Effects"), def: ["kinetic", "pinned", "smooth", "reveal", "grain", "chartanim"], options: [
          O("kinetic", "Tipografia cinética", "Kinetic type", "tipografia cinética na abertura", "kinetic typography in the hero"),
          O("pinned", "Cenas fixadas", "Pinned scenes", "cenas fixadas que se transformam com a rolagem", "pinned scenes that transform as you scroll"),
          O("horizontal", "Rolagem horizontal", "Horizontal scroll", "um trecho de rolagem horizontal", "a horizontal-scroll stretch"),
          O("parallax", "Parallax", "Parallax", "parallax sutil", "subtle parallax"),
          O("smooth", "Rolagem suave", "Smooth scroll", "rolagem suave", "smooth scrolling"),
          O("reveal", "Texto revelado", "Text reveal", "texto revelado linha a linha", "text revealed line by line"),
          O("grain", "Granulação", "Film grain", "textura de granulação", "a film-grain texture"),
          O("particles", "Partículas", "Particles", "partículas leves na abertura", "light particles in the hero"),
          O("scene3d", "Cena 3D", "3D scene", "uma cena 3D na abertura que represente a tese, com a biblioteca carregada sob demanda", "a 3D hero scene that embodies the thesis, with the library loaded on demand"),
          O("themes", "Cor por capítulo", "Colour per chapter", "mudança de cor de fundo entre capítulos", "background colour shifts between chapters"),
          O("chartanim", "Gráficos animados", "Animated charts", "gráficos que se desenham ao entrar na tela", "charts that draw themselves on entering the screen")
        ] },
        { id: "libs", type: "choice", level: 3, label: T("Bibliotecas", "Libraries"), def: "libs", options: [
          O("libs", "Consagradas", "Proven ones", "Use bibliotecas consagradas (por exemplo GSAP com ScrollTrigger e Lenis) em vez de reinventar.", "Use proven libraries (for example GSAP with ScrollTrigger, and Lenis) instead of reinventing them."),
          O("vanilla", "Nenhuma", "None", "Use apenas CSS e JavaScript puros, sem bibliotecas.", "Use plain CSS and JavaScript only, no libraries.")
        ] },
        { id: "palette", type: "text", level: 3, short: true, label: T("Cores", "Colours"), ph: "#0f172a, #f97316" },
        { id: "fonts", type: "text", level: 3, short: true, label: T("Fontes", "Fonts"), ph: "Fraunces + Inter" },
        { id: "inspo", type: "area", level: 4, label: T("Referências visuais", "Visual references"), ph: "https://…" }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "data", title: T("Dados e gráficos", "Data and charts"), optional: true, level: 2,
      fields: [
        { id: "rebuild_charts", type: "switch", level: 2, label: T("Tabelas e gráficos viram gráficos nativos", "Tables and charts become native charts"), def: true },
        { id: "chart_table", type: "switch", level: 3, label: T("Cada gráfico com versão em tabela", "Every chart has a table version"), def: true },
        { id: "chart_tooltips", type: "switch", level: 3, label: T("Valores ao passar o mouse ou tocar", "Values on hover or tap"), def: true },
        { id: "chart_rules", type: "switch", level: 4, label: T("Poucas cores, contraste e daltonismo validados", "Few colours, checked contrast and colour-blind safety"), def: true }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "i18n", title: T("Idiomas", "Languages"), optional: true,
      fields: [
        { id: "langs", type: "multi", level: 1, label: T("Idiomas do site", "Site languages"), def: [], options: LANGS },
        { id: "fallback", type: "select", level: 2, label: T("Idioma padrão", "Default language"), def: "en", options: LANGS, when: many },
        { id: "translate_first", type: "switch", level: 2, label: T("Traduzir o material antes de construir", "Translate the material before building"), def: true, when: many },
        { id: "autodetect", type: "switch", level: 2, label: T("Detectar o idioma do navegador", "Detect the browser language"), def: true, when: many },
        { id: "switch_keep", type: "switch", level: 3, label: T("Trocar de idioma mantém a página atual", "Switching language keeps the current page"), def: true, when: many },
        { id: "slugs", type: "switch", level: 3, label: T("URLs traduzidas", "Translated URLs"), def: true,
          when: function (v) { return many(v) && v.layout !== "single"; } },
        { id: "one_template", type: "switch", level: 3, label: T("Um template e arquivos de tradução", "One template plus translation files"), def: true, when: many },
        { id: "localise_all", type: "switch", level: 4, label: T("Traduzir textos do JS, números e imagens", "Translate JS text, numbers and images"), def: true, when: many },
        { id: "glossary_terms", type: "area", level: 4, label: T("Termos preferidos", "Preferred terms"), ph: "steak and eggs → bife a cavalo", when: many }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "a11y", title: T("Acessibilidade", "Accessibility"), optional: true, level: 2,
      fields: [
        { id: "a11y", type: "multi", level: 2, label: T("Garantias", "Guarantees"), def: ["nojs", "reduce", "keyboard", "alt", "contrast", "nooverflow", "live"], options: [
          O("nojs", "Sem JavaScript", "Without JavaScript", "todo o conteúdo legível sem JavaScript", "all content readable without JavaScript"),
          O("reduce", "Movimento reduzido", "Reduced motion", "respeito a `prefers-reduced-motion`", "honouring `prefers-reduced-motion`"),
          O("keyboard", "Teclado", "Keyboard", "navegação completa pelo teclado, com foco visível", "full keyboard navigation with visible focus"),
          O("live", "Leitor de tela", "Screen reader", "resultados das interações anunciados com `aria-live`, nada dependendo só de cor", "interaction results announced with `aria-live`, nothing relying on colour alone"),
          O("alt", "Texto alternativo", "Alt text", "texto alternativo em todas as imagens", "alt text on every image"),
          O("contrast", "Contraste AA", "AA contrast", "contraste mínimo WCAG AA", "WCAG AA contrast at minimum"),
          O("nooverflow", "Sem rolagem lateral", "No sideways scroll", "nenhuma rolagem lateral no celular (390 px)", "no sideways scrolling on phones (390 px)"),
          O("print", "Impressão", "Print", "uma folha de estilo para impressão", "a print stylesheet")
        ] }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tech", title: T("Tecnologia e SEO", "Technology and SEO"), optional: true, level: 2,
      fields: [
        { id: "stack", type: "choice", level: 2, label: T("Base", "Stack"), def: "static", options: [
          O("static", "HTML/CSS/JS", "HTML/CSS/JS",
            "HTML, CSS e JavaScript estáticos, sem backend. Um script de build só se for necessário (por exemplo para gerar os idiomas).",
            "Static HTML, CSS and JavaScript, no backend. A build script only if needed (for example to generate the languages)."),
          O("ssg", "Astro ou 11ty", "Astro or 11ty", "Um gerador de site estático (Astro ou 11ty), sem backend.", "A static site generator (Astro or 11ty), no backend."),
          O("islands", "Astro + React", "Astro + React",
            "**Astro** gerando HTML estático, com ilhas React hidratadas só quando ficam visíveis (`client:visible`).",
            "**Astro** generating static HTML, with React islands hydrated only when visible (`client:visible`)."),
          O("agent", "O agente escolhe", "Agent's choice",
            "Escolha uma stack que gere site estático e seja fácil de publicar; justifique no README.",
            "Pick a stack that outputs a static site and is easy to publish; justify it in the README.")
        ] },
        { id: "seo", type: "multi", level: 2, label: T("Busca e compartilhamento", "Search and sharing"), def: ["meta", "canonical", "og", "sitemap", "favicon", "notfound"], options: [
          O("meta", "Título e descrição", "Title and description", "`<title>` e meta description únicos por página e idioma", "a unique `<title>` and meta description per page and language"),
          O("canonical", "Canonical e hreflang", "Canonical and hreflang", "URL canônica absoluta e `hreflang` entre idiomas, com `x-default`", "an absolute canonical URL and `hreflang` between languages, with `x-default`"),
          O("og", "Imagem de compartilhamento", "Share image", "Open Graph e Twitter Card com imagem 1200×630 por idioma, no estilo do site", "Open Graph and Twitter Card with a 1200×630 image per language, in the site's style"),
          O("jsonld", "Dados estruturados", "Structured data", "dados estruturados JSON-LD (schema.org)", "JSON-LD structured data (schema.org)"),
          O("sitemap", "Sitemap e robots", "Sitemap and robots", "`sitemap.xml` gerado no build e `robots.txt` apontando para ele", "a build-generated `sitemap.xml` and a `robots.txt` pointing to it"),
          O("favicon", "Favicon", "Favicon", "favicon", "a favicon"),
          O("notfound", "Página 404", "404 page", "uma página 404 útil, com caminhos de volta", "a helpful 404 page with ways back")
        ] },
        { id: "keywords", type: "text", level: 3, label: T("Termos de busca", "Search terms"), ph: T("fotossíntese, biologia", "photosynthesis, biology") },
        { id: "readme", type: "switch", level: 2, label: T("README: estrutura, edição e publicação", "README: structure, editing and publishing"), def: true },
        { id: "vendor", type: "switch", level: 3, label: T("Bibliotecas e fontes no projeto, sem CDN", "Libraries and fonts in the project, no CDN"), def: true },
        { id: "portable", type: "switch", level: 3, label: T("Roda em qualquer host ou subpasta", "Runs on any host or subfolder"), def: true },
        { id: "build_source", type: "switch", level: 3, label: T("Material lido no build", "Material read at build time"), def: true },
        { id: "components", type: "switch", level: 4, label: T("Componentes genéricos, dados separados do código", "Generic components, data apart from code"), def: true },
        { id: "weight", type: "choice", level: 4, label: T("Peso máximo da página", "Page weight budget"), def: "3", options: [
          O("1", "1 MB", "1 MB"), O("3", "3 MB", "3 MB"), O("free", "Sem limite", "No limit", "", "")
        ] }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "deploy", title: T("Publicação", "Publishing"), optional: true,
      fields: [
        { id: "deploy_now", type: "choice", level: 1, label: T("Publicar", "Publish"), def: "prepare", options: [
          O("prepare", "Só preparar", "Prepare only", "Deixe o site pronto para publicar, mas não publique nada até eu pedir.", "Make the site ready to publish, but do not publish anything until I ask."),
          O("now", "Publicar", "Publish", "Publique o site.", "Publish the site.")
        ] },
        { id: "host", type: "choice", level: 2, label: T("Hospedagem", "Hosting"), def: "ghpages", options: [
          O("ghpages", "GitHub Pages", "GitHub Pages"),
          O("netlify", "Netlify", "Netlify"),
          O("vercel", "Vercel", "Vercel"),
          O("cf", "Cloudflare Pages", "Cloudflare Pages"),
          O("any", "Qualquer", "Any", "qualquer host estático", "any static host")
        ] },
        { id: "repo", type: "text", level: 2, short: true, label: T("Repositório", "Repository"), ph: "my-explainer" },
        { id: "domain", type: "text", level: 2, short: true, label: T("Domínio", "Domain"), ph: "learn.example.com" },
        { id: "visibility", type: "choice", level: 3, label: T("Visibilidade do repositório", "Repository visibility"), def: "public", options: [
          O("public", "Público", "Public", "público", "public"),
          O("private", "Privado", "Private", "privado", "private")
        ] },
        { id: "dns", type: "text", level: 3, short: true, label: T("Provedor de DNS", "DNS provider"), ph: "Cloudflare",
          when: function (v) { return !!String(v.domain || "").trim(); } },
        { id: "domain_log", type: "text", level: 4, short: true, label: T("Registro do DNS", "DNS log file"), ph: "~/dns-records.md",
          when: function (v) { return !!String(v.domain || "").trim(); } },
        { id: "skeleton", type: "switch", level: 2, label: T("Esqueleto no ar antes do conteúdo", "Skeleton live before the content"), def: true,
          when: function (v) { return v.deploy_now === "now"; } },
        { id: "safe_order", type: "switch", level: 2, label: T("Ordem segura de DNS e HTTPS", "Safe DNS and HTTPS order"), def: true,
          when: function (v) { return !!String(v.domain || "").trim(); } },
        { id: "verify_domain", type: "switch", level: 3, label: T("Verificar o domínio no GitHub", "Verify the domain on GitHub"), def: true,
          when: function (v) { return v.host === "ghpages" && !!String(v.domain || "").trim(); } },
        { id: "accounts", type: "switch", level: 3, label: T("Usar só contas já logadas", "Use only signed-in accounts"), def: true }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "analytics", title: T("Analytics", "Analytics"), optional: true,
      fields: [
        { id: "an_tool", type: "choice", level: 1, label: T("Ferramenta", "Tool"), def: "none", options: [
          O("none", "Nenhuma", "None", "", ""),
          O("plausible", "Plausible", "Plausible"),
          O("umami", "Umami", "Umami"),
          O("ga4", "Google Analytics 4", "Google Analytics 4")
        ] },
        { id: "an_questions", type: "multi", level: 2, label: T("O que você quer saber", "What you want to know"),
          when: function (v) { return v.an_tool !== "none"; },
          def: ["read", "drop", "langs", "where"], options: [
            O("read", "Capítulos lidos", "Chapters read", "quais capítulos são realmente lidos", "which chapters are actually read"),
            O("drop", "Onde param", "Where they stop", "onde as pessoas param de ler", "where people stop reading"),
            O("end", "Quem chega ao fim", "Who reaches the end", "quantos chegam ao fim", "how many reach the end"),
            O("langs", "Idiomas", "Languages", "em que idioma leem", "which language they read in"),
            O("switch", "Trocas de idioma", "Language switches", "de que idioma para qual trocam", "which language they switch from and to"),
            O("where", "De onde vêm", "Where they come from", "de que países e sites vêm", "which countries and sites they come from"),
            O("quiz", "Respostas de quiz", "Quiz answers", "como respondem aos quizzes", "how they answer the quizzes"),
            O("out", "Links externos", "Outbound links", "em quais links externos clicam", "which outbound links they click")
          ] },
        { id: "an_id", type: "text", level: 2, short: true, label: T("ID existente", "Existing ID"), ph: "G-XXXXXXXXXX",
          when: function (v) { return v.an_tool !== "none"; } },
        { id: "an_tz", type: "text", level: 4, short: true, label: T("Fuso e moeda", "Time zone and currency"), ph: "America/Sao_Paulo · BRL",
          when: function (v) { return v.an_tool === "ga4"; } },
        { id: "an_consent", type: "switch", level: 2, label: T("Consentimento antes de cookies", "Consent before cookies"), def: true,
          when: function (v) { return v.an_tool !== "none"; } },
        { id: "an_prod_only", type: "switch", level: 3, label: T("Medir só em produção", "Measure production only"), def: true,
          when: function (v) { return v.an_tool !== "none"; } },
        { id: "an_dashboard", type: "switch", level: 3, label: T("Configurar o painel", "Set up the dashboard"), def: true,
          when: function (v) { return v.an_tool !== "none"; } },
        { id: "an_verify", type: "switch", level: 3, label: T("Confirmar eventos com o site no ar", "Confirm events on the live site"), def: true,
          when: function (v) { return v.an_tool !== "none"; } }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "qa", title: T("Testes", "Testing"), optional: true, level: 2,
      fields: [
        { id: "qa_checks", type: "multi", level: 3, label: T("Verificar", "Check"), def: ["sizes", "resize", "nojs", "reduce", "console", "nav", "interactions", "links", "langs"], options: [
          O("sizes", "Celular e tablet", "Phone and tablet", "larguras de celular, tablet e desktop", "phone, tablet and desktop widths"),
          O("resize", "Redimensionar e zoom", "Resize and zoom", "depois de redimensionar a janela e dar zoom", "after resizing the window and zooming"),
          O("nojs", "Sem JavaScript", "Without JavaScript", "com JavaScript desligado", "with JavaScript off"),
          O("reduce", "Movimento reduzido", "Reduced motion", "com movimento reduzido", "with reduced motion"),
          O("console", "Console", "Console", "console sem erros", "no console errors"),
          O("nav", "Menu e âncoras", "Menu and anchors", "cada link do menu chega à seção certa e o item ativo bate com o que está na tela", "every menu link lands on the right section and the active item matches what is on screen"),
          O("interactions", "Interações", "Interactions", "cada interação clicada como um leitor faria, conferindo o resultado", "every interaction clicked as a reader would, checking the result"),
          O("links", "Links", "Links", "nenhum link interno ou externo quebrado", "no broken internal or external links"),
          O("langs", "Troca de idioma", "Language switching", "troca e detecção de idioma", "language switching and detection"),
          O("lighthouse", "Lighthouse", "Lighthouse", "Lighthouse ≥ 90 em performance, SEO e boas práticas", "Lighthouse ≥ 90 for performance, SEO and best practices"),
          O("axe", "axe", "axe", "axe sem violações sérias", "axe with no serious violations"),
          O("shots", "Capturas de tela", "Screenshots", "revisão visual por capturas de tela de cada seção", "a visual review from screenshots of every section")
        ] },
        { id: "qa_auto", type: "switch", level: 2, label: T("Testes num navegador real", "Tests in a real browser"), def: true },
        { id: "qa_in_repo", type: "switch", level: 2, label: T("Testes no repositório e no CI", "Tests in the repo and CI"), def: true },
        { id: "qa_phone", type: "switch", level: 2, label: T("Eu testo no meu celular antes do fim", "I test on my phone before sign-off"), def: true },
        { id: "qa_done", type: "area", level: 4, label: T("Mais critérios de pronto", "More done criteria"), ph: T("Carrega em menos de 2 s no 4G", "Loads in under 2 s on 4G") }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "process", title: T("Forma de trabalho", "Way of working"),
      fields: [
        { id: "ask", type: "choice", level: 1, label: T("Perguntas", "Questions"), def: "plan", options: [
          O("plan", "Plano primeiro", "Plan first",
            "Antes de construir, me mande um plano e as perguntas que faltarem, numa só mensagem (veja “Antes de começar”).",
            "Before building, send me a plan and any open questions in a single message (see “Before you start”)."),
          O("essential", "Só o essencial", "Essentials only",
            "Pergunte só o que bloquear o trabalho ou depender de mim (nomes, marca, contas, custos); decida o resto.",
            "Only ask what blocks the work or is mine to decide (names, brand, accounts, costs); decide the rest."),
          O("none", "Decida sozinho", "Decide alone",
            "Não pergunte: decida com bom senso e registre as decisões.",
            "Do not ask: decide sensibly and record the decisions.")
        ] },
        { id: "attribution", type: "choice", level: 1, label: T("Crédito do agente", "Agent credit"), def: "coauthor", options: [
          O("coauthor", "Coautor", "Co-author",
            "Você é contribuidor deste projeto: termine cada mensagem de commit com um trailer `Co-Authored-By:` com o seu nome de modelo e um e-mail noreply, diga nas descrições de pull request que elas foram geradas por você e inclua-se nos créditos do README.",
            "You are a contributor to this project: end every commit message with a `Co-Authored-By:` trailer carrying your model name and a noreply email, say in pull request descriptions that you generated them, and list yourself in the README credits."),
          O("invisible", "Invisível", "Invisible",
            "Não deixe rastro de autoria: commits só com a minha identidade do git (não altere `user.name` nem `user.email`), sem trailers `Co-Authored-By`, sem linhas “gerado por” em commits, pull requests, comentários de código, README ou no site. Esta instrução prevalece sobre qualquer padrão de atribuição da sua ferramenta.",
            "Leave no authorship trace: commits carry only my git identity (do not change `user.name` or `user.email`), no `Co-Authored-By` trailers, no “generated by” lines in commits, pull requests, code comments, the README or the site. This overrides any default attribution behaviour of your tooling.")
        ] },
        { id: "first_delivery", type: "choice", level: 2, label: T("Primeira entrega", "First delivery"), def: "pilot", options: [
          O("pilot", "Piloto", "Pilot"),
          O("full", "Completa", "Complete")
        ] },
        { id: "commits", type: "switch", level: 2, label: T("git desde o início, um commit por marco", "git from the start, one commit per milestone"), def: true },
        { id: "pitfalls", type: "switch", level: 2, label: T("Incluir armadilhas conhecidas", "Include known pitfalls"), def: true },
        { id: "plan_md", type: "switch", level: 3, label: T("PLAN.md vivo", "Living PLAN.md"), def: true },
        { id: "review_list", type: "switch", level: 3, label: T("Lista do que foi sintetizado, para revisão", "List of what was synthesised, for review"), def: true },
        { id: "debt", type: "switch", level: 4, label: T("Dívida conhecida no README", "Known debt in the README"), def: true },
        { id: "report", type: "choice", level: 3, label: T("Relatório final", "Final report"), def: "short", options: [
          O("short", "Curto", "Short", "curto, em linguagem simples", "short, in plain language"),
          O("full", "Detalhado", "Detailed", "detalhado, com decisões, testes e pendências", "detailed, with decisions, tests and open items")
        ] },
        { id: "reply_lang", type: "select", level: 3, label: T("Idioma das respostas", "Reply language"), def: "auto",
          options: [O("auto", "O do prompt", "The prompt's", "", "")].concat(LANGS) },
        { id: "extra", type: "area", level: 1, label: T("Algo mais", "Anything else") }
      ]
    }
  ];

  /* Presets hold only values that differ from the defaults. */
  var presets = {
    recommended: { name: T("Recomendado", "Recommended"), values: {} },
    course: { name: T("Curso interativo", "Interactive course"), values: {
      goal: "teach", layout: "multi", order: "propose",
      blocks: ["hero", "menu", "progress", "journey", "summary", "glossary", "fulltext", "readtime", "refs", "credits"],
      chapter_parts: ["hook", "concept", "interaction", "example", "quiz"],
      interactions: ["quiz", "sort", "stepper", "beforeafter", "sliders", "cards", "scenario", "failure", "timeline", "explorer", "diagram", "compare"],
      aids: ["done", "tracks", "templates", "plan", "self"],
      tone: "editorial", effects: ["kinetic", "reveal", "smooth", "grain", "chartanim"]
    } },
    light: { name: T("Leitura leve", "Light read"), values: {
      style: "editorial", anim: "calm", effects: ["smooth", "reveal"], libs: "vanilla",
      blocks: ["hero", "menu", "summary", "credits"], interactions: ["quiz", "cards"], density: "1",
      weight: "1", ask: "essential"
    } },
    showpiece: { name: T("Vitrine", "Showpiece"), values: {
      style: "cinematic", anim: "showpiece",
      effects: ["kinetic", "pinned", "horizontal", "parallax", "smooth", "reveal", "grain", "particles", "scene3d", "themes", "chartanim"],
      blocks: ["hero", "menu", "progress", "journey", "timeline", "map", "refs", "cases", "faq", "summary", "credits", "top"]
    } }
  };

  return { version: 1, uiLanguages: ["pt", "en"], levels: levels, sections: sections, presets: presets };
});
