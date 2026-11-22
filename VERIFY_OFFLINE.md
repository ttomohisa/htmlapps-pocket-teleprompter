# Offline verification

Pocket Teleprompter is designed to run from the generated single HTML file without runtime network access.

Core editor and teleprompter functions work from `file://` in current browsers. Optional Screen Wake Lock and Fullscreen support vary by browser and page context.

To verify:

1. Build the repository.
2. Open `dist/index.html` directly.
3. Paste a script and start the teleprompter.
4. Test pause/resume, speed adjustment, mirror mode, and exit. Check Target time at 0:30, 1:00 and 20:00; decreasing from 0:30 must stay at 0:30.
5. Reload and confirm the script is restored when localStorage is available.
6. Verify no runtime network request is made.

## Reading position checks (manual browser/device verification)

These are manual checks, separate from the deterministic Node runtime tests.

- Check both Japanese and English at 320px/360px and landscape, with a real smartphone.
- Pause, drag Reading position to 0/25/50/75/100%, resume, finish, restart, exit and reopen. Verify elapsed time remains unchanged by seeking and 100% shows the finish controls.
- Focus the slider and use arrows/Home/End; confirm keys change position without changing pace or restarting. Clicking/touching its label or track must not resume playback.
- With target 3:00 and elapsed 1:00, pause and move to 75%: remaining time should stay 2:00. Rotate/resize at 50% in paused and playing states and check position and remaining time.
- Verify the slider is absent during startup/countdown/playback, and that canceling startup then reopening cannot resume an old session.
- Recheck UTF-8 Open/Save, text composition, mirror/alignment, optional Fullscreen/Wake Lock, and offline loading for root/readable/self-extract files. Open .txt sits beside the editor heading; Save script as text is collapsed until opened. Confirm export feedback appears near the action.

## Help and local-processing badge

- Open Help in Japanese and English at 1440×1000, 1280×600, 500×700 and phone widths. Confirm the dialog stays within the viewport and the close button stays visible.
- Scroll to the final Important notes/Cautions item and verify the entire text and bottom padding can be reached. Tab to the named Help scroll area, check its visible focus, and use PageDown/End to reach the bottom.
- Close with the header button and Escape, then reopen repeatedly. Confirm focus returns to Help and closed dialogs stay hidden.
- On desktop, confirm the local-processing badge uses the PDF Fill & Sign shield-check geometry in both languages. At widths of 820px or less, confirm the badge is hidden.
- Repeat Help checks for the readable and self-extract release files; the Node tests cover CSS/markup contracts, not native layout.

## Accessible controls and keyboard help

- In Japanese and English, verify that the editor, speed/target/text-size sliders, five settings toggles and six adjustment buttons have localized accessible names. Check Help/Clear/Replace close buttons and reader Exit/Restart labels.
- Start, pause with the button, resume with Space, pause again and resume with the button. The icon, tooltip and accessible name must alternate between Pause and Resume without changing pace or elapsed time. During countdown and after completion the control is unavailable; restarting restores Pause.
- Read the Help keyboard section and try Space, Left/Right, R, F and Esc in the reader. Test F when the Fullscreen API is unavailable or denies the request; the reader must remain usable. Input/range controls retain their native keyboard behavior; focused buttons use Space/Enter for their own action. In fullscreen, Esc exits fullscreen before another Esc returns to the editor.
- Recheck the longer Help at tall/short/narrow viewports, including keyboard scrolling to its final note.

## Localized status and release documentation

- Trigger an invalid .txt-file warning, then switch from English to Japanese and back; the existing warning must change language without reselecting the file.
- Confirm README.md, README.ja.md, APP_SPEC.md and CHANGELOG.md agree on the 30-second–20-minute Target time range and the collapsed download controls.
- Compare README screenshots against the final Japanese/English UI. Replace outdated images before publication; automated tests do not verify screenshot freshness.
- After merge, inspect the v1.0.6 GitHub Release, its commit tag, and both downloadable HTML assets. The PR preview cannot prove that a future main-branch release has been published.
