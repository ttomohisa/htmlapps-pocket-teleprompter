# APP_SPEC.md

## 1. Product identity

- **Name:** Pocket Teleprompter
- **Version:** 1.0.0
- **Purpose:** Turn a smartphone or browser window into an installation-free teleprompter for speeches, video recording, interviews, presentations, and rehearsal.
- **Primary users:** Smartphone users who need a teleprompter occasionally and do not want to install an app or upload a script.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Core outcome

A user can paste a script, tune the reading experience, start a distraction-free prompter, pause/resume with a tap, and keep the script entirely on the device.

## 3. Core flow

1. Open the page.
2. Paste or type a script.
3. Adjust pace, text size, alignment, cue line, mirror mode, and countdown if needed.
4. Start the teleprompter.
5. Read while the script scrolls automatically.
6. Tap the center to pause/resume. Tap the left/right edge to slow down/speed up.
7. Exit back to the editor without losing the script.

## 4. Functional requirements

- Large responsive script editor with local auto-save.
- Character count and approximate reading units.
- Two pace modes:
  - **Speed:** simple 0.5x–2.0x multiplier.
  - **Target time:** automatically calculate the scroll rate so the script reaches the end in a selected duration.
- Font size adjustment.
- Left/center text alignment.
- Horizontal mirror mode for beam-splitter rigs.
- Optional cue line near the camera eye-line.
- Optional 3-second countdown.
- Optional Screen Wake Lock when supported.
- Optional Fullscreen API request when supported; the fixed reader view must still work if fullscreen fails.
- Reader shows elapsed time, estimated remaining time, progress, and pace.
- Tap center to pause/resume.
- Tap left/right edge to adjust pace without opening settings.
- Keyboard shortcuts on desktop: Space pause/resume, Left/Right pace, R restart, F fullscreen, Esc exit.
- Japanese and English UI in the same HTML.
- Light-only application UI. The reader is a functional presentation surface, not a theme switcher.
- No runtime network request.

## 5. Data and privacy

- Script and preferences are stored only in localStorage when available.
- No script text is sent to a server.
- No analytics, telemetry, API call, remote font, CDN, camera, microphone, or location access.
- The user can clear the script and locally stored state from the UI.

## 6. UX decisions

- Mobile-first from 320px upward.
- The editor remains conventional and calm; the reader becomes full-screen-like and distraction-free.
- The primary mobile action is a sticky “Start teleprompter” button.
- Advanced settings stay visible but compact instead of hiding basic controls behind multiple dialogs.
- Reader controls are intentionally minimal and become more visible while paused.
- Side-tap pace controls display immediate feedback so accidental adjustments are obvious.
- Target-time mode is the main differentiator: it solves “finish this speech in N minutes” without requiring the user to guess a scroll speed.

## 7. Browser target

Current stable Chromium, Firefox, and Safari on desktop and mobile.

Core editor and reader must work when opened via `file://`. Wake Lock and Fullscreen are progressive enhancements and may require HTTPS or browser support.

## 8. Accessibility

- Visible focus indicators.
- Labels or accessible names for every control.
- Keyboard operation on desktop.
- Reader pause state is announced through an `aria-live` status.
- Motion respects `prefers-reduced-motion`; automatic teleprompter scrolling is user-initiated and therefore remains available.
- Destructive clear uses the in-app confirmation dialog.

## 9. Acceptance criteria

- `build-standalone.ps1` produces both release variants.
- No unresolved build placeholders.
- CSP contains `connect-src 'none'`.
- No external runtime scripts, styles, fonts, frames, or images.
- Script persists across reload when localStorage is available.
- Starting with an empty script is blocked with a clear status.
- Start, countdown, automatic scroll, pause/resume, restart, exit, mirror, cue line, speed mode, and target-time mode work.
- Changing font size does not corrupt progress or lose the script.
- Reader reaches 100% and pauses at the end.
- Japanese and English both fit at 360px width.
- Help content documents local storage, Wake Lock/Fullscreen limitations, and tap controls.
