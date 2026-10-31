import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const read = f => readFileSync(new URL('../dist/' + f, import.meta.url), 'utf8');
const live = read('live-app.js');

function load(files, state) {
  const { window, document } = parseHTML('<!doctype html><html><body><div id="app"></div><div id="overlay-root"></div></body></html>');
  const context = { window, document, requestAnimationFrame:fn => fn(), Intl, Date, console, URL, Image:class {} };
  for (const f of files) vm.runInNewContext(read(f), context);
  const calls = [];
  const api = { get:async p => { calls.push(['GET', p]); return { items:[] }; }, post:async (p, b) => { calls.push(['POST', p, b]); return {}; }, delete:async p => { calls.push(['DELETE', p]); return {}; }, request:async (p, o) => { calls.push([o.method, p, o.body]); return {}; } };
  const ctx = { api, state:() => state, lang:() => 'zh', rerender:() => {}, toast:() => {}, explainError:e => e.message, openTask:() => {}, newTask:() => {}, refreshMe:async () => {}, apiBase:'/api', overlay:() => {}, closeOverlay:() => {}, modal:() => {} };
  window.WorkOSPeople?.configure(ctx); window.WorkOSProducts?.configure(ctx);
  return { window, document, calls };
}
const baseState = (actor, extra = {}) => ({ actor, capabilities:{ orgProfiles:true }, directory:[actor], tasks:[], objectives:[], krs:[], page:'overview', ...extra });

test('sidebar has the four sections in the requested order, and restricted pages are gated', () => {
  const block = live.match(/const navs = \[([\s\S]*?)\];/)[1];
  const order = [...block.matchAll(/\['([a-z-]+)','[a-z]+','([^']+)','[^']+','([a-z]+)'\]/g)].map(m => [m[1], m[2], m[3]]);
  const ids = s => order.filter(o => o[2] === s).map(o => o[0]);
  assert.deepEqual(ids('work'), ['okr', 'projects', 'tasks']);
  assert.deepEqual(ids('reports'), ['overview', 'team', 'project-analysis']);
  assert.deepEqual(ids('labs'), ['support', 'knowledge', 'executive', 'products']);
  assert.deepEqual(ids('other'), ['integrations', 'settings', 'org']);
  assert.match(live, /products:!!window\.WorkOSProducts && \(state\.actor\?\.grants\|\|\[\]\)\.includes\('products'\)/);
  assert.match(live, /org:!!window\.WorkOSPeople && state\.actor\?\.isAdmin===true/);
  assert.match(live, /products: \(\) => window\.WorkOSProducts && \(state\.actor\.grants\|\|\[\]\)\.includes\('products'\)/, 'direct URL is gated too');
});

test('cost breakdown is shown only with product_cost_detail; final cost is always shown', () => {
  const basic = load(['products.js'], baseState({ id:'u2', display_name:'Yong', grants:['products'] }));
  basic.window.WorkOSProducts._ui.tab = 'cost';
  const html = basic.window.WorkOSProducts.render();
  assert.match(html, /最终成本/);
  assert.doesNotMatch(html, /成本构成|出厂价|到岸成本|毛利率/);
  const full = load(['products.js'], baseState({ id:'u1', display_name:'KC', grants:['products', 'product_cost_detail'] }));
  full.window.WorkOSProducts._ui.tab = 'cost';
  const fhtml = full.window.WorkOSProducts.render();
  assert.match(fhtml, /成本构成/); assert.match(fhtml, /出厂价/); assert.match(fhtml, /毛利率/);
});

test('cost model adds up and replenishment rounds to MOQ', () => {
  const { window } = load(['products.js'], baseState({ id:'u1', display_name:'KC', grants:['products', 'product_cost_detail'] }));
  const D = window.WorkOSProducts._data, p = D.products.find(x => x.sku === 'XRF-100'), c = D.cost(p);
  const sum = c.lines.reduce((s, l) => s + l[2], 0) + c.fulfil.reduce((s, l) => s + l[2], 0);
  assert.ok(Math.abs(sum - c.total) < 1e-9);
  const s = D.supply(p);
  assert.equal(s.qty % p.moq, 0);
  assert.equal(s.qty, 10); // 0.25/day × (65 lead + 14 safety + 45 cover) − 21 pipeline = 10 → MOQ 5
  assert.equal(s.state, 'stockout');
});

test('team analysis empty state explains reporting lines; workbench lists items needing attention', () => {
  const actor = { id:'u1', display_name:'KC', isAdmin:true };
  const { window } = load(['people.js'], baseState(actor, { tasks:[
    { id:'a', title:'Overdue thing', owner_id:'u1', reviewer_id:'u2', status:'planned', due_at:'2020-01-01T00:00:00Z' },
    { id:'b', title:'Review me', owner_id:'u2', reviewer_id:'u1', status:'submitted', due_at:'2099-01-01T00:00:00Z' },
  ] }));
  window.WorkOSPeople._ui.team = { members:[], canViewAll:true, scope:'reports' };
  assert.match(window.WorkOSPeople.team(), /还没有人向你汇报/);
  const wb = window.WorkOSPeople.workbench();
  assert.match(wb, /待我验收[\s\S]*Review me/);
  assert.match(wb, /已逾期[\s\S]*Overdue thing/);
});

test('settings show contact fields; org page escapes names and offers grant toggles', () => {
  const actor = { id:'u1', display_name:'KC', title:'President', phone:'+1', isAdmin:true, grants:['products'] };
  const { window } = load(['people.js'], baseState(actor));
  const st = window.WorkOSPeople.settings();
  for (const n of ['title', 'phone', 'email', 'wechat', 'location', 'timezone']) assert.match(st, new RegExp(`name="${n}"`));
  window.WorkOSPeople._ui.org = { items:[{ id:'x', display_name:'<b>evil</b>', role:'employee', grants:[], active:true }, { ...actor, role:'manager', active:true, admin:true, adminSource:'deployment' }] };
  const org = window.WorkOSPeople.org();
  assert.doesNotMatch(org, /<b>evil<\/b>/);
  assert.match(org, /data-pp-grant="products"/);
  assert.match(org, /data-pp-grant="product_cost_detail" data-id="x"[^>]*disabled/, 'cost detail requires product access first');
});
