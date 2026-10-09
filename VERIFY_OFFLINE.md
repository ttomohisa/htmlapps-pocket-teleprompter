# Offline verification

Pocket Teleprompter is designed to run from the generated single HTML file without runtime network access.

Core editor and teleprompter functions work from `file://` in current browsers. Optional Screen Wake Lock and Fullscreen support vary by browser and page context.

To verify:

1. Build the repository.
2. Open `dist/index.html` directly.
3. Paste a script and start the teleprompter.
4. Test pause/resume, speed adjustment, mirror mode, and exit.
5. Reload and confirm the script is restored when localStorage is available.
6. Verify no runtime network request is made.

## Reading position checks (manual browser/device verification)

These are manual checks, separate from the deterministic Node runtime tests.

- Check both Japanese and English at 320px/360px and landscape, with a real smartphone.
- Pause, drag Reading position to 0/25/50/75/100%, resume, finish, restart, exit and reopen. Verify elapsed time remains unchanged by seeking and 100% shows the finish controls.
- Focus the slider and use arrows/Home/End; confirm keys change position without changing pace or restarting. Clicking/touching its label or track must not resume playback.
- With target 3:00 and elapsed 1:00, pause and move to 75%: remaining time should stay 2:00. Rotate/resize at 50% in paused and playing states and check position and remaining time.
- Verify the slider is absent during startup/countdown/playback, and that canceling startup then reopening cannot resume an old session.
- Recheck UTF-8 Open/Save, text composition, mirror/alignment, optional Fullscreen/Wake Lock, and offline loading for root/readable/self-extract files.

## Help and local-processing badge

- Open Help in Japanese and English at 1440×1000, 1280×600, 500×700 and phone widths. Confirm the dialog stays within the viewport and the close button stays visible.
- Scroll to the final Important notes/Cautions item and verify the entire text and bottom padding can be reached. Tab to the named Help scroll area, check its visible focus, and use PageDown/End to reach the bottom.
- Close with the header button and Escape, then reopen repeatedly. Confirm focus returns to Help and closed dialogs stay hidden.
- Confirm the local-processing badge uses the PDF Fill & Sign shield-check geometry in both languages.
- Repeat Help checks for the readable and self-extract release files; the Node tests cover CSS/markup contracts, not native layout.
