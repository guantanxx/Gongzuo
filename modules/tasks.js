'use strict';
window.WorkspaceModules.tasks = (()=>{
  const categories=['拍摄','脚本截止','客户对接'];
  let widgetOpen=false;
  const pending=c=>c.state.tasks.filter(t=>!t.done).sort((a,b)=>(a.due || '9999').localeCompare(b.due || '9999'));
  const dueLabel=(t,c)=>`${t.due || '未设截止日'}${t.due && t.due<c.today() && !t.done?' · 已逾期':''}`;
  function toggle(c,id){c.persist(s=>{const t=s.tasks.find(t=>t.id===id);if(t)t.done=!t.done;},'待办状态已保存');}
  return {
    render(c){const d=c.draft('tasks'),items=c.state.tasks.filter(t=>d.filter==='done'?t.done:d.filter==='all'?true:!t.done);return `<div class="module-layout"><section class="panel"><h2>${d.editId?'编辑工作事项':'添加工作事项'}</h2><form id="task-form">${c.field('title','事项名称',d.title,{required:true,maxlength:160})}${c.select('category','事项类型',categories.map(x=>[x,x]),d.category)}${c.field('due','截止日期（可选）',d.due,{type:'date'})}${c.area('notes','准备内容 / 对接备注',d.notes)}<div class="actions"><button class="primary">保存事项</button><button class="secondary" type="button" id="new-task">清空 / 新建</button></div></form></section><section class="panel"><h2>工作日程 · ${pending(c).length} 项待推进</h2><div class="toolbar">${c.select('taskFilter','查看',[['pending','待完成'],['done','已完成'],['all','全部事项']],d.filter || 'pending')}</div>${items.length?items.map(t=>`<article class="record"><span class="tag">${c.esc(t.category)}</span><h3 class="${t.done?'task-done':''}" style="margin-top:10px">${c.esc(t.title)}</h3><p class="${t.due && t.due<c.today() && !t.done?'overdue':'subtext'}">${c.esc(dueLabel(t,c))}</p><p>${c.esc(t.notes)}</p><div class="actions"><button class="secondary" data-toggle-task="${c.esc(t.id)}">${t.done?'标记未完成':'标记完成'}</button><button class="secondary" data-edit-task="${c.esc(t.id)}">编辑</button><button class="secondary danger" data-delete-task="${c.esc(t.id)}">删除</button></div></article>`).join(''):c.empty('这个分类暂无事项。')}</section></div>`;},
    mount(c){
      const form=document.getElementById('task-form');c.bindDraft(form,'tasks');
      form.addEventListener('submit',e=>{e.preventDefault();const v=c.values(form),d=c.draft('tasks');if(!v.title.trim())return c.notify('请填写事项名称');c.persist(s=>{const now=new Date().toISOString(),index=s.tasks.findIndex(t=>t.id===d.editId),item={id:d.editId || c.uid(),title:v.title.trim(),category:v.category,due:v.due,notes:v.notes,done:false,createdAt:now,updatedAt:now};if(index<0)s.tasks.unshift(item);else s.tasks[index]={...item,done:s.tasks[index].done,createdAt:s.tasks[index].createdAt};s.drafts.tasks={filter:d.filter || 'pending'};},'工作事项已保存');});
      document.getElementById('new-task').addEventListener('click',()=>c.persist(s=>{s.drafts.tasks={};},'已新建事项'));
      document.getElementById('f-taskFilter').addEventListener('change',e=>c.persist(s=>{s.drafts.tasks={...s.drafts.tasks,filter:e.target.value};},'已切换事项分类'));
      document.querySelectorAll('[data-toggle-task]').forEach(b=>b.addEventListener('click',()=>toggle(c,b.dataset.toggleTask)));
      document.querySelectorAll('[data-edit-task]').forEach(b=>b.addEventListener('click',()=>{const t=c.state.tasks.find(t=>t.id===b.dataset.editTask);c.persist(s=>{s.drafts.tasks={...s.drafts.tasks,title:t.title,category:t.category,due:t.due,notes:t.notes,editId:t.id};},'已打开事项');}));
      document.querySelectorAll('[data-delete-task]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这条工作事项？'))c.persist(s=>{s.tasks=s.tasks.filter(t=>t.id!==b.dataset.deleteTask);if(s.drafts.tasks?.editId===b.dataset.deleteTask)s.drafts.tasks={};},'事项已删除');}));
    },
    mountWidget(c){
      const root=document.getElementById('task-widget'),d=c.draft('taskWidget'),items=pending(c);
      root.innerHTML=`<details ${widgetOpen?'open':''}><summary>工作提醒 <span class="muted">/ ${items.length} 项待推进</span></summary><div class="task-widget-body"><form id="widget-task-form"><div class="field"><label for="widget-title">快捷添加事项</label><input id="widget-title" name="title" value="${c.esc(d.title || '')}" placeholder="拍摄 / 脚本 / 客户对接" maxlength="160" required></div><div class="field"><label for="widget-category">类型</label><select id="widget-category" name="category">${categories.map(x=>`<option ${d.category===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="widget-due">截止日期</label><input id="widget-due" name="due" type="date" value="${c.esc(d.due || '')}"></div><button class="primary">添加提醒</button></form>${items.slice(0,3).map(t=>`<article class="record"><label><input type="checkbox" data-widget-complete="${c.esc(t.id)}"> ${c.esc(t.title)}</label><p class="subtext">${c.esc(dueLabel(t,c))}</p></article>`).join('')}<a class="secondary" style="margin-top:15px" href="#tasks">管理全部事项 ↗</a></div></details>`;
      root.querySelector('details').addEventListener('toggle',e=>{widgetOpen=e.target.open;});
      const form=root.querySelector('form');c.bindDraft(form,'taskWidget');
      form.addEventListener('submit',e=>{e.preventDefault();const v=c.values(form);if(!v.title.trim())return c.notify('请填写事项名称');c.persist(s=>{const now=new Date().toISOString();s.tasks.unshift({id:c.uid(),title:v.title.trim(),category:v.category,due:v.due,notes:'',done:false,createdAt:now,updatedAt:now});s.drafts.taskWidget={};},'提醒已添加');});
      root.querySelectorAll('[data-widget-complete]').forEach(input=>input.addEventListener('change',()=>toggle(c,input.dataset.widgetComplete)));
    }
  };
})();
