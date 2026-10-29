import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {randomUUID} from 'node:crypto';
const code=await readFile(new URL('../dist/wiki-assistant.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(setImmediate);};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve};};
async function harness({hash='#knowledge/article/en-38',overrides=()=>undefined}={}){
  const {window,document}=parseHTML('<!doctype html><html><body></body></html>');
  const calls=[];window.location={origin:'https://craftos.app',hash};
  window.fetch=async(url,options)=>{const path=new URL(url,window.location.origin).pathname;calls.push({path,options,body:options.body?JSON.parse(options.body):null});const result=overrides(path,options);if(result!==undefined)return result;if(path.endsWith('/config'))return response({enabled:true,modelReady:false,contactUrl:'https://www.1laser.com/pages/contact-us'});if(path.endsWith('/sessions'))return response({sessionId:'session-fixture',sessionToken:'secret-only-in-memory',expiresAt:'2099-01-01T00:00:00Z'});if(path.endsWith('/messages'))return response({messageId:'message-fixture',status:'sources_only',answer:'Found these guides <img src=x onerror="evil()">',sources:[{articleId:'en-38',title:'Software & APP',excerpt:'Original source text.'},{articleId:'../../private',title:'Not allowed'}],modelUsed:false});if(path.endsWith('/handoffs'))return response({requestId:'request-fixture',status:'received',reference:'SUP-TEST-1'});return response({recorded:true});};
  vm.runInNewContext(code,{window,document,URL,Date,AbortController,setTimeout,clearTimeout,crypto:{randomUUID}});
  const ui=window.WikiAssistant;ui.configure({active:true,language:'en',apiBase:'/api'});await flush();
  const click=async selector=>{const node=document.querySelector(selector);assert.ok(node,'Missing '+selector);node.dispatchEvent(new window.Event('click',{bubbles:true}));await flush();};
  const input=(selector,value)=>{const node=document.querySelector(selector);assert.ok(node);node.value=value;node.dispatchEvent(new window.Event('input',{bubbles:true}));};
  const submit=async selector=>{document.querySelector(selector).dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await flush();};
  return {window,document,ui,calls,click,input,submit};
}
test('visitor chat omits staff cookies, binds article context, safely renders sources and keeps session secrets out of DOM',async()=>{
  const h=await harness();await h.click('.assistant-launcher');h.input('[name="wiki-message"]','How do I install LightBurn?');await h.submit('[data-wiki-chat]');
  assert.equal(h.calls.find(c=>c.path.endsWith('/messages')).body.context.articleId,'en-38');
  assert.equal(h.calls.every(c=>c.options.credentials==='omit'),true);
  assert.equal(h.calls.some(c=>c.path.includes('/auth/')),false);
  assert.equal(h.document.querySelectorAll('.assistant-source').length,1);
  assert.equal(h.document.querySelector('.assistant-source').getAttribute('href'),'#knowledge/article/en-38');
  assert.equal(h.document.querySelector('[onerror]'),null);
  assert.match(h.document.querySelector('.assistant-thread').textContent,/Found these guides <img/);
  assert.doesNotMatch(h.document.body.innerHTML,/secret-only-in-memory/);
  assert.equal(h.document.querySelector('[name="wiki-message"]').value,'');
  assert.match(h.document.querySelector('.assistant-composer').textContent,/Guide search and support requests are available/);
});
test('draft and handoff input survive host configuration and language changes',async()=>{
  const h=await harness();await h.click('.assistant-launcher');h.input('[name="wiki-message"]','Unsaved question 中文');h.ui.configure({active:true,language:'zh',apiBase:'/api'});
  assert.equal(h.document.querySelector('[name="wiki-message"]').value,'Unsaved question 中文');
  await h.click('[data-wiki-handoff-open]');h.input('[name="contactEmail"]','customer@example.com');h.input('[name="summary"]','Keep this complete support summary.');
  h.ui.configure({active:true,language:'en',apiBase:'/api'});
  assert.equal(h.document.querySelector('[name="contactEmail"]').value,'customer@example.com');assert.equal(h.document.querySelector('[name="summary"]').value,'Keep this complete support summary.');
});
test('an unconfirmed send preserves input and reuses the request ID on explicit retry',async()=>{
  let attempts=0;const h=await harness({overrides:path=>path.endsWith('/messages')&&++attempts===1?Promise.reject(new Error('timeout')):undefined});
  await h.click('.assistant-launcher');h.input('[name="wiki-message"]','Question retained after network error');await h.submit('[data-wiki-chat]');
  assert.equal(h.document.querySelector('[name="wiki-message"]').value,'Question retained after network error');assert.match(h.document.querySelector('[role="alert"]').textContent,/not confirmed/);
  await h.submit('[data-wiki-chat]');const calls=h.calls.filter(c=>c.path.endsWith('/messages'));assert.equal(calls.length,2);assert.equal(calls[0].body.requestId,calls[1].body.requestId);
  assert.equal(h.document.querySelectorAll('.assistant-user').length,1);
});
test('unsolved feedback is persisted and prepares a customer-confirmed handoff with an honest reference',async()=>{
  const h=await harness();await h.click('.assistant-launcher');h.input('[name="wiki-message"]','My Hydra machine is not connecting');await h.submit('[data-wiki-chat]');
  await h.click('[data-helpful="false"]');assert.equal(h.calls.find(c=>c.path.endsWith('/feedback')).body.helpful,false);
  assert.ok(h.document.querySelector('[data-wiki-handoff]'));
  h.input('[name="contactEmail"]','customer@example.com');const consent=h.document.querySelector('[name="consent"]');consent.checked=true;consent.dispatchEvent(new h.window.Event('change',{bubbles:true}));await h.submit('[data-wiki-handoff]');
  assert.equal(h.calls.find(c=>c.path.endsWith('/handoffs')).body.consent,true);
  assert.match(h.document.querySelector('.assistant-handoff').textContent,/SUP-TEST-1/);assert.match(h.document.querySelector('.assistant-handoff').textContent,/not a Zoho ticket/);
});
test('late session responses after resetting the assistant do not send an old question',async()=>{
  const pending=deferred(),h=await harness({overrides:path=>path.endsWith('/sessions')?pending.promise:undefined});await h.click('.assistant-launcher');h.input('[name="wiki-message"]','Old private question');await h.submit('[data-wiki-chat]');h.ui.reset();
  pending.resolve(response({sessionId:'old-session',sessionToken:'old-secret',expiresAt:'2099-01-01T00:00:00Z'}));await flush();
  assert.equal(h.calls.filter(c=>c.path.endsWith('/messages')).length,0);assert.doesNotMatch(h.document.body.textContent,/Old private question|old-secret/);
});

test('privacy notice follows server retention configuration and remains bilingual without a training promise',async()=>{
  const h=await harness({overrides:path=>path.endsWith('/config')?response({enabled:true,modelReady:false,retentionDays:14}):undefined});await h.click('.assistant-launcher');
  assert.match(h.document.querySelector('.assistant-privacy').textContent,/removal after 14 days/);assert.match(h.document.querySelector('.assistant-privacy').textContent,/support requests/);assert.doesNotMatch(h.document.querySelector('.assistant-privacy').textContent,/train/i);
  h.ui.configure({active:true,language:'zh'});assert.match(h.document.querySelector('.assistant-privacy').textContent,/14 天后定期清理/);
});
test('expired or stuck session offers a new conversation while retaining unsent input and clearing old contact fields',async()=>{
  let fail=true;const h=await harness({overrides:path=>path.endsWith('/messages')&&fail?response({error:{code:'PUBLIC_SESSION_INVALID'}},401):undefined});await h.click('.assistant-launcher');h.input('[name="wiki-message"]','Keep this question on session reset');await h.submit('[data-wiki-chat]');
  assert.match(h.document.querySelector('[role="alert"]').textContent,/conversation expired/);
  await h.click('[data-wiki-handoff-open]');h.input('[name="contactEmail"]','old-contact@example.com');await h.click('.assistant-error [data-wiki-assistant-new]');
  assert.equal(h.document.querySelector('[name="wiki-message"]').value,'Keep this question on session reset');assert.equal(h.document.querySelector('[data-wiki-handoff]'),null);assert.equal(h.document.querySelector('[role="alert"]'),null);
  fail=false;await h.submit('[data-wiki-chat]');assert.equal(h.calls.filter(c=>c.path.endsWith('/sessions')).length,2);assert.equal(h.document.querySelectorAll('.assistant-user').length,1);
  await h.click('[data-wiki-handoff-open]');assert.equal(h.document.querySelector('[name="contactEmail"]').value,'');
});
