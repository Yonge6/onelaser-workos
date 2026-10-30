# Monday task board — design QA, 2026-10-30

final result: passed

## Source visual truth
- User screenshots: `/var/folders/vd/kws8fm5509l6b9hnywhd8yfr0000gn/T/codex-clipboard-94c8bceb-a977-487f-9a7d-9924a22efb84.png` and the status/priority/sort/group-by detail images supplied in this conversation.
- Actual logged-in Monday: `https://hustyy986s-team.monday.com/boards/18437786001`, screenshot `qa/monday-board-20261030/source-live-light.png`. Read-only inspection; no Monday tasks, settings or integrations changed.
- Actual source computed font: Figtree. Supplied dark reference is 3990×2268 with Display P3 ICC. Normalized to sRGB and inferred 2× → 1995×1134 CSS pixels. The user-supplied detail images have independent crops/scales; use them for label content, menu structure and color intent rather than false pixel precision.

## Browser implementation evidence
- Real Ego local integration preview: `http://127.0.0.1:8892/#tasks` backed by the real API and isolated fictional PostgreSQL-compatible data.
- Final dark screenshot: `qa/monday-board-20261030/implementation-dark-final.png` (1556×1166 screenshot, CSS viewport1556×1166; browser DPR2, screenshot normalized by browser tool to1×).
- Normalized full-view comparison: `qa/monday-board-20261030/comparison-final.png`. Both sides are at CSS scale, cropped to the same1556×1134 content extent. The wider source's remaining rightmost columns are outside this crop. Exact full-viewport identity is not claimed.
- Focused interaction captures: `qa/monday-board-20261030/status-menu-final.png` and `implementation-sort-final.png`.
- Mobile: actual390×844 same-origin iframe, screenshot `mobile-light-zh.png`, content crop `mobile-light-zh-crop.png`.

## Iteration history
1. P1: existing host grid plus a new margin doubled the sidebar gutter. P2: host minimum checkbox height expanded rows to45px. P2: global dark sidebar/topbar rules overrode board colors. All were found in actual browser screenshots and computed layout.
2. Fixed the host grid to224px + flexible content with zero extra margin; overrode dark shell colors at the required specificity; reset checkbox minimum sizes. Post-fix measured main contentx224, task row37px, no page-level horizontal overflow. Table overflow is confined to its scroll container.
3. Normalized the reference ICC before final palette comparison. The source page background is#181b34, table#31324e, separator#4c4e69; label samples informed the default palette. Final screenshots compared after these changes.

## Required fidelity surfaces
- Fonts/type: actual Figtree variable font with OFL license bundled locally. Dense14px cells/toolbar,28px board title,19px colored group titles. Chinese uses system CJK fallback. No remote font dependency.
- Layout/rhythm: compact rectangular cells,37px rows, nested subitem tables, colored group spine, group collapse, visible table summaries. Reference user's wider viewport and differing task counts explain crop/height differences. OneLaser navigation and existing owner column are retained intentionally; the logged-in Monday reference also has an owner column.
- Colors/tokens: source dark canvas/sidebar/table and blue actions, pink Urgent, purple High, amber Working, red On-Hold, lilac Review, green Done and gray Not Started. Shared labels are editable; light theme keeps the same label colors.
- Assets: official supplied OneLaser logos retained. Licensed Phosphor icon font and Figtree font are real assets; no fake raster page or handcrafted decorative imagery.
- Copy: exact five status concepts and four priorities, empty priority, category tags, New task/Add task/Add subitem, Person/Filter/Sort/Hide/Group by, Completed. English/Chinese UI checked. Existing task titles are preserved.

## Functional checks
- Real local status change On-Hold persisted through reload.
- Three sort rules displayed and saved to a private server view.
- Custom bilingual group created and persisted.
- New task created through the existing required owner/reviewer/due/outcome/acceptance form with board priority and category.
- Parent expands its actual child records. Unit integration covers child creation context, filtering, views, column visibility, notes/dates, failure preservation, escaped content and logout reset.
- Mobile English/dark → Chinese/light controls tested; toolbar wraps, page remains usable, wide table scrolls horizontally.
- Browser error console checked: no errors.

## Remaining non-blocking differences / P3
- OneLaser company navigation, identity and existing evidence drawer replace Monday-specific marketplace/AI/invite chrome. No unsupported automation buttons are presented.
- App table includes Owner by default; it can be hidden. Source screenshots differ on whether Owner is present.
- Custom group drag reordering and Monday collaboration notifications are outside this task.

## Implementation acceptance checklist
- [x] Visual target opened and compared with browser-rendered implementation.
- [x] Identified P1/P2 layout/color/density defects fixed and re-captured.
- [x] Core interactions use real scoped APIs, not a static screenshot.
- [x] Board Done remains separate from actual evidence acceptance.
- [x] Seven-day boundary, reopening, child completion, cross-user/org access and stale writes tested.
- [x] Mobile and both interface languages/themes checked.


## 2026-10-30 shared workspace UI extension

Result: local visual and regression checks passed; deployment acceptance is recorded separately.

The user selected the task board as the system-wide source of truth. Shell and palette moved to `dist/workspace-ui.css`; the task board now inherits them instead of changing the whole shell only on its route. Legacy module styling remains as layout/behavior fallback; the shared stylesheet is loaded last.

Checked all nine authenticated routes with a fictional local API: Executive, Overview, Tasks, OKRs, Reviews, Performance, Support, Wiki and Integrations. Desktop English light/dark: Figtree, 28px page title, 224px sidebar, 46px topbar, matching canvas/panels, no page overflow or visible app errors. Chinese mobile at 390x844: 24px title, 14px gutter, no page-level horizontal overflow. Fixed Wiki's legacy mobile column alignment so it starts at the same left gutter; hid redundant workspace breadcrumb text on mobile.

Opened the actual task create modal, evidence drawer, support reply comparison and public Wiki assistant. Styles share blue primary controls, 4px form corners, 8px panels, and blue underline tabs. Preserved manager/employee actions, checkbox semantics, editor values, review rules and version history. No synthetic records were added to production and no customer replies or model jobs were submitted.

Public Wiki checked without authentication: 236 guides, family imagery intact, three common guides per desktop row, article body retained at 16px/1.75 and mobile article free of overflow. Login/public shell uses the same stylesheet. Source text and download URLs were not rewritten.

Artifacts: `qa/workspace-ui-20261030/`, including `desktop-checks.json`, `dark-checks.json`, `mobile-checks.json` and browser screenshots. Existing frontend suite: 138 passed, 1 optional skip. Shared CSS change does not require mirror-image unit tests; rendered layout and existing behavior suite are the acceptance evidence.
