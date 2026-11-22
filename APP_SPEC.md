# APP_SPEC.md

## 1. Product identity

- **Name:** Pocket Teleprompter
- **Version:** 1.0.6
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
- Open local UTF-8 `.txt` scripts (optional BOM, up to 1 MiB), with replacement confirmation and stale-read protection. Invalid, binary, or blank files leave the script intact.
- Keep Open .txt beside the script heading. Save UTF-8 `.txt` from a collapsed-by-default section beneath the editor, with an editable, sanitized filename.
- Character count and approximate reading units.
- Two pace modes:
  - **Speed:** simple 0.5x–2.0x multiplier.
  - **Target time:** automatically calculate the scroll rate so the script reaches the end in 30-second steps between 30 seconds and 20 minutes.
- Font size adjustment.
- Left/center text alignment.
- Horizontal mirror mode for beam-splitter rigs.
- Optional cue line near the camera eye-line.
- Optional 3-second countdown.
- Optional Screen Wake Lock when supported.
- Optional Fullscreen API request when supported; the fixed reader view must still work if fullscreen fails.
- Reader shows elapsed time, estimated remaining time, progress, and pace.
- Tap center to pause/resume.
- Paused-only 0–100% Reading position slider for rehearsal, preserving elapsed reading time. Seek/manual scroll recalculates target pace; resize preserves normalized progress before recalculation. Reaching 100% finishes; Restart resets the session. Position is not persisted.
- Tap left/right edge to adjust pace without opening settings.
- Keyboard shortcuts on desktop: Space pause/resume, Left/Right pace, R restart, F fullscreen, Esc exit.
- Japanese and English UI in the same HTML; the header shows EN in Japanese and JA in English, with localized target-language and Help accessible names/titles.
- Light-only application UI. The reader is a functional presentation surface, not a theme switcher.
- Playback timers use real elapsed foreground time; the reader pauses when hidden, including during countdown. Manual seeking is available only while paused.
- Screen Wake Lock is acquired for each active playback session, released when paused/finished/closed, and stale asynchronous requests are discarded.
- Failed local auto-save is shown as an error with a .txt export fallback; pending edits are flushed on pagehide. Clearing a script cannot claim success when persistent storage could not be updated.
- No runtime network request. The full-screen keyboard shortcut must not throw when the Fullscreen API is missing or fails.

## 5. Data and privacy

- Script and preferences are stored only in localStorage when available.
- No script text is sent to a server.
- The privacy badge reads 完全ローカル処理 / Fully local processing in Japanese / English on desktop, and is hidden at widths of 820px or less.
- No analytics, telemetry, API call, remote font, CDN, camera, microphone, or location access.
- Clearing the script also clears its persisted text when storage is available; saved reading preferences remain. The user can clear all site data in browser settings.

## 6. UX decisions

- Mobile-first from 320px upward.
- The informational page footer is hidden at widths of 520px or less and retained on wider screens. The local-processing badge is hidden at 820px or less. A bottom-fixed Start action remains available at 820px or less.
- The editor remains conventional and calm; the reader becomes full-screen-like and distraction-free.
- The primary mobile action is a fixed-bottom “Start teleprompter” button.
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
- Native modal dialogs lock background page scrolling; the independent reader scroll lifecycle and existing Help shell are preserved.

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

## Header visibility

Keep the header version visible on narrow smartphones without overlapping the app name or language/Help controls. Verify Japanese and English at 320px, 360px, 390px and desktop widths.
