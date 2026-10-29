import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

const source=readFileSync(new URL('../dist/company-support.js',import.meta.url),'utf8');

async function harness(body,language='zh'){
  const {document}=parseHTML('<html><body><main id="mount"></main><div id="modal"></div></body></html>');
  const handlers={},calls=[],policy=Object.freeze({body,status:'draft',enabled:false});
  document.addEventListener=(name,handler)=>{handlers[name]=handler;};
  const window={location:{hash:'#support'}};
  const answer=Object.freeze({id:'answer-fixture',title:'Example source',body:'# Original source\n\n**Keep these exact source markers**',note:'Fictional fixture only',sources:[],contentHash:'fixture-hash'});
  const api={get:async path=>{
    calls.push(['get',path]);
    if(path==='/support/sla')return {policy};
    if(path==='/support/summary')return {connected:true,stale:false,counts:{}};
    if(path==='/support/answers')return {items:[answer]};
    return {items:[]};
  },post:async(...args)=>{calls.push(['post',...args]);throw new Error('Formatting must not write data');}};
  vm.runInNewContext(source,{window,document,URL,Date,FormData});
  const ui=window.CompanySupport;
  const options={api,actor:{id:'reviewer-fixture',supportAccess:{read:true,review:true}},language,view:'support',changed:()=>{},showModal:(title,html)=>{document.querySelector('#modal').innerHTML=html;}};
  ui.configure(options);await ui.refresh();
  const click=dataset=>handlers.click({target:{closest:()=>({dataset,hasAttribute:()=>false})}});
  await click({companyTab:'sla'});
  const render=()=>{document.querySelector('#mount').innerHTML=ui.support();return document.querySelector('.company-document');};
  return {ui,options,policy,answer,calls,document,click,render};
}

test('SLA renders actual headings, emphasis, a table, lists and code instead of raw Markdown',async()=>{
  const body=['# Example service proposal','','**Example timing basis:** keep source values.','','Metric | Draft target | Condition','--- | --- | ---','Alpha | 7 sample hours | After a human response','Beta | 11 sample days | Owner confirmation','','## Example procedure','','- Inspect the current record.','- Keep `fixtureDueAt` as a field name.','','1. Gather the evidence.','2. Ask the reviewer.'].join('\n');
  const h=await harness(body),article=h.render();
  assert.ok(article,'SLA must use a semantic document container');
  assert.ok([...article.querySelectorAll('h1,h2,h3,h4,h5,h6')].some(n=>n.textContent==='Example service proposal'));
  assert.ok([...article.querySelectorAll('h1,h2,h3,h4,h5,h6')].some(n=>n.textContent==='Example procedure'));
  assert.equal(article.querySelector('strong')?.textContent,'Example timing basis:');
  assert.equal(article.querySelectorAll('table thead th').length,3);
  assert.equal(article.querySelectorAll('table tbody tr').length,2);
  assert.deepEqual([...article.querySelectorAll('table tbody tr')].map(row=>[...row.querySelectorAll('td')].map(cell=>cell.textContent)),[['Alpha','7 sample hours','After a human response'],['Beta','11 sample days','Owner confirmation']]);
  assert.equal(article.querySelectorAll('ul li').length,2);
  assert.equal(article.querySelectorAll('ol li').length,2);
  assert.equal(article.querySelector('code')?.textContent,'fixtureDueAt');
  assert.doesNotMatch(article.textContent,/# Example|\*\*Example timing|--- \| ---|`fixtureDueAt`/);
});

test('SLA formatting preserves source values and draft state across UI languages without writes',async()=>{
  const body='# Fictional proposal\n\n**Pending approval.** The proposed value is 17; unavailable data stays unknown.\n\n- Not an active customer promise.';
  const h=await harness(body),first=h.render();
  const html=first.innerHTML;
  assert.match(h.document.querySelector('#mount').textContent,/尚未生效/);
  h.ui.configure({...h.options,language:'en'});
  const next=h.render();
  assert.equal(next.innerHTML,html,'Interface translation must not rewrite source prose');
  assert.match(h.document.querySelector('#mount').textContent,/Not active/);
  assert.equal(h.policy.body,body);
  assert.equal(h.policy.status,'draft');
  assert.equal(h.policy.enabled,false);
  assert.equal(h.calls.some(([method])=>method!=='get'),false);
});

test('untrusted SLA markup stays text and cannot inject application actions or executable links',async()=>{
  const body=['# **<img src=x onerror="alert(1)">**','','<script>alert("fixture")</script>','<button data-live-action="logout">Do not execute</button>','','[Unsafe](javascript:alert(1))','[External](https://example.test/fixture)','','`**literal code** <svg onload=alert(1)>`','','| **<iframe src="https://example.test/">** | Safe |','| --- | --- |','| <form data-company-review> | `fixture-field` |'].join('\n');
  const h=await harness(body),article=h.render();
  assert.ok(article);
  assert.equal(article.querySelectorAll('script,img,svg,iframe,form,button,[data-live-action],[data-company-review],[onerror],[onload]').length,0);
  assert.equal(article.querySelectorAll('a').length,0,'SLA source links are not active controls');
  assert.match(article.textContent,/<img src=x onerror="alert\(1\)">/);
  assert.match(article.textContent,/<script>alert\("fixture"\)<\/script>/);
  const code=[...article.querySelectorAll('code')].find(n=>n.textContent.includes('literal code'));
  assert.equal(code?.textContent,'**literal code** <svg onload=alert(1)>');
  assert.equal(code?.querySelectorAll('strong,svg').length,0);
});

test('table parsing preserves escaped and inline-code pipes without shifting columns',async()=>{
  const body=['| Metric | Example | Condition |','| :--- | ---: | :---: |','| Alpha \\| Beta | `fieldA|fieldB` | **Keep this condition** |','| Gamma | 23 | unchanged |','| | 31 | missing metric |','| Delta | 37 | |'].join('\n');
  const h=await harness(body),article=h.render();
  const rows=[...article.querySelectorAll('tbody tr')];
  assert.equal(rows.length,4);
  assert.deepEqual([...rows[0].querySelectorAll('td')].map(n=>n.textContent),['Alpha | Beta','fieldA|fieldB','Keep this condition']);
  assert.equal(rows[0].querySelector('code')?.textContent,'fieldA|fieldB');
  assert.equal(rows[0].querySelector('strong')?.textContent,'Keep this condition');
  assert.equal(rows[1].querySelectorAll('td').length,3);
  assert.deepEqual([...rows[2].querySelectorAll('td')].map(n=>n.textContent),['','31','missing metric']);
  assert.deepEqual([...rows[3].querySelectorAll('td')].map(n=>n.textContent),['Delta','37','']);
});

test('heading text keeps literal trailing hash characters while closing Markdown markers are removed',async()=>{
  const h=await harness('# Example C#\n\n## Example closing heading ##'),article=h.render();
  assert.deepEqual([...article.querySelectorAll('h2,h3')].map(n=>n.textContent),['Example C#','Example closing heading']);
});

test('SLA formatting does not reinterpret standard response source or change its review form',async()=>{
  const h=await harness('# Fictional SLA');h.render();
  await h.click({companyAnswer:'answer-fixture'});
  const modal=h.document.querySelector('#modal'),prose=modal.querySelector('pre.company-prose');
  assert.equal(prose?.textContent,h.answer.body);
  assert.equal(prose?.querySelectorAll('strong,h1,h2,h3').length,0);
  assert.ok(modal.querySelector('[data-company-review][data-hash="fixture-hash"]'));
  assert.equal(h.calls.some(([method])=>method==='post'),false);
});
