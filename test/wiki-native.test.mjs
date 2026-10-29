import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

const code=readFileSync(new URL('../dist/wiki.js',import.meta.url),'utf8');
const families=[['x-series',92],['hydra-series',47],['cobra',6],['vertigo',21],['software',23],['accessories',15],['materials',27],['general',5]].map(([id,count],i)=>({id,name:id,description:'Original description',count,...(i<4?{image:'/assets/'+id+'.png'}:{})}));
const library={families,articles:[]};
let number=0;
for(const family of families)for(let i=0;i<family.count;i++){
  number++;
  library.articles.push({id:'en-'+number,title:number===1?'Firmware setup':number===2?'Air assist':number===3?'Autofocus':'Original guide '+number,
    family:family.id,topic:number<=52?'downloads':number<=96?'troubleshooting':number<=108?'getting-started':'guides',excerpt:'Original excerpt',read_minutes:2,source_updated_at:'2026-10-28T00:00:00Z',source_url:'https://wiki.1laser.com/en/guide-'+number});
}
const index=library.articles.map(a=>({...a,body_text:a.id==='en-150'?'needleonlybody lower maintenance':'original technical text '+a.title}));
const defaultArticle=id=>({...library.articles.find(a=>a.id===id),body_html:'<div><h2 id="installation">Installation</h2><p>Original English technical content.</p></div>',headings:[{level:2,id:'installation',text:'Installation'}]});
const clone=value=>JSON.parse(JSON.stringify(value));
function harness({hash='#knowledge/',language='en',active=true,article=defaultArticle,load,origin='https://craftos.app',data=library,search=index}={}){
  const {document}=parseHTML('<html><body><div id="mount"></div></body></html>');
  const listeners={},requests=[],navigation=[],scrolls=[];
  const location={origin,href:origin+'/',hash};
  const window={location,addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn);},requestAnimationFrame:fn=>fn()};
  const fetch=async path=>{
    requests.push(path);if(load)return load(path);
    const value=path.endsWith('/library.json')?data:path.endsWith('/search-index.json')?search:article(path.match(/(en-\d+)\.json$/)?.[1]);
    return {ok:!!value,json:async()=>clone(value)};
  };
  const FormData=class{constructor(form){this.values=new Map(Array.from(form.querySelectorAll('[name]')).map(n=>[n.name,n.value]));}get(key){return this.values.get(key);}};
  const context={window,document,fetch,URL,URLSearchParams,Date,FormData,setTimeout,clearTimeout};
  vm.runInNewContext(code,context);
  const ui=window.WorkOSWiki,mount=document.getElementById('mount');
  let changes=0;
  const render=()=>{mount.innerHTML=ui.render();for(const el of mount.querySelectorAll('[id]'))el.scrollIntoView=()=>scrolls.push(el.id);return mount;};
  ui.configure({language,active,changed:()=>{changes++;render();},onNavigate:page=>navigation.push(page)});
  const navigate=async next=>{location.hash=next;for(const fn of listeners.hashchange||[])fn();await ui.ensureLoaded();render();};
  return {ui,document,window,mount,render,navigate,requests,navigation,scrolls,get changes(){return changes;}};
}

test('native overview preserves 236 guides, all eight families and 52 download articles without duplicate site chrome',async()=>{
  const h=harness();await h.ui.ensureLoaded();const view=h.render();
  assert.equal(view.querySelectorAll('.wiki-family-card').length,8);
  assert.match(view.querySelector('.wiki-stats').textContent,/236 guides.*8 families.*52 download guides/);
  assert.equal(view.querySelectorAll('.wiki-family-image img').length,4);
  assert.equal(view.querySelector('.wiki-contact-button').getAttribute('href'),'https://www.1laser.com/pages/contact-us');
  assert.doesNotMatch(view.textContent,/Original source|原站源码/);
  assert.equal(view.querySelectorAll('iframe,script,header,footer,h1').length,0);
  assert.equal(view.querySelectorAll('.wiki-help-links a').length,3);
  assert.match(h.ui.renderNav(),/#knowledge\/archive/);
  assert.deepEqual(h.requests,['/wiki/data/library.json','/wiki/data/search-index.json']);
  await h.navigate('#knowledge/downloads');assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,52);
  for(const family of families){await h.navigate('#knowledge/family/'+family.id);assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,family.count);}
});

