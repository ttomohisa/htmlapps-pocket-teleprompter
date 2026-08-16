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
