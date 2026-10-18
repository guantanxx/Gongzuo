'use strict';
(() => {
  const STORAGE_KEY = 'gongzuo.workspace.v1';
  const initial = () => ({ schemaVersion: 2, theme: 'dark', profile: { name: '', niche: '总包、装修公司、经销商、甲方客户', style: '专业克制，工程参数讲清楚，不夸大效果', products: '投影灯、水纹灯、激光灯、文旅亮化', contact: '' }, reports: [], ideas: [], topics: [], scripts: [], lives: [], metrics: [], templates: [], tasks: [], drafts: {} });
  let state = initial();
  let readError = false;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved !== null) state = window.WorkspaceModules.profile.validate(saved, { initial });
  } catch { readError = true; }
  const sections = [
    { id: 'overview', name: '工作台概览', icon: '◫', description: '看见内容，也看见生意的线索。' },
    { id: 'analysis', name: '爆款拆解', icon: '⌕', description: '从工程客户的视角，辨识钩子、痛点与询盘路径。', hint: '看见转化逻辑' },
    { id: 'ideas', name: '灵感库', icon: '✧', description: '把工厂、样品和项目现场，沉淀为下一条内容。', hint: '记录现场的光' },
    { id: 'topics', name: '选题库', icon: '▤', description: '围绕选型、交付与效果，组织 B 端客户关心的话题。', hint: '回应客户的问题' },
    { id: 'scripts', name: '文案生成', icon: '✎', description: '从需求到参数，从验证到询盘，写清一段工程向表达。', hint: '让专业被理解' },
    { id: 'templates', name: '模板库', icon: '▱', description: '口播、探厂开场与询盘引导，让可靠的表达反复使用。', hint: '保留表达的骨架' },
    { id: 'live', name: '直播中心', icon: '◉', description: '走进工厂，演示样品，把每一次沟通变成可跟进的需求。', hint: '用演示建立信任' },
    { id: 'tasks', name: '待办提醒', icon: '◷', description: '拍摄、脚本截止和客户对接，按节奏推进。', hint: '保持创作的秩序' },
    { id: 'analytics', name: '数据复盘', icon: '▥', description: '从播放到私信、询盘与留资，观察内容的商业价值。', hint: '追踪有效线索' },
    { id: 'profile', name: '工作台设置', icon: '⚙', description: '定义照明行业 IP，管理本机数据与外观。' }
  ];
  let toastTimer;
  function notify(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
  }
  function persist(change, message = '', redraw = true) {
    if (readError) { notify('本地数据读取失败。请先在个人中心导出原始数据或恢复有效备份，避免覆盖。'); return false; }
    const next = JSON.parse(JSON.stringify(state));
    change(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { notify('保存失败：浏览器存储不可用或空间不足。请导出备份，释放空间后重试。'); return false; }
    state = next;
    const status = document.getElementById('save-status'); if (status) status.textContent = '已保存到本机';
    window.WorkspaceTools?.refreshSearch?.(ctx);
    if (redraw) render();
    if (message) notify(message);
    return true;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const date = value => new Date(value).toLocaleString('zh-CN', { hour12: false });
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const field = (name, label, value = '', options = {}) => `<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><input id="f-${esc(name)}" name="${esc(name)}" value="${esc(value)}" ${options.type ? `type="${esc(options.type)}"` : 'type="text"'} ${options.required ? 'required' : ''} ${options.type === 'number' ? `min="${options.min ?? 0}" max="${options.max ?? 1000000000000}" step="1"` : `maxlength="${options.maxlength || 500}"`} ${options.placeholder ? `placeholder="${esc(options.placeholder)}"` : ''}></div>`;
  const area = (name, label, value = '', required = false) => `<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><textarea id="f-${esc(name)}" name="${esc(name)}" maxlength="30000" ${required ? 'required' : ''}>${esc(value)}</textarea></div>`;
  const select = (name, label, choices, value = '') => `<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><select id="f-${esc(name)}" name="${esc(name)}">${choices.map(([id, text]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></div>`;
  const empty = text => `<div class="empty-state"><p>${esc(text)}</p></div>`;
  const values = form => Object.fromEntries(new FormData(form));
  const draft = key => state.drafts[key] || {};
  function bindDraft(form, key, exclude = []) {
    form.addEventListener('input', event => { if (exclude.includes(event.target.name)) return; persist(s => { s.drafts[key] = { ...s.drafts[key], ...values(form) }; }, '', false); });
  }
  function go(page) { if (location.hash === `#${page}`) render(); else location.hash = page; }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.getElementById('theme-toggle').setAttribute('aria-label', `切换为${state.theme === 'dark' ? '浅' : '深'}色主题`);
  }
  document.getElementById('theme-toggle').addEventListener('click', () => {
    if (persist(s => { s.theme = s.theme === 'dark' ? 'light' : 'dark'; }, '主题已保存', false)) { applyTheme(); render(); }
  });
  const nav = document.getElementById('navigation');
  nav.innerHTML = sections.map(s => `<a class="nav-item" href="#${s.id}" data-page="${s.id}"><span class="nav-icon" aria-hidden="true">${s.icon}</span>${s.name}</a>`).join('');
  function heading(title, subtitle) {
    return `<div class="page-heading"><div><div class="eyebrow">LIGHTING / CONTENT STUDIO</div><h1>${title}</h1><p class="subtext">${subtitle}</p></div><span class="date-badge">${new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</span></div>`;
  }
  function overview() {
    const leads = state.metrics.reduce((sum, row) => sum + row.leads, 0) + state.lives.reduce((sum,row)=>sum+(row.review?.leads || 0),0);
    const publishedIds = new Set(state.metrics.map(row=>row.topicId).filter(Boolean));
    const published = state.topics.filter(t=>t.status==='已发布').length + state.metrics.filter(row=>!publishedIds.has(row.topicId)).length;
    const pending = state.tasks.filter(t=>!t.done).sort((a,b)=>(a.due || '9999').localeCompare(b.due || '9999'));
    return heading('让专业，被光看见。', '商业照明 · 工程亮化 · 面向项目决策者的内容工作台') +
      `<section class="hero"><div class="hero-copy"><span class="eyebrow">A QUIETER WAY TO CREATE</span><h2>从一束光，<br>到一个真实的项目。</h2><p>以现场为素材，以专业为表达。连接总包、装修公司、经销商与甲方，让每一次创作都有清晰的去向。</p><a class="primary" href="#ideas">记录新的灵感 <span aria-hidden="true">↗</span></a></div><div class="light-study" aria-hidden="true"><div class="light-source"></div><div class="light-beam"></div><div class="light-pool"></div><span>STUDY OF LIGHT / 01</span></div></section>
      <section class="stats" aria-label="核心指标">${[['选题总数',state.topics.length,'内容储备'],['已发布视频',published,'已发布选题与独立视频去重'],['累计询盘',leads,'视频与直播询盘合计'],['待推进事项',pending.length,'拍摄 · 脚本 · 客户']].map(([label,value,note],i)=>`<article class="stat"><div class="stat-top"><span>${label}</span><span>0${i+1}</span></div><strong>${value.toLocaleString('zh-CN')}</strong><small>${note}</small></article>`).join('')}</section>
      <section class="overview-work"><div><div class="section-title"><h2>创作路径</h2><span>从现场出发 / 回到项目</span></div><div class="cards">${sections.filter(s=>!['overview','profile','tasks'].includes(s.id)).map((s,i)=>`<a class="card" href="#${s.id}"><div class="card-top"><span class="card-icon" aria-hidden="true">${s.icon}</span><span class="muted">0${i+1}</span></div><h2>${s.name}</h2><p>${s.description}</p><span class="card-bottom">${s.hint}<span aria-hidden="true">↗</span></span></a>`).join('')}</div></div><aside class="overview-aside panel"><div class="section-title"><h2>待办日程</h2><a href="#tasks">全部 ↗</a></div>${pending.length ? pending.slice(0,6).map(t=>`<div class="agenda-item"><span class="tag">${esc(t.category)}</span><h3>${esc(t.title)}</h3><small class="${t.due && t.due<today()?'overdue':'muted'}">${esc(t.due || '未设截止日')}${t.due && t.due<today()?' · 已逾期':''}</small></div>`).join('') : empty('留一点空白，给下一次现场。可在待办提醒添加事项。')}<a class="secondary" href="#tasks">添加工作事项</a><div class="aside-note"><span class="eyebrow">LOCAL / INDEPENDENT</span><p>数据留在本机。<br>定期导出，把积累妥善留存。</p></div></aside></section>`;
  }
  let renderController = new AbortController();
  const ctx = { get sections() { return sections; }, tools: window.WorkspaceTools, get signal() { return renderController.signal; }, get state() { return state; }, persist, esc, uid, date, today, field, area, select, empty, values, draft, bindDraft, notify, go, render, heading, get readError() { return readError; }, storageKey: STORAGE_KEY, initial, replaceState(next) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { notify('恢复失败：本地存储不可用或空间不足，原数据未变。'); return false; }
    state = next; readError = false; applyTheme(); render(); notify('备份恢复成功'); return true;
  }};
  function render() {
    renderController.abort(); renderController = new AbortController();
    const section = sections.find(s => s.id === location.hash.slice(1)) || sections[0];
    document.getElementById('breadcrumb').textContent = section.name;
    document.title = `${section.name} · 光序 LIGHTING STUDIO`;
    for (const link of nav.children) {
      if (link.dataset.page === section.id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    const module = window.WorkspaceModules?.[section.id];
    document.getElementById('main').innerHTML = module ? heading(section.name, section.description || '管理你的创作空间') + module.render(ctx) : section.id === 'overview' ? overview() : heading(section.name, section.description) + empty('功能正在开发中');
    if (module) module.mount(ctx);
    window.WorkspaceTools?.mountGlobal?.(ctx);
    window.WorkspaceModules.tasks?.mountWidget(ctx);

  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); document.getElementById('main').focus({ preventScroll: true }); });
  document.getElementById('quick-idea').addEventListener('click', () => { if (!state.drafts.ideas?.title || confirm('新建会清空当前灵感编辑草稿，已保存灵感保留。继续？')) { if (persist(s=>{s.drafts.ideas={};},'',false)) { go('ideas'); notify('可以记录新灵感了'); } } });
  document.getElementById('quick-export').addEventListener('click', () => window.WorkspaceModules.profile.exportAll(ctx));
  window.WorkspaceTools?.initGlobal?.(ctx);
  applyTheme(); render();
  if (readError) notify('本地数据读取失败，已暂停写入。请前往个人中心恢复备份。');
})();
