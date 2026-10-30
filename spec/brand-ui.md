# OneLaser Work OS shared UI

Current source of truth (user decision 2026-10-30): the Monday-style task board. This supersedes the earlier website-scale Certia/red/pill UI for the internal system and its native/public Wiki. The official OneLaser wordmark remains unchanged.

All routes load `dist/workspace-ui.css` after legacy module styles. Task-board layout retains its dedicated stylesheet but inherits the same shared shell and tokens.

| Role | Current rule |
|---|---|
| Font | Self-hosted Figtree variable 300–900; PingFang SC / Microsoft YaHei fallback |
| Page title | 28px desktop / 24px mobile, 600 |
| Section / card title | 18–20px / 16px, 500–600 |
| UI body / table / navigation | 14px, regular; 500–600 for emphasis |
| Description / metadata | 13px / 12px |
| Technical article body | 16px, 1.75 line height; content preserved |
| Primary action | #0073ea with white text; hover #0060b9 |
| Controls | 34–36px high, 4px corners; row actions 30px |
| Panels / dialogs | 8px corners; drawers square to window edge |
| Tabs | Transparent surface, blue underline; no pills |
| Shell | 224px sidebar, 46px topbar, 30px content gutter; 14px mobile gutter |

Light: white canvas/panels, #f6f7fb sidebar, #323338 text, #676879 muted, #d0d4e4 borders, #cce5ff selection. Dark: #181b34 canvas, #242944 sidebar, #31324e panels, #d5d6e2 text, #b2b4ca muted, #4c4e69 borders, #133774 selection. Links/focus use lighter blue in dark mode; filled actions retain #0073ea.

Status/priority/category labels retain the supplied task-board colors. Semantic success/warning/error states remain distinct. New styling does not change task, OKR, customer-response, evidence or authorization behavior. Done remains distinct from human acceptance.

Preserve visible keyboard focus, reduced motion, bilingual wrapping, complete logo assets, uncropped Wiki product images, three-column desktop common guides, and table-contained scrolling. Public Wiki remains public; internal data remains authenticated. No remote font/style dependencies.
