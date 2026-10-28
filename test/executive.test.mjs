import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const window={};vm.runInNewContext(await readFile(new URL('../dist/executive.js',import.meta.url),'utf8'),{window,Intl,Date});
const model={generatedAt:'2026-10-28T10:00:00Z',totals:{total:0,accepted:0,waiting:0,overdue:0},companyProgress:null,departments:[],goals:[],risks:[],riskLimit:50};
test('empty metrics remain unknown, with bilingual reporting scope',()=>{
 const en=window.WorkOSExecutive.render(model,'en');assert.match(en,/Executive overview/);assert.match(en,/No company objectives recorded/);assert.match(en,/—/);assert.ok(!/[\u4e00-\u9fff]/.test(en));assert.match(window.WorkOSExecutive.render(model,'zh'),/老板看板/);
});
test('executive evidence names and titles are escaped, never executable',()=>{
 const html=window.WorkOSExecutive.render({...model,risks:[{title:'<img src=x onerror=alert(1)>',owner:'<script>',department:'A&B',due:'2026-10-20',status:'submitted',overdue:true}]},'en');assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);assert.match(html,/A&amp;B/);assert.match(html,/Awaiting review/);
});
