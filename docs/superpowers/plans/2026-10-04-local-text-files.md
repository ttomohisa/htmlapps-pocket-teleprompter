# Local Text Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Open and save local UTF-8 scripts without risking an existing script.

**Architecture:** A small toolbar and separate replacement dialog live in the existing inline app. Import generations invalidate stale asynchronous reads and confirmations. Browser-native decoding and Blob downloads keep all content local.

**Tech Stack:** HTML/CSS, native JavaScript, Node test runner, PowerShell build.

**Spec:** ../specs/2026-10-04-local-text-files.md

## Global Constraints
- Do not change reader timing, preferences, storage schema or offline CSP.
- Produce both one-file artifacts only through the build.
- Japanese and English, keyboard access, and mobile-first wrapping.
- Limit imports to 1,048,576 bytes; reject invalid UTF-8/NUL/blank content.

## Review Focus
- A delayed read or confirmation must never overwrite newer edits.
- Picker cancel/reselect and replacement close/Escape/backdrop preserve content.
- UTF-8 byte limits differ from JavaScript character lengths.
- Save filename controls must not activate reader shortcuts in the editor.
- Storage failures must not prevent in-memory import/export.

### Task 1: Local text-file workflow

**Files:** src/index.template.html; tests/text-files.test.cjs; scripts/check-repository.ps1; APP_SPEC.md; docs/ARCHITECTURE.md; README.md; README.ja.md; generated dist files.

**Interfaces:** Existing textarea input, clear action, reader start and save persistence. New controls: openTextButton, textFileInput, fileNameInput, saveTextButton, fileStatus; replaceDialog with explicit accept/cancel/close controls.

- [x] Write tests against real inline runtime: BOM/CRLF/Japanese/emoji/markup round trip, byte boundaries, malformed/NUL/blank/wrong extension/read failure, replacement accept/cancel/dismissal, same file, stale selection/edit/Clear/start, filename sanitizing and Blob cleanup, unavailable storage, reader keyboard compatibility.
- [x] Run node --test tests/*.test.cjs; confirm failures are missing feature controls/behavior.
- [x] Implement the toolbar, translations, strict decoder, generation guard, separate confirmation, and download helper without reader/persistence redesign.
- [ ] Run the full Node suite, add it to check-repository.ps1, document behavior, regenerate and verify both variants through PowerShell.
- [x] Obtain an independent whole-tree review; reproduce important findings with failing tests and fix.
- [ ] Recheck main/open PRs, publish reviewed tree as a draft PR, verify remote tree and exact-head CI, and exercise public preview through cloud CUA.
