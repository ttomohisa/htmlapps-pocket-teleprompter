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
9. While paused, the native Reading position range seeks to a clamped fraction of the current scroll endpoint without resetting elapsed time. Manual paused scroll and seek recalculate pace, then update displays; 100% enters the existing finish flow.
10. The runtime caches normalized progress before reflow. Resize measures the new endpoint, restores that progress, then recalculates pace and displays; geometry guards in frame/scroll/seek/pause/resume paths prevent an early native scroll clamp from replacing the cache. Speed mode is still `36 * speed`; target mode keeps the `max(5, duration - elapsed)` floor.
11. Startup owns a generation token across Fullscreen/countdown awaits and its layout callback. Closing invalidates those callbacks. Position controls remain hidden and disabled while starting, playing, closed or finished. Input controls and composition events retain their native keyboard behavior.

## Progressive browser capabilities

- Screen Wake Lock is requested only while the reader is active and the setting is enabled.
- Fullscreen is optional. Failure never blocks the fixed reader view.
- Core editing and scrolling do not depend on either capability.

## Persistence

The script and preferences are serialized to localStorage when available. Storage failure is tolerated; the current session remains usable.

## Local text files

The editor reads explicitly selected `.txt` files through `File.arrayBuffer` and a fatal UTF-8 `TextDecoder`, rejecting files over 1 MiB, malformed text, NUL bytes, and blank scripts. BOM is stripped and CRLF/CR becomes textarea LF. Text is assigned through `value`/`textContent`, never HTML. An import generation protects both delayed reads and replacement confirmation from newer selections, editor edits, Clear, or reader start. Downloads use a temporary `text/plain;charset=utf-8` Blob URL and revoke it after initiating the download. Download filenames are limited to 240 UTF-8 bytes including the extension, without splitting code points. Filenames are session-only; the existing localStorage schema is unchanged.

`node --test tests/*.test.cjs` executes the real inline runtime in a deterministic DOM/file fixture and checks the generated variants. `scripts/check-repository.ps1` builds both variants and the identical root `pocket-teleprompter.html` download and runs the tests. Node.js 24 is used in CI; runtime HTML has no Node dependency.

## Build placeholders

`src/index.template.html` contains exactly one of each:

- `__APP_CONFIG_JSON__`
- `__BUILD_MANIFEST_JSON__`
- `__EMBEDDED_ASSET_BUNDLE_BASE64__`

## Navigation verification limits

The navigation tests execute the real inline runtime with synthetic DOM, scroll geometry, event delivery and timers. They cover seeking, pause/resume, finish/restart, target pacing, resize and interrupted startup, but do not verify real browser layout, native range keyboard behavior, touch scrolling, fullscreen or Wake Lock. Use `VERIFY_OFFLINE.md` for the separate browser/device checklist.
