'use strict';
window.WorkspaceModules.live = (()=>{
  function script(v,c) {
    const duration=Number(v.duration),bounds=[0,0.1,0.25,0.65,0.85,1].map(n=>Math.round(n*duration));
    const blocks=[
      ['暖场与定位',`大家好，我是${c.state.profile.name || '本场主播'}。今天我们聊“${v.title}”。先在评论区说说，你最想解决什么问题？`],
      ['问题共鸣',`这场直播的目标是：${v.goal}。先请大家描述一个真实场景，我会围绕具体问题展开。`],
      ['核心内容',`围绕“${v.title}”讲清背景、方法与适用边界。\n准备素材：${v.material || '请在开播前补充真实案例、演示材料和可核查来源。'}\n每讲完一个要点，留出互动时间，用观众问题检查理解。`],
      ['答疑与演示','收集重复提问，优先回应共性问题。遇到暂时无法确认的信息，明确说明稍后核实，不做未经验证的承诺。'],
      ['总结与预告',`回顾“${v.title}”的三个关键点，请观众选一个行动。说明下一次内容安排，感谢参与并提醒理性判断。`]
    ];
    return blocks.map(([title,text],i)=>`${bounds[i]}–${bounds[i+1]} 分钟｜${title}\n${text}`).join('\n\n');
  }
  return {
    render(c) {
      const d=c.draft('livePlan'),selected=c.state.lives.find(l=>l.id===d.selectedId),review=selected ? {...selected.review,...(c.state.drafts.liveReviews?.[selected.id] || {})} : {};
      return `<div class="module-layout"><section class="panel"><h2>新建直播策划</h2><form id="live-form">${c.field('title','直播主题',d.title,{required:true,maxlength:160})}${c.field('date','计划日期',d.date || c.today(),{type:'date',required:true})}${c.field('duration','直播时长（分钟，10–240）',d.duration || 60,{type:'number',min:10,max:240,required:true})}${c.area('goal','本场目标 / 观众需求',d.goal,true)}${c.area('material','讲解素材 / 演示要点',d.material)}<button class="primary">生成直播策划和待办</button></form><h2 style="margin-top:28px">策划库 · ${c.state.lives.length}</h2>${c.state.lives.length ? c.state.lives.map(l=>`<article class="record"><h3>${c.esc(l.title)}</h3><p class="subtext">${c.esc(l.date)} · ${l.duration} 分钟 · ${l.review ? '已复盘' : '待直播'}</p><div class="actions"><button class="secondary" data-open-live="${c.esc(l.id)}">脚本 / 待办 / 复盘</button><button class="secondary danger" data-delete-live="${c.esc(l.id)}">删除</button></div></article>`).join('') : c.empty('先创建一场直播，安排你的开播流程。')}</section><div class="module-stack">${selected ? `<section class="panel"><h2>${c.esc(selected.title)}</h2><div class="field"><label for="live-script">直播脚本（修改自动保存）</label><textarea id="live-script" class="script-editor" maxlength="30000">${c.esc(selected.script)}</textarea></div><h2>直播待办</h2><ul class="checklist">${selected.todos.map(t=>`<li><label><input type="checkbox" data-todo="${c.esc(t.id)}" ${t.done?'checked':''}><span>${c.esc(t.text)}</span></label></li>`).join('')}</ul><form id="todo-form"><div class="toolbar">${c.field('task','新增待办','',{required:true,maxlength:200})}<button class="secondary">添加</button></div></form></section><section class="panel"><h2>直播复盘</h2><form id="live-review-form"><div class="metrics-grid">${c.field('viewers','累计观看人数',review.viewers || 0,{type:'number',required:true})}${c.field('peak','最高在线人数',review.peak || 0,{type:'number',required:true})}${c.field('leads','有效询盘数',review.leads || 0,{type:'number',required:true})}</div>${c.area('wins','本场亮点',review.wins)}${c.area('problems','遇到的问题',review.problems)}${c.area('next','下一场改进动作',review.next,true)}<button class="primary">保存直播复盘</button></form></section>` : `<section class="panel">${c.empty('打开一场直播，编辑脚本、勾选待办并填写复盘。')}</section>`}</div></div>`;
    },
    mount(c) {
      const form=document.getElementById('live-form');c.bindDraft(form,'livePlan');
      form.addEventListener('submit',e=>{
        e.preventDefault();const v=c.values(form);if(!v.title.trim() || !v.goal.trim())return c.notify('请填写直播主题和目标');
        c.persist(s=>{const now=new Date().toISOString(),id=c.uid();s.lives.unshift({id,title:v.title.trim(),date:v.date,duration:Number(v.duration),goal:v.goal.trim(),material:v.material,script:script(v,c),todos:['检查网络、收音和灯光','准备封面、标题及直播素材','熟悉讲解顺序与互动问题','开播前检查设备与演示内容','直播后记录数据并完成复盘'].map(text=>({id:c.uid(),text,done:false})),review:null,createdAt:now});s.drafts.livePlan={selectedId:id};},'直播脚本和待办已生成并保存');
      });
      document.querySelectorAll('[data-open-live]').forEach(b=>b.addEventListener('click',()=>c.persist(s=>{s.drafts.livePlan={...s.drafts.livePlan,selectedId:b.dataset.openLive};},'已打开直播策划')));
      document.querySelectorAll('[data-delete-live]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这场直播及脚本、待办和复盘？'))c.persist(s=>{s.lives=s.lives.filter(l=>l.id!==b.dataset.deleteLive);if(s.drafts.livePlan?.selectedId===b.dataset.deleteLive)delete s.drafts.livePlan.selectedId;if(s.drafts.liveReviews)delete s.drafts.liveReviews[b.dataset.deleteLive];},'直播已删除');}));
      const live=c.state.lives.find(l=>l.id===c.draft('livePlan').selectedId);if(!live)return;
      document.getElementById('live-script').addEventListener('input',e=>c.persist(s=>{s.lives.find(l=>l.id===live.id).script=e.target.value;},'',false));
      document.querySelectorAll('[data-todo]').forEach(input=>input.addEventListener('change',()=>c.persist(s=>{s.lives.find(l=>l.id===live.id).todos.find(t=>t.id===input.dataset.todo).done=input.checked;},'待办状态已保存',false)));
      document.getElementById('todo-form').addEventListener('submit',e=>{e.preventDefault();const text=c.values(e.target).task.trim();if(!text)return c.notify('请输入待办内容');c.persist(s=>{s.lives.find(l=>l.id===live.id).todos.push({id:c.uid(),text,done:false});},'待办已添加');});
      const reviewForm=document.getElementById('live-review-form');
      reviewForm.addEventListener('input',()=>c.persist(s=>{s.drafts.liveReviews={...s.drafts.liveReviews,[live.id]:c.values(reviewForm)};},'',false));
      reviewForm.addEventListener('submit',e=>{
        e.preventDefault();const v=c.values(reviewForm);if(!v.next.trim())return c.notify('请填写下一场的改进动作');
        if(Number(v.peak)>Number(v.viewers))return c.notify('最高在线人数不能超过累计观看人数');
        c.persist(s=>{s.lives.find(l=>l.id===live.id).review={...v,viewers:Number(v.viewers),peak:Number(v.peak),leads:Number(v.leads),updatedAt:new Date().toISOString()};if(s.drafts.liveReviews)delete s.drafts.liveReviews[live.id];},'直播复盘已保存');
      });
    }
  };
})();
