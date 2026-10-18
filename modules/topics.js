'use strict';
window.WorkspaceModules.topics = (()=>{
  function generate(idea,c) {
    const title=idea.title.slice(0,50),detail=idea.content.split(/[。！？\n]/)[0].slice(0,90),audience=c.state.profile.niche || '总包、装修公司与甲方';
    return [
      {title:`${title}：工程选型先核对这 3 个条件`,cover:'选型之前，先看现场',hook:`${title}，不是看一段样片就能定。安装距离、环境光和画面尺寸，你核对了吗？`,angle:'工程选型'},
      {title:`${title}：为什么样片和现场效果不一样？`,cover:'效果差异，问题在哪',hook:`同一款灯，样片好看，装到现场却不一样？先把测试条件放在一起比。`,angle:'现场验证'},
      {title:`${title}：从安装到交付，提前确认什么`,cover:'交付之前，少留盲点',hook:`${detail}。接工程项目，除了灯本身，这几个交付条件也要讲清楚。`,angle:'交付与安装'},
      {title:`给${audience.slice(0,25)}：${title}的需求核对清单`,cover:'把需求，说到同一张表上',hook:`要做${title}，先别急着问最低价。把场景、距离、数量和工期一起发来，方案才有依据。`,angle:'需求与询盘'},
      {title:`${title}：经销合作为什么建议先打样`,cover:'先验证，再谈批量',hook:`做渠道合作，先看样品验证和售后边界，再讨论批量配置，会不会更稳妥？`,angle:'经销合作'}
    ].map(item=>({...item,id:c.uid(),ideaId:idea.id,source:idea.content,status:'待撰写',createdAt:new Date().toISOString()}));
  }
  return {
    render(c){const d=c.draft('topics');return `${c.tools.csvTools('topics',c)}<p class="rule-note">根据灵感与 IP 定位，从工程选型、效果验证、交付、询盘与渠道合作五个角度生成。请补充真实参数与现场条件。</p><section class="panel"><h2>从灵感生成选题</h2><form id="topic-form"><div class="toolbar">${c.select('ideaId','选择灵感',[['','请选择一条灵感'],...c.state.ideas.map(i=>[i.id,i.title])],d.ideaId)}<button class="primary" ${c.state.ideas.length ? '' : 'disabled'}>生成 5 套选题</button><a class="secondary" href="#ideas">新增灵感</a></div></form></section><section class="panel" style="margin-top:22px"><div class="section-title"><h2>选题库 · ${c.state.topics.length}</h2><span>一键选用，进入口播写作</span></div><div class="toolbar">${c.select('statusFilter','按状态筛选',[['','全部状态'],['待撰写','待撰写'],['拍摄中','拍摄中'],['已发布','已发布']],d.statusFilter)}</div><div id="topic-list"></div></section>`;},
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
        document.getElementById('topic-list').innerHTML=items.length ? items.map(t=>`<article class="record"><h3>${c.esc(t.title)}</h3><p><span class="muted">封面标题：</span>${c.esc(t.cover)}</p><p style="margin-top:8px"><span class="muted">5 秒开头：</span>${c.esc(t.hook)}</p><span class="tag">${c.esc(t.angle)}</span><div class="actions"><button class="secondary" data-copy-text="${c.esc(t.title+'\n封面：'+t.cover+'\n开头：'+t.hook)}">复制选题文案</button></div><div class="actions"><button class="primary" data-use-topic="${c.esc(t.id)}">选用 / 写文案</button><label class="inline-status">状态<select aria-label="${c.esc(t.title)}的状态" data-topic-status="${c.esc(t.id)}">${['待撰写','拍摄中','已发布'].map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select></label><button class="secondary danger" data-delete-topic="${c.esc(t.id)}">删除</button></div></article>`).join('') : c.empty('没有该状态的选题。选择灵感，生成你的第一批候选。');
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
