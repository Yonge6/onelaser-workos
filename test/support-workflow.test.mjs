import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {parseHTML} from 'linkedom';

const code=readFileSync(new URL('../dist/company-support.js',import.meta.url),'utf8');
const sourceHash='b'.repeat(64),draftHash='a'.repeat(64);

async function harness({post=async()=>({id:randomUUID()}),summary={},review=true,shopifyConfig={configured:false,shop:null,mode:'read_only'}}={}){
  const {document}=parseHTML('<html><body><main></main><div id="modal"></div></body></html>');
  const handlers={},calls=[];document.addEventListener=(type,fn)=>(handlers[type]??=[]).push(fn);
  const ticket={id:'t1',number:'fixture-1',subject:'Fictional laser setup',status:'Open',revision:3,contentHash:sourceHash,reasons:[]};
  const detail={ticket,connected:true,stale:false,drafts:[{id:'d1',version:2,status:'pending',createdAt:new Date().toISOString(),body:'Original fictional draft',contentHash:draftHash,sources:[],quality:{engine:'rules',status:'needs_review',flags:[{code:'unverified_promise',severity:'warning',message:'Check <img src=x onerror=evil> promise',excerpt:'<script>literal evidence</script>'}]}}],edits:[],reviews:[],sentReplies:[{id:'s1',sentAt:new Date().toISOString(),agentName:'Fixture agent',observedAt:new Date().toISOString(),body:'Actual fictional reply'}],replySync:{status:'ready'},handovers:[],handoverPeople:[{id:'staff',display_name:'Fixture staff',canAccept:true},{id:'receiver',display_name:'Fixture receiver',canAccept:true},{id:'boss',display_name:'Fixture boss',canAccept:false}]};
  const responses={
    '/support/library':{items:[]},'/support/tickets':{items:[ticket]},'/support/tickets/t1':detail,
    '/support/summary':{connected:true,stale:false,...summary},'/support/answers':{items:[]},'/support/sla':{},
    '/support/public-inbox':{items:[{id:'i1',kind:'handoff',reference:'REQ-FIXTURE',contactEmail:'fixture@example.test',summary:'<script>customer text</script>',status:'pending',createdAt:new Date().toISOString()}]},
    '/support/knowledge-candidates':{items:[{id:'k1',title:'Fictional candidate',body:'Literal <button data-live-action=logout>content</button>',contentHash:sourceHash,status:'pending',createdAt:new Date().toISOString()}]},
    '/support/public-knowledge':{items:[{id:'en-1',title:'Fixture guide',contentHash:sourceHash,eligible:false,family:'general',updatedAt:null}]},
    '/support/shopify/config':shopifyConfig
  };
  const api={get:async path=>responses[path]||{items:[]},post:async(path,payload)=>{calls.push({path,payload});return post(path,payload);}};
  function bindForms(){
    for(const form of document.querySelectorAll('form')){
      Object.defineProperty(form,'elements',{configurable:true,value:new Proxy({}, {get:(_,key)=>form.querySelector(`[name="${String(key)}"]`)})});
      for(const select of form.querySelectorAll('select')){
        Object.defineProperty(select,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')??this.querySelector('option')?.getAttribute('value')??'';},set(value){for(const option of this.querySelectorAll('option')){if(option.getAttribute('value')===value)option.setAttribute('selected','');else option.removeAttribute('selected');}}});
        Object.defineProperty(select,'selectedOptions',{configurable:true,get(){return [...this.querySelectorAll('option')].filter(option=>option.getAttribute('value')===this.value);}});
      }
      for(const check of form.querySelectorAll('input[type=checkbox]'))check.checked=check.hasAttribute('checked');
    }
  }
  const FormData=class{constructor(form){this.form=form;}get(name){const field=this.form.querySelector(`[name="${name}"]`);return field?.type==='checkbox'?(field.checked?'on':null):field?.value??null;}};
  const window={location:{hash:'#support'}};
  vm.runInNewContext(code,{window,document,URL,Date,FormData,crypto:{randomUUID}});
  const options={api,actor:{id:'staff',display_name:'Fixture staff',supportAccess:{read:true,edit:true,review}},language:'en',view:'support',changed:()=>render(),showModal:(_,body)=>{document.querySelector('#modal').innerHTML=body;bindForms();}};
  const ui=window.CompanySupport;function render(){document.querySelector('main').innerHTML=ui.support();}
  ui.configure(options);await ui.refresh();render();
  async function emit(type,target){for(const fn of handlers[type]||[])await fn({target,preventDefault(){}});}
  const click=selector=>emit('click',document.querySelector(selector));
  return {document,ui,options,calls,detail,responses,emit,click,render};
}

test('quality findings are labeled rules and unsafe evidence remains text',async()=>{
  const h=await harness();await h.click('[data-company-ticket]');
  const panel=h.document.querySelector('.support-quality-check');
  assert.match(panel.textContent,/Rule checks/);assert.match(panel.textContent,/<img src=x onerror=evil>/);
  assert.match(panel.textContent,/<script>literal evidence<\/script>/);
  assert.equal(panel.querySelectorAll('img,script,[onerror]').length,0);
  assert.equal(h.calls.length,0);
});

test('reply feedback requires deliberate sent-mail pairing and saves reason/outcome binding',async()=>{
  const h=await harness();await h.click('[data-company-ticket]');
  const form=h.document.querySelector('[data-company-reply-edit]');
  form.elements.body.value='Corrected fictional reply';form.elements.reasonNote.value='Verified against the fixture guide';
  form.querySelector('[name="reasonCodes"][value="facts"]').checked=true;
  form.querySelector('[name="reasonCodes"][value="technical"]').checked=true;
  form.elements.outcome.value='unresolved';form.elements.sentReplyId.value='s1';
  await h.emit('change',form.elements.sentReplyId);assert.equal(form.elements.pairingConfirmed.disabled,false);
  await h.emit('submit',form);assert.equal(h.calls.length,0);assert.match(form.querySelector('[role=alert]').textContent,/confirm/);
  form.elements.pairingConfirmed.checked=true;await h.emit('submit',form);
  const {path,payload}=h.calls[0];assert.equal(path,'/support/tickets/t1/reply-edits');
  assert.equal(payload.draftId,'d1');assert.equal(payload.draftHash,draftHash);assert.equal(payload.sentReplyId,'s1');assert.equal(payload.pairingConfirmed,true);
  assert.deepEqual([...payload.reasonCodes],['facts','technical']);assert.equal(payload.reasonNote,'Verified against the fixture guide');assert.equal(payload.outcome,'unresolved');
  assert.match(h.document.querySelector('[data-company-edit-history]').textContent,/Fact correction/);
  assert.match(h.document.querySelector('[data-company-edit-history]').textContent,/s1/);
  assert.match(h.document.querySelector('[data-company-edit-history] > details > summary').textContent,/AI v2/);
  assert.equal(h.document.querySelector('[data-company-edit-history] > details > details pre').textContent,'Original fictional draft');
});

test('saved history retains the submitted draft snapshot while the selection or source changes during save',async()=>{
  let finish;const h=await harness({post:()=>new Promise(resolve=>finish=resolve)});
  h.detail.drafts.push({...h.detail.drafts[0],id:'d2',version:7,contentHash:'c'.repeat(64),body:'Different later draft'});
  await h.click('[data-company-ticket]');const form=h.document.querySelector('[data-company-reply-edit]');form.elements.draftId.value='d1';form.elements.body.value='Submitted staff revision';
  const pending=h.emit('submit',form);
  assert.equal(h.calls[0].payload.draftId,'d1');assert.equal(h.calls[0].payload.draftHash,draftHash);
  form.elements.draftId.value='d2';form.elements.body.value='Newer unsaved staff change';
  h.document.querySelector('[data-company-draft-body="d1"]').textContent='DOM source replaced while save was pending';
  finish({id:randomUUID()});await pending;
  const record=h.document.querySelector('[data-company-edit-history] > details');
  assert.match(record.querySelector(':scope > summary').textContent,/AI v2/);assert.doesNotMatch(record.querySelector(':scope > summary').textContent,/No linked draft|AI v7/);
  assert.equal(record.querySelector(':scope > pre').textContent,'Submitted staff revision');
  assert.equal(record.querySelector(':scope > details pre').textContent,'Original fictional draft');
  assert.equal(form.elements.body.value,'Newer unsaved staff change');assert.equal(form.elements.draftId.value,'d2');
});

test('saving an intentionally unlinked revision does not invent draft history',async()=>{
  const h=await harness();await h.click('[data-company-ticket]');const form=h.document.querySelector('[data-company-reply-edit]');
  form.elements.draftId.value='';form.elements.body.value='Independent staff revision';await h.emit('submit',form);
  const record=h.document.querySelector('[data-company-edit-history] > details');
  assert.equal(h.calls[0].payload.draftId,null);assert.match(record.querySelector(':scope > summary').textContent,/No linked draft/);assert.equal(record.querySelector(':scope > details'),null);
});

test('changing source selection clears pairing confirmation, copying sent mail retains its source',async()=>{
  const h=await harness();await h.click('[data-company-ticket]');const form=h.document.querySelector('[data-company-reply-edit]');
  await h.click('[data-company-copy-sent]');assert.equal(form.elements.sentReplyId.value,'s1');assert.equal(form.elements.body.value,'Actual fictional reply');assert.equal(form.elements.pairingConfirmed.checked,false);
  form.elements.pairingConfirmed.checked=true;await h.emit('change',form.elements.draftId);assert.equal(form.elements.pairingConfirmed.checked,false);
});

test('failed reply retry is idempotent while edited feedback creates a distinct request',async()=>{
  const h=await harness({post:async()=>{throw new Error('fixture conflict');}});await h.click('[data-company-ticket]');
  const form=h.document.querySelector('[data-company-reply-edit]');form.elements.body.value='Keep this fixture';form.elements.reasonNote.value='Keep my reasoning';
  await h.emit('submit',form);await h.emit('submit',form);assert.equal(h.calls[0].payload.requestId,h.calls[1].payload.requestId);
  form.elements.reasonNote.value='Changed reasoning';await h.emit('submit',form);assert.notEqual(h.calls[1].payload.requestId,h.calls[2].payload.requestId);
  assert.equal(form.elements.body.value,'Keep this fixture');assert.equal(form.elements.reasonNote.value,'Changed reasoning');
  h.ui.configure({...h.options,language:'zh'});assert.equal(h.document.querySelector('[data-company-reply-edit]'),form);assert.equal(form.elements.reasonNote.value,'Changed reasoning');
});

test('handover uses exact ticket source, authorized receiver options and own acceptance',async()=>{
  const h=await harness();await h.click('[data-company-ticket]');const form=h.document.querySelector('[data-company-handover]');
  assert.equal(form.querySelector('[name=receiverId] option[value=boss]'),null);assert.ok(form.querySelector('[name=ownerId] option[value=boss]'));
  form.elements.confirmedFacts.value='Verified fixture fact';form.elements.triedSteps.value='Step and observed result';form.elements.commitments.value='No ETA was promised';form.elements.blockers.value='Awaiting a photograph';form.elements.nextAction.value='Ask for the fixture image';form.elements.ownerId.value='boss';form.elements.receiverId.value='receiver';form.elements.status.value='accepted';
  await h.emit('submit',form);assert.equal(h.calls.length,0);assert.match(form.querySelector('[role=alert]').textContent,/Only the selected receiver/);
  form.elements.status.value='open';await h.emit('submit',form);
  assert.equal(h.calls[0].path,'/support/tickets/t1/handovers');assert.equal(h.calls[0].payload.ticketHash,sourceHash);assert.equal(h.calls[0].payload.ticketRevision,3);assert.equal(h.calls[0].payload.nextAction,'Ask for the fixture image');
  assert.equal(h.calls[0].payload.ownerId,'boss');assert.equal(h.calls[0].payload.receiverId,'receiver');assert.equal(h.calls[0].payload.nextFollowupAt,null);
  assert.match(h.document.querySelector('[data-company-handover-history]').textContent,/Verified fixture fact/);
});

test('handover retry retains fields and preserves request identity after a failed save',async()=>{
  const h=await harness({post:async()=>{throw new Error('fixture conflict');}});await h.click('[data-company-ticket]');const form=h.document.querySelector('[data-company-handover]');
  form.elements.nextAction.value='Keep the proposed next action';form.elements.blockers.value='Awaiting verified information';
  await h.emit('submit',form);await h.emit('submit',form);
  assert.equal(h.calls.length,2);assert.equal(h.calls[0].payload.requestId,h.calls[1].payload.requestId);assert.equal(form.elements.blockers.value,'Awaiting verified information');
  assert.match(form.querySelector('[role=alert]').textContent,/input is retained/);
});

test('quality summary reports coverage and does not fill unavailable metrics with zero',async()=>{
  const h=await harness({summary:{quality:{engine:'rules',draftsChecked:4,flaggedDrafts:2,unknownInboundDrafts:1},workflow:{pairedRevisions:1,handovers:2,resolvedRevisions:0},coverage:{ticketsWithInboundId:2,totalTickets:5}}});
  await h.click('[data-company-tab=quality]');const text=h.document.querySelector('main').textContent;
  assert.match(text,/2 \/ 5/);assert.match(text,/Drafts checked/);assert.match(text,/rather than an AI quality score/);
  const empty=await harness();await empty.click('[data-company-tab=quality]');assert.match(empty.document.querySelector('main').textContent,/—/);
});

test('visitor inbox and knowledge candidate content cannot execute markup',async()=>{
  const h=await harness();await h.click('[data-company-tab=publicInbox]');
  assert.match(h.document.querySelector('main').textContent,/REQ-FIXTURE/);assert.match(h.document.querySelector('main').textContent,/<script>customer text<\/script>/);assert.equal(h.document.querySelectorAll('main script').length,0);
  await h.click('[data-company-tab=candidates]');assert.equal(h.document.querySelectorAll('main [data-live-action]').length,0);assert.match(h.document.querySelector('main').textContent,/Literal <button/);
});

test('candidate and public source approvals require explicit confirmation and exact version hash',async()=>{
  const h=await harness();await h.click('[data-company-tab=candidates]');await h.click('[data-company-candidate]');let form=h.document.querySelector('[data-company-candidate-review]');
  form.elements.note.value='Fixture evidence checked';form.elements.decision.value='approved';await h.emit('submit',form);assert.equal(h.calls.length,0);
  form.elements.humanConfirmation.checked=true;await h.emit('submit',form);assert.equal(h.calls[0].path,'/support/knowledge-candidates/k1/reviews');assert.equal(h.calls[0].payload.contentHash,sourceHash);assert.equal(h.calls[0].payload.humanConfirmation,true);
  await h.click('[data-company-tab=publicKnowledge]');await h.click('[data-company-public-knowledge]');form=h.document.querySelector('[data-company-candidate-review]');form.elements.note.value='Current source version checked';form.elements.humanConfirmation.checked=true;await h.emit('submit',form);
  assert.equal(h.calls[1].path,'/support/public-knowledge/en-1/reviews');assert.equal(h.calls[1].payload.contentHash,sourceHash);assert.equal(h.calls[1].payload.decision,'changes_requested');
});

test('read-only support users do not receive candidate or source review controls',async()=>{
  const h=await harness({review:false});await h.click('[data-company-tab=publicKnowledge]');assert.equal(h.document.querySelector('[data-company-public-knowledge]'),null);
  await h.click('[data-company-tab=candidates]');assert.equal(h.document.querySelector('[data-company-candidate]'),null);
});

test('unsaved ticket inputs survive reopening, changed sources retain a separate copy, signout clears them',async()=>{
  const h=await harness();await h.click('[data-company-ticket]');let form=h.document.querySelector('[data-company-reply-edit]');
  form.elements.body.value='Unsaved fixture text';form.elements.reasonNote.value='Unsubmitted reason';await h.emit('input',form.elements.body);await h.emit('input',form.elements.reasonNote);
  const handover=h.document.querySelector('[data-company-handover]');handover.elements.nextAction.value='Unsubmitted handover';await h.emit('input',handover.elements.nextAction);
  await h.click('[data-company-ticket]');form=h.document.querySelector('[data-company-reply-edit]');assert.equal(form.elements.body.value,'Unsaved fixture text');assert.equal(form.elements.reasonNote.value,'Unsubmitted reason');assert.equal(h.document.querySelector('[data-company-handover]').elements.nextAction.value,'Unsubmitted handover');
  h.detail.ticket={...h.detail.ticket,revision:4,contentHash:'c'.repeat(64)};await h.click('[data-company-ticket]');form=h.document.querySelector('[data-company-reply-edit]');assert.equal(form.elements.body.value,'');assert.match(h.document.querySelector('.support-restored-draft').textContent,/Unsaved fixture text/);assert.match(h.document.querySelector('.support-restored-draft').textContent,/source changed/);
  h.ui.reset();h.ui.configure(h.options);await h.ui.refresh();h.render();await h.click('[data-company-ticket]');assert.equal(h.document.querySelector('[data-company-reply-edit]').elements.body.value,'');assert.equal(h.document.querySelector('.support-restored-draft'),null);
});

test('late handover save after signout does not append a private record',async()=>{
  let finish;const h=await harness({post:()=>new Promise(resolve=>finish=resolve)});await h.click('[data-company-ticket]');
  const form=h.document.querySelector('[data-company-handover]');form.elements.nextAction.value='Private pending action';const pending=h.emit('submit',form);h.ui.reset();h.document.querySelector('#modal').innerHTML='';finish({id:randomUUID()});await pending;
  assert.equal(h.document.querySelector('[data-company-handover-history]'),null);assert.doesNotMatch(h.document.body.textContent,/Private pending action/);
});

test('Shopify remains explicitly unavailable until store API configuration exists',async()=>{
  const h=await harness();await h.click('[data-company-tab=shopify]');const form=h.document.querySelector('[data-company-shopify-lookup]');
  assert.match(h.document.querySelector('main').textContent,/Awaiting store API authorization/);assert.equal(form.querySelector('button').disabled,true);
  form.querySelector('input').value='#1234';await h.emit('submit',form);assert.equal(h.calls.length,0);
});

test('exact order lookup shows distinct packages and carrier-delivered never means customer receipt',async()=>{
  const observedAt=new Date().toISOString();
  const h=await harness({shopifyConfig:{configured:true,shop:'fixture.myshopify.com',mode:'read_only'},post:async()=>({status:'ready',observedAt,orders:[{id:'gid://shopify/Order/1234',name:'#1234',createdAt:observedAt,updatedAt:observedAt,fulfillmentStatus:'PARTIALLY_FULFILLED',lineItems:[{title:'Fixture <script>machine</script>',quantity:1,currentQuantity:1}],fulfillments:[{id:'f1',status:'SUCCESS',displayStatus:'DELIVERED',trackingInfo:[{company:'UPS',number:'FIXTURE-TRACK',url:'https://example.test/tracking'}],deliveredAt:observedAt},{id:'f2',status:'OPEN',displayStatus:'IN_TRANSIT',trackingInfo:[{company:'Fixture carrier',number:'OTHER-TRACK',url:'javascript:alert(1)'}]}],customerReceiptConfirmed:false}]})});
  await h.click('[data-company-tab=shopify]');let form=h.document.querySelector('[data-company-shopify-lookup]');form.querySelector('input').value=' #1234 ';await h.emit('input',form.querySelector('input'));await h.emit('submit',form);
  assert.equal(h.calls[0].path,'/support/shopify/lookup');assert.deepEqual({...h.calls[0].payload},{orderNumber:'#1234'});
  const main=h.document.querySelector('main');assert.match(main.textContent,/Partially fulfilled/);assert.match(main.textContent,/Carrier marked delivered/);assert.match(main.textContent,/Customer receipt confirmation: Not verified/);assert.equal(main.querySelectorAll('.support-shipment').length,2);assert.equal(main.querySelectorAll('script,[href^="javascript:"]').length,0);assert.equal(main.querySelectorAll('.support-tracking-list a').length,1);assert.match(main.textContent,/Not provided/);
});

test('Shopify lookup preserves changed search text through pending results and discards a late signout response',async()=>{
  let finish;const h=await harness({shopifyConfig:{configured:true,shop:'fixture.myshopify.com',mode:'read_only'},post:()=>new Promise(resolve=>finish=resolve)});await h.click('[data-company-tab=shopify]');
  let form=h.document.querySelector('[data-company-shopify-lookup]');form.querySelector('input').value='#1234';const pending=h.emit('submit',form);
  form=h.document.querySelector('[data-company-shopify-lookup]');form.querySelector('input').value='#5678';await h.emit('input',form.querySelector('input'));h.ui.configure({...h.options,language:'zh'});h.render();assert.equal(h.document.querySelector('[data-company-shopify-query]').value,'#5678');
  h.ui.reset();h.document.querySelector('main').innerHTML='';finish({status:'ready',orders:[{name:'PRIVATE-ORDER'}],observedAt:new Date().toISOString()});await pending;assert.doesNotMatch(h.document.body.textContent,/PRIVATE-ORDER/);
});

test('Shopify validates exact order input without customer or fuzzy search and keeps failed searches',async()=>{
  const h=await harness({shopifyConfig:{configured:true,shop:'fixture.myshopify.com',mode:'read_only'},post:async()=>{throw new Error('Provider unavailable');}});await h.click('[data-company-tab=shopify]');
  let form=h.document.querySelector('[data-company-shopify-lookup]');form.querySelector('input').value='customer@example.test';await h.emit('submit',form);assert.equal(h.calls.length,0);assert.match(h.document.querySelector('main').textContent,/Enter the full order number/);
  form=h.document.querySelector('[data-company-shopify-lookup]');form.querySelector('input').value='#1234';await h.emit('submit',form);assert.equal(h.calls.length,1);assert.equal(h.document.querySelector('[data-company-shopify-query]').value,'#1234');assert.match(h.document.querySelector('main').textContent,/lookup did not complete/);
});
