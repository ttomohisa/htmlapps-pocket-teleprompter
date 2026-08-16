# Security and privacy

Pocket Teleprompter is a local-first single-HTML application.

- Script text is never uploaded by the application.
- Script text and preferences may be stored in browser localStorage on the current device.
- The runtime Content Security Policy contains `connect-src 'none'`.
- There are no analytics, telemetry, remote fonts, CDN assets, or third-party runtime libraries.
- The app does not request camera, microphone, location, motion, or contact access.
- Screen Wake Lock and Fullscreen are optional browser capabilities and do not transmit the script.

If the device is shared, clear the script before leaving it unattended or clear the browser's site data.
