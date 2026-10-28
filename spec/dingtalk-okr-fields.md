# OKR fields aligned with the existing DingTalk table

Read-only review: 2026-10-28, `OKR Scoring System`, October records and Guideline.
No existing DingTalk records, views, scoring values or formulas were modified.
The field editor is disabled for the current account. The legacy computed formulas are **unverified**.
The visible guideline defines 0 not started, 20 seriously behind, 40 partly complete,
60 nearly complete, 80 complete, 100 exceptional. No self/manager blend is inferred.

| Existing field | Work OS representation |
|---|---|
| 标题 Item | Objective / KR title and sequential O/KR label |
| 员工 Name | Authenticated objective owner; no free-text identity |
| 权重 Weighting | Objective and KR period shares, 0–100%, stored separately |
| 工作地点 Work Location | Objective planning location, independent of department |
| 描述 Description | Title plus additional objective/KR description |
| O 类型 Type | Mandatory / bonus; normalized new choices |
| 是否奖励任务参与评分 | Explicit bonus inclusion; defaults off |
| 员工评分 Self-evaluation | Nullable six-level self score |
| KR 成果显示 Show your KR here | Versioned deliverable text and source references |
| 评分阐述 Self-comment | Owner-written rationale |
| 主管评分 Mgr-evaluation | Different authorized manager, six-level score |
| 评分阐述 Mgr comment | Human verification note |
| KR 得分 KR Score | New policy uses current manager-confirmed score; legacy value retained only in import template |
| OKR 综合得分 OKR Sub-Score | New explicit weighted contribution, not a claim to reproduce the legacy formula |
| 父记录 | KR objective_id; import source parent ID retained in template |
| OKR 归属人 | Same verified owner displayed; conflicting imported owners require manual resolution |
| 打分截止日期 | Scoring deadline, separate from task due date |

## Improvements and boundaries

- An explicit `YYYY-MM` review period replaces separate monthly database tables.
  Deadlines outside the source month must be reviewed, never silently repaired on import.
- Objective weight 50%, child KR weights 30% + 20% means absolute period shares.
  With scores 80 and 100, the objective contributes 44 points, not 22 or 88.
  Parent objectives do not contribute a second time. Incomplete/invalid weights and
  missing/current-version manager reviews produce null, not zero.
- **New rule `human_confirmed_v1`**, explicitly labeled in both languages:
  manager score × KR period share. Self scores remain evidence and are not blended.
  No company-wide employee ranking or automatic employment outcome is produced.
- Business actuals/progress remain separate; task acceptance and scoring do not
  change business metrics. AI evidence review stays in task details and cannot
  write manager scores, accept evidence or make personnel decisions.
- New evidence or a metric update invalidates the current manager result; immutable
  appraisal rows and audit events retain earlier versions. Concurrent writes use
  expectedVersion. Other employees cannot read individual appraisals even when the
  associated department objective is visible.
- Planning fields are supported at creation. Existing objectives retain their
  original data and show missing planning as unknown. Bulk migration, source-table
  synchronization, plan editing and formal period close are **not implemented**.
- Pages uses fictional examples only; real employee records stay on the Mac backend.

## Validation

Backend tests cover nullable scores, actual zero, exact six-level rubric, planning
validation, scope isolation, no self-approval, stale writes, metric changes, audit
history and idempotent schema upgrades. UI tests cover bilingual labels, escaped
source material, weights and unknown/stale score handling. Browser smoke checks
cover the self/manager flow, mobile layout and light/dark presentation.