test('full-text AND search, Chinese keyword aliases and product/topic filters retain source behavior',async()=>{
  const h=harness({hash:'#knowledge/search?q=needleonlybody+maintenance'});await h.ui.ensureLoaded();h.render();
  assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,1);assert.match(h.mount.textContent,/Original guide 150/);
  await h.navigate('#knowledge/search?q=needleonlybody+absent');assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,0);
  await h.navigate('#knowledge/search?q='+encodeURIComponent('固件'));assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,1);assert.match(h.mount.textContent,/Firmware setup/);
  await h.navigate('#knowledge/family/x-series?topic=downloads');assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,52);
  await h.navigate('#knowledge/downloads?family=hydra-series');assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,0);
});

test('route and query survive language changes and article back links return to the exact filtered list',async()=>{
  const start='#knowledge/family/x-series?q=firmware&topic=downloads',h=harness({hash:start});await h.ui.ensureLoaded();h.render();
  const destination=h.mount.querySelector('.wiki-guide-card').getAttribute('href');
  assert.match(destination,/^#knowledge\/article\/en-1/);
  await h.navigate(destination);
  assert.equal(h.mount.querySelector('.wiki-back').getAttribute('href'),start);
  assert.equal(h.mount.querySelector('.wiki-source-link'),null);
  const body=h.mount.querySelector('.wiki-article-body').innerHTML;
  h.ui.configure({language:'zh'});h.render();
  assert.equal(h.window.location.hash,destination);
  assert.equal(h.mount.querySelector('.wiki-article-body').innerHTML,body);
  assert.match(h.mount.textContent,/本页目录/);
  await h.navigate(start);assert.equal(h.mount.querySelector('.wiki-search-input').value,'firmware');
  assert.equal(h.requests.filter(x=>x.includes('/articles/')).length,1);
});

test('source HTML is rebuilt with a real DOM allowlist while preserving tables, formatting, text and Unicode TOC',async()=>{
  const headings=Array.from({length:40},(_,i)=>({id:i===0?'️-important-note':'section-'+i,level:2,text:'Original heading '+i}));
  const body=headings.map(x=>`<h2 id="${x.id}">${x.text}</h2>`).join('')+'<figure><img src="https://wiki.1laser.com/image.png" alt="Original diagram"><figcaption>Original caption</figcaption></figure><table><tbody><tr><td colspan="2" rowspan="3"><strong>Bold</strong><i>Italic</i><sub>sub</sub><sup>sup</sup><code>code</code></td></tr></tbody></table><blockquote>Original quote</blockquote>';
  const h=harness({hash:'#knowledge/article/en-1',article:id=>({...defaultArticle(id),headings,body_html:body})});await h.ui.ensureLoaded();h.render();
  const content=h.mount.querySelector('.wiki-article-body');
  assert.equal(h.mount.querySelectorAll('.wiki-toc-link').length,40);
  assert.equal(content.querySelector('td').getAttribute('colspan'),'2');assert.equal(content.querySelector('td').getAttribute('rowspan'),'3');
  for(const tag of ['figure','figcaption','strong','i','sub','sup','code','blockquote'])assert.ok(content.querySelector(tag),tag);
  assert.equal(content.querySelector('img').getAttribute('alt'),'Original diagram');
  assert.equal(content.querySelectorAll('[id]').length,40);
  assert.ok(content.querySelector('h2').id.includes(encodeURIComponent('️-important-note')));
  const anchor=h.mount.querySelector('.wiki-toc-link').getAttribute('href');await h.navigate(anchor);
  assert.ok(h.scrolls.some(id=>id.includes(encodeURIComponent('️-important-note'))));
});

test('sanitizer blocks executable markup, handlers, unsafe URLs, DOM clobbering and unapproved image domains',async()=>{
  const malicious='<script>window.pwned=1</script><style>body{display:none}</style><svg onload="evil()"><script>evil()</script></svg><math><mtext><img src=x onerror=evil()></mtext></math><p id="app" style="position:fixed" class="app-shell" onclick="evil()">Safe words</p><a href="jav&#x61;script:evil()" onclick="evil()">Bad link</a><a href="data:text/html,evil">Data</a><a href="https://user:pass@example.com">Credentials</a><img src="https://evil.example/track" onerror="evil()" alt="Blocked diagram"><img src="https://wiki.1laser.com/allowed.png" srcset="https://evil.example/alternate.png" onerror="evil()"><form action="https://evil.example"><input name="password"><button formaction="https://evil.example">Untrusted action</button></form><iframe src="https://www.youtube.com/embed/example" srcdoc="<script>evil()</script>" title="Video reference"></iframe><object data="javascript:evil()"></object>';
  const h=harness({hash:'#knowledge/article/en-1',article:id=>({...defaultArticle(id),body_html:malicious,headings:[]})});await h.ui.ensureLoaded();h.render();
  const content=h.mount.querySelector('.wiki-article-body');
  assert.equal(content.querySelectorAll('script,style,svg,math,iframe,object,form,input,button').length,0);
  assert.equal(content.querySelectorAll('[onclick],[onerror],[onload],[style],[srcset],[srcdoc]').length,0);
  assert.equal(content.querySelector('[id="app"]'),null);assert.equal(content.querySelector('.app-shell'),null);
  assert.match(content.textContent,/Safe words/);assert.match(content.textContent,/Blocked diagram/);
  assert.equal(content.querySelectorAll('img').length,1);
  for(const a of content.querySelectorAll('a'))assert.ok(!a.hasAttribute('href')||a.getAttribute('href').startsWith('https://www.youtube.com/'));
  assert.equal(content.querySelector('.wiki-embed-link').textContent,'Video reference');
  assert.equal(content.querySelector('.wiki-embed-link').getAttribute('rel'),'noopener noreferrer');
});

test('internal source URLs route natively, external downloads remain safe links and empty anchors stay empty',async()=>{
  const body='<p><a href="/#/article/en-2">Internal</a><a href="https://wiki.1laser.com/en/guide-3#installation">Canonical source</a><a href="#installation">Same article heading</a><a href="https://yonge6.github.io/onelaser-support-center/#/article/en-4">Old site</a><a href="https://cdn.shopify.com/manual.pdf">Download</a><a href="https://wiki.1laser.com/unmapped/resource.exe">Unmapped resource</a><a>No destination</a></p>';
  const h=harness({hash:'#knowledge/article/en-1',article:id=>({...defaultArticle(id),body_html:body})});await h.ui.ensureLoaded();h.render();
  const anchors=[...h.mount.querySelectorAll('.wiki-article-body a')];
  for(const a of anchors.slice(0,4)){assert.match(a.getAttribute('href'),/^#knowledge\/article\/en-\d+/);assert.equal(a.hasAttribute('target'),false);}
  assert.match(anchors[1].getAttribute('href'),/anchor=installation/);
  for(const a of anchors.slice(4,6)){assert.match(a.getAttribute('href'),/^https:/);assert.equal(a.getAttribute('target'),'_blank');assert.equal(a.getAttribute('rel'),'noopener noreferrer');}
  assert.equal(anchors[6].hasAttribute('href'),false);
});

test('untrusted route parameters remain text and cannot construct article fetch paths',async()=>{
  const payload='"><img src=x onerror=evil()>',h=harness({hash:'#knowledge/search?'+new URLSearchParams({q:payload,family:payload,topic:'__proto__'})});await h.ui.ensureLoaded();h.render();
  assert.equal(h.mount.querySelectorAll('[onerror]').length,0);
  assert.equal(h.mount.querySelector('.wiki-search-input').value,payload);
  await h.navigate('#knowledge/article/../../secret');assert.match(h.mount.textContent,/Guide not found/);
  assert.equal(h.requests.some(path=>path.includes('/articles/')),false);
});

test('untrusted reading-time metadata is escaped in both guide cards and the article header',async()=>{
  const payload='<img src=x onerror="evil()">',data=clone(library),search=clone(index);
  data.articles[0].read_minutes=payload;search[0].read_minutes=payload;
  const h=harness({data,search,article:id=>({...defaultArticle(id),read_minutes:payload})});await h.ui.ensureLoaded();h.render();
  assert.equal(h.mount.querySelectorAll('[onerror]').length,0);
  assert.ok(h.mount.querySelector('.wiki-guide-meta').textContent.includes(payload));
  await h.navigate('#knowledge/article/en-1');
  assert.equal(h.mount.querySelectorAll('[onerror]').length,0);
  assert.ok(h.mount.querySelector('.wiki-article-meta').textContent.includes(payload));
});

test('loading is deduplicated and old responses after reset cannot restore previous state',async()=>{
  const pending=[];
  const h=harness({load:path=>new Promise(resolve=>pending.push({path,resolve}))});
  const a=h.ui.ensureLoaded(),b=h.ui.ensureLoaded();h.render();
  assert.equal(pending.length,2);
  h.ui.reset();for(const request of pending)request.resolve({ok:true,json:async()=>request.path.includes('search-index')?index:library});
  await Promise.all([a,b]);assert.equal(h.changes,0);
  assert.match(h.ui.render(),/Loading documentation/);
});

test('article race cannot render the previous article after navigating elsewhere',async()=>{
  let finish;
  const h=harness({load:async path=>path.includes('/articles/')?new Promise(resolve=>{finish=resolve;}):{ok:true,json:async()=>clone(path.includes('search-index')?index:library)}});
  await h.ui.ensureLoaded();h.render();h.window.location.hash='#knowledge/article/en-1';
  const loading=h.ui.ensureLoaded();await Promise.resolve();
  await h.navigate('#knowledge/downloads');
  finish({ok:true,json:async()=>defaultArticle('en-1')});await loading;
  assert.equal(h.mount.querySelectorAll('.wiki-article-body').length,0);assert.equal(h.mount.querySelectorAll('.wiki-guide-card').length,52);
});

test('inactive module does not fetch, re-render or mutate another Work OS page',async()=>{
  const h=harness({active:false,hash:'#tasks'});await h.ui.ensureLoaded();
  assert.equal(h.requests.length,0);assert.equal(h.changes,0);assert.equal(h.window.location.hash,'#tasks');
  await h.navigate('#knowledge/archive');assert.equal(h.requests.length,0);assert.equal(h.changes,0);assert.deepEqual(h.navigation,['archive']);
});

test('an initial deep link loads its exact article and source metadata, with same-origin asset paths in local QA',async()=>{
  const h=harness({hash:'#knowledge/article/en-3',origin:'http://127.0.0.1:8872'});await h.ui.ensureLoaded();h.render();
  assert.match(h.mount.querySelector('.wiki-heading').textContent,/Autofocus/);assert.match(h.mount.textContent,/Source updated/);
  assert.ok(h.requests.includes('/wiki/data/articles/en-3.json'));
  await h.navigate('#knowledge/');assert.equal(h.mount.querySelectorAll('.wiki-family-image img').length,4);
  assert.ok([...h.mount.querySelectorAll('.wiki-family-image img')].every(n=>n.getAttribute('src').startsWith('/wiki/assets/')));
});

test('source load failures have an explicit retry and do not cause a re-render loop',async()=>{
  const h=harness({load:async()=>({ok:false})});await h.ui.ensureLoaded();h.render();
  assert.match(h.mount.textContent,/temporarily unavailable/);assert.ok(h.mount.querySelector('[data-wiki-retry]'));
  const count=h.requests.length;for(let i=0;i<5;i++)h.render();await Promise.resolve();assert.equal(h.requests.length,count);
});

// Optional integration acceptance against the complete preserved public package:
// WORKOS_WIKI_PACKAGE=/absolute/path/to/wiki-package-language npm test
test('complete original package retains every article, source link, image, table and TOC entry', {skip:!process.env.WORKOS_WIKI_PACKAGE},async()=>{
  const base=process.env.WORKOS_WIKI_PACKAGE;
  const data=JSON.parse(readFileSync(join(base,'data/library.json'))),search=JSON.parse(readFileSync(join(base,'data/search-index.json')));
  const contents=new Map(data.articles.map(a=>[a.id,JSON.parse(readFileSync(join(base,'data/articles',a.id+'.json')))]));
  assert.equal(data.articles.length,236);assert.equal(data.families.length,8);assert.equal(data.articles.filter(a=>a.topic==='downloads').length,52);
  const h=harness({data,search,article:id=>contents.get(id)});await h.ui.ensureLoaded();
  let imageCount=0,tableCount=0,headingCount=0,internalCount=0;
  for(const original of contents.values()){
    await h.navigate('#knowledge/article/'+original.id);
    const rendered=h.mount.querySelector('.wiki-article-body');assert.ok(rendered,original.id);
    const source=parseHTML('<html><body><main>'+original.body_html+'</main></body></html>').document.querySelector('main');
    assert.equal(rendered.textContent,source.textContent,original.id+' text');
    for(const tag of ['img','table','td','figure','figcaption','strong','i','code','blockquote','sup','sub'])assert.equal(rendered.querySelectorAll(tag).length,source.querySelectorAll(tag).length,original.id+' '+tag);
    for(const attr of ['rowspan','colspan'])assert.deepEqual([...rendered.querySelectorAll('['+attr+']')].map(n=>n.getAttribute(attr)),[...source.querySelectorAll('['+attr+']')].map(n=>n.getAttribute(attr)),original.id+' '+attr);
    assert.equal(h.mount.querySelectorAll('.wiki-toc-link').length,original.headings.length,original.id+' TOC');
    imageCount+=rendered.querySelectorAll('img').length;tableCount+=rendered.querySelectorAll('table').length;headingCount+=h.mount.querySelectorAll('.wiki-toc-link').length;
    const before=[...source.querySelectorAll('a[href]')],after=[...rendered.querySelectorAll('a[href]')];assert.equal(after.length,before.length,original.id+' links');
    for(let i=0;i<before.length;i++)if(before[i].getAttribute('href').startsWith('/#/article/')){internalCount++;assert.match(after[i].getAttribute('href'),/^#knowledge\/article\/en-\d+/);}
  }
  assert.equal(imageCount,2181);assert.equal(tableCount,314);assert.equal(headingCount,2691);assert.equal(internalCount,486);
});

test('explicit public preloading deduplicates requests and makes repeated navigation immediate',async()=>{
 const h=harness({active:false,hash:'#tasks'});
 await Promise.all([h.ui.preload(),h.ui.preload()]);
 assert.equal(h.requests.length,2);assert.equal(h.changes,0);
 h.ui.configure({active:true});h.window.location.hash='#knowledge/';
 assert.doesNotMatch(h.ui.render(),/Loading documentation/);
 h.ui.configure({active:false});h.ui.configure({active:true});
 assert.doesNotMatch(h.ui.render(),/Loading documentation/);
 assert.equal(h.requests.length,2);
 h.ui.reset();await h.ui.preload();assert.equal(h.requests.length,4);
});
