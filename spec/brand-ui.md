# OneLaser Work OS brand UI

Source verified 2026-10-28: OneLaser 网页 project, `UI-SPEC.md`, `AGENTS.md`, `src/home.css`, supplied `public/fonts/Certia-*.otf`. These are the user's website-project standards, not a claim that the commercial site has shipped every prototype change.

The Work OS demo, authenticated workspace, manager views and Bot authorization pages use Certia Regular 400, SemiBold 600 and ExtraBold 800. Chinese glyphs fall back to PingFang SC / Noto Sans CJK SC / Microsoft YaHei. Official English logo assets remain unchanged.

| Role | Work OS rule |
|---|---|
| Page title | 32 px, 800, 1.2 line height on desktop and mobile |
| Entry card title | 28 px desktop / 24 px mobile, 800 |
| Panel title | 20 px, 800 |
| Body / introduction | 16 px, 1.6 line height |
| Table cell / navigation / form value | 14 px; 600 for emphasis |
| UI label | 13 px / 18 px, 600 |
| Metadata / caption | minimum 12 px |

Primary surface white, secondary #F5F5F7, text black, muted #6B6B70, border #D2D2D7. Brand #E7310E; action #D92D0D; pressed #BF260B. Night mode is a Work OS extension of the brand: #141414 page, #202023 panels, #F5F5F7 text, #B8B8BF muted, #444449 border. Red text is lightened for contrast; primary buttons retain white on action red. Semantic green/amber/error colors remain distinguishable.

Use 4 px spacing units, 8/12 px related-control gaps, 16/24 px content gaps, 24 px cards and 32 px modal corners. Pill primary actions are 52 px high; secondary actions 48 px; compact row actions 36 px; fields at least 44 px. Dense business tables do not copy 48–96 px marketing display type. Theme controls remain sun/moon icons; language stays 中 / EN.

Fonts are same-origin files copied from the user's existing website assets, with swap display and Chinese fallbacks. Do not load fonts or CSS from third parties. Preserve functional keyboard focus, status semantics, responsive wrapping, and reduced motion. This change does not alter authentication, review permissions or demo/live data separation.
