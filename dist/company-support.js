'use strict';
window.CompanySupport = (() => {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let api,actor,language='zh',changed,showModal,cache={},tab='tickets',query='',viewContext='',openGeneration=0;
  const tr=(zh,en)=>language==='en'?en:zh;
  const date=v=>v?new Date(v).toLocaleString(language==='en'?'en-GB':'zh-CN'):'—';
  const safe=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
  const source=s=>safe(s.url)?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)}</a> <small>${esc(s.version||'')}</small>`:esc(s.title||'');
  function configure(options){const nextContext=[options.actor?.id,options.view,window.location?.hash||''].join('|');if(nextContext!==viewContext){viewContext=nextContext;openGeneration++;}({api,actor,changed,showModal}=options);language=options.language;window.WorkOSWiki?.configure({language,changed,active:!!actor&&options.active===true&&!isArchive()});}
  const isArchive=()=>/^#knowledge\/archive(?:[?]|$)/.test(window.location?.hash||'');
  function reset(){openGeneration++;viewContext='';cache={};actor=null;query='';tab='tickets';window.WorkOSWiki?.reset();}
  async function refresh(){
    const identity=actor?.id;if(!identity)return;cache={};
    const list=await api.get('/support/library');if(actor?.id!==identity)return;cache.library=list;
    if(actor.supportAccess?.read){
      const results=await Promise.allSettled([api.get('/support/summary'),api.get('/support/tickets'),api.get('/support/answers'),api.get('/support/sla')]);
      if(actor?.id!==identity)return;
      ['summary','tickets','answers','sla'].forEach((key,i)=>{cache[key]=results[i].status==='fulfilled'?results[i].value:null;});
    }
  }
  function freshness(s=cache.summary){return `<div class="notice ${!s||s.stale?'amber':''}"><span>${!s?.connected?tr('客服数据尚未同步。','Support data has not been synced.'):s.stale?tr('同步已过期，以下为历史快照。恢复连接后才能审核。','Sync is stale. These are historical snapshots. Restore the connector before reviewing.'):tr('客服数据已同步。','Support data synced.')} ${tr('更新时间','Updated')}: ${date(s?.observedAt)}</span></div>`;}
  const card=(label,value)=>`<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value num">${value??'—'}</div></div>`;
  function summary(){const s=cache.summary;return `<section class="panel live-space-top"><div class="panel-head"><h2>${tr('客服运营','Customer support')}</h2><button class="btn small" data-live-page="support">${tr('进入客服工作台','Open support')}</button></div><div class="panel-body">${freshness(s)}<div class="stats-grid live-space-top">${card(tr('跟踪工单','Tracked tickets'),s?.counts?.tickets)}${card(tr('当前待审核草稿','Current pending drafts'),s?.counts?.drafts)}${card(tr('需要关注','Needs attention'),s?.counts?.attention)}${card(tr('知识文章','Knowledge articles'),s?.counts?.articles)}</div><p class="fine">${tr('统计范围为试运行已跟踪工单，不代表 Zoho 全部工单。','Counts cover tracked pilot tickets, not the entire Zoho account.')}</p></div></section>`;}
  function header(title,detail){return `<div class="page-heading"><div><div class="eyebrow">ONELASER · COMPANY WORKSPACE</div><h1>${title}</h1><p>${detail}</p></div><button class="btn" data-company-refresh>${tr('刷新','Refresh')}</button></div>`;}
  function knowledge(){
    const content=isArchive()?`${window.WorkOSWiki?.renderNav?.()||`<a class="btn" href="#knowledge/">${tr('返回指南','Back to guides')}</a>`}${archive()}`:window.WorkOSWiki?.render()||`<div class="notice amber" role="alert">${tr('知识中心暂未加载，请刷新后重试。','The knowledge center could not load. Refresh to retry.')}</div>`;
    return `<section class="company-knowledge"><div class="page-heading"><div><div class="eyebrow">ONELASER · KNOWLEDGE CENTER</div><h1>${tr('知识中心 / Wiki','Knowledge center / Wiki')}</h1><p>${tr('产品指南、问题排查与下载资源。','Product guides, troubleshooting and downloads.')}</p></div></div>${content}</section>`;
  }
  function archive(){const items=cache.library?.items||[],terms=query.toLowerCase().split(/\s+/).filter(Boolean),filtered=items.filter(a=>terms.every(t=>(a.title+' '+a.family).toLowerCase().includes(t)));return `<section class="panel"><div class="panel-head"><div><h2>${tr('资料档案与人工核对','Source archive & human review')}</h2><p class="fine">${tr('保留原文、来源版本和已有核对记录。','Original content, source versions and existing review records are retained.')}</p></div><button class="btn small" data-company-refresh>${tr('刷新档案','Refresh archive')}</button></div><div class="panel-body"><label class="field"><span>${tr('搜索标题或产品系列','Search title or product family')}</span><input data-company-search value="${esc(query)}" placeholder="${tr('例如：Hydra、安装、firmware','For example: Hydra, setup, firmware')}"></label><p class="fine">${filtered.length} / ${items.length}</p></div>${filtered.map(a=>`<button class="todo-row company-archive-row" data-company-article="${esc(a.id)}"><span class="todo-body"><h3>${esc(a.title)}</h3><span class="todo-meta">${esc(a.family)} · ${esc(a.sourceVersion)}</span></span><span>→</span></button>`).join('')||`<div class="empty">${tr('没有可用文章，请检查同步状态。','No articles available. Check sync status.')}</div>`}</section>`;}
  function support(){const s=cache.summary;return `${header(tr('客服工作台','Support workspace'),tr('工单、回复草稿、知识与服务标准，在一个工作空间内处理。','Tickets, response drafts, knowledge and service standards in one workspace.'))}${freshness(s)}<div class="inline-actions live-space-top company-tabs">${[['tickets','工单与草稿','Tickets & drafts'],['answers','标准回复','Standard answers'],['sla','SLA 草案','SLA draft'],['operations','自动化状态','Automation status']].map(([id,zh,en])=>`<button class="btn ${id===tab?'primary':''}" data-company-tab="${id}">${tr(zh,en)}</button>`).join('')}</div><div class="live-space-top">${tab==='tickets'?tickets():tab==='answers'?answers():tab==='sla'?sla():operations()}</div>`;}
  function tickets(){return `<section class="panel"><div class="panel-head"><h2>${tr('已跟踪的工单','Tracked tickets')}</h2></div><div class="table-wrap"><table class="task-table"><thead><tr><th>${tr('工单','Ticket')}</th><th>${tr('状态','Status')}</th><th>${tr('需要关注','Needs attention')}</th><th>${tr('同步时间','Observed')}</th></tr></thead><tbody>${(cache.tickets?.items||[]).map(t=>`<tr><td><button class="company-text-button" data-company-ticket="${esc(t.id)}"><strong>#${esc(t.number||t.id)}</strong><br>${esc(t.subject||tr('查看工单','View ticket'))}</button></td><td>${esc(t.status)}</td><td>${t.reasons.length?esc(t.reasons.join(' · ')):'—'}</td><td>${date(t.observedAt)}</td></tr>`).join('')}</tbody></table></div><p class="fine panel-body">${tr('AI 草稿不算客户已收到回复。点击工单查看版本、来源与人工审核记录。','An AI draft does not mean the customer received a reply. Open a ticket for versions, sources and human reviews.')}</p></section>`;}
  function answers(){return `<section class="panel"><div class="panel-head"><h2>${tr('标准回复候选','Standard response candidates')}</h2></div>${(cache.answers?.items||[]).map(a=>`<button class="todo-row" data-company-answer="${esc(a.id)}"><span class="todo-body"><h3>${esc(a.title)}</h3><span class="todo-meta">${esc(a.id)} · ${esc(a.family)}</span></span><span>→</span></button>`).join('')}<p class="fine panel-body">${tr('仅供人工核对。审核不会自动启用 Bot 复用或向客户发送。','For human review. Reviewing does not enable automatic Bot reuse or customer delivery.')}</p></section>`;}
  // Render the SLA document's text-only Markdown subset; source HTML is never executable.
  function documentInline(value){
    const text=String(value),pattern=/(`+)([^\n]*?)\1|\*\*([^\n]+?)\*\*/g;let html='',offset=0,match;
    while((match=pattern.exec(text))){html+=esc(text.slice(offset,match.index));html+=match[1]?`<code>${esc(match[2])}</code>`:`<strong>${documentInline(match[3])}</strong>`;offset=pattern.lastIndex;}
    return html+esc(text.slice(offset));
  }
  function documentCells(line){
    const cells=[];let cell='',code='';
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='\\'&&line[i+1]==='|'&&!code){cell+='|';i++;continue;}
      if(ch==='`'){let ticks=ch;while(line[i+1]==='`'){ticks+='`';i++;}if(!code)code=ticks;else if(code===ticks)code='';cell+=ticks;continue;}
      if(ch==='|'&&!code){cells.push(cell.trim());cell='';}else cell+=ch;
    }
    cells.push(cell.trim());if(cells[0]==='')cells.shift();if(cells.at(-1)==='')cells.pop();return cells;
  }
  function renderSlaDocument(value){
    const lines=String(value??'').replace(/\r\n?/g,'\n').split('\n');let html='',paragraph=[];
    const flush=()=>{if(paragraph.length){html+=`<p>${documentInline(paragraph.join(' '))}</p>`;paragraph=[];}};
    const bullet=line=>line.match(/^\s{0,3}(?:([-+*])|(\d+)[.)])\s+(.+)$/);
    for(let i=0;i<lines.length;){
      const line=lines[i],trim=line.trim();
      if(!trim){flush();i++;continue;}
      const heading=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
      if(heading){flush();const level=Math.min(6,heading[1].length+1),title=heading[2].replace(/\s+#+\s*$/,'');html+=`<h${level}>${documentInline(title)}</h${level}>`;i++;continue;}
      const separators=i+1<lines.length?documentCells(lines[i+1]):[];
      const headers=documentCells(line);
      if(line.includes('|')&&separators.length===headers.length&&separators.length&&separators.every(cell=>/^:?-{3,}:?$/.test(cell))){
        flush();const rows=[];i+=2;
        while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')){const cells=documentCells(lines[i]);if(cells.length!==headers.length)break;rows.push(cells);i++;}
        html+=`<div class="company-document-table" role="region" aria-label="${tr('服务标准表格','Service standards table')}" tabindex="0"><table><thead><tr>${headers.map(cell=>`<th scope="col">${documentInline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${documentInline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;continue;
      }
      const item=bullet(line);
      if(item){
        flush();const ordered=!!item[2],tag=ordered?'ol':'ul',start=ordered&&Number(item[2])>1?` start="${Number(item[2])}"`:'';html+=`<${tag}${start}>`;
        while(i<lines.length){const next=bullet(lines[i]);if(!next||!!next[2]!==ordered)break;html+=`<li>${documentInline(next[3])}</li>`;i++;}
        html+=`</${tag}>`;continue;
      }
      paragraph.push(trim);i++;
    }
    flush();return html;
  }
  function sla(){return `<section class="panel"><div class="panel-head"><h2>${tr('服务标准 · 待确认','Service standards · draft')}</h2><span class="badge amber">${tr('尚未生效','Not active')}</span></div><div class="panel-body"><article class="company-document">${renderSlaDocument(cache.sla?.policy?.body||tr('等待同步 SLA 草案','Awaiting SLA draft sync'))}</article></div></section>`;}
  function operations(){const s=cache.summary;return `<section class="panel"><div class="panel-head"><h2>${tr('客服自动化运行状态','Support automation status')}</h2></div><div class="panel-body"><dl class="company-facts"><dt>${tr('运行位置','Runtime')}</dt><dd>${tr('当前 Mac 试运行，休眠或断网会中断自动化','Current Mac pilot; sleep or loss of connectivity interrupts automation')}</dd><dt>${tr('工单最近读取成功','Last successful ticket poll')}</dt><dd>${date(s?.pollerLastSuccess)}</dd><dt>${tr('时限最近检查成功','Last successful deadline check')}</dt><dd>${date(s?.watchLastSuccess)}</dd><dt>${tr('Grok 派发','Grok dispatch')}</dt><dd>${s?.dispatchPaused==null?'—':s.dispatchPaused?tr('已暂停','Paused'):tr('未暂停，请结合运行时间判断','Not paused; check runtime timestamps')}</dd><dt>${tr('排队任务 / 需核对任务','Queued / needs verification')}</dt><dd>${s?.jobs?.pending??'—'} / ${s?.jobs?.attention??'—'}</dd><dt>${tr('客户自动发送','Automatic customer delivery')}</dt><dd>${tr('关闭','Disabled')}</dd></dl><p class="fine">${tr('此处读取现有后台的状态，不重复启动派发，也不自动重试结果不明确的任务。','This screen reads the existing backend. It does not start a second dispatcher or retry ambiguous jobs.')}</p></div></section>`;}
  function reviewForm(kind,id,contentHash,enabled){if(!actor?.supportAccess?.review)return '';return `<form data-company-review data-kind="${kind}" data-id="${esc(id)}" data-hash="${esc(contentHash)}"><h3>${tr('人工核对记录','Human review record')}</h3><label class="field"><span>${tr('结论','Finding')}</span><select name="decision"><option value="reviewed">${tr('已核对，可供人工参考','Reviewed for human reference')}</option><option value="changes_requested">${tr('需要修改','Changes requested')}</option></select></label><label class="field"><span>${tr('说明','Notes')}</span><textarea name="note" required minlength="3" maxlength="4000"></textarea></label><label class="form-check"><input type="checkbox" name="confirm" required><span>${tr('我已核对当前版本及引用来源。此操作不会发送客户邮件或发布内容。','I checked this version and its sources. This does not send customer mail or publish content.')}</span></label><button class="btn primary live-space-top" ${enabled?'':'disabled'}>${tr('保存核对记录','Save review record')}</button><p class="form-error" role="alert"></p></form>`;}
  const history=items=>`<h3 class="live-space-top">${tr('核对记录','Review history')}</h3>${items.length?items.map(r=>`<p><strong>${esc(r.display_name)}</strong> · ${esc(r.decision)} · ${date(r.created_at)}<br>${esc(r.note)}</p>`).join(''):`<p class="fine">${tr('暂无记录','No records yet')}</p>`}`;
  async function open(kind,id){
    const identity=actor.id,generation=++openGeneration,current=()=>actor?.id===identity&&generation===openGeneration;let title,body;
    try{
    if(kind==='ticket'){
      const data=await api.get('/support/tickets/'+encodeURIComponent(id));if(!current())return;
      title='#'+(data.ticket.number||data.ticket.id)+' '+data.ticket.subject;
      body=`<p>${tr('回复到期','Reply due')}: ${date(data.ticket.responseDueAt)} · ${tr('解决到期','Resolution due')}: ${date(data.ticket.resolutionDueAt)}</p>${freshness(data)}${data.drafts.map(d=>`<section class="company-draft"><h3>v${d.version} · ${esc(d.status)} · ${date(d.createdAt)}</h3><pre class="company-prose">${esc(d.body)}</pre><h4>${tr('引用来源','Sources')}</h4><ul>${d.sources.map(s=>`<li>${source(s)}</li>`).join('')}</ul>${reviewForm('draft',d.id,d.contentHash,d.reviewable)}${history(data.reviews.filter(r=>r.entity_id===d.id))}</section>`).join('')||`<p>${tr('暂无草稿','No draft available')}</p>`}`;
    }else{
      const a=kind==='article'?await api.get('/support/articles/'+encodeURIComponent(id)):cache.answers?.items.find(a=>a.id===id);if(!a||!current())return;
      const reviews=actor.supportAccess?.read?await api.get('/support/reviews/'+kind+'/'+encodeURIComponent(id)):{items:[]};if(!current())return;
      title=a.title;body=`<pre class="company-prose">${esc(a.body)}</pre>${kind==='article'?source({url:a.sourceUrl,title:tr('查看原始资料','View original source'),version:a.sourceVersion}):`<p>${esc(a.note)}</p><ul>${a.sources.map(s=>`<li>${source(s)}</li>`).join('')}</ul>`}${reviewForm(kind,a.id,a.contentHash,cache.summary?.connected&&!cache.summary?.stale)}${history(reviews.items)}`;
    }
    if(current())showModal(esc(title),body);
    }catch(error){if(current())throw error;}
  }
  document.addEventListener('click',async e=>{
    const t=e.target.closest('[data-company-tab],[data-company-refresh],[data-company-ticket],[data-company-article],[data-company-answer]');if(!t||!actor)return;
    try{if(t.dataset.companyTab){tab=t.dataset.companyTab;changed();}else if(t.hasAttribute('data-company-refresh')){await refresh();changed();}else await open(t.dataset.companyTicket?'ticket':t.dataset.companyArticle?'article':'answer',t.dataset.companyTicket||t.dataset.companyArticle||t.dataset.companyAnswer);}catch{showModal(tr('暂时无法读取','Temporarily unavailable'),tr('请刷新或重新登录后重试。','Refresh or sign in again.'));}
  });
  document.addEventListener('change',e=>{if(e.target.matches('[data-company-search]')){query=e.target.value;changed();}});
  document.addEventListener('submit',async e=>{
    const form=e.target;if(!form.matches('[data-company-review]'))return;e.preventDefault();const button=form.querySelector('button');if(button.disabled)return;button.disabled=true;
    try{const values=new FormData(form);await api.post('/support/reviews',{kind:form.dataset.kind,id:form.dataset.id,contentHash:form.dataset.hash,decision:values.get('decision'),note:values.get('note'),humanConfirmation:values.get('confirm')==='on'});form.innerHTML=`<p role="status">${tr('已保存。客户发送、知识发布及 SLA 启用均未执行。','Saved. No customer message, publication or SLA activation was performed.')}</p>`;}
    catch{form.querySelector('[role="alert"]').textContent=tr('保存失败，记录可能已更新或同步过期。请刷新当前版本后核对。','Save failed. The record may have changed or sync expired. Refresh and review the current version.');button.disabled=false;}
  });
  return {configure,reset,refresh,support,knowledge,summary};
})();
