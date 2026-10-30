# Unified Work OS UI Implementation Plan

> Execute the existing authorized request in the current checkout; preserve all data, routes, permissions, and dirty work.

**Goal:** Make every Work OS page use the approved Monday-style task board's UI system.

**Architecture:** Extract the board shell, palette and typography into a same-origin shared stylesheet loaded after legacy module styles. Keep module behavior and content intact. Apply common controls, dense tables, 8px panels, 4px controls and underlined tabs across all workspace pages, including native/public Wiki and dialogs. Preserve board label colors, semantic state colors and the complete English logo.

**Tech Stack:** Static HTML/CSS/JS, existing Fastify API, existing pinned Docker deployment on Render.

## Steps
1. Inspect the real board and other page structures; verify DevSSD and clean checkouts.
2. Add `dist/workspace-ui.css`; extract board-only shell tokens into shared tokens; load with a new cache version in `dist/index.html`. Keep 28/20/16/14/12px typography and 34–36px controls; maintain 16px article body for long technical content.
3. Update `spec/brand-ui.md` to mark this user-selected design as current. Avoid new functionality or API/data changes.
4. Run existing frontend tests. Use a fictional local API for desktop light/dark, Chinese/English, mobile, and representative task/evidence/customer-reply dialogs. Inspect every route and fix contrast/overflow/cascade issues.
5. Commit/push frontend, pin the exact commit in API deployment file, run CI, deploy the fixed API revision to the existing service.
6. Verify public asset hashes and authenticated real-browser pages on craftos.app; preserve final English/light preference and report only observed completion.

## Acceptance
- Same sidebar width/active state, topbar, content alignment, font and title scale across routes.
- Blue primary actions and focus, consistent tab underline, borders and small corners; legible dark surfaces.
- Content, forms, scores, statuses, authentication and review boundaries unchanged.
- Public Wiki remains public and private data remains authenticated.
- Responsive layouts have no page-level horizontal overflow; data tables may scroll within their container.
