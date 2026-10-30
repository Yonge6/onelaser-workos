# Monday-style task board implementation

Goal: Recreate the supplied Monday task table and color labels in the existing production Work OS.
Architecture: A native board module uses the existing authenticated task API plus scoped board configuration and task metadata. Task execution labels remain separate from immutable submission/review records. No Monday data is imported or modified.

1. Capture the logged-in Monday table and source colors/Figtree; screenshots supplied by the user are the dark-theme visual truth.
2. Add department-scoped board groups, status/priority/category labels, private saved views, parent/subtasks, updated-at and completion timestamps. Every edit checks task scope and expected version and creates an audit event.
3. Derive Completed placement on server reads after seven full days in Done; reopening clears the completion clock. Parents with unfinished/newly completed children stay active. This never approves evidence or changes business KR values.
4. Build the compact table with editable colored cells, expandable subitems, group creation/rename, search, person/status filters, multi-sort, hide columns, group-by, selection and real batch updates. Keep OneLaser identity, English/light defaults and bilingual/dark controls.
5. Verify permissions, stale writes, timer boundaries, parent scope, view isolation and task-review separation. Exercise desktop and mobile, both themes, and save/reload in a real browser.
6. Commit front/back, pin the front commit, run CI, deploy to the existing Render service, and verify craftos.app/#tasks. Preserve Wiki/support and all existing data.
