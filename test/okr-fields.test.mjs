import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const window={};vm.runInNewContext(await readFile(new URL('../dist/okr-fields.js',import.meta.url),'utf8'),{window});const O=window.WorkOSOkr;
const krs=[{id:'a',version:3,planning:{weight:30}},{id:'b',version:3,planning:{weight:20}}];
const ratings={a:{version:3,manager:{score:80,metric_version:3}},b:{version:3,manager:{score:100,metric_version:3}}};
test('absolute KR weights contribute only once, missing or stale ratings never become zero',()=>{
 assert.equal(O.summary({weight:50,type:'mandatory'},krs,ratings).contribution,44);
 assert.equal(O.summary({weight:50,type:'mandatory'},krs,{}).contribution,null);
 assert.equal(O.summary({weight:50,type:'mandatory'},[{...krs[0],version:4},krs[1]],ratings).contribution,null);
 assert.equal(O.summary({weight:100,type:'mandatory'},krs,ratings).contribution,null);
 assert.equal(O.summary({weight:50,type:'bonus',bonusIncluded:false},krs,ratings).contribution,null);
 const zero={...ratings,a:{version:3,manager:{score:0,metric_version:3}}};assert.equal(O.summary({weight:50,type:'mandatory'},krs,zero).contribution,20);
});
test('all static fields, six scoring levels and unknowns render in both languages without executable evidence',()=>{
 const evidence={self:{score:80,evidence:'<img src=x onerror=alert(1)>',note:'<script>bad</script>'},manager:null};
 const en=O.plan({period:'2026-10',type:'bonus',bonusIncluded:false},'en')+O.evaluationView('en',evidence,krs[0])+O.planningFields('en')+O.evaluationForm('en','manager',evidence);
 assert.ok(!/[\u4e00-\u9fff]/.test(en));assert.match(en,/Not scored/);assert.match(en,/80.*Complete/);assert.match(en,/100.*Exceptional/);assert.ok(!en.includes('<img'));assert.match(en,/&lt;img/);
 assert.match(O.plan({},'zh'),/打分截止日期/);assert.match(O.evaluationView('zh',evidence,krs[0]),/主管评价说明/);
});
