/* Explainer Studio · interface strings. Every key must exist in every language (the tests check it). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EXPLAINER_UI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
    pt: {
      description: "Gere o prompt que transforma qualquer material num site explicativo, para entregar a um agente de código.",
      level: "Nível de detalhe",
      preset: "Ponto de partida",
      custom: "Personalizado",
      uiLang: "Idioma da interface",
      promptLang: "Idioma do prompt",
      more: "Mais opções",
      exportAnswers: "Exportar respostas",
      importAnswers: "Importar respostas",
      reset: "Recomeçar",
      sections: "Seções",
      include: "Incluir no prompt",
      why: "Porquês",
      copy: "Copiar prompt",
      copied: "Copiado",
      download: "Baixar .md",
      prompt: "Prompt",
      close: "Fechar",
      tokens: "tokens",
      undo: "Desfazer",
      resetDone: "Formulário recomeçado",
      presetDone: "Ponto de partida aplicado",
      imported: "Respostas importadas",
      importFailed: "Arquivo de respostas inválido",
      copyFailed: "Não foi possível copiar; selecione o texto",
      noscript: "O Explainer Studio precisa de JavaScript ativado."
    },
    en: {
      description: "Generate the prompt that turns any material into an explainer website, ready to hand to a coding agent.",
      level: "Level of detail",
      preset: "Starting point",
      custom: "Custom",
      uiLang: "Interface language",
      promptLang: "Prompt language",
      more: "More options",
      exportAnswers: "Export answers",
      importAnswers: "Import answers",
      reset: "Start over",
      sections: "Sections",
      include: "Include in the prompt",
      why: "Rationale",
      copy: "Copy prompt",
      copied: "Copied",
      download: "Download .md",
      prompt: "Prompt",
      close: "Close",
      tokens: "tokens",
      undo: "Undo",
      resetDone: "Form reset",
      presetDone: "Starting point applied",
      imported: "Answers imported",
      importFailed: "Invalid answers file",
      copyFailed: "Couldn't copy; select the text instead",
      noscript: "Explainer Studio needs JavaScript enabled."
    }
  };
});
