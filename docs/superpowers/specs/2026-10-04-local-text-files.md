# Local text files

Add a compact editor toolbar with Open .txt, an editable download filename, and Save .txt. Keep the single-file, local-only app, existing storage schema, preferences, reader timing, and both languages.

Open UTF-8 .txt files up to 1 MiB (1,048,576 bytes), accepting a UTF-8 BOM. Normalize CRLF/CR to textarea LF while preserving Japanese, emoji, whitespace, paragraphs, and literal markup. Reject wrong extension, oversized, malformed UTF-8, NUL, blank content, and read failures without replacing the editor or filename. Ask in an accessible in-app dialog before replacing different nonempty content; cancel, Escape, backdrop and close preserve it. Same content requires no prompt. Reset the picker so selecting the same file works again.

Use an import generation to ignore asynchronous results superseded by another picker/selection, editor input, Clear, or starting the reader. This also invalidates a pending replacement confirmation.

Save the current editor text as UTF-8 plain text through a temporary Blob URL. The filename defaults to the imported basename or pocket-teleprompter.txt and is editable, sanitized for path/control/reserved characters, bounded, and guaranteed to end in .txt. Do not add filename to localStorage. Revoke every created Blob URL. File activity has a separate localized live status. File operations must work when storage is unavailable.

Verify logic with Node's built-in test runner against the actual inline script and a deterministic DOM fixture. Run the repository PowerShell aggregate, which rebuilds and verifies both artifacts. Review the exact tree independently, then publish only a draft PR and test its exact-head HTTPS preview in the cloud browser. Real smartphone verification, Windows execution, and file:// testing are separate checks and must not be claimed without performing them.
