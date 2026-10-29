# Knowledge Center / Wiki Implementation Plan

**Superseded:** The user requested native integration, not embedding. See `2026-10-29-native-wiki.md` for the replacement architecture.

**Goal:** Make the existing complete OneLaser support center the default Wiki view inside Work OS, preserving its original public URL and every route, asset and feature.

**Architecture:** Embed the exact public support-center site in a cross-origin, sandboxed iframe. Keep the authenticated archive and source-bound review records as a secondary view. The parent sends only an initial public language preference in the URL; no employee identity, credentials, tickets, review data or postMessage bridge is shared. The existing source site is unchanged.

**Tech Stack:** Vanilla JavaScript/CSS frontend, existing Fastify API and Caddy edge, Node tests, live browser verification.

## Implementation

1. Rename the live navigation, breadcrumb and default page to 知识中心 / Wiki and Knowledge center / Wiki.
2. In dist/company-support.js, default to the full original Wiki, provide an original-site link and a secondary 档案与核对 / Archive & review view containing the unchanged source list/review flow. Use the site's supported lang query parameter. Include scripts, forms, downloads and external links in the iframe sandbox, with no top navigation permission.
3. Add responsive iframe layout in dist/styles.css. Retain the original site's design and native bilingual controls.
4. In the API Caddyfile, permit framing only https://yonge6.github.io/onelaser-support-center/ while retaining Work OS's anti-framing policy. Keep private APIs and existing authorization unchanged.
5. Verify the default complete site, archive escaping, restored archive search/review path, approved frame URL/sandbox, and actual edge CSP. Run relevant existing suites.
6. Publish frontend, pin its exact commit in the API build, run production-container CI, deploy Render, then verify the real employee page: original home, product family, search, downloads, article, bilingual interface, new-tab link, archive and responsive layout.

## Acceptance

The original public site is not edited or replaced. All 236 source articles remain reachable through its full interface. Existing authenticated review records remain reachable separately. The Render page must show and run the complete Wiki rather than a flattened article list. Domain cutover stays pending the user's GoDaddy account recovery; this change works on either approved host.

## Deployment follow-up

Live Chrome verification reproduced blank cross-origin frames despite correct response headers and a working original-site link. Bundle the exact reviewed public support-center revision under same-origin `/wiki/`, retaining every source file and the original link. Parent iframe URL changes to `/wiki/?lang=zh|en`. The API build verifies Git blob hashes and serves only the fixed public artifact; private records remain in authenticated archive APIs. The same-origin document is trusted application code, not a security boundary, and only reviewed pins may be deployed. Scope framing headers to `/wiki/*` while preserving parent anti-framing headers.
