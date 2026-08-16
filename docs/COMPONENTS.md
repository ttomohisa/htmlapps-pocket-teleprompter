# Components

`components/` contains source snippets, not runtime dependencies. The final release remains one HTML file.

## Confirmation dialog

Pocket Teleprompter uses an in-app confirmation dialog for destructive script clearing instead of `window.confirm()`.

The embedded implementation supports keyboard focus, `Esc` cancellation, backdrop cancellation, visible focus, and mobile-safe layout.
