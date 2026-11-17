# Features and roadmap

This document tracks the features available in Explainer Studio and the next features planned for development. The current inventory was reviewed against the implementation on November 16, 2026.

Checked items (`[x]`) are implemented. Unchecked items (`[ ]`) are planned and have not been implemented. Planned work is listed in priority order; no delivery dates are assigned.

Explainer Studio generates a Markdown prompt for a separate coding agent. In the website requirements section, a checked item means the tool can include that requirement in its prompt. Building, translating, testing, publishing, and configuring analytics for the resulting website are tasks for that agent.

## Contents

- [Application features](#application-features)
- [Website requirements](#website-requirements)
- [Generated prompt behavior](#generated-prompt-behavior)
- [Command-line features](#command-line-features)
- [Project infrastructure](#project-infrastructure)
- [Planned features](#planned-features)
- [Maintaining this document](#maintaining-this-document)

## Application features

Implemented in [the browser application](../src/app.js), [the interface](../index.html), and [the stylesheet](../src/style.css).

- [x] Generate a structured Markdown prompt from form answers.
- [x] Offer four detail levels: Essential, Balanced, Detailed, and Complete.
- [x] Offer four starting presets: Recommended, Interactive course, Light read, and Showpiece.
- [x] Save personal starting points from the current answers, choosing any of four groups: branding, languages, accessibility, and development (technology, publishing, analytics, testing, and way-of-working preferences).
- [x] List personal starting points beside the built-in presets; choosing one applies all its saved groups.
- [x] Apply only selected groups of a personal starting point from the My starting points dialog.
- [x] Keep project-specific answers (material, site name, audience, goal, structure, teaching, chapters, repository, domain, analytics ID, and free-form requests) when applying a personal starting point.
- [x] Remember whether the optional sections owned by a group were switched off.
- [x] Overwrite a personal starting point by saving under the same name, delete one with undo, and export or import one as a JSON file.
- [x] Update the prompt preview whenever answers change.
- [x] Highlight newly changed preview lines and scroll relevant changes into view.
- [x] Display an approximate token count.
- [x] Optionally include the rationale behind supported prompt rules.
- [x] Provide the interface in English and Portuguese.
- [x] Choose the initial interface language from the browser preference and remember later choices.
- [x] Generate prompts in English or Portuguese, with an independent prompt-language control.
- [x] Reveal questions according to the chosen detail level and relevant answers.
- [x] Allow optional sections to be excluded from the prompt.
- [x] Provide section jump links and indicate the currently viewed section.
- [x] Automatically save and restore the current configuration in browser storage.
- [x] Export answers as a JSON file compatible with the CLI.
- [x] Import a JSON answers file, with feedback for invalid input.
- [x] Reset the form to its defaults.
- [x] Offer a temporary undo action after resetting, importing, or applying a preset.
- [x] Copy the prompt to the clipboard, with a fallback for browsers without the modern clipboard API.
- [x] Download the prompt as Markdown, using the website name in the filename when provided.
- [x] Provide a responsive desktop layout with the form and preview side by side.
- [x] Provide a mobile prompt panel with open/close controls and focus handling.
- [x] Follow the system preference for light or dark appearance.
- [x] Support keyboard controls, visible focus, screen-reader labels, and status announcements.
- [x] Reduce interface animation when reduced motion is requested.
- [x] Process answers locally without an account, backend, or external submission of answers.
- [x] Run from downloaded files through `index.html`, including `file://`, with JavaScript enabled.
- [x] Require no runtime dependencies, development dependencies, or build step.

## Website requirements

The [configuration schema](../src/schema.js) contains **96 fields across 13 sections**. Each checkbox below corresponds to one configurable field; a field can offer several choices. Availability depends on the detail level, enabled sections, and related answers.

### 1. Source material

- [x] Source type: slides, document/article, book, technical documentation, lecture/video transcript, notes, or several files.
- [x] Source location or path.
- [x] Author attribution.
- [x] Source language: automatic detection, Portuguese, English, Spanish, French, German, or Italian.
- [x] Author links for credits.
- [x] Content fidelity: follow faithfully, condense, or expand with identified outside material.
- [x] Publishing-rights status: owned content, permission obtained, or not yet confirmed.
- [x] Third-party image policy: use and list, replace, or exclude.
- [x] Label synthesized content and illustrative figures or examples.
- [x] Verify and link cited references.
- [x] Extract and optimize images from the material.
- [x] Keep the original source file out of the repository.

### 2. Goal and audience

- [x] Website name.
- [x] Intended audience.
- [x] Main goal: teach, persuade, serve as a reference, or showcase work.
- [x] Explicit outcomes describing what readers should be able to do afterwards.
- [x] Tone: follow the material, warm, editorial, or technical.
- [x] Device priority: phone, desktop, or both equally.
- [x] Assumed prior knowledge.

### 3. Structure

- [x] Format: single page, several pages, or chosen according to the material's length.
- [x] Content blocks: hero, chapter index, progress indicator, journey map, timeline, geographical map, sources, cases/testimonials, FAQ, key points, glossary, collapsible full text, reading time, credits, and back-to-top navigation.
- [x] Chapter organization: source order, thematic order, or an agent-proposed outline for approval.
- [x] Requested number of chapters.

### 4. Teaching and interactions

- [x] Chapter components: hook, concept, central interaction, concrete example, and short quiz.
- [x] Interaction repertoire: quiz, sorting/classification, step-by-step simulator, before/after comparison, calculator, explanatory cards, branching scenario, failure simulation, checklist plan, filterable explorer, clickable diagram, and comparator.
- [x] Interaction density: one to four interactions per chapter, besides a quiz when selected.
- [x] Study aids: saved chapter completion, learning paths, copyable templates, study plans, and self-assessments.
- [x] Clear instructions explaining what an interaction demonstrates, what to do, and where to find the result.
- [x] Quiz feedback explaining why each alternative is right or wrong.
- [x] Browser persistence for reader progress, answers, plans, and checklists.

### 5. Look and motion

- [x] Visual style: cinematic, light editorial, minimal, playful, or technical.
- [x] Motion intensity: calm, balanced, or showpiece.
- [x] Visual identity: reuse the material's identity or create a new one.
- [x] Effects: kinetic typography, pinned scenes, horizontal scrolling, parallax, smooth scrolling, text reveals, film grain, particles, a 3D scene, chapter color changes, and animated charts.
- [x] Animation implementation preference: established libraries or plain CSS and JavaScript.
- [x] Required color palette.
- [x] Preferred fonts.
- [x] Visual references and inspiration links.

### 6. Data and charts

- [x] Rebuild source tables and charts as native SVG/HTML charts using the source's exact figures.
- [x] Provide accessible table alternatives for charts.
- [x] Show values on hover or tap.
- [x] Apply chart rules covering meaningful colors, contrast, and color-blind distinguishability.

### 7. Languages

- [x] Website languages: Portuguese, English, Spanish, French, German, and Italian.
- [x] Default language for a multilingual website.
- [x] Translate source material before building the multilingual website.
- [x] Detect the visitor's browser language while respecting saved choices and direct links.
- [x] Keep the equivalent page when switching languages and remember the choice.
- [x] Translate page URLs.
- [x] Generate language versions from one template and translation files, checking for missing translations.
- [x] Localize JavaScript text, number formats, and sharing images.
- [x] Specify preferred translated terminology.

### 8. Accessibility

- [x] Select accessibility requirements: readable content without JavaScript, reduced motion, keyboard navigation with visible focus, screen-reader announcements, image alt text, WCAG AA contrast, no sideways scrolling on phones, and print styling.

### 9. Technology and SEO

- [x] Stack preference: static HTML/CSS/JavaScript, Astro or Eleventy, Astro with React islands, or an agent-selected static stack.
- [x] Search and sharing features: titles/descriptions, canonical URLs and multilingual `hreflang`, sharing images, structured data, sitemap/robots files, favicon, and a helpful 404 page.
- [x] Search keywords.
- [x] README instructions covering project structure, content editing, and publishing.
- [x] Bundle libraries and fonts locally instead of loading them from a CDN.
- [x] Support deployment on different static hosts and under subfolders.
- [x] Process source material at build time.
- [x] Separate content data from reusable components.
- [x] Page-weight budget: 1 MB, 3 MB, or no explicit limit.

### 10. Publishing

- [x] Delivery scope: prepare for publication or publish the website.
- [x] Hosting preference: GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static host.
- [x] Target repository.
- [x] Custom domain.
- [x] Repository visibility: public or private.
- [x] DNS provider.
- [x] DNS log file location.
- [x] Publish a website skeleton before completing its content.
- [x] Follow an ordered DNS and HTTPS setup process.
- [x] Verify a custom domain on GitHub.
- [x] Use existing signed-in accounts for account-related work.

### 11. Analytics

- [x] Analytics choice: none, Plausible, Umami, or Google Analytics 4.
- [x] Measurement goals: chapters read, abandonment points, completion, language use, language switches, visitor origins, quiz answers, and outbound links.
- [x] Existing analytics identifier.
- [x] GA4 property time zone and currency.
- [x] Consent handling before cookies are used.
- [x] Measure production traffic only.
- [x] Configure an analytics dashboard.
- [x] Verify that events arrive from the live website.

### 12. Testing

- [x] Verification scope: phone/tablet/desktop widths, resizing/zoom, JavaScript disabled, reduced motion, console errors, navigation/anchors, interactions, links, language switching, Lighthouse, axe, and screenshots.
- [x] Repeatable automated tests in a real browser.
- [x] Store tests in the repository and run them in CI.
- [x] Ask the owner to test the website on a phone before sign-off.
- [x] Add custom completion criteria.

### 13. Way of working

- [x] Question policy: plan first, ask only essential questions, or decide autonomously.
- [x] Agent attribution: co-author credit or no agent-authorship markers.
- [x] First delivery: a pilot with the hero and one complete chapter, or the complete website.
- [x] Use Git from the start and commit at milestones.
- [x] Include guidance about known implementation pitfalls.
- [x] Maintain a living `PLAN.md`.
- [x] Deliver a review list of synthesized, simplified, or illustrative content.
- [x] Document known technical debt in the README.
- [x] Final report: short or detailed.
- [x] Agent reply language: match the prompt, or use Portuguese, English, Spanish, French, German, or Italian.
- [x] Add free-form instructions beyond the structured options.

## Generated prompt behavior

Implemented in [the shared builder](../src/core.js).

- [x] Use the same field visibility rules in the form and prompt generation.
- [x] Normalize missing or invalid values and combine explicit answers with preset values and defaults.
- [x] Generate clean Markdown with sequential section numbers and no empty bullets or repeated blank lines.
- [x] Include a configuration-specific definition-of-done checklist when the testing section is enabled.
- [x] Describe delivery milestones inside the generated prompt.
- [x] Request four to six verifiable learning outcomes when teaching is selected, no outcomes are supplied, and the detail level supports them.
- [x] Adapt language instructions and language-switching tests to single-language or multilingual websites.
- [x] Exclude pinned scenes and horizontal-scrolling effects from the output when calm motion is selected.
- [x] Mention full-text generation only when the Full text block is selected.
- [x] Include relevant implementation guidance for scrolling/resizing, animated accents, localization, DNS, GitHub Pages workflows, analytics, fixed elements, and tool-version consistency.
- [x] Expose shared generation, state, visibility, and text-statistics functions to browser and Node consumers.

## Command-line features

Implemented in [the CLI](../bin/explainer-studio.js).

- [x] Generate a prompt without opening the browser.
- [x] Read the same JSON answers format exported by the application.
- [x] Select a preset with `--preset`.
- [x] Select a detail level with `--level`.
- [x] Select the prompt language with `--lang`.
- [x] Include rule explanations with `--why`.
- [x] Exclude optional sections with `--off`.
- [x] Override individual answers using repeatable `--set id=value` arguments, including lists and booleans.
- [x] Apply an exported personal starting point with `--personal`, optionally limited to some groups with `--groups`.
- [x] Print the prompt to standard output or save it with `--out`.
- [x] List field IDs, types, levels, defaults, and options with `--fields`.
- [x] Show command usage with `--help` or `-h`.
- [x] Report invalid arguments, unknown fields/options, and unreadable input files.
- [x] Expose the `explainer-studio` command after linking or installing the package.

## Project infrastructure

See [the tests](../test/core.test.js), [CI workflow](../.github/workflows/ci.yml), and [contribution guide](../CONTRIBUTING.md).

- [x] Share one pure prompt builder between the browser and CLI.
- [x] Use a data-driven schema with English and Portuguese labels and prompt phrases.
- [x] Provide a local development server through `npm start`.
- [x] Include automated tests for schema integrity, translations, defaults, presets, normalization, visibility, Markdown output, attribution, and CLI behavior.
- [x] Configure CI to test on Node 18, 20, 22, and 24.
- [x] Configure GitHub Pages publication after successful tests on `main`, including manual workflow runs.
- [x] Support serving the application directly from a static host.
- [x] Bundle fonts locally with their license files.
- [x] Provide English and Portuguese READMEs.
- [x] Include contribution guidance, coding-agent instructions, issue/PR templates, a changelog, and a code of conduct.
- [x] Publish the source under the MIT license.

## Planned features

The following ten features extend the existing application. Effort estimates are relative and assume the current browser-based architecture. The first three are the initial priorities.

- [ ] **1. Prompt consistency checker — Medium effort.** Detect conflicting instructions, missing essentials, and unresolved choices. Explain each finding and offer a correction, such as reconciling autonomous work with an approval-dependent milestone. Build on existing normalization and visibility rules with checks across related fields.

- [ ] **2. Saved projects and version history — Medium effort.** Name, duplicate, and switch between projects; save and restore earlier versions; compare answer and prompt changes. Extend the current single saved configuration and temporary undo with persistent project history.

- [ ] **3. Chapter planner — Medium effort.** Create and reorder named chapters, assigning each a learning objective, source section, interaction, and quiz. Include this chapter-specific plan in exported answers and the generated prompt. Extend the existing chapter-count, ordering, and general teaching controls.

- [ ] **4. Interactive examples gallery — Medium effort.** Provide playable examples of the available interaction types so users can try a calculator, branching scenario, comparison, or other activity before selecting it. Connect examples to the existing interaction choices.

- [ ] **5. Website blueprint preview — Medium to large effort.** Show a schematic of the proposed website's opening, navigation, chapters, activities, and references. Update it as structural choices change and incorporate chapter-planner details when available. Keep it clearly identified as a planning preview.

- [x] **6. Reusable personal presets — Small to medium effort.** Save preferred branding, languages, accessibility requirements, and development choices. Apply selected groups of settings while preserving project-specific answers. Extend the four built-in presets with user-created presets.

- [ ] **7. Source organizer — Medium effort.** Maintain multiple source records with titles, authors, locations, relevant pages or sections, and chapter assignments. Export a source manifest alongside the prompt. Extend the existing source-type and location fields with structured records for individual sources.

- [ ] **8. Separate prompts for each stage — Medium effort.** Export focused prompts for planning, the pilot chapter, remaining chapters, review, and publication. Carry shared project requirements and relevant prior decisions into each stage. Extend the milestone instructions already included in the single generated prompt.

- [ ] **9. Review and revision mode — Medium effort.** Record feedback against chapters or requirements and turn selected feedback into a focused revision prompt. Save review notes with the project so the tool remains useful after the first website is built.

- [ ] **10. Requirement checklist export and evidence tracking — Small to medium effort.** Export a standalone checklist derived from the selected requirements and record completion, evidence, and review results. Extend the definition-of-done checklist already generated inside the prompt.

## Maintaining this document

When a planned feature ships, document its actual behavior in the appropriate implemented section and mark its roadmap entry as complete. If only part ships, keep the remaining scope unchecked and describe the delivered portion precisely. Update this inventory when configuration fields or supported options change, and record release changes in the [changelog](../CHANGELOG.md).

Future work should preserve local processing of answers, English/Portuguese interface coverage, the dependency-free application, and shared browser/CLI generation. Evolve the saved-answer format through compatible migrations when needed.
