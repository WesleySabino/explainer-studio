# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Single-language sites no longer get a language-switching test.
- Reading the material at build time only mentions the full text when the Full text block is chosen.

## [1.0.0] - 2026-11-04

### Added

- Form with four levels of detail, thirteen sections and live Markdown preview.
- Prompt in Portuguese or English, independent of the interface language.
- Optional rationale for each rule.
- Agent credit option: co-author or invisible.
- Starting points: Recommended, Interactive course, Light read, Showpiece.
- Export and import of answers as JSON; undo for reset, preset and import.
- CLI (`bin/explainer-studio.js`) sharing the browser's builder.
- Light and dark themes, keyboard and screen-reader support, mobile bottom sheet.
- Test suite with `node:test`.
