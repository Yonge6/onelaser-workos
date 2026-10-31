import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const fields = readFileSync(new URL('../dist/okr-fields.js', import.meta.url), 'utf8');
const board = readFileSync(new URL('../dist/okr-board.js', import.meta.url), 'utf8');
const live = readFileSync(new URL('../dist/live-app.js', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

const users = [
  { id:'m1', display_name:'Manager', role:'manager', department_id:'d1' },
  { id:'e1', display_name:'Amy Chen', role:'employee', department_id:'d1' },
  { id:'e2', display_name:'Ben Li', role:'employee', department_id:'d1' },
];
const objectives = [
  { id:'c1', title:'Company revenue', level:'company', owner_id:null, department_id:null, org_id:'o', version:1, parent_objective_id:null, planning:{ period:'2026-10', weight:100 } },
  { id:'p1', title:'Grow dealers', level:'personal', owner_id:'e1', department_id:'d1', org_id:'o', version:3, parent_objective_id:'c1', planning:{ period:'2026-10', weight:50 } },
  { id:'p2', title:'Old goal', level:'personal', owner_id:'e1', department_id:'d1', org_id:'o', version:1, parent_objective_id:null, planning:{ period:'2026-09', weight:50 } },
];
const krs = [
  { id:'k1', objective_id:'p1', title:'Sign 30 dealers', baseline:0, target:30, actual:12, direction:'increase', unit:'dealers', version:2, meta_version:4, confidence:'at_risk', department_id:'d1', planning:{ weight:30 } },
  { id:'k2', objective_id:'p1', title:'Repeat rate 25%', baseline:15, target:25, actual:20, direction:'increase', unit:'%', version:1, meta_version:1, confidence:null, department_id:'d1', planning:{ weight:20 } },
];

function load({ actor = users[0], collab = true, lang = 'zh', appraisals = {} } = {}) {
  const { window, document } = parseHTML('<!doctype html><html><body><div id="app"></div><div id="overlay-root"></div></body></html>');
  const state = { actor, capabilities:{ okrCollaboration:collab }, directory:users, objectives, krs, appraisals, page:'okr' };
  const calls = [];
  const context = { window, document, requestAnimationFrame:fn => fn(), Intl, Date, console };
  vm.runInNewContext(fields, context);
  vm.runInNewContext(board, context);
  const api = { get:async p => { calls.push(['GET', p]); return { items:[] }; }, post:async (p, b) => { calls.push(['POST', p, b]); return { id:'new' }; }, request:async (p, o) => { calls.push([o.method, p, o.body]); return {}; } };
  window.WorkOSOkrBoard.configure({ api, state:() => state, lang:() => lang, rerender:() => { document.getElementById('app').innerHTML = window.WorkOSOkrBoard.render(); }, refreshOkr:async () => {}, toast:() => {}, explainError:e => e.message, overlay:html => { document.getElementById('overlay-root').innerHTML = `<section class="drawer">${html}</section>`; }, closeOverlay:() => { document.getElementById('overlay-root').innerHTML = ''; }, modal:() => {}, openAppraisal:id => calls.push(['appraisal', id]), measurement:id => calls.push(['measure', id]), openObjectiveSource:() => {} });
  const B = window.WorkOSOkrBoard;
  const paint = () => { document.getElementById('app').innerHTML = B.render(); };
  const click = sel => { const el = document.querySelector(sel); assert.ok(el, `missing ${sel}`); el.dispatchEvent(new window.Event('click', { bubbles:true })); };
  return { B, document, window, calls, state, paint, click };
}

test('index loads the OKR board after the app and live-app delegates to it', () => {
  assert.match(indexHtml, /okr-board\.css/);
  assert.match(indexHtml, /okr-board\.js[^"]*" defer/);
  assert.match(live, /if\(window\.WorkOSOkrBoard\)return window\.WorkOSOkrBoard\.render\(\);/);
  assert.match(live, /async function refreshOkr\(\)/);
});

test('weighted progress uses KR weights; cycle helpers', () => {
  const { B } = load();
  const H = B._helpers;
  // k1 40% * 30 + k2 50% * 20 = 22 / 50 = 44%
  assert.equal(H.objectivePct(objectives[1]), 44);
  assert.equal(H.dueDateFor('2026-12'), '2027-01-03');
  assert.ok(H.cycles().includes('2026-10') && H.cycles().includes('2026-09'));
});

test('team view lists people and shows the selected person’s objectives for the cycle only', () => {
  const { B, paint, click, document } = load();
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; paint();
  assert.ok(document.querySelector('[data-okr="person"][data-id="__company"]'), 'company bucket');
  click('[data-okr="person"][data-id="e1"]');
  const text = document.getElementById('app').textContent;
  assert.match(text, /Grow dealers/);
  assert.doesNotMatch(text, /Old goal/, 'other cycle hidden');
  assert.match(text, /Sign 30 dealers/);
  assert.ok(document.querySelector('.okb-align-chip'), 'alignment chip shown');
  assert.ok(document.querySelector('[data-okr="kr-status"][data-id="k1"]'), 'manager can set status');
});

test('without backend collaboration support, edit/status/delete controls are hidden', () => {
  const { B, paint, document } = load({ collab:false });
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; B._ui.person = 'e1'; paint();
  assert.equal(document.querySelectorAll('[data-okr="edit"]').length, 0);
  assert.equal(document.querySelectorAll('button[data-okr="kr-status"]').length, 0);
  assert.ok(document.querySelector('[data-okr="add-kr"]'), 'creation still works on the old backend');
});

test('employees cannot edit colleagues’ objectives', () => {
  const { B, paint, document } = load({ actor:users[2] });
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; B._ui.person = 'e1'; paint();
  assert.equal(document.querySelectorAll('[data-okr="edit"]').length, 0);
  assert.equal(document.querySelectorAll('[data-okr="add-kr"]').length, 0);
  assert.equal(document.querySelectorAll('[data-okr="add-o"]').length, 0);
});

test('setting a KR status sends the meta version, not the metric version', async () => {
  const { B, paint, click, calls } = load();
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; B._ui.person = 'e1'; paint();
  click('[data-okr="kr-status"][data-id="k1"]');
  click('[data-okr="set-status"][data-id="k1"][data-value="on_track"]');
  await new Promise(r => setTimeout(r, 0));
  const patch = calls.find(c => c[0] === 'PATCH');
  assert.equal(JSON.stringify(patch), JSON.stringify(['PATCH', '/key-results/k1', { expectedMetaVersion:4, confidence:'on_track' }]));
});

test('scores: confirmed, self-only and none are distinguished', () => {
  const { B, paint, document } = load({ appraisals:{ k1:{ version:2, manager:{ score:80, metric_version:2 }, self:{ score:80 } }, k2:{ version:1, manager:null, self:{ score:60 } } } });
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; B._ui.person = 'e1'; paint();
  assert.equal(document.querySelector('[data-kr="k1"] .okb-score-final').textContent, '80');
  assert.match(document.querySelector('[data-kr="k2"] .okb-score-self').textContent, /60/);
});

test('alignment view nests personal objectives under their parent', () => {
  const { B, paint, document } = load();
  B._ui.cycle = '2026-10'; B._ui.tab = 'align'; paint();
  const nested = document.querySelector('.okb-tree > li ul [data-id="p1"]');
  assert.ok(nested, 'p1 is a child of c1');
});

test('drawer shows progress updates and the composer; English labels', async () => {
  const { B, paint, click, document, calls } = load({ lang:'en' });
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; B._ui.person = 'e1'; paint();
  click('.okb-btn[data-okr="open-o"][data-id="p1"]');
  await new Promise(r => setTimeout(r, 0));
  assert.ok(calls.some(c => c[0] === 'GET' && c[1] === '/objectives/p1/updates'));
  const drawer = document.getElementById('overlay-root').textContent;
  assert.match(drawer, /Progress updates/);
  assert.match(drawer, /Aligned up to: /);
  assert.ok(document.querySelector('#okr-update textarea'));
});

test('user-entered titles are escaped', () => {
  const evil = { ...objectives[1], id:'x1', title:'<img src=x onerror=alert(1)>' };
  const { B, document, state } = load();
  state.objectives = [evil]; state.krs = [];
  B._ui.cycle = '2026-10'; B._ui.tab = 'team'; B._ui.person = 'e1';
  document.getElementById('app').innerHTML = B.render();
  assert.equal(document.querySelectorAll('#app img').length, 0);
});
