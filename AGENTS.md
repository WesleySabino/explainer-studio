# AGENTS.md

Guidance for coding agents working on this repository. Human contributors: see `CONTRIBUTING.md`.

## What this is

Explainer Studio turns form answers into a Markdown prompt that another agent uses to build an explainer website from source material. The browser UI and the CLI share one pure builder.

## Map

- `src/schema.js`: data only (levels, sections, fields, options, presets). Each text is `{ pt, en }`; each option has `label` (shown in the form) and `say` (phrase used in the prompt).
- `src/core.js`: `normalize(raw)` → valid state; `fieldVisible(state, field)`; `build(state)` → Markdown. No DOM.
- `src/i18n.js`: interface strings.
- `src/app.js`: DOM rendering, persistence (`localStorage` key `explainer-studio:v1`), preview, menu, mobile sheet.
- `bin/explainer-studio.js`: CLI. `--fields` prints every field id, type, level and option.
- `test/core.test.js`: the suite.

## Commands

```sh
npm test                                   # must pass before you finish
npm start                                  # serves the repo at http://localhost:4173
node bin/explainer-studio.js --preset course --level 3 --lang pt   # generate a prompt
node bin/explainer-studio.js --fields                 # discover field ids before writing an answers file
```

## Rules

- No runtime or dev dependencies, no build step, no ES modules in `src/` (they break `file://`). Keep the UMD wrapper.
- Every user-visible text exists in both `pt` and `en`. Run the tests to find gaps.
- Read field values in `build()` only through the helpers (`v`, `on`, `str`, `say`, `says`, `picked`, `has`): they apply level, section switches and `when` conditions. Reading `A[id]` directly is only for facts that intentionally ignore visibility.
- Field ids are a public format (answers files, CLI `--set`). Do not rename or remove one without a migration in `normalize()` and a CHANGELOG entry.
- The UI has no helper text, taglines or secondary labels. Fix unclear questions through the label, the options or the layout.
- Keep generated Markdown clean: no empty bullets, no runs of blank lines, sequential section numbers. The tests check this for every preset × level × language.

## Verifying UI changes

Tests cover the builder, not the DOM. After touching `index.html`, `src/app.js` or `src/style.css`, load the page in a real browser, check the console for errors, and look at it at 1440 px, about 1100 px and 390 px wide, in light and dark mode. Headless Chrome works:

```sh
npm start &
google-chrome --headless=new --window-size=390,844 --screenshot=phone.png http://localhost:4173/
```
