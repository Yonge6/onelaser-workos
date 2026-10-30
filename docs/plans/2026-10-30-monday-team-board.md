# Monday team task-board completion

Goal: finish the missing core flows in the production OneLaser task module using a fresh read-only audit of the logged-in Monday workspace.

Source inspected: OneLaser board 18437786001, its member dialog and Add view menu, Dashboard and reporting 40234630, My Work table and Calendar. Only Main workspace / one board / one invited owner was available. The old KC screenshots are user-supplied references, not proof of access to that private board. No source tasks, memberships or views were created/edited. My Work discussion opened but its right content panel stayed blank; exclude it from accepted visual evidence.

## Fresh audit / differences
1. Board: current app lacks a real view bar and board identity/scope controls; fixed minimum columns hide the right edge without pinned task identity.
2. Members: Monday shows board access and invited people separately. Keep existing Work OS organization/department/owner authorization; do not grant anyone new access for fidelity.
3. Views: Monday exposes Table, Kanban, Calendar, Chart and Dashboard. Add functioning Table, Kanban, Calendar and Dashboard for the existing tasks; do not add fake buttons for unsupported Doc/Form/AI/marketplace features.
4. Team reporting: total, in progress, stuck/on hold, done; status distribution and tasks by owner, with filters applying to all widgets.
5. My Work: assigned-to-me tasks grouped by past dates, today, this week, next week, later, no date. Preserve a separate Team board surface and show its actual authorization scope.
6. Calendar: month navigation, Today, weekdays, due-date task cards opening the same task details.
7. Collaboration: replace the current misleading comment bubble (opens evidence) with actual stored task updates, author/timestamp/count, and a separate link to evidence. Updates use existing task permissions and do not send notifications or approve outcomes.

## Implementation
- API: extend private saved view schema with optional display/scope/column widths; add append-only task updates with request UUID/idempotency, task visibility, org/department checks and audit. No access expansion and no evidence mutation.
- Frontend: board header switch Team board/My work, named view tabs, assigned-only date buckets, shared filter/sort state, team dashboard, Kanban (status move with version checks and keyboard alternative), month calendar, internal updates drawer, column resize persistence and pinned task columns.
- Tests: new view persistence/validation, task-update privacy/idempotency/XSS, team versus mine filtering, date buckets, calendar/dashboard counts, status changes and failed updates. Existing behavior suite remains required.
- QA: local fictional records, actual source/implementation screenshots side by side, mobile/light/dark, then exact frontend pin + CI + existing Render service + production browser and public asset readback. Never seed synthetic employee work into production.
