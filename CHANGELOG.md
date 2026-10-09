# Changelog

All notable changes to Pocket Teleprompter are documented here.

## 1.0.3 - 2026-10-09

- Keep all Help content reachable in tall and short desktop windows with a keyboard-focusable scroll area and a visible close button.
- Use the shield-check icon from the PDF Fill & Sign local-processing badge.
- Show the correct Pause/Resume icon and localized action label, keeping the action unavailable during startup and after completion.
- Document existing desktop keyboard shortcuts and their input/fullscreen exceptions in Japanese and English Help.
- Name the editor, sliders, setting toggles, adjustment buttons and dialog controls using localized labels.

## 1.0.2 - 2026-10-09

- Add a real English catalog screenshot and use it in the English README, preserving app behavior and the supplied icon.

## 1.0.1 - 2026-10-07

### Added

- Japanese/English Reading position slider for paused rehearsal, keeping elapsed reading time.

### Fixed

- Standardized header language targets as EN / JA with localized accessible names and tooltips.
- Localized Help tooltips and standardized the Japanese fully-local processing badge.
- Fixed the advertised 3-second countdown to hold each numeral for one full second without changing cancellation, pause/resume, or restart behavior.

- Target-time pace and remaining time are recalculated after paused navigation and after restoring progress on resize.
- Startup/countdown callbacks cannot enable navigation or resume a closed/newer session.
- Range/input controls keep native keyboard handling without triggering reader shortcuts or tap playback.
- The root HTML download is rebuilt and checked against the readable release.

## 1.0.0 - 2026-08-17

### Added

- Single-HTML teleprompter optimized for smartphones.
- Local script editing and auto-save.
- Speed mode and target-duration mode.
- Adjustable font size and text alignment.
- Horizontal mirror mode for beam-splitter teleprompters.
- Optional cue line and 3-second countdown.
- Tap-to-pause and edge-tap pace adjustment.
- Elapsed time, estimated remaining time, and progress display.
- Progressive Screen Wake Lock and Fullscreen support.
- Japanese and English UI.
- Fully local runtime with no external dependencies or network requests.
