import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const fields=await readFile(new URL('../dist/okr-fields.js',import.meta.url),'utf8');
const live=await readFile(new URL('../dist/live-app.js',import.meta.url),'utf8');
const unitWindow={};vm.runInNewContext(fields,{window:unitWindow,URL});const O=unitWindow.WorkOSOkr;
const quantified={id:'kr1',objective_id:'o1',version:1,baseline:0,target:10,actual:null,direction:'increase',unit:'items',planning:{weight:50}};
const source={provider:'dingtalk',period:'2026-10',itemLabel:'KR1',sourceUrl:'https://alidocs.dingtalk.com/i/test',importedAt:'2026-10-29T01:00:00Z',sourceExportedAt:'2026-10-28T14:00:00Z',originalScoringDueDate:'2026-08-27',deadlinePeriodMismatch:true};
const legacy={classification:'legacy_source',formulaVerified:false,importSource:source,rawFields:[{name:'Original self score',value:100},{name:'Original manager score',value:0},{name:'Original note',value:'<img src=x onerror=alert(1)>'},{name:'Empty original cell',value:null}]};

test('unknown metrics and blank actuals never render a fabricated zero or progress bar',()=>{
 for(const lang of ['zh','en']){
  for(const kr of [{...quantified,baseline:null,target:null,actual:null,direction:null,progress:null},{...quantified,baseline:null,actual:0,progress:0},{...quantified,actual:''}]){
   const view=O.metricView(kr,lang);assert.doesNotMatch(view,/class="progress"|width:|>0%/);
  }
  assert.match(O.metricView({...quantified,baseline:null,target:null,actual:null,direction:null},lang),lang==='en'?/No quantitative metric set/:/未设量化指标/);
  assert.match(O.metricView(quantified,lang),lang==='en'?/No actual value entered/:/未填实际值/);
 }
 const zero=O.metricView({...quantified,actual:0},'en');assert.match(zero,/<strong>0 \/ 10 items<\/strong>/);assert.match(zero,/width:0%/);
 assert.equal(O.metric({...quantified,actual:5}).progress,50);
 assert.equal(O.metric({...quantified,baseline:10,target:0,actual:5,direction:'decrease'}).progress,50);
 assert.equal(O.metric({...quantified,actual:null,progress:0}).progress,null);
 assert.equal(O.metric({...quantified,baseline:-1e308,target:1e308,actual:0}).quantified,false);
});

test('source metadata preserves dates and exposes only safe original links with bilingual mismatch guidance',()=>{
 const en=O.importSourceView(source,'en'),zh=O.importSourceView(source,'zh');
 assert.match(en,/KR1/);assert.match(en,/29 Oct 2026/);assert.doesNotMatch(en,/2026-10-29T01:00:00Z/);assert.match(en,/<details[^>]*><summary>DingTalk source · KR1 · Check dates/);assert.match(en,/2026-08-27/);assert.match(en,/different month/);assert.match(en,/source value is preserved/);assert.match(en,/href="https:\/\/alidocs\.dingtalk\.com\/i\/test"/);
 assert.match(zh,/原截止日期/);assert.match(zh,/请按原表核对评分安排/);
 for(const url of ['javascript:alert(1)','https://user:secret@example.com/'])assert.doesNotMatch(O.importSourceView({...source,sourceUrl:url},'en'),/href=/);
 assert.match(O.importSourceView({...source,itemLabel:'<img src=x>'},'en'),/&lt;img/);
});

test('legacy values remain a separate escaped original record and cannot contribute to current grades',()=>{
 const appraisal={version:1,self:null,manager:null,history:[],legacySource:legacy};
 const view=O.evaluationView('en',appraisal,quantified);
 assert.match(view,/Historical source record \(not confirmed scores\)/);assert.match(view,/do not contribute to current manager-confirmed scores/);assert.match(view,/Empty original cell<\/dt><dd class="okr-evidence">Blank/);assert.match(view,/Original manager score<\/dt><dd class="okr-evidence">0/);assert.match(view,/&lt;img/);assert.doesNotMatch(view,/<img src=x/);
 assert.equal(O.summary({weight:50,type:'mandatory'},[quantified],{kr1:appraisal}).contribution,null);
 assert.equal(O.summary({weight:50,type:'mandatory'},[quantified],{kr1:appraisal}).reviewed,0);
});

test('imported O and KR labels sort naturally within owner/period while non-imported positions stay fixed',()=>{
 const item=(id,label,owner='a',period='2026-10',objective_id)=>({id,owner_id:owner,objective_id,importSource:{provider:'dingtalk',period,itemLabel:label}});
 const rows=[item('a10','O10'),{id:'manual'},item('a2','O2'),item('b2','O2','b'),item('a1','O1'),item('b1','O1','b'),item('old2','O2','a','2026-09'),item('old1','O1','a','2026-09')];
 assert.deepEqual(Array.from(O.orderImported(rows),x=>x.id),['a1','manual','a2','b1','a10','b2','old1','old2']);
 assert.equal(rows[0].id,'a10');
 const krs=[item('kr10','KR10','a','2026-10','o1'),item('other2','KR2','a','2026-10','o2'),item('kr2','KR2','a','2026-10','o1'),item('kr1','KR1','a','2026-10','o1')];
 assert.deepEqual(Array.from(O.orderImported(krs),x=>x.id),['kr1','other2','kr2','kr10']);
});

