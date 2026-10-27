# OneLaser · Work OS (interactive prototype)

[简体中文](README.md) · [English](README.en.md)

An interactive browser prototype for a pilot with 1–2 departments and 10–30 people. All employees, tasks, business metrics and review records are fictional. The business demo clock is fixed at October 27, 2026.

[Live demo](https://yonge6.github.io/onelaser-workos/) · [GitHub repository](https://github.com/Yonge6/onelaser-workos)

## Languages and themes

Use the **中 / EN** language buttons and **sun / moon** theme icons in the gateway or workspace header. Your choices are saved in the current browser. On the first visit, the theme follows the operating system preference.

The interface, validation messages, sample tasks, objectives, review explanations, integrations and notification previews are available in both languages. Language changes keep the same business records and current view. User-entered tasks, evidence and review comments remain unchanged; they are not automatically translated. Preset display text and export metadata follow the selected language; the browser still keeps a single set of business records.

The brand area uses the original English OneLaser SVG wordmark and the fixed English subtitle `Work OS`. Light and dark themes use the original black and white variants at their full aspect ratio. Dark styling covers tables, boards, forms, drawers, dialogs, reminders and empty states without applying a global image inversion.

## Run locally

No package installation or build is required:

```sh
git clone https://github.com/Yonge6/onelaser-workos.git
cd onelaser-workos
python3 -m http.server 8867 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8867`.

## Interactive flows

1. Choose Tasks or OKRs at the gateway. Switch demo identity to explore individual and department scopes.
2. Browse task lists and boards, search and filter, create tasks and link key results.
3. Submit an evidence title, outcome summary, optional HTTPS URL and self-reported acceptance-criteria coverage.
4. Run a local demo evidence check. It identifies missing fields and unverified evidence. It does not call a model or assess actual deliverable quality.
5. A manager inspects the actual evidence, enters a human quality score from 0–100 with reasons, and accepts the deliverable or requests more evidence.
6. A new submission version invalidates earlier checks and acceptance decisions while retaining event history.
7. View OKR progress from baseline, current and target business values, separately from task speed or quality scores.
8. Inspect human-reviewed performance metrics and sample sizes. Missing samples show “—”. Sample and coverage thresholds require calibration by role; this prototype does not compute an individual composite score.
9. Read integration guides for DingTalk sign-in, directory, notifications and an independent AI model API. Reminder previews are local drafts and are never sent.
10. Export demo records for the current visible scope or confirm a reset to the fictional samples.

## Implementation and limitations

- `dist/index.html`, `styles.css`, `i18n.js` and `app.js` are dependency-free static files with responsive layouts and keyboard controls.
- `i18n.js` contains source-key dictionaries, dynamic message templates and fixed sample translations. UI localization does not change organization keys, task IDs, form values or permission logic. Escaped user content is protected from UI translation.
- Business records are stored in browser `localStorage` under `onelaser-workos-demo-v4`. Demo records are shared by pages using the same browser origin.
- Identity switching **is not authentication or a security boundary**. Production must implement server-side sign-in, organization membership, role authorization and object-level data access.
- The simulated scope shows employees only their own tasks and managers only their department’s tasks. Company objectives are public demo objectives. Individual objectives follow the visible scope. Managers cannot approve their own tasks; production must assign a supervisor or another authorized reviewer.
- User content is HTML-escaped. Evidence URLs must use HTTPS and cannot include embedded usernames or passwords. The prototype does not read linked content or upload files.
- There is no database, real employee authentication, multiuser synchronization, file storage, model call, message delivery, scheduler or enterprise API connection in this frontend.
- The existing Grok Bot’s automation capability is unverified. Bot access and a model API are separate integrations. Neither is connected. Configuration variable names are documentation only; the browser never collects secrets.
- The prototype does not process real salaries, make employee retention decisions or automatically change compensation. Performance metrics need human review in the context of role, work calendar, dependencies and approved changes.
- The demo check only examines the title, text length and self-reported coverage. Complete fields do not establish actual quality or authenticity.

## Demo metric definitions

- **KR progress:** `(current − baseline) / (target − baseline)`, displayed within 0–100%. This prototype contains increasing metrics only.
- **Quality Q:** average human quality score for accepted tasks at their current submission version.
- **On-time T:** percentage of accepted tasks submitted by 18:00 on the effective due date. Submission and event times use the same fixed demo clock; export metadata records the actual export time.
- **Plan alignment P:** percentage of accepted tasks the reviewer confirms as matching the agreed scope.
- **Response R:** percentage of accepted tasks with valid working-time response data that meet a four-hour agreement. The prototype does not observe real employee behavior.
- **Proposed weights:** Q 50% / T 20% / P 20% / R 10%, pending agreement. This prototype does not calculate individual composite execution scores or rank people across roles.

Production development should implement the server-side policies in `spec/` and the implementation plan, followed by real authentication, authorization, evidence access, auditing, strict model-output validation and pilot acceptance testing.

## GitHub Pages deployment

Pushing website changes to `main` triggers GitHub Actions to deploy `dist/`. The **Deploy GitHub Pages** workflow can also run manually. The published page is publicly accessible and contains only fictional product-flow examples. A real employee system requires a separate backend, authentication and server-side permissions.

The HTML uses matching version query parameters for scripts and styles. Update them together when changing localization, code or styling so cached files from different releases are not mixed.

## Backend API

The [backend API source](https://github.com/Yonge6/onelaser-workos-api) is maintained separately. The current GitHub Pages frontend still uses browser-local demo data and **is not connected to that backend**. The API repository contains development implementations for tasks, OKRs, submissions and human acceptance. DingTalk and model integration require separate acceptance checks.
