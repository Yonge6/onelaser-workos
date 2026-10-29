# Native Knowledge Center / Wiki

This supersedes the iframe approach in `2026-10-29-knowledge-center-wiki.md` following the user's explicit correction. Wiki is a native Work OS section, using the existing sidebar, typography, language and theme controls.

## Implementation

- Render the fixed, verified support-center data inside the main document. Keep all 236 articles, eight product families, full-text search, 52 download-topic guides, article tables, images, captions, attachments, source links and complete tables of contents.
- Use `#knowledge/` routes for home, search, family, downloads, article and authenticated archive. Browser history and refresh must preserve the route. Internal article links remain inside Work OS; precise unmatched source links stay external.
- Remove the iframe, nested site header/footer, duplicate logo and duplicate language controls. Use compact native panels: 32px page titles, 20px section titles, 16px reading text and 14px navigation/metadata following the existing brand standard.
- Sanitize article HTML into an explicit safe tag/attribute/URL allowlist before insertion. Original technical wording is unchanged; interface translations do not translate technical source text. CSP permits only the existing audited media hosts and denies frames in the main shell.
- Keep the authenticated source archive and human review workflow separate from public guide data. Existing notes, decisions and operational permissions are unchanged. No customer messages or automatic publication.

## Acceptance and deployment

Test source coverage, sanitizer behavior, search/filter counts, route history, stale request isolation and archive rendering. Inspect the native UI in the browser, including article media, internal navigation, language/theme and responsive layout. Publish frontend, pin its exact commit in the API, pass container CI, deploy the existing Render service and read back the live result.

The original public support-center repository and fixed Wiki package remain preserved. This frontend change does not complete the separately pending craftos.app DNS/account cutover.
