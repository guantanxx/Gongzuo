'use strict';
window.WorkspaceModules.ideas = {
  render(c) {
    const d=c.draft('ideas');
    return `${c.tools.csvTools('ideas',c)}<div class="module-layout"><section class="panel"><h2>${d.editId ? '编辑灵感' : '记录新灵感'}</h2><form id="idea-form">${c.field('title','灵感标题',d.title,{required:true,maxlength:120})}${c.area('content','灵感内容 / 真实场景',d.content,true)}${c.field('tags','标签（逗号分隔）',d.tags,{placeholder:'投影灯,工程案例'})}<div class="tag-picker" aria-label="常用行业标签">${['投影灯','水纹灯','激光灯','文旅亮化','工程案例','工厂实拍'].map(t=>`<button class="secondary" type="button" data-idea-tag="${t}">${t}</button>`).join('')}</div><div class="actions"><button class="primary">${d.editId ? '保存修改' : '加入灵感库'}</button><button class="secondary" type="button" id="new-idea">清空 / 新建</button></div></form></section><section class="panel"><h2>灵感库 · ${c.state.ideas.length}</h2><div class="toolbar">${c.field('search','检索标题 / 正文 / 标签',d.search)}${c.select('tagFilter','标签分类',[['','全部标签'],...[...new Set(['投影灯','水纹灯','激光灯','文旅亮化','工程案例','工厂实拍',...c.state.ideas.flatMap(i=>i.tags)])].sort().map(t=>[t,t])],d.tagFilter)}</div><div id="idea-list"></div></section></div>`;
  },
  mount(c) {
    const form=document.getElementById('idea-form');c.bindDraft(form,'ideas');
    document.querySelectorAll('[data-idea-tag]').forEach(button=>button.addEventListener('click',()=>{
      const input=form.elements.tags,tags=input.value.split(/[,，、|｜\n]/).map(t=>t.trim()).filter(Boolean),tag=button.dataset.ideaTag;
      input.value=(tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag]).join(', ');input.dispatchEvent(new Event('input',{bubbles:true}));c.notify('标签已更新');
    }));
    form.addEventListener('submit',e=>{
      e.preventDefault();const v=c.values(form);if(!v.title.trim() || !v.content.trim()) return c.notify('请填写标题和内容');
      const d=c.draft('ideas');
      c.persist(s=>{
        const item={id:d.editId || c.uid(),title:v.title.trim(),content:v.content.trim(),tags:[...new Set(v.tags.split(/[,，、|｜\n]/).map(t=>t.trim()).filter(Boolean))].slice(0,20),updatedAt:new Date().toISOString()};
        const i=s.ideas.findIndex(x=>x.id===item.id);
        if(i>=0)s.ideas[i]={...s.ideas[i],...item};else s.ideas.unshift({...item,createdAt:item.updatedAt});
        s.drafts.ideas={search:d.search || '',tagFilter:d.tagFilter || ''};
      },d.editId ? '灵感修改已保存' : '灵感已加入本地库');
    });
    document.getElementById('new-idea').addEventListener('click',()=>c.persist(s=>{s.drafts.ideas={};},'已切换为新灵感'));
    const search=document.getElementById('f-search'),filter=document.getElementById('f-tagFilter');
    const draw=()=>{
      const query=search.value.trim().toLowerCase(),tag=filter.value;
      const items=c.state.ideas.filter(i=>(!tag || i.tags.includes(tag)) && `${i.title} ${i.content} ${i.tags.join(' ')}`.toLowerCase().includes(query));
      document.getElementById('idea-list').innerHTML=items.length ? items.map(i=>`<article class="record"><h3>${c.esc(i.title)}</h3><p>${c.esc(i.content)}</p><div>${i.tags.map(t=>`<span class="tag">${c.esc(t)}</span>`).join('')}</div><p class="subtext">更新于 ${c.date(i.updatedAt)}</p><div class="actions"><button class="primary" data-derive="${c.esc(i.id)}">一键衍生选题</button><button class="secondary" data-edit-idea="${c.esc(i.id)}">编辑</button><button class="secondary danger" data-delete-idea="${c.esc(i.id)}">删除</button></div></article>`).join('') : c.empty('没有匹配灵感，试试新增一条或调整筛选。');
      document.querySelectorAll('[data-edit-idea]').forEach(b=>b.addEventListener('click',()=>{const i=c.state.ideas.find(x=>x.id===b.dataset.editIdea);c.persist(s=>{s.drafts.ideas={...s.drafts.ideas,editId:i.id,title:i.title,content:i.content,tags:i.tags.join(', ')};},'已打开灵感，可编辑后保存');document.getElementById('f-title').focus();}));
      document.querySelectorAll('[data-delete-idea]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这条灵感？已生成的选题会保留。'))c.persist(s=>{s.ideas=s.ideas.filter(i=>i.id!==b.dataset.deleteIdea);if(s.drafts.ideas?.editId===b.dataset.deleteIdea)s.drafts.ideas={};},'灵感已删除');}));
      document.querySelectorAll('[data-derive]').forEach(b=>b.addEventListener('click',()=>{
        if(c.persist(s=>{s.drafts.topics={...s.drafts.topics,ideaId:b.dataset.derive,autoGenerate:true};},'',false)) { c.go('topics');c.notify('已带入灵感，准备生成候选选题'); }
      }));
    };
    for(const el of [search,filter]) el.addEventListener('input',()=>{c.persist(s=>{s.drafts.ideas={...s.drafts.ideas,search:search.value,tagFilter:filter.value};},'',false);draw();});
    draw();
  }
};
