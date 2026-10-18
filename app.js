'use strict';
(() => {
  const STORAGE_KEY = 'gongzuo.workspace.v1';
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
  let storageAvailable = true;
  let state = { theme: 'light', profile: { name: '', niche: '', style: '' } };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (saved.theme === 'dark') state.theme = 'dark';
      for (const key of Object.keys(state.profile)) {
        if (typeof saved.profile?.[key] === 'string') state.profile[key] = saved.profile[key];
      }
    }
  } catch { storageAvailable = false; }
  let toastTimer;
  function notify(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
    catch { notify('本地存储不可用，设置仅在本次页面中保留。'); return false; }
  }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.getElementById('theme-toggle').setAttribute('aria-label', `切换为${state.theme === 'dark' ? '浅' : '深'}色主题`);
  }
  document.getElementById('theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    if (save()) notify(`已切换为${state.theme === 'dark' ? '深' : '浅'}色主题`);
  });
  const nav = document.getElementById('navigation');
  nav.innerHTML = sections.map(s => `<a class="nav-item" href="#${s.id}" data-page="${s.id}"><span class="nav-icon" aria-hidden="true">${s.icon}</span>${s.name}</a>`).join('');
  function heading(title, subtitle) {
    return `<div class="page-heading"><div><div class="eyebrow">YOUR CREATIVE SPACE</div><h1>${title}</h1><p class="subtext">${subtitle}</p></div><span class="date-badge">${new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</span></div>`;
  }
  function overview() {
    return heading('把灵感，变成影响力。', '从灵感萌芽到内容复盘，你的创作流程尽在这里。') +
      `<section class="hero"><div><h2>每一份好内容，都从一个想法开始</h2><p>串联拆解、灵感、选题与表达，为你的创作建立清晰的节奏。</p></div><a class="primary" href="#ideas">探索灵感库 →</a></section>
      <section class="stats" aria-label="内容资产概览">${['收藏灵感', '储备选题', '口播文案', '直播记录'].map((name, i) => `<article class="stat"><div class="stat-top">${name}<span aria-hidden="true">${['✧', '▤', '✎', '◉'][i]}</span></div><strong>0</strong><small>暂无记录 · 等待开始创作</small></article>`).join('')}</section>
      <section aria-labelledby="tools-title"><div class="section-title"><h2 id="tools-title">创作工具箱</h2><span>从一个想法到一份作品</span></div><div class="cards">${sections.slice(1, 7).map((s, i) => `<a class="card" href="#${s.id}"><span class="card-icon" aria-hidden="true">${s.icon}</span><h2>${s.name}</h2><p>${s.description}</p><div class="card-bottom"><span>0${i + 1} / ${s.hint}</span><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section>
      <aside class="bottom-note"><span aria-hidden="true">◇</span><div><h2>你的内容，留在你的设备</h2><p>工作台独立运行，设置保存在当前浏览器。当前为基础框架，内容生成与数据管理功能将逐步加入。</p></div></aside>`;
  }
  function profile() {
    return heading('个人中心', '先定义你是谁，再打造属于你的内容风格。') + `<section class="panel"><h2>创作者档案</h2><p class="subtext" style="margin:6px 0 24px">档案自动保存在本机，后续用于个性化创作。</p><form id="profile-form"><div class="field"><label for="creator-name">IP 名称</label><input id="creator-name" name="name" maxlength="60" placeholder="例如：小林的成长手记" autocomplete="nickname"></div><div class="field"><label for="creator-niche">内容领域 / 目标人群</label><input id="creator-niche" name="niche" maxlength="200" placeholder="例如：面向初入职场年轻人的成长分享"></div><div class="field"><label for="creator-style">表达风格</label><textarea id="creator-style" name="style" maxlength="1000" placeholder="例如：真诚直接，多用生活案例，少用专业术语"></textarea></div><div class="form-actions"><button class="primary" type="submit">保存档案</button><span class="subtext">输入后自动保存</span></div></form></section>`;
  }
  function render() {
    const id = location.hash.slice(1) || 'overview';
    const section = sections.find(s => s.id === id) || sections[0];
    document.getElementById('breadcrumb').textContent = section.name;
    document.title = `${section.name} · 创作舱`;
    for (const link of nav.children) {
      if (link.dataset.page === section.id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    document.getElementById('main').innerHTML = section.id === 'overview' ? overview() : section.id === 'profile' ? profile() : heading(section.name, section.description) + `<section class="panel empty-state"><div class="card-icon" aria-hidden="true">${section.icon}</div><h2>${section.hint}</h2><p>${section.description}</p><span class="pill">基础框架已就绪</span><p>本步骤提供页面与导航，${section.name}的内容操作将在后续开发中开放。</p><a class="secondary" style="display:inline-block;margin-top:24px" href="#overview">返回工作台</a></section>`;
    if (section.id === 'profile') {
      const form = document.getElementById('profile-form');
      for (const key of Object.keys(state.profile)) form.elements.namedItem(key).value = state.profile[key];
      form.addEventListener('input', event => {
        if (Object.hasOwn(state.profile, event.target.name)) {
          state.profile[event.target.name] = event.target.value;
          if (save()) notify('档案已自动保存');
        }
      });
      form.addEventListener('submit', event => { event.preventDefault(); if (save()) notify('档案保存成功'); });
    }
  }
  window.addEventListener('hashchange', render);
  applyTheme();
  render();
  if (!storageAvailable) notify('本地数据无法读取，请检查浏览器存储设置。');
})();
