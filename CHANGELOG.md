# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Multi-layer background rendering from level JSON (`backgroundLayers`) with per-layer parallax/scale/offset.
- Decor pipeline (`decor`) for non-colliding depth-aware visuals with per-item texture/parallax/layer controls.
- Level manifest support (`public/levels/manifest.json`) with runtime level switching and level metadata overlay.
- New demo map: `public/levels/demo-decor.json`.
- ESLint 9 flat config (`eslint.config.js`) and `lint:fix` script.
- Structured documentation hub under `docs/`:
  - `docs/ai/`
  - `docs/plans/`
  - `docs/architecture/`

### Changed

- Camera supports optional vertical follow + Y clamping via per-level camera config.
- Goals are read from WASM getters in the render loop instead of mirrored JS refs.
- README and AI docs now cross-link to the new docs layout.
