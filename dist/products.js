'use strict';
/* Product hub (test area) — three boards:
 *  1. Product catalog: every attribute of an e-commerce product, Shopify-admin style
 *  2. Cost calculator: search a SKU or name; everyone with access sees the final cost,
 *     only `product_cost_detail` holders see how it is calculated
 *  3. Supply chain panorama + auto-replenishment: factory / in transit / overseas
 *     warehouse per SKU, days of cover and suggested purchase orders
 *     (Inventory Planner style)
 * Visible only to users granted `products`. Prototype: sample data in memory.
 */
(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  let ctx = null;
  const lang = () => ctx?.lang?.() === 'en' ? 'en' : 'zh';
  const tr = (zh, en) => lang() === 'en' ? en : zh;
  const icon = n => `<i class="ph ph-${n}" aria-hidden="true"></i>`;
  const L = o => o && typeof o === 'object' ? (o[lang()] ?? o.zh) : o;
  const usd = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const int = n => Math.round(n).toLocaleString('en-US');
  const TODAY = new Date('2026-10-31T12:00:00');
  const addDays = n => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d; };
  const fmtD = d => lang() === 'en' ? d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) : `${d.getMonth() + 1}月${d.getDate()}日`;

  /* ---------- sample catalog ---------- */
  const LIFECYCLE = { dev:['研发中','In development','#a25ddc'], sample:['打样','Prototype','#579bfc'], ramp:['量产准备','Ramp-up','#fdab3d'], live:['在售','Selling','#00c875'], eol:['停产','End of life','#9699a6'] };
  const STATUS = { active:['上架','Active','#00c875'], draft:['草稿','Draft','#9699a6'], archived:['已归档','Archived','#c4c4c4'] };
  const P = (o) => ({ variants:[], tags:[], channels:['shopify'], ...o });
  const products = [
    P({ sku:'HYD-60', name:{ zh:'Hydra 60W 激光雕刻机', en:'Hydra 60W laser engraver' }, cat:{ zh:'CO2 激光机', en:'CO2 laser' }, icon:'cube', status:'active', life:'live', price:3999, compare:4499, dealer:2999, factory:{ zh:'东莞工厂', en:'Dongguan factory' }, hs:'8456.11', origin:'CN', weight:68, dims:'110×78×42', cbm:0.42, moq:20, prodDays:25, shipDays:30, exw:11800, pack:35, tariff:27.4, lastMile:180, wip:40, ready:20, transit:60, wh:34, velocity:1.6, channels:['shopify','amazon','dealer'], tags:['旗舰','60W'], desc:{ zh:'60W CO2 激光，自动对焦，摄像头定位，适合小型工作室批量雕刻。', en:'60W CO2 laser with autofocus and camera positioning for small studios.' }, variants:[{ name:'60W', sku:'HYD-60' }, { name:'80W', sku:'HYD-80' }] }),
    P({ sku:'COB-40', name:{ zh:'Cobra 40W 桌面激光机', en:'Cobra 40W desktop laser' }, cat:{ zh:'CO2 激光机', en:'CO2 laser' }, icon:'cube', status:'active', life:'live', price:2499, compare:2799, dealer:1899, factory:{ zh:'东莞工厂', en:'Dongguan factory' }, hs:'8456.11', origin:'CN', weight:42, dims:'92×62×36', cbm:0.26, moq:30, prodDays:20, shipDays:30, exw:7200, pack:28, tariff:27.4, lastMile:120, wip:0, ready:0, transit:30, wh:12, velocity:1.9, channels:['shopify','amazon'] }),
    P({ sku:'VRT-30', name:{ zh:'VertiGo 30W 光纤打标机', en:'VertiGo 30W fiber marker' }, cat:{ zh:'光纤激光', en:'Fiber laser' }, icon:'lightning', status:'active', life:'live', price:3299, compare:3599, dealer:2499, factory:{ zh:'济南工厂', en:'Jinan factory' }, hs:'8456.11', origin:'CN', weight:38, dims:'70×50×60', cbm:0.21, moq:10, prodDays:18, shipDays:32, exw:9800, pack:30, tariff:27.4, lastMile:110, wip:15, ready:0, transit:0, wh:46, velocity:0.7, channels:['shopify','dealer'] }),
    P({ sku:'GFX-50', name:{ zh:'Galvo Flex 50W 振镜激光', en:'Galvo Flex 50W galvo laser' }, cat:{ zh:'光纤激光', en:'Fiber laser' }, icon:'lightning', status:'draft', life:'ramp', price:4599, compare:0, dealer:3399, factory:{ zh:'济南工厂', en:'Jinan factory' }, hs:'8456.11', origin:'CN', weight:45, dims:'72×55×62', cbm:0.25, moq:10, prodDays:30, shipDays:32, exw:13600, pack:32, tariff:27.4, lastMile:120, wip:30, ready:0, transit:0, wh:0, velocity:0, channels:[] }),
    P({ sku:'XRF-100', name:{ zh:'XRF 100W 大幅面激光切割机', en:'XRF 100W large-format cutter' }, cat:{ zh:'CO2 激光机', en:'CO2 laser' }, icon:'cube', status:'active', life:'live', price:7999, compare:8999, dealer:6199, factory:{ zh:'东莞工厂', en:'Dongguan factory' }, hs:'8456.11', origin:'CN', weight:320, dims:'180×130×110', cbm:2.6, moq:5, prodDays:30, shipDays:35, exw:26500, pack:120, tariff:27.4, lastMile:450, wip:6, ready:4, transit:8, wh:3, velocity:0.25, channels:['shopify','dealer'] }),
    P({ sku:'ACC-ROT', name:{ zh:'旋转轴（圆柱雕刻）', en:'Rotary axis' }, cat:{ zh:'配件', en:'Accessory' }, icon:'arrows-clockwise', status:'active', life:'live', price:299, compare:349, dealer:209, factory:{ zh:'东莞工厂', en:'Dongguan factory' }, hs:'8466.94', origin:'CN', weight:4.5, dims:'40×20×18', cbm:0.015, moq:100, prodDays:12, shipDays:30, exw:520, pack:4, tariff:25, lastMile:18, wip:200, ready:0, transit:150, wh:95, velocity:4.2, channels:['shopify','amazon','dealer'] }),
    P({ sku:'ACC-AF', name:{ zh:'烟雾净化器', en:'Fume extractor' }, cat:{ zh:'配件', en:'Accessory' }, icon:'wind', status:'active', life:'live', price:899, compare:999, dealer:649, factory:{ zh:'合作工厂', en:'Partner factory' }, hs:'8421.39', origin:'CN', weight:28, dims:'50×45×75', cbm:0.17, moq:20, prodDays:15, shipDays:30, exw:2100, pack:15, tariff:25, lastMile:75, wip:0, ready:40, transit:0, wh:8, velocity:1.1, channels:['shopify','dealer'] }),
    P({ sku:'ACC-LENS', name:{ zh:'聚焦镜片套装', en:'Focus lens kit' }, cat:{ zh:'耗材', en:'Consumable' }, icon:'circle-half', status:'active', life:'live', price:79, compare:0, dealer:52, factory:{ zh:'合作工厂', en:'Partner factory' }, hs:'9002.11', origin:'CN', weight:0.3, dims:'15×10×5', cbm:0.001, moq:200, prodDays:10, shipDays:30, exw:95, pack:1, tariff:25, lastMile:6, wip:0, ready:0, transit:300, wh:410, velocity:6.5, channels:['shopify','amazon'] }),
  ];
  const CHANNELS = { shopify:'1laser.com', amazon:'Amazon', dealer:{ zh:'经销商', en:'Dealers' } };
  const shipments = [
    { id:'MSKU 482190-3', mode:{ zh:'海运整柜', en:'Ocean FCL' }, eta:addDays(9), from:{ zh:'深圳盐田', en:'Yantian, Shenzhen' }, to:'Lake Forest, CA', items:[['HYD-60', 40], ['ACC-ROT', 150], ['COB-40', 30]] },
    { id:'CMAU 771045-8', mode:{ zh:'海运拼柜', en:'Ocean LCL' }, eta:addDays(21), from:{ zh:'青岛', en:'Qingdao' }, to:'Lake Forest, CA', items:[['HYD-60', 20], ['XRF-100', 8], ['ACC-LENS', 300]] },
  ];

  const ui = { tab:'catalog', product:null, search:'', costQuery:'', costSku:'HYD-60', viewAsBasic:false, scFilter:'all', safety:14, cover:45 };
  const assumptions = { fx:7.15, oceanPerCbm:135, domesticPerCbm:28, customsPerUnit:0.025, threePl:0.035, paymentPct:3.2, afterSalesPct:2.5, targetMargin:45 };
  const canDetail = () => (ctx.state().actor?.grants || []).includes('product_cost_detail') && !ui.viewAsBasic;
  const bySku = sku => products.find(p => p.sku === sku);

  /* ---------- cost model (per unit, USD) ---------- */
  function cost(p) {
    const a = assumptions, exwUsd = p.exw / a.fx;
    const lines = [
      ['exw', tr('出厂价', 'Factory price (EXW)'), exwUsd, `¥${int(p.exw)} ÷ ${a.fx}`],
      ['pack', tr('包装', 'Packaging'), p.pack, tr('每台固定', 'Per unit')],
      ['domestic', tr('国内运输到港', 'Domestic freight to port'), p.cbm * a.domesticPerCbm, `${p.cbm} CBM × $${a.domesticPerCbm}`],
      ['ocean', tr('海运费', 'Ocean freight'), p.cbm * a.oceanPerCbm, `${p.cbm} CBM × $${a.oceanPerCbm}`],
      ['duty', tr('进口关税', 'Import duty'), exwUsd * p.tariff / 100, `${tr('货值', 'Value')} × ${p.tariff}% (HTS ${p.hs})`],
      ['customs', tr('清关与港杂', 'Customs & port fees'), exwUsd * a.customsPerUnit, `${tr('货值', 'Value')} × ${(a.customsPerUnit * 100).toFixed(1)}%`],
      ['3pl', tr('海外仓入库与仓储', 'Warehouse receiving & storage'), exwUsd * a.threePl, `${tr('货值', 'Value')} × ${(a.threePl * 100).toFixed(1)}%`],
    ];
    const landed = lines.reduce((s, l) => s + l[2], 0);
    const fulfil = [
      ['lastmile', tr('尾程配送', 'Last-mile delivery'), p.lastMile, tr('平均每单', 'Average per order')],
      ['payment', tr('支付与平台费', 'Payment & platform fees'), p.price * a.paymentPct / 100, `${tr('售价', 'Price')} × ${a.paymentPct}%`],
      ['aftersales', tr('售后预留', 'After-sales reserve'), p.price * a.afterSalesPct / 100, `${tr('售价', 'Price')} × ${a.afterSalesPct}%`],
    ];
    const total = landed + fulfil.reduce((s, l) => s + l[2], 0);
    const margin = p.price ? (p.price - total) / p.price * 100 : 0;
    const pctFees = (a.paymentPct + a.afterSalesPct) / 100;
    const suggested = (landed + p.lastMile) / Math.max(0.05, 1 - a.targetMargin / 100 - pctFees);
    const dealerMargin = p.dealer ? (p.dealer - landed - p.lastMile * .3) / p.dealer * 100 : 0;
    return { lines, landed, fulfil, total, margin, suggested, dealerMargin };
  }

  /* ---------- supply chain math ---------- */
  function supply(p) {
    const lead = p.prodDays + p.shipDays, v = p.velocity;
    const pipeline = p.wip + p.ready + p.transit + p.wh;
    const cover = v > 0 ? p.wh / v : Infinity, pipeCover = v > 0 ? pipeline / v : Infinity;
    const rop = v * (lead + ui.safety);
    const need = v * (lead + ui.safety + ui.cover) - pipeline;
    const qty = need > 0 ? Math.ceil(need / p.moq) * p.moq : 0;
    const orderIn = v > 0 ? Math.floor((pipeline - rop) / v) : Infinity;
    let state = 'ok';
    if (v === 0 && pipeline > 0 && p.life !== 'ramp') state = 'idle';
    else if (v > 0 && cover < 14) state = 'stockout';
    else if (qty > 0 && orderIn <= 0) state = 'reorder';
    else if (v > 0 && pipeCover > (lead + ui.safety + ui.cover) * 1.8) state = 'excess';
    const nextShip = shipments.filter(s => s.items.some(i => i[0] === p.sku)).sort((a, b) => a.eta - b.eta)[0];
    return { lead, pipeline, cover, pipeCover, rop, qty, orderIn, state, nextShip, value:qty * p.exw };
  }
  const STATE = { stockout:['即将缺货','Stock-out risk','bad'], reorder:['需要补货','Reorder now','warn'], ok:['正常','Healthy','ok'], excess:['库存偏多','Overstock','info'], idle:['无销量','No sales','muted'] };

  /* ---------- shell ---------- */
  function render() {
    if (!ctx) return '';
    const tabs = [['catalog', icon('package'), tr('产品管理', 'Catalog')], ['cost', icon('calculator'), tr('成本核算', 'Cost calculator')], ['supply', icon('truck'), tr('供应链全景 · 自动补货', 'Supply chain · Replenishment')]];
    return `<div class="pd">
      <div class="page-heading"><div><div class="eyebrow">LABS · PRODUCT HUB</div><h1>${tr('产品管理区', 'Product hub')}</h1><p>${tr('产品资料、成本和库存在一个地方。仅限授权人员访问。', 'Product data, costs and inventory in one place. Restricted access.')}</p></div></div>
      <div class="pd-banner">${icon('lock-simple')} ${tr('受限区域 · 测试原型，数据为示例，修改不会保存', 'Restricted · test prototype with sample data; changes are not saved')}</div>
      <nav class="pd-tabs">${tabs.map(([id, ic, label]) => `<button class="${ui.tab === id ? 'active' : ''}" data-pd="tab" data-v="${id}">${ic} ${label}</button>`).join('')}</nav>
      ${ui.tab === 'cost' ? costBoard() : ui.tab === 'supply' ? supplyBoard() : ui.product ? productEditor(bySku(ui.product)) : catalog()}
    </div>`;
  }

  /* ---------- 1. catalog (Shopify admin style) ---------- */
  const pill = (map, k) => `<span class="pd-pill" style="--c:${map[k][2]}">${esc(tr(map[k][0], map[k][1]))}</span>`;
  function catalog() {
    const q = ui.search.trim().toLowerCase();
    const list = products.filter(p => !q || `${p.sku} ${p.name.zh} ${p.name.en} ${L(p.cat)}`.toLowerCase().includes(q));
    const counts = Object.keys(LIFECYCLE).map(k => [k, products.filter(p => p.life === k).length]).filter(x => x[1]);
    return `<div class="pd-toolbar"><label class="pd-search">${icon('magnifying-glass')}<input data-pd-search placeholder="${tr('搜索 SKU、名称或分类', 'Search SKU, name or category')}" value="${esc(ui.search)}"></label><span class="pd-chips">${counts.map(([k, n]) => `<span class="pd-chip"><i style="--c:${LIFECYCLE[k][2]}"></i>${esc(tr(LIFECYCLE[k][0], LIFECYCLE[k][1]))} ${n}</span>`).join('')}</span><button class="pd-btn primary" data-pd="new-product">${icon('plus')} ${tr('添加产品', 'Add product')}</button></div>
      <section class="pd-card"><table class="pd-table"><thead><tr><th>${tr('产品', 'Product')}</th><th>${tr('状态', 'Status')}</th><th>${tr('生命周期', 'Lifecycle')}</th><th>${tr('库存', 'Inventory')}</th><th>${tr('销售渠道', 'Channels')}</th><th>${tr('分类', 'Category')}</th><th>${tr('工厂', 'Factory')}</th><th class="num">${tr('零售价', 'Price')}</th></tr></thead><tbody>
      ${list.map(p => { const inv = p.wh; return `<tr data-pd="open-product" data-sku="${p.sku}" tabindex="0"><td><div class="pd-prod"><span class="pd-thumb">${icon(p.icon)}</span><div><strong>${esc(L(p.name))}</strong><span>${p.sku}${p.variants.length ? ` · ${p.variants.length} ${tr('个规格', 'variants')}` : ''}</span></div></div></td><td>${pill(STATUS, p.status)}</td><td>${pill(LIFECYCLE, p.life)}</td><td class="${inv < 10 ? 'pd-bad' : ''}">${inv} ${tr('件可售', 'available')}${p.transit ? `<small> · ${p.transit} ${tr('在途', 'inbound')}</small>` : ''}</td><td>${p.channels.map(c => `<span class="pd-tag">${esc(L(CHANNELS[c]))}</span>`).join('') || '—'}</td><td>${esc(L(p.cat))}</td><td>${esc(L(p.factory))}</td><td class="num">${usd(p.price)}</td></tr>`; }).join('') || `<tr><td colspan="8" class="pd-empty">${tr('没有匹配的产品', 'No matching products')}</td></tr>`}
      </tbody></table></section>`;
  }
  function productEditor(p) {
    const s = supply(p);
    const f = (label, value, attrs = '') => `<label class="pd-field"><span>${label}</span><input value="${esc(value)}" ${attrs}></label>`;
    return `<div class="pd-crumb"><button data-pd="back">${icon('caret-left')} ${tr('全部产品', 'All products')}</button></div>
      <div class="pd-editor-head"><span class="pd-thumb big">${icon(p.icon)}</span><div><h2>${esc(L(p.name))}</h2><p>${p.sku} · ${esc(L(p.cat))}</p></div>${pill(STATUS, p.status)}<button class="pd-btn primary" data-pd="save-product">${tr('保存', 'Save')}</button></div>
      <div class="pd-editor">
        <div class="pd-main">
          <section class="pd-card"><h3>${tr('基本信息', 'Basics')}</h3>${f(tr('产品名称（中文）', 'Title (Chinese)'), p.name.zh)}${f(tr('产品名称（英文）', 'Title (English)'), p.name.en)}<label class="pd-field"><span>${tr('描述', 'Description')}</span><textarea rows="3">${esc(L(p.desc) || '')}</textarea></label></section>
          <section class="pd-card"><h3>${tr('媒体', 'Media')}</h3><div class="pd-media">${[1, 2, 3].map(() => `<span class="pd-thumb big">${icon(p.icon)}</span>`).join('')}<button class="pd-media-add">${icon('upload-simple')}<span>${tr('上传图片 / 视频', 'Upload images / video')}</span></button></div></section>
          <section class="pd-card"><h3>${tr('价格', 'Pricing')}</h3><div class="pd-grid3">${f(tr('零售价 (USD)', 'Price (USD)'), p.price, 'type="number"')}${f(tr('划线价', 'Compare-at price'), p.compare || '', 'type="number"')}${f(tr('经销价', 'Dealer price'), p.dealer, 'type="number"')}</div><p class="pd-hint">${icon('calculator')} ${tr('成本与毛利在“成本核算”中查看', 'See cost and margin in Cost calculator')} <button class="pd-link" data-pd="cost-for" data-sku="${p.sku}">${tr('打开', 'Open')}</button></p></section>
          <section class="pd-card"><h3>${tr('规格（变体）', 'Variants')}</h3>${p.variants.length ? `<table class="pd-table small"><thead><tr><th>${tr('规格', 'Option')}</th><th>SKU</th></tr></thead><tbody>${p.variants.map(v => `<tr><td>${esc(v.name)}</td><td>${esc(v.sku)}</td></tr>`).join('')}</tbody></table>` : `<p class="pd-hint">${tr('没有规格。如有功率、颜色等不同选项，可以在这里添加。', 'No variants. Add options such as wattage or color here.')}</p>`}<button class="pd-link">${icon('plus')} ${tr('添加规格', 'Add option')}</button></section>
          <section class="pd-card"><h3>${tr('物流与报关', 'Shipping & customs')}</h3><div class="pd-grid3">${f(tr('毛重 (kg)', 'Gross weight (kg)'), p.weight)}${f(tr('包装尺寸 (cm)', 'Package size (cm)'), p.dims)}${f(tr('体积 (CBM)', 'Volume (CBM)'), p.cbm)}${f(tr('HS 编码', 'HS code'), p.hs)}${f(tr('原产地', 'Country of origin'), p.origin)}${f(tr('关税率 %', 'Duty rate %'), p.tariff)}</div></section>
          <section class="pd-card"><h3>${tr('采购与供应', 'Sourcing')}</h3><div class="pd-grid3">${f(tr('生产工厂', 'Factory'), L(p.factory))}${f(tr('最小起订量 (MOQ)', 'MOQ'), p.moq)}${f(tr('生产周期（天）', 'Production lead time (days)'), p.prodDays)}${f(tr('运输周期（天）', 'Transit time (days)'), p.shipDays)}</div><p class="pd-hint">${icon('truck')} ${tr(`总交期 ${s.lead} 天 · 可售 ${p.wh} 件 · 在途 ${p.transit} 件 · 生产中 ${p.wip} 件`, `Total lead time ${s.lead} days · ${p.wh} available · ${p.transit} inbound · ${p.wip} in production`)}</p></section>
        </div>
        <aside class="pd-side">
          <section class="pd-card"><h3>${tr('状态', 'Status')}</h3><select class="pd-select">${Object.keys(STATUS).map(k => `<option ${k === p.status ? 'selected' : ''}>${esc(tr(STATUS[k][0], STATUS[k][1]))}</option>`).join('')}</select></section>
          <section class="pd-card"><h3>${tr('生命周期', 'Lifecycle')}</h3><ol class="pd-life">${Object.keys(LIFECYCLE).map(k => `<li class="${k === p.life ? 'on' : Object.keys(LIFECYCLE).indexOf(k) < Object.keys(LIFECYCLE).indexOf(p.life) ? 'past' : ''}"><i style="--c:${LIFECYCLE[k][2]}"></i>${esc(tr(LIFECYCLE[k][0], LIFECYCLE[k][1]))}</li>`).join('')}</ol></section>
          <section class="pd-card"><h3>${tr('销售渠道', 'Sales channels')}</h3>${Object.keys(CHANNELS).map(c => `<label class="pd-check"><input type="checkbox" ${p.channels.includes(c) ? 'checked' : ''}> ${esc(L(CHANNELS[c]))}</label>`).join('')}</section>
          <section class="pd-card"><h3>${tr('分类与标签', 'Organization')}</h3>${f(tr('产品分类', 'Product type'), L(p.cat))}<div class="pd-tags">${p.tags.map(t => `<span class="pd-tag">${esc(t)}</span>`).join('')}<button class="pd-link">${icon('plus')} ${tr('标签', 'Tag')}</button></div></section>
        </aside>
      </div>`;
  }

  /* ---------- 2. cost calculator ---------- */
  function costBoard() {
    const q = ui.costQuery.trim().toLowerCase();
    const matches = q ? products.filter(p => `${p.sku} ${p.name.zh} ${p.name.en}`.toLowerCase().includes(q)).slice(0, 6) : [];
    const p = bySku(ui.costSku), c = p && cost(p), detail = canDetail();
    const previewSwitch = window.WORKOS_PREVIEW && (ctx.state().actor?.grants || []).includes('product_cost_detail') ? `<label class="pd-preview-switch"><input type="checkbox" data-pd-viewas ${ui.viewAsBasic ? 'checked' : ''}> ${tr('预览：以“只看最终成本”的身份查看（如袁勇）', 'Preview: view as a final-cost-only user')}</label>` : '';
    return `<div class="pd-cost">
      <div class="pd-cost-search"><label class="pd-search big">${icon('magnifying-glass')}<input data-pd-cost placeholder="${tr('输入 SKU 或产品名称，例如 HYD-60 或 Hydra', 'Enter a SKU or name, e.g. HYD-60 or Hydra')}" value="${esc(ui.costQuery)}" autocomplete="off"></label>
        ${matches.length ? `<div class="pd-suggest">${matches.map(m => `<button data-pd="pick-cost" data-sku="${m.sku}"><span class="pd-thumb">${icon(m.icon)}</span><strong>${m.sku}</strong> ${esc(L(m.name))}</button>`).join('')}</div>` : ''}
        ${previewSwitch}</div>
      ${p ? `<section class="pd-card pd-cost-hero"><div class="pd-prod"><span class="pd-thumb big">${icon(p.icon)}</span><div><strong>${esc(L(p.name))}</strong><span>${p.sku} · ${esc(L(p.factory))}</span></div></div>
        <div class="pd-final"><span>${tr('最终成本（到岸 + 履约，每台）', 'Final cost (landed + fulfillment, per unit)')}</span><strong>${usd(c.total)}</strong>${detail ? `<em>${tr('到岸成本', 'Landed')} ${usd(c.landed)}</em>` : ''}</div>
        ${detail ? `<div class="pd-final"><span>${tr('当前零售价 / 毛利率', 'Current price / margin')}</span><strong>${usd(p.price)}</strong><em class="${c.margin < 30 ? 'pd-bad' : 'pd-good'}">${tr('毛利率', 'Margin')} ${c.margin.toFixed(1)}%</em></div><div class="pd-final"><span>${tr(`按 ${assumptions.targetMargin}% 目标毛利的建议零售价`, `Suggested price at ${assumptions.targetMargin}% target margin`)}</span><strong>${usd(c.suggested)}</strong><em>${tr('经销价毛利', 'Dealer margin')} ${c.dealerMargin.toFixed(1)}%</em></div>` : ''}</section>
        ${detail ? `<div class="pd-cost-grid"><section class="pd-card"><h3>${tr('成本构成（每台，USD）', 'Cost breakdown (per unit, USD)')}</h3><table class="pd-table pd-breakdown"><tbody>
            ${c.lines.map(l => `<tr><td>${l[1]}</td><td class="pd-formula">${esc(l[3])}</td><td class="num">${usd(l[2])}</td><td class="pd-share"><i style="width:${Math.round(l[2] / c.total * 100)}%"></i></td></tr>`).join('')}
            <tr class="pd-subtotal"><td>${tr('到岸成本', 'Landed cost')}</td><td></td><td class="num">${usd(c.landed)}</td><td></td></tr>
            ${c.fulfil.map(l => `<tr><td>${l[1]}</td><td class="pd-formula">${esc(l[3])}</td><td class="num">${usd(l[2])}</td><td class="pd-share"><i style="width:${Math.round(l[2] / c.total * 100)}%"></i></td></tr>`).join('')}
            <tr class="pd-total"><td>${tr('最终成本', 'Final cost')}</td><td></td><td class="num">${usd(c.total)}</td><td></td></tr></tbody></table></section>
          <section class="pd-card"><h3>${tr('计算假设（可调整，实时重算）', 'Assumptions (edit to recalculate)')}</h3><form class="pd-assume" id="pd-assume">
            ${[['fx', tr('汇率 (CNY/USD)', 'FX (CNY per USD)'), .01], ['oceanPerCbm', tr('海运费 ($/CBM)', 'Ocean ($/CBM)'), 1], ['domesticPerCbm', tr('国内运输 ($/CBM)', 'Domestic ($/CBM)'), 1], ['paymentPct', tr('支付与平台费 %', 'Payment fees %'), .1], ['afterSalesPct', tr('售后预留 %', 'After-sales %'), .1], ['targetMargin', tr('目标毛利率 %', 'Target margin %'), 1]].map(([k, label, step]) => `<label class="pd-field"><span>${label}</span><input type="number" step="${step}" name="${k}" value="${assumptions[k]}"></label>`).join('')}
            <label class="pd-field"><span>${tr(`关税率 %（${p.sku}）`, `Duty % (${p.sku})`)}</span><input type="number" step="0.1" name="tariff" value="${p.tariff}"></label>
          </form><p class="pd-hint">${tr('调整只影响当前页面，用于测算不同汇率、运费、关税下的成本和定价。', 'Adjustments affect this page only, for what-if analysis of FX, freight and duty.')}</p></section></div>`
        : `<div class="pd-locked">${icon('lock-simple')} ${tr('成本计算明细仅限授权人员查看。如需了解构成，请联系有“成本明细”权限的负责人。', 'Cost breakdown is restricted. Contact someone with Cost detail access.')}</div>`}` : `<p class="pd-hint">${tr('输入 SKU 或名称开始查询。', 'Enter a SKU or name to start.')}</p>`}
    </div>`;
  }

  /* ---------- 3. supply chain panorama + replenishment ---------- */
  function supplyBoard() {
    const rows = products.filter(p => p.status !== 'archived').map(p => ({ p, s:supply(p) }));
    const sum = k => rows.reduce((t, r) => t + r.p[k], 0);
    const value = k => rows.reduce((t, r) => t + r.p[k] * r.p.exw / assumptions.fx, 0);
    const filtered = rows.filter(r => ui.scFilter === 'all' || (ui.scFilter === 'action' ? ['stockout', 'reorder'].includes(r.s.state) : r.s.state === ui.scFilter));
    const toOrder = rows.filter(r => r.s.qty > 0 && ['stockout', 'reorder'].includes(r.s.state));
    const byFactory = {}; toOrder.forEach(r => { const k = L(r.p.factory); (byFactory[k] ||= []).push(r); });
    const stage = (label, ic, units, val, tone) => `<div class="pd-stage ${tone}"><span>${icon(ic)} ${label}</span><strong>${int(units)}</strong><em>${tr('件', 'units')} · ${usd(val).replace('.00', '')}</em></div>`;
    return `<div class="pd-sc">
      <div class="pd-pipeline">${stage(tr('工厂生产中', 'In production'), 'factory', sum('wip'), value('wip'), '')}<i>${icon('caret-right')}</i>${stage(tr('工厂待发', 'Ready at factory'), 'package', sum('ready'), value('ready'), '')}<i>${icon('caret-right')}</i>${stage(tr('海运在途', 'In transit'), 'boat', sum('transit'), value('transit'), 'blue')}<i>${icon('caret-right')}</i>${stage(tr('海外仓可售', 'At US warehouse'), 'warehouse', sum('wh'), value('wh'), 'green')}</div>
      <div class="pd-sc-grid">
        <section class="pd-card"><div class="pd-card-head"><h3>${tr('SKU 库存全景', 'SKU inventory panorama')}</h3><div class="pd-seg">${[['all', tr('全部', 'All')], ['action', tr('需处理', 'Needs action')], ['excess', tr('库存偏多', 'Overstock')]].map(([k, l]) => `<button class="${ui.scFilter === k ? 'active' : ''}" data-pd="sc-filter" data-v="${k}">${l}</button>`).join('')}</div></div>
          <table class="pd-table pd-sc-table"><thead><tr><th>SKU</th><th class="num">${tr('生产中', 'Prod.')}</th><th class="num">${tr('待发', 'Ready')}</th><th class="num">${tr('在途', 'Transit')}</th><th class="num">${tr('海外仓', 'Warehouse')}</th><th class="num">${tr('日均销量', 'Sales/day')}</th><th class="num">${tr('可售天数', 'Days of cover')}</th><th>${tr('下一批到货', 'Next arrival')}</th><th>${tr('状态', 'Status')}</th></tr></thead><tbody>
          ${filtered.map(({ p, s }) => `<tr><td><div class="pd-prod small"><span class="pd-thumb">${icon(p.icon)}</span><div><strong>${p.sku}</strong><span>${esc(L(p.name))}</span></div></div><div class="pd-mini-pipe">${['wip', 'ready', 'transit', 'wh'].map((k, i) => s.pipeline ? `<i class="pd-c${i}" style="flex:${p[k]}"></i>` : '').join('')}</div></td><td class="num">${p.wip || '—'}</td><td class="num">${p.ready || '—'}</td><td class="num">${p.transit || '—'}</td><td class="num ${p.wh < 10 ? 'pd-bad' : ''}"><b>${p.wh}</b></td><td class="num">${p.velocity || '—'}</td><td class="num ${s.cover < 14 ? 'pd-bad' : ''}">${s.cover === Infinity ? '—' : Math.round(s.cover)}${s.pipeCover !== Infinity ? `<small> / ${Math.round(s.pipeCover)}</small>` : ''}</td><td>${s.nextShip ? `${fmtD(s.nextShip.eta)}<small> · ${s.nextShip.items.find(i => i[0] === p.sku)[1]} ${tr('件', 'pcs')}</small>` : '—'}</td><td><span class="pd-state ${STATE[s.state][2]}">${esc(tr(STATE[s.state][0], STATE[s.state][1]))}</span></td></tr>`).join('')}
          </tbody></table><p class="pd-hint">${tr('可售天数 = 海外仓库存 ÷ 日均销量；斜杠后是算上生产中和在途的总天数。', 'Days of cover = warehouse stock ÷ daily sales; after the slash: including production and inbound.')}</p></section>
        <aside class="pd-side">
          <section class="pd-card"><h3>${icon('boat')} ${tr('在途货柜', 'Inbound shipments')}</h3>${shipments.map(sh => `<div class="pd-ship"><div><strong>${esc(sh.id)}</strong><span>${esc(L(sh.mode))} · ${esc(L(sh.from))} → ${esc(sh.to)}</span></div><div class="pd-eta"><b>${fmtD(sh.eta)}</b><span>ETA · ${Math.round((sh.eta - TODAY) / 864e5)} ${tr('天', 'days')}</span></div><div class="pd-ship-items">${sh.items.map(([sku, n]) => `<span class="pd-tag">${sku} × ${n}</span>`).join('')}</div></div>`).join('')}</section>
        </aside>
      </div>
      <section class="pd-card pd-replen"><div class="pd-card-head"><h3>${icon('magic-wand')} ${tr('自动补货建议', 'Replenishment suggestions')}</h3><form class="pd-replen-set" id="pd-replen"><label>${tr('安全库存天数', 'Safety stock days')} <input type="number" name="safety" min="0" max="120" value="${ui.safety}"></label><label>${tr('目标备货天数', 'Target cover days')} <input type="number" name="cover" min="7" max="180" value="${ui.cover}"></label></form></div>
        <p class="pd-hint">${tr('补货点 = 日均销量 × (生产周期 + 运输周期 + 安全天数)；建议数量 = 日均销量 × (交期 + 安全天数 + 目标备货天数) − 现有全部库存（含生产中、在途），再按起订量取整。', 'Reorder point = daily sales × (production + transit + safety days). Suggested qty = daily sales × (lead time + safety + target cover) − all pipeline stock, rounded up to MOQ.')}</p>
        ${Object.keys(byFactory).length ? Object.entries(byFactory).map(([factory, list]) => `<div class="pd-po"><div class="pd-po-head"><strong>${icon('factory')} ${esc(factory)}</strong><span>${list.length} SKU · ¥${int(list.reduce((t, r) => t + r.s.value, 0))}</span><button class="pd-btn small primary" data-pd="create-po" data-f="${esc(factory)}">${tr('生成采购单草稿', 'Create draft PO')}</button></div>
          <table class="pd-table small"><thead><tr><th>SKU</th><th class="num">${tr('建议采购', 'Suggested qty')}</th><th class="num">MOQ</th><th class="num">${tr('补货点', 'Reorder point')}</th><th class="num">${tr('现有全部库存', 'Pipeline stock')}</th><th>${tr('最晚下单', 'Order by')}</th><th class="num">${tr('预计金额', 'Est. value')}</th></tr></thead><tbody>
          ${list.map(({ p, s }) => `<tr><td><strong>${p.sku}</strong> ${esc(L(p.name))}</td><td class="num"><b>${s.qty}</b></td><td class="num">${p.moq}</td><td class="num">${Math.round(s.rop)}</td><td class="num">${s.pipeline}</td><td class="${s.orderIn <= 0 ? 'pd-bad' : ''}">${s.orderIn <= 0 ? tr('今天', 'Today') : fmtD(addDays(s.orderIn))}</td><td class="num">¥${int(s.value)}</td></tr>`).join('')}</tbody></table></div>`).join('')
        : `<div class="pd-empty">${icon('check-circle')} ${tr('目前没有需要补货的 SKU。', 'No SKU needs replenishment right now.')}</div>`}
      </section>
    </div>`;
  }

  /* ---------- events ---------- */
  const rerender = () => ctx.rerender();
  document.addEventListener('click', e => {
    if (!ctx) return;
    const t = e.target.closest('[data-pd]'); if (!t) return;
    e.preventDefault();
    const a = t.dataset.pd;
    if (a === 'tab') { ui.tab = t.dataset.v; ui.product = null; return rerender(); }
    if (a === 'open-product') { ui.product = t.dataset.sku; return rerender(); }
    if (a === 'back') { ui.product = null; return rerender(); }
    if (a === 'save-product') { ctx.toast(tr('原型：已模拟保存', 'Prototype: save simulated')); return; }
    if (a === 'new-product') { ctx.toast(tr('原型：将打开新产品表单', 'Prototype: opens a new product form')); return; }
    if (a === 'cost-for' || a === 'pick-cost') { ui.tab = 'cost'; ui.costSku = t.dataset.sku; ui.costQuery = ''; ui.product = null; return rerender(); }
    if (a === 'sc-filter') { ui.scFilter = t.dataset.v; return rerender(); }
    if (a === 'create-po') { const list = products.filter(p => L(p.factory) === t.dataset.f).map(p => ({ p, s:supply(p) })).filter(r => r.s.qty > 0 && ['stockout', 'reorder'].includes(r.s.state));
      ctx.modal(tr('采购单草稿', 'Draft purchase order'), `<p><strong>${esc(t.dataset.f)}</strong> · ${tr('交期按各 SKU 生产周期计算', 'Lead times per SKU')}</p><table class="pd-table small"><thead><tr><th>SKU</th><th class="num">${tr('数量', 'Qty')}</th><th class="num">${tr('单价', 'Unit price')}</th><th class="num">${tr('金额', 'Amount')}</th></tr></thead><tbody>${list.map(({ p, s }) => `<tr><td>${p.sku} ${esc(L(p.name))}</td><td class="num">${s.qty}</td><td class="num">¥${int(p.exw)}</td><td class="num">¥${int(s.value)}</td></tr>`).join('')}</tbody></table><p class="pd-hint">${tr('原型：正式版会生成采购单并通知工厂负责人确认交期，确认后自动计入“生产中”。', 'Prototype: the real version creates the PO, asks the factory to confirm, then counts it as in production.')}</p>`, `<button class="btn" data-live-action="close">${tr('关闭', 'Close')}</button>`); }
  });
  document.addEventListener('input', e => {
    if (!ctx) return;
    const el = e.target;
    if (el.matches('[data-pd-search]') || el.matches('[data-pd-cost]')) {
      const key = el.matches('[data-pd-search]') ? 'search' : 'costQuery', sel = el.matches('[data-pd-search]') ? '[data-pd-search]' : '[data-pd-cost]';
      ui[key] = el.value; const pos = el.selectionStart;
      if (key === 'costQuery') { const exact = bySku(el.value.trim().toUpperCase()); if (exact) ui.costSku = exact.sku; }
      rerender(); requestAnimationFrame(() => { const n = document.querySelector(sel); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
    }
    if (el.closest('#pd-assume')) { const k = el.name, v = Number(el.value); if (!Number.isFinite(v)) return; if (k === 'tariff') bySku(ui.costSku).tariff = v; else assumptions[k] = v; const name = el.name; rerender(); requestAnimationFrame(() => { const n = document.querySelector(`#pd-assume [name="${name}"]`); if (n) { n.focus(); } }); }
  });
  document.addEventListener('change', e => {
    if (!ctx) return;
    const el = e.target;
    if (el.matches('[data-pd-viewas]')) { ui.viewAsBasic = el.checked; rerender(); }
    if (el.closest('#pd-replen')) { const v = Math.max(0, Number(el.value) || 0); ui[el.name] = v; rerender(); }
  });

  window.WorkOSProducts = { configure(next) { ctx = next; }, render, _data:{ products, assumptions, cost, supply }, _ui:ui };
})();
