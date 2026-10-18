'use strict';
(() => {
  const STORAGE_KEY = 'gongzuo.workspace.v1';
  const collections = ['reports', 'ideas', 'topics', 'scripts', 'lives', 'metrics'];
  const initial = () => ({ schemaVersion: 1, theme: 'light', profile: { name: '', niche: '', style: '' }, reports: [], ideas: [], topics: [], scripts: [], lives: [], metrics: [], drafts: {} });
  let state = initial();
  let readError = false;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved !== null) state = window.WorkspaceModules.profile.validate(saved, { initial });
  } catch { readError = true; }
  const sections = [
    { id: 'overview', name: '工作台概览', icon: '◫' },
    { id: 'analysis', name: '爆款拆解', icon: '⌕', description: '拆解内容结构与开头钩子，找到值得借鉴的创作方法。', hint: '从一条好内容开始' },
    { id: 'ideas', name: '灵感库', icon: '✧', description: '收集一闪而过的想法，让每一份灵感都有归处。', hint: '捕捉你的下一个灵感' },
    { id: 'topics', name: '选题库', icon: '▤', description: '将灵感转化为选题，打磨标题、封面与黄金开头。', hint: '让好灵感变成好选题' },
    { id: 'scripts', name: '文案生成', icon: '✎', description: '围绕表达风格组织口播文案，管理每一次创作迭代。', hint: '写出属于你的表达' },
    { id: 'live', name: '直播中心', icon: '◉', description: '规划直播主题与流程，沉淀脚本和复盘记录。', hint: '从容准备每一场直播' },
    { id: 'analytics', name: '数据复盘', icon: '▥', description: '记录发布表现，从数据中发现内容的增长方向。', hint: '让下一次创作更有依据' },
    { id: 'profile', name: '个人中心', icon: '♙' }
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
  function bindDraft(form, key) {
    form.addEventListener('input', () => { persist(s => { s.drafts[key] = { ...s.drafts[key], ...values(form) }; }, '', false); });
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
    return `<div class="page-heading"><div><div class="eyebrow">YOUR CREATIVE SPACE</div><h1>${title}</h1><p class="subtext">${subtitle}</p></div><span class="date-badge">${new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</span></div>`;
  }
  function overview() {
    return heading('把灵感，变成影响力。', '从灵感萌芽到内容复盘，你的创作流程尽在这里。') +
      `<section class="hero"><div><h2>每一份好内容，都从一个想法开始</h2><p>串联拆解、灵感、选题与表达，为你的创作建立清晰的节奏。</p></div><a class="primary" href="#ideas">探索灵感库 →</a></section>
      <section class="stats" aria-label="内容资产概览">${['收藏灵感', '储备选题', '口播文案', '直播记录'].map((name, i) => `<article class="stat"><div class="stat-top">${name}<span aria-hidden="true">${['✧', '▤', '✎', '◉'][i]}</span></div><strong>${[state.ideas.length, state.topics.length, state.scripts.length, state.lives.length][i]}</strong><small>本地内容资产 · 实时统计</small></article>`).join('')}</section>
      <section aria-labelledby="tools-title"><div class="section-title"><h2 id="tools-title">创作工具箱</h2><span>从一个想法到一份作品</span></div><div class="cards">${sections.slice(1, 7).map((s, i) => `<a class="card" href="#${s.id}"><span class="card-icon" aria-hidden="true">${s.icon}</span><h2>${s.name}</h2><p>${s.description}</p><div class="card-bottom"><span>0${i + 1} / ${s.hint}</span><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section>
      <aside class="bottom-note"><span aria-hidden="true">◇</span><div><h2>你的内容，留在你的设备</h2><p>工作台独立运行，设置保存在当前浏览器。分析与生成基于本地规则，不抓取平台内容、不调用远程 AI。建议定期导出备份。</p></div></aside>`;
  }

  function profile() {
    return heading('个人中心', '定义创作者档案，管理你的本地工作空间。') + `<section class="panel"><h2>创作者档案</h2><p class="subtext">输入自动保存，供本地生成规则参考。</p><form id="profile-form">${field('name', 'IP 名称', state.profile.name, {maxlength:60})}${field('niche', '内容领域 / 目标人群', state.profile.niche, {maxlength:200})}${area('style','表达风格',state.profile.style)}<button class="primary">保存档案</button></form></section>`;
  }
  let renderController = new AbortController();
  const ctx = { get signal() { return renderController.signal; }, get state() { return state; }, persist, esc, uid, date, today, field, area, select, empty, values, draft, bindDraft, notify, go, render, heading, get readError() { return readError; }, storageKey: STORAGE_KEY, initial, replaceState(next) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { notify('恢复失败：本地存储不可用或空间不足，原数据未变。'); return false; }
    state = next; readError = false; applyTheme(); render(); notify('备份恢复成功'); return true;
  }};
  function render() {
    renderController.abort(); renderController = new AbortController();
    const section = sections.find(s => s.id === location.hash.slice(1)) || sections[0];
    document.getElementById('breadcrumb').textContent = section.name;
    document.title = `${section.name} · 创作舱`;
    for (const link of nav.children) {
      if (link.dataset.page === section.id) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    const module = window.WorkspaceModules?.[section.id];
    document.getElementById('main').innerHTML = module ? heading(section.name, section.description || '管理你的创作空间') + module.render(ctx) : section.id === 'overview' ? overview() : section.id === 'profile' ? profile() : heading(section.name, section.description) + empty('功能正在开发中');
    if (module) module.mount(ctx);
    else if (section.id === 'profile') {
      const form = document.getElementById('profile-form');
      form.addEventListener('input', () => { persist(s => { s.profile = values(form); }, '', false); });
      form.addEventListener('submit', e => { e.preventDefault(); persist(s => { s.profile = values(form); }, '档案保存成功', false); });
    }
  }
  window.addEventListener('hashchange', render);
  applyTheme(); render();
  if (readError) notify('本地数据读取失败，已暂停写入。请前往个人中心恢复备份。');
})();
