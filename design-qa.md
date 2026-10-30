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

## 2026-10-30 Monday team workflow extension

final result: passed

Source inspected read-only: OneLaser board `18437786001`, its member dialog, Add view menu, Dashboard `40234630`, and My Work table/calendar. The logged-in account exposes one Main workspace, one OneLaser board, and one invited owner. The user's KC screenshots remain the truth for five status labels, priorities, categories, nesting and colors. Access to the private KC board was not available and is not claimed.

Evidence directory: `qa/monday-team-20261030/` (local-only QA assets).
- Source: `08-source-board-final.png`, `02-source-members.png`, `03-source-views.png`, `04-source-team-dashboard.png`, `05-source-my-work.png`, `06-source-calendar.png`.
- Implementation: `20-local-table-final.png`, `13-local-my-work.png`, `21-local-dashboard-postfix.png`, `22-local-calendar-postfix.png`, `15-local-members.png`, `12-local-kanban.png`, `17-local-mobile-dark.png`, `18-local-mobile-table.png`.
- Combined visual inputs actually opened: `compare-board-focused.png`, `compare-my-work.png`, `compare-dashboard-postfix.png`, `compare-calendar-postfix.png`; earlier iterations `compare-dashboard.png` and `compare-calendar.png` retained.
- Source and implementation desktop images are1352×822, CSS viewport1352×822, browser-normalized1× capture. Focused board comparison removes the different app navigation; source cropx350/y90 and implementationx224/y46. Source KC screenshot density/color normalization remains documented above. Mobile actual viewport390×844. No device-frame comparison.

Comparison history:
1. P2: first My Work repeated all team columns and summary bars, unlike the source's Group/Board/People/Date/Status organization. Fixed with a distinct personal table, original group/board references, and collapsed empty date buckets. Recaptured `13-local-my-work.png` and reviewed combined `compare-my-work.png`.
2. P2: first reporting used left-aligned short KPI cards and horizontal owner bars; source uses centered tall KPI cards and vertical bars. Fixed card header separators, centered values and vertical bars. Post-fix combined `compare-dashboard-postfix.png` opened and reviewed.
3. P2: initial125px calendar rows hid the current-date row below the first viewport and used verbose navigation. Reduced rows to92px, aligned navigation/date positions, used purple due-date cards and blue today marker. Post-fix `compare-calendar-postfix.png` opened and reviewed.
4. P2 interaction: discussion drawer needed keyboard focus management and misleading Hide/Group controls appeared in views that did not use them. Added initial focus, Tab containment, Escape close/focus return; removed irrelevant controls. Small-width group count now stays on one line.

Fidelity surfaces:
- Typography: locally bundled Figtree,14px dense table/toolbar,28px main title,18px reporting titles and36px KPI values. Chinese system fallback retained. Long task names truncate only within table cells; full names remain in details/update drawer.
- Layout: same dense rows, grid separators, blue underline tabs, colored group spines, nested subitems and cell labels. Added separate Team board/My Work scopes, functional Table/Kanban/Calendar/Dashboard. Dates and original board/group are visible in My Work. Horizontal table/Kanban scrolling stays inside their own containers; task/check columns remain pinned on desktop, scrolling is free on mobile.
- Colors: the existing KC-derived status/priority/category palette is preserved in light and dark. Blue actions and selected states share production tokens; reporting uses those actual states. Calendar due-date cards use source purple. Dashboard actual data has five states instead of the source demo's three; this is intentional data/config variation.
- Assets/icons: official OneLaser logo, real Figtree and Phosphor assets. No imitation Monday logo or screenshot-as-UI. Pie/bar charts are live data visualizations, not decorative image substitutes.
- Copy: bilingual operational labels; real people names come only from the authorized directory. No copied source task content or private KC records. Internal updates explicitly explain no customer sending/notifications/acceptance.

Functional/browser acceptance:
- Local fictional manager/team data only, no production records seeded. Actual UI task drag moved a card Working→On-Hold and saved the versioned API state; status menu remains keyboard alternative.
- Owner filter reduced all team widgets consistently. My Work showed only three tasks owned by the current manager, correctly split Past Dates/Today/This week. New task from My Work selects the current owner.
- Month navigation, Today, show/hide weekends, private scope/view persistence, board people dialog checked. People dialog describes real department/assigned scope and does not grant access.
- Internal update posted through the real API, author/date/text and count visibly returned. Evidence is a separate existing action. Draft/error/idempotency/XSS and cross-org/department/owner restrictions covered by tests.
- Light/dark desktop and390px mobile checked. Mobile navigation overlay closes by selecting a page; closed state has no document overflow. Tables intentionally scroll horizontally.

Intentional product boundaries: retain the OneLaser system sidebar and existing department/owner authorization, not Monday's marketplace/navigation/billing. One department board exists per authorized scope; no new multi-board membership, invitations, Gantt, Docs, Forms, file upload, rich-text mentions or notification delivery were added. The first source Updates capture had an unloaded pane and was rejected as visual truth. Kanban is functional based on the exposed view type, not a claimed pixel audit of an inaccessible source Kanban view. Exact whole-product identity is not claimed.

No actionable P0/P1/P2 findings remain for this core team-task scope. P3: rich-text discussion tools, chart axes and independently named multiple boards can be separate future expansions; no fake controls for them are shipped. Production deployment proof is recorded in the private acceptance handoff.