const flush=async()=>{for(let i=0;i<3;i++)await new Promise(setImmediate);};
async function harness({kr={...quantified,baseline:null,target:null,actual:null,direction:null,unit:null,progress:null,importSource:source},language='en'}={}){
 const calls=[],listeners=new Map(),elements=new Map(['app','overlay-root','toast'].map(id=>[id,{innerHTML:'',textContent:'',classList:{add(){},remove(){}}}]));
 const objective={id:'o1',title:'Original objective',owner_id:'owner1',department_id:'company',level:'personal',planning:{period:'2026-10',weight:50,type:'mandatory',scoringDueDate:'2026-08-27'},importSource:{...source,itemLabel:'O1'}};
 kr={...kr,department_id:'company',owner_id:'owner1'};
 const document={documentElement:{dataset:{theme:'light'}},body:{style:{}},title:'',activeElement:null,contains:()=>false,querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>elements.get(id),addEventListener:(type,handler)=>listeners.set(type,handler)};
 class Client{
  async get(path){calls.push({method:'GET',path});if(path==='/capabilities')return {};if(path==='/me')return {id:'manager1',display_name:'Manager',department_id:'company',role:'manager'};if(path==='/objectives')return {items:[objective]};if(path==='/key-results')return {items:[kr]};if(path==='/directory')return {items:[]};if(path==='/key-results/kr1/appraisal')return {version:1,self:null,manager:null,history:[],legacySource:legacy};if(path==='/objectives/o1/source')return legacy;return {items:[]};}
  async post(path,body){calls.push({method:'POST',path,body});return {};}
 }
 const window={WORKOS_CONFIG:{mode:'live',apiBase:'/api'},WorkOSApi:{Client},WorkI18n:{lang:language,set(value){this.lang=value;}},location:{origin:'https://work.example'}};
 class Data extends Map{constructor(form){super(Object.entries(form.values));}}
 const context={window,document,URL,URLSearchParams,FormData:Data,AbortController,Intl,Date,Map,Set,setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>fn()};
 vm.runInNewContext(fields,context);vm.runInNewContext(live,context);await flush();
 const click=async dataset=>{listeners.get('click')({target:{closest:()=>({dataset}),matches:()=>false}});await flush();};
 const submit=async values=>{const error={textContent:''};await listeners.get('submit')({target:{id:'live-measure',dataset:{krId:'kr1'},values,querySelector:()=>error},preventDefault(){}});await flush();return error.textContent;};
 await click({livePage:'okr'});
 return {calls,click,submit,html:()=>elements.get('app').innerHTML,drawer:()=>elements.get('overlay-root').innerHTML,toast:()=>elements.get('toast').textContent};
}

test('live imported unquantified KR has source labels and history but no measurement action or fabricated progress',async()=>{
 const h=await harness();assert.match(h.html(),/class="objective-letter">O1/);assert.match(h.html(),/class="kr-symbol">KR1/);assert.match(h.html(),/No quantitative metric set/);assert.match(h.html(),/Original deadline<\/dt><dd>2026-08-27/);assert.doesNotMatch(h.html(),/data-live-measure=|class="progress"|width:0%/);
 await h.click({liveMeasure:'kr1'});assert.doesNotMatch(h.drawer(),/id="live-measure"/);
 assert.match(await h.submit({actual:'0',source:'Source',note:'Verified evidence'}),/No quantitative metric/);assert.equal(h.calls.some(c=>c.method==='POST'),false);
 await h.click({liveObjectiveSource:'o1'});assert.ok(h.calls.some(c=>c.path==='/objectives/o1/source'));assert.match(h.drawer(),/Historical source record/);
 await h.click({liveAppraisal:'kr1'});assert.match(h.drawer(),/Historical source record \(not confirmed scores\)/);assert.match(h.drawer(),/Not scored/);
});

test('a quantified KR with no actual keeps measurement empty and rejects blank saves, while explicit zero remains valid',async()=>{
 const h=await harness({kr:quantified});assert.match(h.html(),/No actual value entered/);assert.match(h.html(),/data-live-measure="kr1"/);assert.doesNotMatch(h.html(),/class="progress"/);
 await h.click({liveMeasure:'kr1'});assert.match(h.drawer(),/name="actual"[^>]*value=""/);
 assert.match(await h.submit({actual:'  ',source:'Source',note:'Verified evidence'}),/blank is not recorded as zero/);assert.equal(h.calls.some(c=>c.method==='POST'),false);
 await h.submit({actual:'0',source:'Source',note:'Verified evidence'});assert.equal(h.calls.find(c=>c.method==='POST')?.body.actual,0);
});


test('identical title/description is shown once and unknown bonus inclusion remains unconfirmed',()=>{
 const planning={period:'2026-10',weight:50,type:'bonus',bonusIncluded:null,description:'Original objective'};
 const view=O.plan(planning,'en','Original objective');assert.doesNotMatch(view,/Original objective/);assert.match(view,/Include bonus in scoring<\/dt><dd>—/);assert.doesNotMatch(view,/<dd>No<\/dd>/);
 const result=O.summary(planning,[quantified],{});assert.equal(result.included,false);assert.equal(result.contribution,null);assert.match(O.summaryHtml(result,'en'),/inclusion is unconfirmed/);
});
