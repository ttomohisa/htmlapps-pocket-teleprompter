# Architecture

Pocket Teleprompter follows the `htmlapps-template` repository model.

```text
app.config.json
APP_SPEC.md
dependencies.json
src/index.template.html
build-standalone.ps1
scripts/build-self-extract.ps1
scripts/verify-standalone.ps1
scripts/check-repository.ps1
dist/index.html
dist/index.self-extract.html
```

## Runtime

The release is one HTML document. Script editing, reader UI, pace calculations, local persistence, translations, dialogs, Wake Lock integration, and Fullscreen integration are inline. No third-party package is currently embedded.

The CSP blocks runtime network connections with `connect-src 'none'`.

## Reader pipeline

1. The user edits a script and chooses display / pace settings.
2. Starting the reader copies the script into a fixed presentation surface.
3. The rendered text height is measured after layout.
4. The reader calculates the scroll endpoint so the last line reaches the eye-line guide rather than scrolling through the trailing padding.
5. Speed mode uses a direct pixels-per-second multiplier.
6. Target-time mode calculates a rate from remaining scroll distance and remaining target time.
7. `requestAnimationFrame` advances the scroll only while playback is active.
8. Elapsed time, estimated remaining time, and progress are updated from the same scroll state.

## Progressive browser capabilities

- Screen Wake Lock is requested only while the reader is active and the setting is enabled.
- Fullscreen is optional. Failure never blocks the fixed reader view.
- Core editing and scrolling do not depend on either capability.

## Persistence

The script and preferences are serialized to localStorage when available. Storage failure is tolerated; the current session remains usable.

## Build placeholders

`src/index.template.html` contains exactly one of each:

- `__APP_CONFIG_JSON__`
- `__BUILD_MANIFEST_JSON__`
- `__EMBEDDED_ASSET_BUNDLE_BASE64__`
