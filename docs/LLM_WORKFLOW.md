# LLM workflow

1. Read `AGENTS.md` and `APP_SPEC.md`.
2. Inspect `src/index.template.html` and keep its mobile-first interaction model.
3. Prefer browser-native APIs and avoid dependencies unless they materially reduce risk.
4. Preserve the single-HTML build placeholders and no-network CSP.
5. Update README / spec / changelog when behavior changes.
6. Build and run repository verification.
7. For sensor math changes, also test on a real smartphone over HTTPS; headless desktop tests only verify UI and simulated events.
