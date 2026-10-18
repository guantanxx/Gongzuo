'use strict';
window.WorkspaceModules.live = (()=>{
  function script(v,c) {
    const duration=Number(v.duration),bounds=[0,0.1,0.25,0.65,0.85,1].map(n=>Math.round(n*duration));
    const factory=v.kind!=='样品演示';
    const blocks=[
      ['开场与项目分流',v.opening?.trim() || `大家好，我是${c.state.profile.name || '本场照明讲解员'}。今天${factory?'带大家看工厂与产品验证流程':'做灯具样品现场演示'}，主题是“${v.title}”。总包、装修公司、经销商和甲方朋友，可先说应用场景。`],
      [factory?'探厂路线 / 工序说明':'测试条件 / 样品说明',factory?'按实际授权范围展示装配、检测和包装环节。只介绍现场可证实的流程，不承诺未经核实的产能或交期。':'先展示样品型号与已确认参数，交代投射距离、环境光、画面尺寸及相机曝光。不要把近景样片直接当作项目效果。'],
      ['核心演示与互动',`本场目标：${v.goal}。\n准备素材：${v.material || '请补充真实样品、测试记录、安装示意与参数表。'}\n围绕投影灯、水纹灯或项目灯具，展示效果与适用边界；穿插回答安装、控制、防护和维护问题。`],
      ['采购答疑与需求核对','按场景、安装距离、数量、交付时间记录需求。涉及定制、报价和验收条件，约定后续核实，不在缺少项目资料时直接保证效果。'],
      ['询盘承接与收尾','请有具体项目的朋友私信必要的现场条件，我们核对参数、样品验证和排期。回顾本场已确认的信息，记录待回复问题，感谢参与。']
    ];
    return blocks.map(([title,text],i)=>`${bounds[i]}–${bounds[i+1]} 分钟｜${title}\n${text}`).join('\n\n');
  }
  return {
    render(c) {
      const d=c.draft('livePlan'),selected=c.state.lives.find(l=>l.id===d.selectedId),review=selected ? {...selected.review,...(c.state.drafts.liveReviews?.[selected.id] || {})} : {};
      return `${c.tools.csvTools('lives',c)}<div class="module-layout"><section class="panel"><h2>新建直播策划</h2><form id="live-form">${c.select('kind','直播类型',[['探厂','探厂'],['样品演示','样品演示']],d.kind || '探厂')}${c.field('title','直播主题',d.title,{required:true,maxlength:160})}${c.field('date','计划日期',d.date || c.today(),{type:'date',required:true})}${c.field('duration','直播时长（分钟，10–240）',d.duration || 60,{type:'number',min:10,max:240,required:true})}${c.area('opening','开场文案（可从模板库载入）',d.opening)}${c.area('goal','本场目标 / 观众需求',d.goal,true)}${c.area('material','讲解素材 / 演示要点',d.material)}<button class="primary">生成直播策划和待办</button></form><h2 style="margin-top:28px">策划库 · ${c.state.lives.length}</h2>${c.state.lives.length ? c.state.lives.map(l=>`<article class="record"><h3>${c.esc(l.title)}</h3><p class="subtext">${c.esc(l.kind || '探厂')} · ${c.esc(l.date)} · ${l.duration} 分钟 · ${l.review ? '已复盘' : '待直播'}</p><div class="actions"><button class="secondary" data-open-live="${c.esc(l.id)}">脚本 / 待办 / 复盘</button><button class="secondary danger" data-delete-live="${c.esc(l.id)}">删除</button></div></article>`).join('') : c.empty('先创建一场直播，安排你的开播流程。')}</section><div class="module-stack">${selected ? `<section class="panel"><h2>${c.esc(selected.title)}</h2><div class="field"><label for="live-script">直播脚本（修改自动保存）</label><textarea id="live-script" class="script-editor" maxlength="30000">${c.esc(selected.script)}</textarea></div><button class="secondary" type="button" data-copy-target="live-script">复制直播脚本</button><h2 style="margin-top:24px">直播待办</h2><ul class="checklist">${selected.todos.map(t=>`<li><label><input type="checkbox" data-todo="${c.esc(t.id)}" ${t.done?'checked':''}><span>${c.esc(t.text)}</span></label></li>`).join('')}</ul><form id="todo-form"><div class="toolbar">${c.field('task','新增待办','',{required:true,maxlength:200})}<button class="secondary">添加</button></div></form></section><section class="panel"><h2>直播复盘</h2><form id="live-review-form"><div class="metrics-grid">${c.field('viewers','累计观看人数',review.viewers || 0,{type:'number',required:true})}${c.field('peak','最高在线人数',review.peak || 0,{type:'number',required:true})}${c.field('leads','有效询盘数',review.leads || 0,{type:'number',required:true})}</div>${c.area('wins','本场亮点',review.wins)}${c.area('problems','遇到的问题',review.problems)}${c.area('next','下一场改进动作',review.next,true)}<button class="primary">保存直播复盘</button></form></section>` : `<section class="panel">${c.empty('打开一场直播，编辑脚本、勾选待办并填写复盘。')}</section>`}</div></div>`;
    },
    mount(c) {
      const form=document.getElementById('live-form');c.bindDraft(form,'livePlan');
      form.addEventListener('submit',e=>{
        e.preventDefault();const v=c.values(form);if(!v.title.trim() || !v.goal.trim())return c.notify('请填写直播主题和目标');
        c.persist(s=>{const now=new Date().toISOString(),id=c.uid();s.lives.unshift({id,title:v.title.trim(),kind:v.kind,date:v.date,duration:Number(v.duration),goal:v.goal.trim(),material:v.material,script:script(v,c),todos:['确认探厂拍摄授权与可展示区域','核实样品参数、距离和环境光记录','准备安装示意、控制接口与维护说明','测试网络、收音和直播演示设备','整理待跟进项目需求并记录询盘'].map(text=>({id:c.uid(),text,done:false})),review:null,createdAt:now});s.drafts.livePlan={selectedId:id};},'直播脚本和待办已生成并保存');
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
