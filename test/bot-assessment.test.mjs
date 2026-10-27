import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const apiSource = await readFile(new URL('../dist/api-client.js',import.meta.url),'utf8');
const liveSource = await readFile(new URL('../dist/live-app.js',import.meta.url),'utf8');
const response = (status,value) => ({status,ok:status>=200&&status<300,json:async()=>value});
const flush = async () => { for(let i=0;i<3;i++) await new Promise(setImmediate); };

async function harness({mode='bot',jobs=[],analyze,poll,language='en',evaluations=[],fetchOverride}={}) {
  let now=Date.parse('2026-10-27T08:00:00Z'),sequence=0;
  const timers=new Map(),calls=[],listeners=new Map();
  const elements=new Map(['app','overlay-root','toast','live-ai-region','live-bot-duplicate-ack'].map(id=>[id,{innerHTML:'',textContent:'',checked:false,classList:{add(){},remove(){}}}]));
  const document={documentElement:{dataset:{theme:'light'}},body:{style:{}},title:'',activeElement:null,contains:()=>false,querySelector:()=>null,getElementById:id=>elements.get(id),addEventListener:(type,handler)=>listeners.set(type,handler)};
  const task={id:'task-1',title:'Actual deliverable',description:'Expected evidence',criteria:['Verifiable outcome'],owner_id:'employee-1',reviewer_id:'manager-1',status:'submitted',version:2,submission_version:1,submissions:[{id:'sub-1',version:1,title:'Submitted evidence',description:'Actual supplied text',created_at:'2026-10-27T07:00:00Z'}],reviews:[]};
  const window={WORKOS_CONFIG:{mode:'live',apiBase:'/api'},WorkI18n:{lang:language,set(value){this.lang=value;}},location:{origin:'https://work.example'}};
  const snapshotJob = (status='pending',id='job-1',version=1) => ({id,status,submissionVersion:version,createdAt:'2026-10-27T07:59:00Z',expiresAt:'2026-10-27T08:29:00Z'});
  window.fetch=async(url,options)=>{
    const path=new URL(url).pathname;calls.push({path,options});
    const override=await fetchOverride?.(path,options);if(override)return override;
    if(path==='/api/capabilities')return response(200,{aiReviewMode:mode,aiReview:'configured',auth:{loginEnabled:true}});
    if(path==='/api/me')return response(200,{id:'manager-1',display_name:'Manager',role:'manager',department_id:'company'});
    if(path==='/api/tasks')return response(200,{items:[task]});
    if(path==='/api/directory')return response(200,{items:[{id:'manager-1',display_name:'Manager',role:'manager'},{id:'employee-1',display_name:'Employee',role:'employee'}]});
    if(path==='/api/auth/csrf')return response(200,{csrfToken:'test-csrf'});
    if(path==='/api/tasks/task-1')return response(200,{...task});
    if(path.endsWith('/evaluations'))return response(200,{items:typeof evaluations==='function'?evaluations():evaluations});
    if(path.endsWith('/analysis-jobs'))return response(200,{items:jobs});
    if(path.endsWith('/analyze')||path.endsWith('/retry'))return analyze?analyze(path,options):response(202,{mode:'bot',job:snapshotJob()});
    if(path.includes('/analysis-jobs/'))return poll?poll(path,options):response(200,{job:jobs[0]||snapshotJob()});
    return response(200,{items:[]});
  };
  class ClockDate extends Date { static now(){return now;} }
  const context={window,document,URL,AbortController,Date:ClockDate,Intl,Map,Set,console,requestAnimationFrame:fn=>fn(),setTimeout:(fn,delay)=>{const id=++sequence;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(apiSource,context);vm.runInNewContext(liveSource,context);await flush();
  const click=async dataset=>{listeners.get('click')({target:{closest:()=>({dataset}),matches:()=>false}});await flush();};
  const tick=async()=>{const entry=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)return false;timers.delete(entry[0]);now=entry[1].at;entry[1].fn();await flush();return true;};
  const open=async()=>{await click({liveTask:'task-1'});};
  const drawer=()=>elements.get('overlay-root').innerHTML;
  const region=()=>elements.get('live-ai-region').innerHTML;
  return {calls,elements,document,timers,click,tick,open,drawer,region,snapshotJob,task};
}

test('Bot enqueue is pending, cannot double-submit, and does not claim assessment completion',async()=>{
  const h=await harness();await h.open();await h.click({liveAction:'analyze'});
  assert.match(h.region(),/Waiting for Bot/);
  assert.match(h.region(),/Dispatch or queue acceptance does not mean assessment is complete/);
  assert.match(h.region(),/data-live-action="analyze" disabled/);
  assert.doesNotMatch(h.region(),/Assessment completed|server-validated assessment/);
  assert.equal(h.calls.filter(call=>call.path.endsWith('/analyze')).length,1);
});

test('double clicks while enqueue is in flight create only one analysis mutation',async()=>{
  let finish;const h=await harness({analyze:async()=>new Promise(resolve=>finish=resolve)});await h.open();
  await h.click({liveAction:'analyze'});await h.click({liveAction:'analyze'});
  assert.equal(h.calls.filter(call=>call.path.endsWith('/analyze')).length,1);
  finish(response(202,{mode:'bot',job:h.snapshotJob()}));await flush();assert.match(h.region(),/Waiting for Bot/);
});

test('a late enqueue response cannot reopen a closed drawer',async()=>{
  let finish;const h=await harness({analyze:async()=>new Promise(resolve=>finish=resolve)});await h.open();await h.click({liveAction:'analyze'});
  await h.click({liveAction:'close'});finish(response(202,{mode:'bot',job:h.snapshotJob()}));await flush();assert.equal(h.drawer(),'');
  const count=h.calls.length;for(let i=0;i<4;i++)await h.tick();assert.equal(h.calls.length,count);
});

test('completed Bot job refreshes current-version evaluations and preserves the human review form',async()=>{
  let completed=false;
  const job={id:'job-1',status:'pending',submissionVersion:1};
  const h=await harness({jobs:[job],poll:async()=>{completed=true;return response(200,{job:{...job,status:'completed'}});},evaluations:()=>completed?[{submission_version:1,result:{summary:'Verified current evidence',criteria:[]}}]:[]});
  await h.open();const initial=h.drawer();assert.match(initial,/id="live-review"/);
  await h.tick();assert.match(h.region(),/Verified current evidence/);
  assert.equal(h.drawer(),initial,'polling updates only the assessment region');
  assert.equal(h.calls.filter(call=>call.path.endsWith('/analyze')).length,0);
});

test('old-version jobs and findings never attach to the current submission or start polling',async()=>{
  const h=await harness({jobs:[{id:'old-job',status:'pending',submissionVersion:0}],evaluations:[{submission_version:0,result:{summary:'OLD RESULT'}}]});
  await h.open();assert.match(h.drawer(),/Assessments of older submissions do not apply/);assert.doesNotMatch(h.drawer(),/OLD RESULT/);
  await h.tick();assert.equal(h.calls.filter(call=>call.path.includes('/analysis-jobs/')).length,0);
});

test('latest matching evaluation is selected from descending history',async()=>{
  const h=await harness({evaluations:[{submission_version:1,result:{summary:'Newest verified result'}},{submission_version:1,result:{summary:'Old matching result'}}]});
  await h.open();assert.match(h.drawer(),/Newest verified result/);assert.doesNotMatch(h.drawer(),/Old matching result/);
});

test('uncertain dispatch requires explicit duplicate-allowance acknowledgement before retry',async()=>{
  const job={id:'unknown-job',status:'dispatch_unknown',submissionVersion:1,errorCode:'BOT_DISPATCH_UNKNOWN'};
  const h=await harness({jobs:[job]});await h.open();assert.match(h.drawer(),/retrying may consume Bot allowance again/);
  await h.click({liveAction:'retry-analysis',liveJobId:job.id});assert.equal(h.calls.filter(call=>call.path.endsWith('/retry')).length,0);
  h.elements.get('live-bot-duplicate-ack').checked=true;
  await h.click({liveAction:'retry-analysis',liveJobId:job.id});assert.equal(h.calls.filter(call=>call.path.endsWith('/retry')).length,1);
});

test('closing a drawer aborts an in-flight status read and stops future polling',async()=>{
  let signal;
  const h=await harness({jobs:[{id:'job-1',status:'pending',submissionVersion:1}],poll:async(path,options)=>new Promise((resolve,reject)=>{signal=options.signal;signal.addEventListener('abort',()=>reject(Object.assign(new Error('cancelled'),{name:'AbortError'})),{once:true});})});
  await h.open();await h.tick();assert.ok(signal);await h.click({liveAction:'close'});assert.equal(signal.aborted,true);
  const count=h.calls.length;for(let i=0;i<5;i++)await h.tick();assert.equal(h.calls.length,count);
});

test('pending jobs stop automatic refresh after two minutes and require manual refresh',async()=>{
  const h=await harness({jobs:[{id:'job-1',status:'pending',submissionVersion:1}]});await h.open();
  for(let i=0;i<25;i++)await h.tick();assert.match(h.region(),/Automatic refresh has stopped/);
  const count=h.calls.length;for(let i=0;i<5;i++)await h.tick();assert.equal(h.calls.length,count);
  await h.click({liveAction:'refresh-analysis'});await h.tick();assert.ok(h.calls.length>count);
});

test('a failed polling request is not automatically retried or replayed as an analysis mutation',async()=>{
  const h=await harness({jobs:[{id:'job-1',status:'pending',submissionVersion:1}],poll:async()=>response(502,{error:{code:'UPSTREAM_FAILURE',message:'Unavailable'}})});
  await h.open();await h.tick();assert.match(h.region(),/State refresh was interrupted/);
  for(let i=0;i<5;i++)await h.tick();assert.equal(h.calls.filter(call=>call.path.includes('/analysis-jobs/')).length,1);assert.equal(h.calls.filter(call=>call.path.endsWith('/analyze')).length,0);
});

test('expired authentication clears the drawer and cancels assessment polling',async()=>{
  const h=await harness({jobs:[{id:'job-1',status:'leased',submissionVersion:1}],poll:async()=>response(401,{error:{code:'UNAUTHENTICATED',message:'Sign in'}})});
  await h.open();await h.tick();assert.equal(h.drawer(),'');assert.match(h.elements.get('app').innerHTML,/Sign in with DingTalk/);
  const count=h.calls.length;for(let i=0;i<4;i++)await h.tick();assert.equal(h.calls.length,count);
});

test('API mode preserves synchronous assessment and never requests Bot job routes',async()=>{
  const h=await harness({mode:'api',analyze:async()=>response(200,{evaluation:{submission_version:1}}),evaluations:[{submission_version:1,result:{summary:'Synchronous API finding'}}]});
  await h.open();assert.match(h.drawer(),/Run Grok API evidence assessment/);await h.click({liveAction:'analyze'});
  assert.match(h.region(),/Synchronous API finding/);assert.equal(h.calls.filter(call=>call.path.includes('/analysis-jobs')).length,0);
});

test('Bot state text and retry warnings are bilingual and escaped',async()=>{
  const h=await harness({language:'zh',jobs:[{id:'job-1',status:'dispatch_unknown',submissionVersion:1,errorCode:'<script>'}]});
  await h.open();assert.match(h.drawer(),/提交状态待核实/);assert.match(h.drawer(),/重复消耗 Bot 额度/);assert.doesNotMatch(h.drawer(),/<script>/);
});
