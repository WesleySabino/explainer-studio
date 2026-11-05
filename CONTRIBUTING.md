# Contributing

Thanks for helping. Explainer Studio is small on purpose: no dependencies, no build step, one schema that drives both the form and the prompt.

## Setup

```sh
npm test     # Node 18+; nothing to install
npm start    # http://localhost:4173
```

## What makes a good change

- **Prompt rules come from real projects.** If you add a rule or a pitfall, say in the PR what went wrong without it. Write it as an instruction the agent can act on, and add a short rationale (`why(...)`) when the reason isn't obvious.
- **Every text exists in Portuguese and English.** The tests fail otherwise.
- **The interface stays quiet.** Labels and options, no helper text, taglines or secondary labels. If a question needs an explanation to make sense, rephrase the label or the options instead. Explanations belong in the prompt's rationale.
- **No dependencies and no build.** Browser files are classic scripts with a UMD wrapper so `index.html` keeps working from `file://` and Node can `require()` them.
- **The builder stays pure.** `src/core.js` never touches the DOM; the UI and the CLI both call `build(state)`.

## Pull requests

1. Keep each PR to one topic.
2. Run `npm test`.
3. If you touched the interface, check it in a browser at phone width and in both light and dark mode.
4. Add a line to `CHANGELOG.md` under "Unreleased".

## Reporting bugs

Attach an exported answers file (⋯ → Export answers) when the problem is in the generated prompt; it reproduces your exact state.

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE) and that you'll follow the [Code of Conduct](CODE_OF_CONDUCT.md).
