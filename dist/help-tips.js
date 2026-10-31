'use strict';
/* Hover help for new users.
 * Every button that matches a rule below shows a bilingual tooltip with its
 * purpose ("用途") and how to use it ("怎么用"). Each page title also gets a
 * small (?) icon that explains the whole page.
 *
 * Design rules:
 * - Read-only layer: never changes app state, never sends requests, never
 *   touches business data. It only reads the DOM and positions a tooltip.
 * - The tooltip lives outside #app so app re-renders and i18n never touch it.
 * - Users can switch hints off with the (?) toggle in the top bar; the choice
 *   is stored locally like language and theme.
 * - To add or edit a hint, edit RULES or PAGES below. Keep selectors on
 *   data-* attributes, never on visible text, so translations do not break them.
 */
(() => {
  const STORE_KEY = 'onelaser-workos-help';
  const SHOW_DELAY = 350;
  const lang = () => (window.WorkI18n && window.WorkI18n.lang === 'en') ? 'en' : 'zh';
  const enabled = () => { try { return localStorage.getItem(STORE_KEY) !== 'off'; } catch { return true; } };
  const setEnabled = on => { try { localStorage.setItem(STORE_KEY, on ? 'on' : 'off'); } catch {} };

  // h(title, purpose, how) for zh and en. "how" may be omitted when obvious.
  const h = (zt, zp, zh, et, ep, eh) => ({ zh:{ t:zt, p:zp, h:zh }, en:{ t:et, p:ep, h:eh } });

  /* Page guides: shown from the (?) icon next to each page title. */
  const PAGES = {
    executive: h('老板看板',
      '给公司负责人看的全公司只读总览：OKR 进度、任务交付和需要协调的事项。',
      '先看顶部四个数字，再看“部门全景”找压力大的部门，最后处理“需要协调与跟进”里最早截止的事项。这里只能查看，不能修改。',
      'Executive overview',
      'A company-wide, read-only view for leadership: OKR progress, delivery and items that need coordination.',
      'Scan the four headline numbers, use Department overview to spot pressure, then work through Needs coordination, earliest deadline first. Nothing here can be edited.'),
    overview: h('个人工作台',
      '你的个人首页：个人表现（完成度、逾期、OKR 进度）和所有需要你注意的事项。',
      '每天先看“需要注意”：待我验收、已逾期、被退回、3 天内到期的任务都在这里，点一下直接处理。右侧是你的 OKR 和参与的项目。',
      'My workbench',
      'Your home page: personal performance (completion, overdue, OKR progress) and everything that needs your attention.',
      'Start each day with Needs attention: reviews waiting for you, overdue, returned and due-soon tasks. Click to act. Your OKRs and projects are on the right.'),
    team: h('团队任务分析',
      '按汇报线汇总下属（直接和间接）的任务结果：完成度、准时率、质量分和逾期。',
      '先看顶部总数，再在表格里找逾期多或完成度低的人，点“查看问题”看具体任务。汇报线在“组织与权限”里设置。',
      'Team analysis',
      'Task outcomes of your direct and indirect reports: completion, on-time rate, quality and overdue work.',
      'Scan the totals, then find people with overdue work or low completion and open Details. Reporting lines are set in Organization & permissions.'),
    'project-analysis': h('项目分析',
      '看每个项目的进展是否跟得上时间，以及延期的可能性。',
      '对比“工作进度”和“时间进度”：时间过了一大半而工作没完成，就有延期风险。延期可能性 60 分以上的项目需要马上找负责人沟通。',
      'Project analysis',
      'Whether each project’s progress keeps pace with time, and how likely it is to slip.',
      'Compare work done with time elapsed; risk 60+ needs a conversation with the owner now.'),
    products: h('产品管理区（测试）',
      '产品资料、成本核算、供应链与补货的集中管理区，仅限授权人员。',
      '“产品管理”维护每个 SKU 的全部属性；“成本核算”输入 SKU 查成本；“供应链全景”看工厂、在途、海外仓库存，并按建议生成采购单。',
      'Product hub (test)',
      'Product data, costing, supply chain and replenishment in one restricted area.',
      'Catalog keeps every SKU attribute; Cost calculator looks up costs by SKU; Supply chain shows factory, inbound and warehouse stock and suggests purchase orders.'),
    settings: h('个人设置',
      '上传头像、填写联系方式，方便同事找到你；查看自己的权限。',
      '点“上传头像”选一张照片，系统会自动裁剪压缩；填写电话、邮箱、微信、所在地和时区后点保存。',
      'Personal settings',
      'Upload a photo and contact details so colleagues can reach you; see your access.',
      'Click Upload photo (it is cropped and compressed automatically), fill in phone, email, WeChat, location and time zone, then Save.'),
    org: h('组织与权限',
      '管理员设置每个人的直属上级、职位、角色和功能权限。',
      '在表格里直接修改，改完立即保存。直属上级决定“团队任务分析”的可见范围；“产品管理区”和“成本明细”只给需要的人开通。切到“汇报线图”检查组织结构是否正确。',
      'Organization & permissions',
      'Admins set each person’s manager, title, role and feature access.',
      'Edit directly in the table; changes save immediately. Managers decide Team analysis visibility; grant Product hub and Cost detail only as needed. Check the Org chart view.'),
    tasks: h('任务中心 / 团队任务看板',
      '全部门任务的主表格，记录负责人、优先级、状态、分类和截止日期，类似 monday.com。',
      '① 点“新建任务”或分组底部“添加任务”创建；② 直接点表格里的格子修改负责人、状态等；③ 点任务名右侧的对话图标写进度；④ 用上方“人员 / 筛选 / 排序”找任务。状态改成 Done 只代表执行完成，正式验收在“成果验收”里做。',
      'Task hub / Team task board',
      'The department’s main task table: owner, priority, status, category and due date, similar to monday.com.',
      '1) Create with New task or Add task under a group. 2) Click any cell to edit it. 3) Use the speech-bubble icon to post progress. 4) Narrow the list with Person / Filter / Sort. Done only marks execution; formal acceptance happens in Deliverable review.'),
    projects: h('项目管理',
      '管理跨部门的项目：按阶段拆分任务、看进度和时间线、发布项目状态。',
      '① 点“新建项目”选模板；② 在“表格”里按阶段添加任务并分派负责人，任务会自动进入对方的“我的任务”；③ 点彩色格子直接改状态或优先级；④ 用“时间线”看排期，用“概览”每周发布一次项目状态。',
      'Projects',
      'Run cross-department projects: tasks by stage, progress, timeline and status updates.',
      '1) Click New project and pick a template. 2) In Table, add tasks by stage and assign owners; they appear in each person’s My tasks automatically. 3) Click a colored cell to change status or priority. 4) Use Timeline for scheduling and post a weekly status update in Overview.'),
    okr: h('OKR 目标',
      '记录每个人的目标（O）和可量化的关键结果（KR），跟踪进度、状态和进展，周期末自评并由主管确认评分。',
      '① 右上角选周期；② 在“我的 OKR”底部点“添加目标”，写目标和权重；③ 在目标下点“添加关键结果”，填目标值和单位；④ 平时点“进展”写更新、给 KR 标状态；⑤ 周期末点 KR 右侧的分数提交自评，主管确认。“团队 OKR”看同事，“对齐视图”看目标如何层层支撑。',
      'OKRs',
      'Each person’s objectives (O) and measurable key results (KR), with progress, status and updates; self evaluation and manager confirmation at period end.',
      '1) Pick the cycle (top right). 2) Under My OKRs click Add objective and set its weight. 3) Click Add key result and enter target and unit. 4) Use Updates to post progress and set KR status. 5) At period end click the score on a KR to self-evaluate; a manager confirms. Team OKRs shows colleagues; Alignment shows how goals support each other.'),
    reviews: h('成果验收',
      '集中处理已提交、等待你验收的成果。系统要求有证据、由人确认，避免“说做完了但没交付”。',
      '点“检查成果与记录”，对照验收标准查看成果说明和链接；可先让 AI 做证据检查，但最终必须由你勾选“已实际核对”后选择“确认验收通过”或“退回补充”。',
      'Deliverable review',
      'Deliverables submitted and waiting for your review. Acceptance needs evidence and a human decision.',
      'Open Inspect evidence & records, compare the submission and links with the criteria, optionally run the AI check, then tick that you inspected it and choose Confirm acceptance or Return for revision.'),
    performance: h('绩效参考',
      '汇总已人工验收的交付记录，作为绩效沟通的参考依据，不自动给出人事结论。',
      '点“读取当前验收依据”加载已验收任务的版本与验收人，再结合 OKR 评分一起看。',
      'Performance insights',
      'Evidence-backed records of accepted work for performance conversations. No automated personnel decisions.',
      'Click Load current review evidence to load accepted versions and reviewers, then read them together with OKR scores.'),
    support: h('客服工作台',
      '客服团队处理 Zoho 工单、AI 回复草稿、订单物流查询、知识库和服务标准的地方。',
      '用上方标签切换功能：“工单与草稿”看工单并核对 AI 草稿；“订单与物流”按订单号查 Shopify；“知识候选 / 问答资料”维护给 AI 助手用的资料。所有审核都不会自动发邮件给客户。',
      'Support workspace',
      'Where the support team handles Zoho tickets, AI reply drafts, order lookups, knowledge and service standards.',
      'Use the tabs: Tickets & drafts to review tickets and AI drafts, Order & shipping to look up Shopify orders, Knowledge candidates / Q&A sources to maintain what the AI assistant may use. Reviews never email customers automatically.'),
    knowledge: h('知识中心 / Wiki',
      'OneLaser 产品指南、故障排查和下载资源，客服和新人查资料的地方。',
      '用左侧“全部指南 / 下载中心”浏览，或在搜索框输入机型和关键词（例如 Hydra 对焦）。也可以打开 AI 助手提问。',
      'Knowledge center / Wiki',
      'OneLaser product guides, troubleshooting and downloads for support staff and new hires.',
      'Browse All guides / Downloads on the left, or search by model and keyword (e.g. Hydra focus). You can also ask the AI assistant.'),
    integrations: h('集成与通知',
      '查看钉钉、Grok AI 等外部服务的连接状态，并管理成员同步和任务提醒。',
      '新员工入职或离职后点“同步钉钉成员”；需要催办时点“预览提醒”，勾选任务后再确认发送。',
      'Integrations & notifications',
      'Connection status for DingTalk, Grok AI and other services, plus member sync and task reminders.',
      'After people join or leave, click Sync DingTalk members. To nudge people, click Preview reminders, select tasks, then confirm sending.')
  };

  /* Button hints. First matching rule wins, so put specific selectors first. */
  const RULES = [
    // Navigation (left sidebar)
    ['[data-live-page="executive"].nav-item', h('老板看板','全公司只读总览，适合管理层每天快速了解进度。','点击进入，查看 OKR 进度、部门交付和待协调事项。','Executive overview','Company-wide read-only view for leadership.','Open it to see OKR progress, delivery and items that need coordination.')],
    ['[data-live-page="overview"].nav-item', h('个人工作台','个人表现和需要你注意的任务、项目。','每天上班先点这里。','My workbench','Your performance and what needs your attention.','Start each day here.')],
    ['[data-live-page="team"].nav-item', h('团队任务分析','看所有向你汇报的同事的任务完成情况。','有下属才会有数据；汇报线由管理员设置。','Team analysis','Task outcomes of everyone who reports to you.','Data appears once reporting lines are set.')],
    ['[data-live-page="project-analysis"].nav-item', h('项目分析','项目进展、及时性和延期可能性。','','Project analysis','Project progress, timeliness and delay risk.','')],
    ['[data-live-page="products"].nav-item', h('产品管理区（测试）','产品资料、成本核算、供应链全景与自动补货。','仅限授权人员。','Product hub (test)','Catalog, costing, supply chain and replenishment.','Restricted access.')],
    ['[data-live-page="settings"].nav-item, .identity-btn', h('个人设置','头像、联系方式和我的权限。','','Personal settings','Photo, contact details and your access.','')],
    ['[data-live-page="org"].nav-item', h('组织与权限','设置汇报线、职位、角色和功能权限（管理员）。','','Organization & permissions','Reporting lines, titles, roles and access (admins).','')],
    ['[data-live-page="tasks"].nav-item', h('任务中心','部门所有任务的主表格，可按表格、看板、日历查看。','在这里创建任务、分配负责人、更新状态。','Task hub','The department’s main task table, with table, kanban and calendar views.','Create tasks, assign owners and update status here.')],
    ['[data-live-page="projects"].nav-item', h('项目管理','跨部门项目：阶段、任务、时间线和项目状态。','项目里分派的任务会自动进入负责人的“我的任务”。','Projects','Cross-department projects: stages, tasks, timeline and status.','Tasks assigned in a project flow into each owner’s My tasks.')],
    ['[data-live-page="okr"].nav-item', h('OKR 目标','个人和团队的目标与关键结果，以及评分。','设定季度 / 月度目标，记录 KR 实际值，周期末评分。','OKRs','Objectives, key results and scores for people and teams.','Set goals, record KR values and score at period end.')],
    ['[data-live-page="reviews"].nav-item', h('成果验收','等你验收的成果都在这里；右侧数字是待处理数量。','点进去逐条检查证据，确认通过或退回。','Deliverable review','Deliverables waiting for your review; the number shows how many.','Open it and check each item’s evidence, then accept or return.')],
    ['[data-live-page="performance"].nav-item', h('绩效参考','已验收交付的汇总，用于绩效沟通参考。','绩效面谈前打开，读取验收依据。','Performance insights','Summary of accepted deliveries for performance conversations.','Open before a review meeting and load the evidence.')],
    ['[data-live-page="support"].nav-item', h('客服工作台','工单、回复草稿、订单查询和客服知识库。','客服同事每天在这里处理工单。','Support workspace','Tickets, reply drafts, order lookup and support knowledge.','Support staff handle tickets here every day.')],
    ['[data-live-page="knowledge"].nav-item', h('知识中心 / Wiki','产品指南、故障排查和下载资源。','遇到产品问题先来这里搜索。','Knowledge center / Wiki','Product guides, troubleshooting and downloads.','Search here first when you have a product question.')],
    ['[data-live-page="integrations"].nav-item', h('集成与通知','钉钉、AI 等外部连接，以及成员同步和提醒。','管理员维护成员名单、发送催办提醒时使用。','Integrations & notifications','External connections, member sync and reminders.','Used by managers to sync members and send reminders.')],
    ['[data-live-action="logout"]', h('退出登录','结束当前账号的登录状态。','在公用电脑上用完后务必点击退出。','Sign out','Ends your current session.','Always sign out when using a shared computer.')],
    ['[data-live-action="login"]', h('钉钉登录','用公司钉钉账号进入系统，不需要单独密码。','点击后在钉钉里确认授权即可。','Sign in with DingTalk','Use your company DingTalk account; no separate password.','Click, then approve in DingTalk.')],
    ['[data-live-action="menu"]', h('导航菜单','在手机或窄屏上打开左侧菜单。','点击展开，再选择要去的页面。','Navigation','Opens the side menu on small screens.','Tap it, then pick a page.')],
    ['[data-wiki-assistant-open]', h('AI 产品助手','基于已核对的知识库回答产品问题。','输入机型和问题，例如“Hydra 如何对焦”。回答仅供参考，以 Wiki 原文为准。','AI product assistant','Answers product questions from reviewed knowledge.','Type the model and question, e.g. “How do I focus the Hydra?”. Check the Wiki article for the final word.')],

    // Top bar
    ['[data-live-lang="zh"]', h('切换到中文','把界面文字切换成中文。','只改变界面语言；你录入的内容不会被翻译。','Switch to Chinese','Shows the interface in Chinese.','Only the interface changes; content you entered is not translated.')],
    ['[data-live-lang="en"]', h('Switch to English','把界面文字切换成英文，方便美国同事使用。','只改变界面语言；你录入的内容不会被翻译。','Switch to English','Shows the interface in English.','Only the interface changes; content you entered is not translated.')],
    ['[data-live-action="theme"]', h('日间 / 夜间主题','切换浅色或深色界面，保护眼睛。','点击切换，选择会保存在当前浏览器。','Light / dark theme','Switches between light and dark mode.','Click to toggle; your choice is saved in this browser.')],
    ['[data-live-action="refresh"]', h('刷新数据','从服务器重新读取最新数据。','同事刚更新了内容、而你这里没变化时点击。','Refresh data','Reloads the latest data from the server.','Click when a colleague has updated something you don’t see yet.')],

    // Overview / shared
    ['[data-live-action="new-task"]', h('新建任务','给自己或同事布置一项有明确交付和验收标准的工作。','填写标题、说明、负责人、验收人、截止时间和验收标准（每行一条），可关联一个 KR。','New task','Assign a piece of work with a clear deliverable and acceptance criteria.','Fill in title, description, owner, reviewer, due date and criteria (one per line); optionally link a KR.')],
    ['.btn[data-live-page="tasks"]', h('全部任务','跳转到任务中心查看完整任务列表。','点击进入任务看板。','All tasks','Goes to the full task list in the Task hub.','Click to open the task board.')],
    ['.btn[data-live-page="support"]', h('进入客服工作台','跳转到客服工作台查看工单详情。','点击进入。','Open support','Goes to the support workspace.','Click to open.')],
    ['.btn[data-live-page]', h('查看全部','跳转到对应页面查看完整内容。','','View all','Opens the full page.','')],
    ['.todo-row[data-live-task], .kanban-card[data-live-task]', h('打开任务详情','查看任务说明、验收标准、成果和验收记录。','点击打开右侧详情面板；负责人在里面提交成果，验收人在里面验收。','Open task details','See the description, criteria, deliverables and review history.','Click to open the side panel. Owners submit deliverables there; reviewers accept there.')],
    ['[data-live-action="list"]', h('列表视图','按行列出任务，适合快速浏览。','点击切换到列表。','List view','Shows tasks as rows for quick scanning.','Click to switch to list.')],
    ['[data-live-action="board"]', h('看板视图','按状态分列显示任务卡片。','点击切换到看板。','Board view','Shows task cards in status columns.','Click to switch to board.')],

    // People & product hub
    ['[data-pp="scope"]', h('查看范围','“我的下属”只看向你汇报的人；“全公司”仅管理员可用。','','Scope','My reports, or the whole company (admins).','')],
    ['[data-pp="toggle-member"]', h('查看问题','展开这个人逾期或被退回的任务。','点任务可以打开详情。','Details','Shows this person’s overdue or returned tasks.','Click a task to open it.')],
    ['[data-pp-field="managerId"]', h('直属上级','这个人向谁汇报。','上级可以在“团队任务分析”中看到他的任务结果；不能设成自己或自己的下属。','Manager','Who this person reports to.','The manager sees their outcomes in Team analysis; no cycles allowed.')],
    ['[data-pp-field="role"]', h('角色','主管可以管理本部门的任务和目标，员工只管理自己的。','钉钉重新登录不会覆盖这里的设置。','Role','Managers manage department tasks and goals; employees their own.','DingTalk re-login keeps this setting.')],
    ['[data-pp-admin]', h('管理员','可以修改组织架构和所有人的权限。','只给少数负责人开通。','Administrator','Can change the org structure and everyone’s access.','Grant sparingly.')],
    ['[data-pp-grant="products"]', h('产品管理区','开通后可以进入产品管理、成本核算（只看最终成本）和供应链全景。','','Product hub','Access to catalog, cost calculator (final cost only) and supply chain.','')],
    ['[data-pp-grant="product_cost_detail"]', h('成本明细','可以看到价格是如何计算出来的（出厂价、运费、关税、费用、毛利）。','需要先开通产品管理区。','Cost detail','Shows how prices are calculated (factory price, freight, duty, fees, margin).','Requires Product hub access.')],
    ['[data-pp-avatar], .pp-upload', h('上传头像','选一张清晰的正面照片。','自动裁成正方形并压缩，同事在各处都能看到。','Upload photo','Choose a clear headshot.','Cropped and compressed automatically.')],
    ['[data-pd="tab"][data-v="catalog"]', h('产品管理','每个 SKU 的全部属性：名称、价格、规格、物流报关、采购和销售渠道。','点任一产品进入编辑页。','Catalog','Every SKU attribute: titles, pricing, variants, shipping & customs, sourcing, channels.','Click a product to edit it.')],
    ['[data-pd="tab"][data-v="cost"]', h('成本核算','输入 SKU 或名称，查看每台的最终成本。','授权人员还能看到成本构成并调整汇率、运费、关税做测算。','Cost calculator','Look up the final per-unit cost by SKU or name.','Authorized users also see the breakdown and can run what-ifs.')],
    ['[data-pd="tab"][data-v="supply"]', h('供应链全景 · 自动补货','所有 SKU 在工厂、在途、海外仓的数量，可售天数和补货建议。','按工厂一键生成采购单草稿。','Supply chain · Replenishment','Stock at factory, in transit and in the warehouse, days of cover and reorder suggestions.','Create draft POs by factory.')],
    ['[data-pd="create-po"]', h('生成采购单草稿','把这家工厂所有建议补货的 SKU 汇总成一张采购单。','确认数量后发给工厂。','Create draft PO','Combines all suggested reorders for this factory.','Confirm quantities, then send to the factory.')],
    ['[data-pd-cost]', h('查询成本','输入 SKU（如 HYD-60）或产品名称。','','Look up cost','Enter a SKU (e.g. HYD-60) or a product name.','')],

    ['.pp-att-row', h('打开任务','打开这项任务的详情。','“待我验收”的任务在详情里核对成果后确认或退回；逾期任务可以写进展或调整计划。','Open task','Opens this task’s details.','Review submissions there, or update overdue work.')],
    ['[data-pp="reload-team"]', h('刷新','重新计算团队数据。','','Refresh','Recalculates team data.','')],
    ['[data-pp="org-view"]', h('切换视图','“成员与权限”用来修改设置；“汇报线图”检查组织结构。','','Switch view','Members & access to edit; Org chart to check the structure.','')],
    ['#pp-profile button[type="submit"]', h('保存资料','保存你的联系方式，同事会在通讯录和头像卡片上看到。','','Save profile','Saves your contact details for colleagues to see.','')],
    ['#pp-profile select[name="timezone"]', h('时区','选择你所在的时区，方便中美团队安排沟通时间。','','Time zone','Your time zone, to help US and China teams schedule.','')],
    ['[data-pd="new-product"]', h('添加产品','新建一个 SKU，填写全部产品属性。','','Add product','Creates a new SKU with all attributes.','')],
    ['[data-pj="open-project"]', h('打开项目','进入这个项目查看任务、时间线和状态更新。','','Open project','Opens the project’s tasks, timeline and updates.','')],
    ['[data-pj="open-task"]', h('打开任务','查看任务详情、子任务和评论。','','Open task','Shows task details, subtasks and comments.','')],
    // OKR (Feishu-style board)
    ['[data-okr="tab"][data-value="mine"]', h('我的 OKR','只看你自己这个周期的目标和关键结果。','每周来这里更新进展。','My OKRs','Only your own objectives and key results for this cycle.','Come here weekly to update progress.')],
    ['[data-okr="tab"][data-value="team"]', h('团队 OKR','左侧选成员，查看他们的目标和进度。','了解同事在做什么、哪里有风险。','Team OKRs','Pick a person on the left to see their objectives and progress.','See what colleagues work on and where the risks are.')],
    ['[data-okr="tab"][data-value="align"]', h('对齐视图','以树状展示公司 → 部门 → 个人目标的支撑关系。','检查每个人的目标是否都对齐到了公司目标。','Alignment','A tree of company → department → personal objectives.','Check that personal goals support company goals.')],
    ['[data-okr="cycle-prev"], [data-okr="cycle-next"], [data-okr-cycle]', h('切换周期','选择要查看或填写的月份周期。','新建的目标会归入当前选中的周期。','Change cycle','Choose the monthly cycle to view or plan.','New objectives go into the selected cycle.')],
    ['[data-okr="rubric"]', h('评分标准','查看评分档位和权重规则。','完成 80 分，卓越 100 分；KR 权重合计应等于目标权重。','Scoring guide','Score levels and weight rules.','Complete 80, exceptional 100; KR weights should equal the objective weight.')],
    ['[data-okr="person"]', h('查看成员','切换到这位同事的 OKR。','右侧数字是整体进度。','View person','Switch to this person’s OKRs.','The number is their overall progress.')],
    ['[data-okr-search]', h('搜索成员','按姓名快速找到同事。','','Search people','Find a colleague by name.','')],
    ['[data-okr="add-o"]', h('添加目标','在当前周期新建一个目标（O）。','写清楚想达成什么，并填写权重（占本周期总分的比例）；创建后会自动打开“添加关键结果”。','Add objective','Creates an objective (O) in the current cycle.','State what you want to achieve and its weight (share of the period); the key-result row opens next.')],
    ['[data-okr="add-kr"]', h('添加关键结果','为这个目标添加一个可量化的 KR。','填目标值、单位和权重；“更多”里可改基准值和方向（例如退货率越低越好）。添加后可以继续添加下一条。','Add key result','Adds a measurable KR to this objective.','Enter target, unit and weight; More lets you set baseline and direction. You can add the next one right after.')],
    ['[data-okr="edit"][data-kind="o-title"], [data-okr="edit"][data-kind="kr-title"]', h('点击修改名称','直接在原位修改目标或 KR 的名称。','改完按回车或点“保存”；按 Esc 取消。','Click to rename','Edit the objective or KR name in place.','Press Enter or Save; Esc cancels.')],
    ['[data-okr="edit"][data-kind="o-weight"], [data-okr="edit"][data-kind="kr-weight"]', h('权重','占本周期总分的比例。','点击修改。KR 权重合计应等于所属目标的权重，不相等时卡片下方会提示。','Weight','Share of the period total.','Click to edit. KR weights should add up to their objective’s weight; a warning appears if not.')],
    ['[data-okr="kr-status"]', h('KR 状态','负责人对这条 KR 能否按时达成的判断：正常 / 有风险 / 已延期。','点击选择。状态只用于提醒和沟通，不影响评分。','KR status','The owner’s view of whether this KR is on track, at risk or off track.','Click to choose. Status is for communication and never changes the score.')],
    ['[data-okr="measure"]', h('KR 进度','根据实际值计算的完成进度。','主管点击可以登记最新实际值和数据来源。','KR progress','Progress calculated from the actual value.','Managers can click to record the latest value and its source.')],
    ['[data-okr="appraisal"]', h('评分','蓝色数字 = 主管已确认的分数；浅蓝“自评” = 员工自评待确认；虚线 = 未评分。','点击提交成果与自评，或由主管核对后确认评分。','Score','Blue number = confirmed by a manager; light “Self” = awaiting confirmation; dashed = not scored.','Click to submit evidence and a self evaluation, or for a manager to confirm.')],
    ['[data-okr="open-o"]', h('进展与详情','打开目标详情：描述、对齐关系、KR 状态和进展时间线。','在里面写本周进展，可同时更新某条 KR 的状态。','Updates & details','Opens the objective: description, alignment, KR status and the update timeline.','Post this week’s progress there and optionally update a KR’s status.')],
    ['[data-okr="menu"]', h('更多操作','设置对齐、编辑描述或指标、删除等。','','More actions','Alignment, description or metric edits, delete and more.','')],
    ['[data-okr="collapse"]', h('收起 / 展开','隐藏或显示这个目标下的关键结果。','','Collapse / expand','Hides or shows this objective’s key results.','')],
    ['[data-okr="edit-align"]', h('设置对齐','把这个目标对齐到上级或公司目标。','对齐后，目标会显示在“对齐视图”的树中。不能对齐到自己的下级目标。','Set alignment','Align this objective to a parent or company objective.','It then appears under that goal in the Alignment view. You can’t align to your own children.')],
    ['#okr-update button[type="submit"]', h('发布进展','记录这段时间的进展、风险或需要的协助。','可以选择关联的 KR 并更新它的状态；进展会按时间显示，团队都能看到。','Post update','Records progress, risks or help needed.','Optionally pick a KR and update its status; updates appear in a timeline for the team.')],
    ['.okb-align-chip', h('对齐的上级目标','这个目标支撑的上级目标。','点击查看上级目标的详情。','Parent objective','The goal this objective supports.','Click to open it.')],

    // OKR
    ['[data-live-action="new-objective"]', h('创建目标','新增一个目标（O），例如“Q4 销售额增长 20%”。','填写目标内容、负责人、周期和权重；保存后再在卡片上添加 KR。','Create objective','Adds an objective (O), e.g. “Grow Q4 sales 20%”.','Enter the objective, owner, period and weight; then add KRs on its card.')],
    ['#live-okr-owner', h('按员工查看','只看某一位员工的目标，或查看全部员工。','从下拉框选择员工。','View by employee','Show one employee’s objectives, or everyone’s.','Pick a person from the list.')],
    ['[data-live-new-kr]', h('添加关键结果（KR）','为这个目标添加可量化的衡量指标，例如“新增 30 家经销商”。','填写 KR 名称、指标类型、基线和目标值、权重。所有 KR 权重之和应等于目标权重。','Add key result (KR)','Adds a measurable result to this objective, e.g. “Sign 30 new dealers”.','Enter the KR name, metric type, baseline, target and weight. KR weights must add up to the objective’s weight.')],
    ['[data-live-objective-source]', h('查看原始记录','查看这个目标的来源和原始导入内容。','核对字段是否与原始表格一致时使用。','View source record','Shows where this objective came from and its original import.','Use it to check fields against the original sheet.')],
    ['[data-live-appraisal]', h('成果与评分','提交这个 KR 的成果和自评，或由主管确认评分。','员工：写成果说明并自评；主管：核对后确认评分（完成 80 分，卓越 100 分）。','Evidence & score','Submit this KR’s evidence and self evaluation, or confirm the manager score.','Owners describe the result and self-score; managers verify and confirm (complete 80, exceptional 100).')],
    ['[data-live-measure]', h('记录实际值','登记这个 KR 当前的真实业务数据，例如本月已签 12 家。','填写实际数值和核验依据；任务完成不会自动更新 KR，需要在这里手动记录。','Record actual value','Logs the KR’s current real-world value, e.g. 12 dealers signed so far.','Enter the value and its evidence. Finishing tasks does not update KRs automatically.')],

    // Reviews / performance / integrations
    ['.btn[data-live-task]', h('检查成果与记录','打开这项待验收的成果，核对证据后做出验收决定。','对照验收标准查看成果说明和链接，确认通过或退回补充。','Inspect evidence & records','Opens the deliverable so you can verify it and decide.','Compare the submission with the criteria, then accept or return it.')],
    ['[data-live-action="load-performance"]', h('读取当前验收依据','加载所有已验收任务的当前版本和验收人。','绩效沟通前点击，数据较多时需要等几秒。','Load current review evidence','Loads the current accepted versions and reviewers.','Click before a performance conversation; it may take a few seconds.')],
    ['[data-live-action="sync-directory"]', h('同步钉钉成员','从钉钉更新员工名单，让新同事可以被分配任务。','有人入职、离职或调岗后点击。不在授权部门内的账号会被停用。','Sync DingTalk members','Updates the employee list from DingTalk so new people can be assigned work.','Click after someone joins, leaves or changes team. Accounts outside approved departments are deactivated.')],
    ['[data-live-action="notifications"]', h('预览提醒','列出需要催办的任务，先预览、再决定发不发。','勾选要提醒的任务，点击“确认发送选定提醒”通过钉钉发出。','Preview reminders','Lists tasks that need a nudge so you can preview before sending.','Select tasks, then click Send selected reminders to notify via DingTalk.')],

    // Task drawer & forms
    ['[data-live-action="analyze"]', h('AI 成果检查','让 AI（Grok）对照验收标准检查当前成果，指出缺失的证据。','点击后等待结果。AI 只是建议，最终是否通过由验收人决定。','AI evidence check','Asks the AI (Grok) to compare the current deliverable with the criteria and flag missing evidence.','Click and wait for the result. The AI only advises; the reviewer decides.')],
    ['[data-live-action="refresh-analysis"]', h('刷新分析状态','查看 AI 分析是否已经完成。','AI 显示“等待中”时点击，不会重复提交。','Refresh assessment','Checks whether the AI assessment has finished.','Click while it shows waiting; it never resubmits.')],
    ['[data-live-action="retry-analysis"]', h('重试 AI 分析','上一次 AI 分析失败或过期时重新提交。','先勾选“我理解可能重复消耗额度”，再点击重试。','Retry AI assessment','Resubmits when the previous assessment failed or expired.','Tick the acknowledgement first, then retry.')],
    ['#live-submission button[type="submit"]', h('提交成果','把你完成的工作交给验收人检查。','写清楚做了什么、结果在哪里，最好附上 HTTPS 链接（文档、截图、网页）。提交新版本会让旧的验收失效。','Submit deliverable','Sends your finished work to the reviewer.','Describe what you did and where the result is, ideally with an HTTPS link. A new version replaces the current acceptance.')],
    ['#live-review button[value="accept"]', h('确认验收通过','确认成果达到验收标准，任务正式完成。','先实际打开成果核对、填写质量分和核验依据，并勾选确认框。','Confirm acceptance','Confirms the deliverable meets the criteria and closes the task.','Inspect the actual work, enter a quality score and evidence, and tick the confirmation box first.')],
    ['#live-review button[value="return"]', h('退回补充','成果不达标时退回给负责人修改。','在“核验依据或退回原因”里写清楚缺什么，负责人修改后重新提交。','Return for revision','Sends the work back when it doesn’t meet the criteria.','Explain what’s missing in the reason field; the owner resubmits.')],
    ['#live-send-notifications button[type="submit"]', h('确认发送选定提醒','通过钉钉向选中任务的负责人发送提醒。','确认勾选无误后点击；“已提交发送队列”不等于对方已读。','Send selected reminders','Sends DingTalk reminders to the owners of the selected tasks.','Check your selection first. “Queued” does not mean the person has read it.')],
    ['#live-measure button[type="submit"]', h('保存核验记录','保存这次 KR 实际值和依据。','确认数值和来源无误后保存，历史记录会保留。','Save measurement','Saves this KR value and its evidence.','Double-check the number and source; history is kept.')],
    ['button[form="live-new-task"]', h('创建任务','保存这项新任务并通知负责人。','确认负责人、验收人、截止时间和验收标准都已填写。','Create task','Saves the new task.','Make sure owner, reviewer, due date and criteria are filled in.')],
    ['button[form="live-new-objective"]', h('保存目标','保存这个新目标。','保存后在目标卡片上添加 KR。','Save objective','Saves the new objective.','Add KRs on its card afterwards.')],
    ['button[form="live-new-kr"]', h('保存 KR','保存这个关键结果。','确认目标值和权重正确。','Save KR','Saves the key result.','Check the target and weight.')],
    // Form fields inside dialogs
    ['#overlay-root select[name="ownerId"]', h('负责人','这项工作由谁来完成。','选择具体执行的同事；他会在“工作台”和“我的任务”里看到这项任务。','Owner','Who will do this work.','Pick the person doing it; it will appear in their Overview and My Work.')],
    ['#overlay-root select[name="reviewerId"]', h('验收人','由谁检查成果并决定是否通过。','一般选直属主管；不能和负责人是同一个人。','Reviewer','Who checks the deliverable and decides.','Usually the direct manager; must differ from the owner.')],
    ['#overlay-root select[name="krId"]', h('关联 KR','这项任务支撑哪一个关键结果。','可不选；关联后方便在 OKR 里追踪，但不会自动修改 KR 实际值。','Linked KR','Which key result this task supports.','Optional; helps tracking in OKRs but never changes KR values automatically.')],
    ['#overlay-root select[name="boardPriority"]', h('优先级','任务的紧急和重要程度。','紧急事项选“紧急 / 高”，看板会优先排在前面。','Priority','How urgent and important the task is.','Choose Urgent / High for time-critical work; it sorts first.')],
    ['#overlay-root select[name="boardCategory"]', h('分类','任务所属的业务类别。','便于按部门职能筛选和统计。','Category','The business area of the task.','Helps filtering and reporting by function.')],
    ['#overlay-root select[name="level"]', h('目标层级','个人目标还是部门目标。','部门目标由负责人设定，个人目标支撑部门目标。','Level','Personal or department objective.','Managers set department objectives; personal ones support them.')],
    ['#overlay-root select[name="objectiveType"]', h('目标类型','基础任务还是奖励任务。','基础任务是岗位必须完成的；奖励任务是额外挑战，可参与奖励评分。','Objective type','Base or bonus objective.','Base objectives are core duties; bonus ones are stretch goals eligible for bonus scoring.')],
    ['#overlay-root select[name="direction"]', h('指标方向','数值越大越好，还是越小越好。','例如销售额选“越高越好”，退货率选“越低越好”。','Direction','Whether higher or lower is better.','Sales: higher is better. Return rate: lower is better.')],
    ['#overlay-root select[name="score"]', h('评分','按完成程度打分：完成 80 分，卓越完成 100 分。','对照成果和 KR 目标值如实选择。','Score','Score by achievement: complete 80, exceptional 100.','Choose honestly against the evidence and KR target.')],

    ['[data-live-action="close"]', h('关闭','关闭当前面板或弹窗。','未保存的内容可能会丢失，关闭前请先保存。','Close','Closes this panel or dialog.','Save first; unsaved input may be lost.')],

    // Team task board (task-board.js)
    ['[data-mb="refresh"]', h('刷新看板','重新读取看板上的最新任务。','同事刚改过任务、你这里还没更新时点击；未保存的视图设置会保留。','Refresh board','Reloads the latest tasks on the board.','Click when a colleague changed something you don’t see yet.')],
    ['[data-mb="people"]', h('团队成员','查看这个看板涉及哪些人，以及你的权限范围。','只能查看；账号和权限由管理员在钉钉中管理。','Board people','Shows who is on this board and your access scope.','View only; administrators manage accounts in DingTalk.')],
    ['[data-mb="copy-link"]', h('复制链接','复制当前看板的网址，发给同事。','对方打开后仍需要自己的权限才能看到内容。','Copy link','Copies this board’s URL to share.','Recipients still need their own access.')],
    ['[data-mb="settings"]', h('看板设置','修改分组、状态、优先级和分类标签的名称与颜色。','仅部门负责人可修改，修改会影响全部门的看板。','Board settings','Edit names and colors of groups, statuses, priorities and categories.','Managers only; changes apply to the whole department.')],
    ['[data-mb="scope"][data-value="team"]', h('团队看板','显示部门内所有你有权限看到的任务。','点击切换到全部门视图。','Team board','Shows all department tasks you can access.','Click for the department view.')],
    ['[data-mb="scope"][data-value="mine"]', h('我的任务','只显示分派给你的任务，按日期集中查看。','每天开始工作前点这里，看自己今天要做什么。','My Work','Shows only tasks assigned to you, by date.','Start your day here to see your own work.')],
    ['[data-mb="display"][data-value="table"]', h('主表格','以表格显示任务，可直接点格子编辑。','最常用的视图，适合批量整理任务。','Main table','Tasks as a table; click cells to edit.','The everyday view for organizing tasks.')],
    ['[data-mb="display"][data-value="kanban"]', h('看板','按状态分列显示任务卡片。','把卡片拖到另一列即可改变状态。','Kanban','Task cards in status columns.','Drag a card to another column to change its status.')],
    ['[data-mb="display"][data-value="calendar"]', h('日历','按截止日期在日历上显示任务。','查看本月哪天任务集中；默认隐藏周末，可切换显示。','Calendar','Tasks placed on their due dates.','See which days are busy; weekends are hidden by default.')],
    ['[data-mb="display"][data-value="dashboard"]', h('团队汇总','按状态和负责人统计任务数量。','点击图表中的状态或人名，可直接筛选出对应任务。','Team summary','Task counts by status and owner.','Click a status or person to filter the tasks.')],
    ['[data-mb="new"][data-group]', h('添加任务','在这个分组里直接新建一项任务。','输入任务名称回车即可，之后再补充负责人和日期。','Add task','Creates a task in this group.','Type a name and press Enter; fill in details later.')],
    ['[data-mb="new"]', h('新建任务','创建一项新任务。','填写名称、负责人、优先级和截止日期。','New task','Creates a new task.','Enter name, owner, priority and due date.')],
    ['[data-mb-search]', h('搜索任务','按任务名称快速查找。','输入关键词即可实时筛选。','Search tasks','Find tasks by name.','Type a keyword to filter instantly.')],
    ['[data-mb="person"]', h('人员筛选','只看某位同事负责的任务。','点击后选择人员；再选“全部人员”恢复。','Person filter','Show only one person’s tasks.','Pick a person; choose All people to reset.')],
    ['[data-mb="filter"]', h('筛选','按状态等条件缩小任务范围。','选择条件后表格立即更新；“清除筛选”恢复全部。','Filter','Narrow tasks by status and other fields.','The table updates instantly; Clear filters resets it.')],
    ['[data-mb="sort"]', h('排序','设置任务排列顺序，例如先按优先级、再按截止日期。','可添加多个排序条件，数字表示当前条件数。点“保存到此视图”记住设置。','Sort','Set the order, e.g. by priority then due date.','Add several rules; the number shows how many. Save to this view to keep it.')],
    ['[data-mb="hide"]', h('隐藏 / 显示列','选择表格中显示哪些列。','取消勾选不需要的列，让表格更简洁。','Hide / show columns','Choose which columns appear.','Untick columns you don’t need.')],
    ['[data-mb="groupBy"]', h('分组依据','选择按分组、状态、优先级、分类、负责人或日期把任务分块显示。','换个角度看任务，例如按负责人看每人工作量。','Group by','Group tasks by group, status, priority, category, owner or date.','Switch perspective, e.g. by owner to see workload.')],
    ['[data-mb="add-group"]', h('添加分组','新建一个任务分组，例如一个项目或一个阶段。','填写中英文名称和颜色；仅负责人可操作。','Add group','Creates a new task group, e.g. a project or phase.','Enter Chinese and English names and a color; managers only.')],
    ['[data-mb="collapse-group"]', h('折叠 / 展开分组','收起或展开这个分组里的任务。','点击分组名切换，任务很多时用来聚焦。','Collapse / expand group','Hides or shows the tasks in this group.','Click the group name to focus.')],
    ['[data-mb="edit-group"]', h('分组设置','重命名分组、修改颜色，或批量操作组内任务。','仅负责人可修改。','Group options','Rename, recolor or act on tasks in this group.','Managers only.')],
    ['[data-mb-resize]', h('调整列宽','拖动改变这一列的宽度。','按住左右拖动即可。','Resize column','Drag to change the column width.','Click and drag left or right.')],
    ['[data-mb="column-sort"]', h('按此列排序','点击列标题，按这一列升序或降序排列。','再次点击切换方向。','Sort by this column','Click the header to sort by this column.','Click again to reverse.')],
    ['[data-mb="expand"]', h('展开子任务','查看或添加这项任务下的子任务。','把大任务拆成几个小步骤时使用。','Expand subitems','Shows or adds subitems under this task.','Use it to break big work into steps.')],
    ['[data-mb="rename"]', h('任务名称','点击可直接修改任务名称。','修改后按回车保存。','Task name','Click to rename the task.','Press Enter to save.')],
    ['[data-mb="updates"]', h('任务讨论','记录进度、阻碍或需要协作的事项，数字是已有更新条数。','写一条更新后点“发布更新”。这是内部记录，不会通知客户，也不会触发验收。','Task updates','Post progress, blockers or coordination notes; the number shows existing updates.','Write an update and click Post update. Internal only; no customer email or acceptance.')],
    ['[data-mb="task-menu"]', h('任务选项','重命名、添加子任务、移动分组或打开详情与成果。','点击后从菜单中选择操作。','Task options','Rename, add a subitem, move group or open details & evidence.','Click and pick an action.')],
    ['[data-mb="edit-cell"][data-field="owner"]', h('负责人','这项任务由谁来做。','点击选择同事；只有负责人能调整分派。','Owner','Who does this task.','Click to choose a person; only managers can reassign.')],
    ['[data-mb="edit-cell"][data-field="priority"]', h('优先级','任务的紧急和重要程度：紧急 / 高 / 中 / 低。','点击选择。排序默认先按优先级。','Priority','How urgent and important: Urgent / High / Medium / Low.','Click to choose. Sorting uses priority first by default.')],
    ['[data-mb="edit-cell"][data-field="status"]', h('执行状态','任务做到哪一步：未开始 / 进行中 / 暂缓 / 待检查 / 完成。','点击修改。“完成”满 7 天会自动移入“已完成”分组；正式验收仍需在详情里提交成果。','Status','Where the task stands: Not started / Working / On hold / Review / Done.','Click to change. Done for 7 days moves it to Completed; formal acceptance still happens in details.')],
    ['[data-mb="edit-cell"][data-field="category"]', h('分类','任务所属的业务类别，例如人事、财务、市场。','点击选择；负责人可在“看板设置”里新增分类。','Category','The business area, e.g. HR, finance, marketing.','Click to choose; managers add categories in Board settings.')],
    ['[data-mb="edit-cell"][data-field="due"]', h('截止日期','这项任务需要在哪天之前完成。','点击选择日期，逾期会在老板看板中被标出。','Due date','When the task must be finished.','Click to pick a date; overdue work is flagged on the executive overview.')],
    ['[data-mb="edit-cell"][data-field="notes"]', h('备注','补充说明、链接或注意事项。','点击直接编辑。','Notes','Extra details, links or reminders.','Click to edit.')],
    ['[data-mb="detail"]', h('最后更新 / 详情','显示任务最后修改的时间；点击打开任务详情与成果。','需要提交成果或验收时从这里进入。','Last updated / details','When the task last changed; click to open details & evidence.','Go here to submit or review deliverables.')],
    ['[data-mb="move"]', h('移至分组','把任务移到另一个分组。','选择目标分组；子任务会跟着父任务一起移动。','Move to group','Moves the task to another group.','Choose a group; subitems move with their parent.')],
    ['[data-mb="labels"]', h('编辑标签','修改状态、优先级或分类的中英文名称和颜色。','改动对全部门生效；正在使用的分类不能删除。','Edit labels','Edit Chinese/English names and colors for statuses, priorities or categories.','Changes apply department-wide; categories in use cannot be deleted.')],
    ['[data-mb="add-sort"]', h('新增排序','再加一个排序条件。','例如先按优先级，再按截止日期。','Add sort','Adds another sort rule.','E.g. priority first, then due date.')],
    ['[data-mb="remove-sort"]', h('删除排序','去掉这一条排序条件。','','Remove sort','Removes this sort rule.','')],
    ['[data-mb="save-view"]', h('保存到此视图','把当前的排序、分组、隐藏列等设置保存下来。','只影响你自己的视图，下次打开时保持不变。','Save to this view','Saves the current sort, grouping and column settings.','Only your own view; it stays the same next time.')],
    ['[data-mb="calendar-today"]', h('今天','跳回当前月份。','','Today','Jumps back to the current month.','')],
    ['[data-mb="calendar-prev"], [data-mb="calendar-next"]', h('切换月份','查看上一个月或下一个月的任务。','','Change month','Shows the previous or next month.','')],
    ['[data-mb="calendar-weekends"]', h('显示 / 隐藏周末','切换日历中是否显示周六、周日。','截止日期在周末的任务需要打开才能看到。','Show / hide weekends','Toggles Saturday and Sunday in the calendar.','Turn on to see tasks due on weekends.')],
    ['[data-mb="dashboard-status"], [data-mb="dashboard-person"]', h('点击筛选','点这个统计项，只显示对应的任务。','再点一次或“清除筛选”恢复。','Click to filter','Shows only the matching tasks.','Click again or Clear filters to reset.')],

    // Support workspace (company-support.js)
    ['[data-company-refresh]', h('刷新','重新读取最新的工单和客服数据。','顶部提示“未同步”或数据不对时点击。','Refresh','Reloads the latest tickets and support data.','Click when it says not synced or data looks stale.')],
    ['[data-company-tab="tickets"]', h('工单与草稿','查看已跟踪的 Zoho 工单，对比 AI 草稿、客服修改稿和已发送回复。','点工单号打开，检查 AI 草稿是否准确。','Tickets & drafts','Tracked Zoho tickets with AI drafts, staff edits and sent replies.','Open a ticket to check the AI draft.')],
    ['[data-company-tab="shopify"]', h('订单与物流','按订单号查询 Shopify 订单和物流状态（只读）。','输入完整订单号，例如 #1001，查看各包裹的发货和送达记录。','Order & shipping','Read-only Shopify order and shipping lookup.','Enter the full order number, e.g. #1001, to see each package.')],
    ['[data-company-tab="quality"]', h('质量与交接','检查回复质量，记录需要转交其他同事的工单。','逐条核对后保存核对记录。','Quality & handover','Review reply quality and log tickets handed to others.','Check each item and save the review record.')],
    ['[data-company-tab="publicInbox"]', h('访客请求','官网 AI 助手收到的人工支持请求和客户反馈。','优先处理“标记未解决”的问题，并考虑补充到知识库。','Visitor requests','Human-help requests and feedback from the website assistant.','Prioritize items marked unresolved and consider adding them to the knowledge base.')],
    ['[data-company-tab="candidates"]', h('知识候选','把处理工单时总结的经验整理成知识草稿，审核后再发布。','点“新建候选”填写适用机型、解决方法和来源；去掉客户个人信息。','Knowledge candidates','Turn ticket experience into knowledge drafts for review.','Use New candidate with model, fix and source; remove customer personal data.')],
    ['[data-company-tab="publicKnowledge"]', h('问答资料','决定哪些公开文章可以给 AI 助手用来回答客户。','打开文章核对当前版本，再选择是否允许助手使用。','Q&A sources','Decide which public articles the AI assistant may use.','Review the current version, then allow or deny assistant use.')],
    ['[data-company-tab="answers"]', h('标准回复','常见问题的标准回复候选。','仅供人工核对，审核不会自动发给客户。','Standard responses','Candidate standard replies for common questions.','For human review only; nothing is sent automatically.')],
    ['[data-company-tab="sla"]', h('SLA 草案','客服服务时限标准（例如首次响应时间）的草案。','尚未生效，供讨论确认。','SLA draft','Draft service-time standards such as first-response time.','Not active yet; for discussion.')],
    ['[data-company-tab="operations"]', h('自动化状态','查看客服自动化（工单读取、AI 派发）是否正常运行。','“最近读取成功”时间太久说明自动化可能中断，需要联系管理员。','Automation status','Whether support automation (ticket polling, AI dispatch) is running.','An old last-success time means it may have stopped; tell an admin.')],
    ['[data-company-ticket-search]', h('搜索工单','按工单号、主题、状态或关注原因查找。','输入关键词实时筛选。','Search tickets','Find by number, subject, status or attention reason.','Type to filter instantly.')],
    ['[data-company-ticket]', h('打开工单','查看工单内容、AI 草稿、客服修改稿和已发送回复的对比。','核对 AI 草稿是否准确，必要时记录修改。','Open ticket','See the ticket, AI draft, staff edit and sent reply side by side.','Check whether the AI draft is accurate.')],
    ['[data-company-shopify-lookup]', h('查询订单','按输入的完整订单号查询 Shopify。','只读查询，不会修改订单。','Look up order','Looks up the order in Shopify.','Read-only; nothing is changed.')],
    ['[data-company-candidate-new]', h('新建候选','新建一条知识候选草稿。','写清适用机型、已验证的解决方法、来源和仍待确认的事项。','New candidate','Creates a new knowledge draft.','Include model, verified fix, source and open questions.')],
    ['[data-company-candidate-review]', h('核对候选','审核这条知识候选的事实、来源和适用范围。','确认无误后选择审核结论并保存。','Review candidate','Check this candidate’s facts, sources and scope.','Pick a finding and save.')],
    ['[data-company-public-knowledge]', h('核对使用范围','决定这篇文章当前版本能否给 AI 助手使用。','先阅读原文，再勾选确认并保存。','Review eligibility','Decide whether the assistant may use this article version.','Read it, tick the confirmation and save.')],
    ['[data-company-copy-draft], [data-company-copy-sent]', h('复制内容','复制这段回复文本到剪贴板。','方便粘贴到 Zoho 或对比修改。','Copy text','Copies this reply to the clipboard.','Paste into Zoho or compare edits.')],
    ['[data-company-review]', h('保存核对记录','记录你已核对这条内容。','此操作不会给客户发邮件，也不会发布内容。','Save review record','Records that you checked this item.','Does not email customers or publish anything.')],

    // Wiki
    ['.wiki-nav .wiki-nav-link:nth-of-type(1)', h('知识中心概览','知识中心首页，展示常用指南和产品系列入口。','不知道从哪找起时先看这里。','Knowledge overview','The knowledge center home with popular guides and product families.','Start here if you are not sure where to look.')],
    ['.wiki-nav .wiki-nav-link:nth-of-type(2)', h('全部指南','按产品系列和主题浏览全部文章，并可搜索。','输入机型或关键词筛选，例如 Hydra、安装。','All guides','Browse and search every article by product family and topic.','Filter by model or keyword, e.g. Hydra, setup.')],
    ['.wiki-nav .wiki-nav-link:nth-of-type(3)', h('下载中心','驱动、软件、固件和说明书等下载资源。','找到对应机型后下载；发给客户前确认版本。','Downloads','Drivers, software, firmware and manuals.','Find the model and download; confirm the version before sending to customers.')],
    ['.wiki-nav .wiki-nav-link:nth-of-type(4)', h('档案与核对','保留文章原文、来源版本和人工核对记录（仅有权限的同事可见）。','审核资料来源或核对历史版本时使用。','Archive & review','Original content, source versions and review records (authorized staff only).','Use it to audit sources or check past versions.')],
    ['.wiki-back', h('返回列表','回到指南列表。','看完一篇后点这里继续浏览。','Back to guides','Returns to the guide list.','Click after reading to keep browsing.')],
    ['[data-wiki-search]', h('搜索知识库','按标题或产品系列搜索指南。','输入机型或关键词，例如 Hydra、安装、firmware。','Search knowledge','Search guides by title or product family.','Type a model or keyword, e.g. Hydra, setup, firmware.')],
    ['[data-wiki-article]', h('打开文章','阅读这篇产品指南或排查步骤。','点击打开全文。','Open article','Read this guide or troubleshooting article.','Click to open.')],
    ['[data-wiki-retry]', h('重试','知识中心加载失败时重新读取。','点击重试；多次失败请联系管理员。','Retry','Reloads the knowledge center after an error.','Click to retry; tell an admin if it keeps failing.')],
    ['[data-wiki-assistant-new]', h('新对话','清空当前对话，重新开始提问。','换一个问题时使用。','New chat','Clears the conversation to start over.','Use it for a new question.')],
    ['[data-wiki-handoff-open]', h('转人工','AI 回答不了时，提交给客服同事处理。','留下问题和联系方式。','Talk to a person','Hands the question to support staff when the AI can’t help.','Leave the question and contact details.')]
  ].map(([sel, data]) => ({ sel, data }));

  const SCOPE = '#app, #overlay-root';
  const inScope = el => !!(el && el.closest && el.closest(SCOPE));
  const ruleFor = el => {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (!node.matches) continue;
      if (node.matches('.help-page-icon')) return null;
      for (const r of RULES) if (node.matches(r.sel)) return { target:node, data:r.data };
    }
    return null;
  };
  const currentPage = () => document.querySelector('#app [data-live-page][aria-current="page"]')?.dataset.livePage || '';

  /* Tooltip element (single, reused). */
  let tip, showTimer, activeTarget, pinned = false;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'help-tip'; tip.className = 'help-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  }
  function content(data, wide) {
    const l = lang(), d = data[l], labels = l === 'en' ? ['Purpose','How to use'] : ['用途','怎么用'];
    return `<div class="help-tip-title">${esc(d.t)}</div><div class="help-tip-row"><span>${labels[0]}</span><p>${esc(d.p)}</p></div>${d.h ? `<div class="help-tip-row"><span>${labels[1]}</span><p>${esc(d.h)}</p></div>` : ''}`;
  }
  function place(target) {
    const r = target.getBoundingClientRect(), t = tip.getBoundingClientRect(), gap = 8, vw = innerWidth, vh = innerHeight;
    let top = r.bottom + gap, left = r.left + r.width / 2 - t.width / 2;
    if (top + t.height > vh - 8) top = r.top - t.height - gap;          // flip above
    if (top < 8) top = Math.min(vh - t.height - 8, r.bottom + gap);
    left = Math.max(8, Math.min(left, vw - t.width - 8));
    tip.style.top = `${Math.round(top)}px`; tip.style.left = `${Math.round(left)}px`;
  }
  function show(target, data, opts = {}) {
    ensureTip();
    tip.classList.toggle('help-tip-wide', !!opts.wide);
    tip.innerHTML = content(data);
    tip.hidden = false; tip.style.top = '-9999px'; tip.style.left = '-9999px';
    place(target);
    if (activeTarget && activeTarget !== target) activeTarget.removeAttribute('aria-describedby');
    activeTarget = target; target.setAttribute('aria-describedby', 'help-tip');
  }
  function hide() {
    clearTimeout(showTimer); pinned = false;
    if (tip) tip.hidden = true;
    if (activeTarget) { activeTarget.removeAttribute('aria-describedby'); activeTarget = null; }
  }
  const pageData = () => PAGES[currentPage()];

  /* Hover / focus on buttons. */
  document.addEventListener('pointerover', e => {
    if (pinned || e.pointerType === 'touch') return;
    const icon = e.target.closest?.('.help-page-icon');
    if (icon) { const d = pageData(); if (d) { clearTimeout(showTimer); showTimer = setTimeout(() => show(icon, d, { wide:true }), 120); } return; }
    if (!enabled() || !inScope(e.target)) return;
    const hit = ruleFor(e.target);
    if (!hit) return;
    if (hit.target === activeTarget) return;
    clearTimeout(showTimer);
    showTimer = setTimeout(() => { if (hit.target.isConnected) show(hit.target, hit.data); }, SHOW_DELAY);
  });
  document.addEventListener('pointerout', e => {
    if (pinned) return;
    const from = e.target.closest?.('.help-page-icon') || (activeTarget && activeTarget.contains(e.target) ? activeTarget : null);
    const to = e.relatedTarget;
    if (from && to && from.contains(to)) return;
    clearTimeout(showTimer);
    if (!to || !activeTarget || !activeTarget.contains(to)) hide();
  });
  document.addEventListener('focusin', e => {
    const icon = e.target.closest?.('.help-page-icon');
    if (icon) { const d = pageData(); if (d) show(icon, d, { wide:true }); return; }
    if (!enabled() || !inScope(e.target) || !e.target.matches(':focus-visible')) return;
    const hit = ruleFor(e.target); if (hit) show(hit.target, hit.data);
  });
  document.addEventListener('focusout', () => { if (!pinned) hide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', () => { if (!pinned) hide(); }, true);
  addEventListener('resize', hide);

  /* Clicks: page icon pins its guide (touch friendly); help toggle switches hints. */
  document.addEventListener('click', e => {
    const icon = e.target.closest?.('.help-page-icon');
    if (icon) {
      e.preventDefault(); e.stopPropagation();
      const d = pageData(); if (!d) return;
      if (pinned && activeTarget === icon) { hide(); return; }
      show(icon, d, { wide:true }); pinned = true; return;
    }
    const toggle = e.target.closest?.('.help-toggle');
    if (toggle) {
      e.preventDefault(); e.stopPropagation();
      setEnabled(!enabled()); hide(); decorate();
      flash(enabled() ? (lang() === 'en' ? 'Button hints on' : '按钮说明已开启') : (lang() === 'en' ? 'Button hints off' : '按钮说明已关闭'));
      return;
    }
    if (pinned && !e.target.closest?.('#help-tip')) hide();
    else if (!pinned) hide();
  }, true);

  function flash(text) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = text; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* Inject (?) icons next to page titles and the hint toggle in the top bar.
   * Re-applied after every app render; each insertion is idempotent. */
  function decorate() {
    const page = currentPage();
    const l = lang();
    const heading = page && PAGES[page] && document.querySelector('#app .page-heading h1, #app .mb-heading h1, #app main h1');
    if (heading && !heading.querySelector('.help-page-icon')) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'help-page-icon';
      b.setAttribute('aria-label', l === 'en' ? 'About this page' : '这个页面怎么用');
      b.innerHTML = '<span aria-hidden="true">?</span>';
      heading.appendChild(b);
    }
    const bar = document.querySelector('#app .topbar-right');
    if (bar) {
      let t = bar.querySelector('.help-toggle');
      if (!t) {
        t = document.createElement('button');
        t.type = 'button'; t.className = 'help-toggle';
        t.innerHTML = '<span aria-hidden="true">?</span>';
        bar.insertBefore(t, bar.firstChild);
      }
      const on = enabled();
      t.classList.toggle('help-off', !on);
      t.setAttribute('aria-pressed', String(on));
      const label = on ? (l === 'en' ? 'Button hints are on. Click to turn off.' : '按钮说明已开启，点击关闭') : (l === 'en' ? 'Button hints are off. Click to turn on.' : '按钮说明已关闭，点击开启');
      t.setAttribute('aria-label', label); t.title = label;
    }
  }
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; decorate(); if (activeTarget && !activeTarget.isConnected) hide(); }); };
  function start() {
    const app = document.getElementById('app');
    if (!app) return;
    new MutationObserver(schedule).observe(app, { childList:true, subtree:true });
    decorate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.WorkOSHelp = { RULES, PAGES, ruleFor, enabled, setEnabled };
})();
