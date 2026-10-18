'use strict';
window.WorkspaceModules.topics = (()=>{
  function generate(idea,c) {
    const title=idea.title.slice(0,50),detail=idea.content.split(/[。！？\n]/)[0].slice(0,100),audience=c.state.profile.niche || '刚开始尝试的朋友';
    return [
      {title:`${title}：新手先做对这 3 件事`,cover:'先把这三件事做对',hook:`还在为${title}发愁？先别急，看看你是不是漏了第一步。`,angle:'步骤教学'},
      {title:`关于${title}，我想提醒你的一个误区`,cover:'这个误区先避开',hook:`你以为${title}越用力越好？先看看这个容易忽略的细节。`,angle:'误区反差'},
      {title:`${title}：从一个真实场景说起`,cover:'一个场景，说清问题',hook:`${detail}。遇到这种情况，你会怎么做？`,angle:'场景故事'},
      {title:`${title}怎么开始？给${audience.slice(0,25)}的行动清单`,cover:'收藏这份行动清单',hook:`如果你今天就想开始${title}，先用五秒钟记住这个小动作。`,angle:'行动清单'},
      {title:`${title}，哪种方式更适合你？`,cover:'选对方法，少走弯路',hook:`同样是${title}，为什么有人越做越顺？先对照一下自己的情况。`,angle:'对比选择'}
    ].map(item=>({...item,id:c.uid(),ideaId:idea.id,source:idea.content,status:'待写',createdAt:new Date().toISOString()}));
  }
  return {
    render(c){const d=c.draft('topics');return `<p class="rule-note">根据灵感与 IP 定位，使用五种本地模板衍生候选选题。请用真实经历完善观点与细节。</p><section class="panel"><h2>从灵感生成选题</h2><form id="topic-form"><div class="toolbar">${c.select('ideaId','选择灵感',[['','请选择一条灵感'],...c.state.ideas.map(i=>[i.id,i.title])],d.ideaId)}<button class="primary" ${c.state.ideas.length ? '' : 'disabled'}>生成 5 套选题</button><a class="secondary" href="#ideas">新增灵感</a></div></form></section><section class="panel" style="margin-top:22px"><div class="section-title"><h2>选题库 · ${c.state.topics.length}</h2><span>一键选用，进入口播写作</span></div><div class="toolbar">${c.select('statusFilter','按状态筛选',[['','全部状态'],['待写','待写'],['制作','制作'],['已发布','已发布']],d.statusFilter)}</div><div id="topic-list"></div></section>`;},
    mount(c){
      const form=document.getElementById('topic-form');c.bindDraft(form,'topics');
      const create=()=>{
        const idea=c.state.ideas.find(i=>i.id===form.elements.ideaId.value);if(!idea)return c.notify('请先选择有效灵感');
        c.persist(s=>{s.topics.unshift(...generate(idea,c));s.drafts.topics={...s.drafts.topics,ideaId:idea.id,autoGenerate:false,statusFilter:''};},'已生成 5 套选题');
      };
      form.addEventListener('submit',e=>{e.preventDefault();create();});
      const filter=document.getElementById('f-statusFilter');
      const draw=()=>{
        const items=c.state.topics.filter(t=>!filter.value || t.status===filter.value);
        document.getElementById('topic-list').innerHTML=items.length ? items.map(t=>`<article class="record"><h3>${c.esc(t.title)}</h3><p><span class="muted">封面标题：</span>${c.esc(t.cover)}</p><p style="margin-top:8px"><span class="muted">5 秒开头：</span>${c.esc(t.hook)}</p><span class="tag">${c.esc(t.angle)}</span><div class="actions"><button class="primary" data-use-topic="${c.esc(t.id)}">选用 / 写文案</button><label class="inline-status">状态<select aria-label="${c.esc(t.title)}的状态" data-topic-status="${c.esc(t.id)}">${['待写','制作','已发布'].map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select></label><button class="secondary danger" data-delete-topic="${c.esc(t.id)}">删除</button></div></article>`).join('') : c.empty('没有该状态的选题。选择灵感，生成你的第一批候选。');
        document.querySelectorAll('[data-topic-status]').forEach(el=>el.addEventListener('change',()=>c.persist(s=>{s.topics.find(t=>t.id===el.dataset.topicStatus).status=el.value;},'选题状态已更新')));
        document.querySelectorAll('[data-use-topic]').forEach(b=>b.addEventListener('click',()=>{
          const topic=c.state.topics.find(t=>t.id===b.dataset.useTopic);
          if(c.draft('scripts').text && !confirm('选用此选题会替换当前文案草稿，已保存版本保留。继续？'))return;
          if(c.persist(s=>{s.drafts.scripts={topicId:topic.id,title:topic.title,duration:'60',notes:topic.source || '',hook:topic.hook};},'',false)){c.go('scripts');c.notify('选题已带入口播文案');}
        }));
        document.querySelectorAll('[data-delete-topic]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这条选题？已有文案仍会保留。'))c.persist(s=>{s.topics=s.topics.filter(t=>t.id!==b.dataset.deleteTopic);},'选题已删除');}));
      };
      filter.addEventListener('change',()=>{c.persist(s=>{s.drafts.topics={...s.drafts.topics,statusFilter:filter.value};},'',false);draw();});
      draw();
      if(c.draft('topics').autoGenerate) {
        if(c.state.ideas.some(i=>i.id===c.draft('topics').ideaId)) create();
        else c.persist(s=>{s.drafts.topics.autoGenerate=false;},'来源灵感已删除，请重新选择');
      }
    }
  };
})();
