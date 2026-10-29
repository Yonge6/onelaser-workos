import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/preferences.js',import.meta.url),'utf8');
const run=(values,blocked=false)=>{const document={documentElement:{dataset:{}}};vm.runInNewContext(source,{document,localStorage:{getItem:k=>{if(blocked)throw Error();return values.get(k);},setItem:(k,v)=>values.set(k,v)},matchMedia:()=>({matches:true})});return document.documentElement;};
test('company defaults are English and light even on a dark OS, with one-time migration',()=>{
 const v=new Map([['onelaser-workos-theme','dark'],['onelaser-workos-language','zh']]);
 let d=run(v);assert.equal(d.lang,'en');assert.equal(d.dataset.theme,'light');
 v.set('onelaser-workos-theme','dark');v.set('onelaser-workos-language','zh');
 d=run(v);assert.equal(d.lang,'zh-CN');assert.equal(d.dataset.theme,'dark');
});
test('blocked preference storage still defaults to English and light',()=>{const d=run(new Map(),true);assert.equal(d.lang,'en');assert.equal(d.dataset.theme,'light');});
