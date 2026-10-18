'use strict';
(()=>{
  let open=false,pendingFocus=null;
  function entries(c){
    return [
      ...c.state.ideas.map(r=>({type:'ideas',id:r.id,label:'灵感',title:r.title,text:r.content+' '+r.tags.join(' ')})),
      ...c.state.topics.map(r=>({type:'topics',id:r.id,label:'选题',title:r.title,text:r.cover+' '+r.hook+' '+r.status})),
      ...c.state.scripts.map(r=>({type:'scripts',id:r.id,label:'文案',title:r.title,text:r.versions.map(v=>v.text).join(' ')})),
      ...c.state.lives.map(r=>({type:'live',id:r.id,label:'直播',title:r.title,text:[r.goal,r.material,r.script,r.review?.wins,r.review?.problems,r.review?.next].filter(Boolean).join(' ')})),
      ...c.state.reports.map(r=>({type:'analysis',id:r.id,label:'拆解',title:r.text.slice(0,45),text:r.text+' '+Object.values(r.report).join(' ')})),
      ...[...c.state.templates,...window.WorkspaceModules.templates.builtins].map(r=>({type:'templates',id:r.id,label:'模板',title:r.title,text:r.body+' '+r.category})),
      ...c.state.tasks.map(r=>({type:'tasks',id:r.id,label:'待办',title:r.title,text:r.notes+' '+r.category})),
      ...c.state.metrics.map(r=>({type:'analytics',id:r.id,label:'视频复盘',title:r.title,text:r.notes}))
    ];
  }
  function hide(){open=false;document.getElementById('search-results').hidden=true;document.getElementById('global-query').setAttribute('aria-expanded','false');}
  function choose(type,id,c){
    let change;
    if(type==='ideas'){
      const r=c.state.ideas.find(x=>x.id===id);if(!r)return;
      if(c.draft('ideas').content && c.draft('ideas').editId!==id && !confirm('打开灵感将替换当前灵感编辑草稿，已保存数据保留。继续？'))return;
      change=s=>{s.drafts.ideas={editId:id,title:r.title,content:r.content,tags:r.tags.join(', ')};};
    }else if(type==='topics')change=s=>{s.drafts.topics={...s.drafts.topics,statusFilter:''};};
    else if(type==='scripts'){
      const r=c.state.scripts.find(x=>x.id===id),v=r?.versions.at(-1);if(!v)return;
      if(c.draft('scripts').text && c.draft('scripts').text!==v.text && !confirm('打开文案将替换当前草稿，已保存版本保留。继续？'))return;
      change=s=>{s.drafts.scripts={docId:id,title:r.title,topicId:r.topicId,duration:String(r.duration),notes:r.notes,hook:r.hook,text:v.text,versionId:v.id};};
    }else if(type==='live')change=s=>{s.drafts.livePlan={...s.drafts.livePlan,selectedId:id};};
    else if(type==='analysis'){
      const r=c.state.reports.find(x=>x.id===id);if(!r)return;
      if(c.draft('analysis').text && c.draft('analysis').text!==r.text && !confirm('打开报告将替换当前拆解草稿。继续？'))return;
      change=s=>{s.drafts.analysis={url:r.url,text:r.text,result:r.report};};
    }else if(type==='templates')change=s=>{s.drafts.templates={templateSearch:'',templateCategory:''};};
    else if(type==='tasks'){
      const r=c.state.tasks.find(x=>x.id===id);if(!r)return;
      change=s=>{s.drafts.tasks={title:r.title,category:r.category,due:r.due,notes:r.notes,editId:id,filter:'all'};};
    }else if(type==='analytics'){
      const r=c.state.metrics.find(x=>x.id===id);if(!r)return;
      change=s=>{s.drafts.metrics={...r,editId:id};s.drafts.metricFilter={};};
    }
    if(!change)return;
    hide();pendingFocus={type,id};
    if(c.persist(change,'',false)){c.go(type);c.notify('已打开搜索结果');}else pendingFocus=null;
  }
  Object.assign(window.WorkspaceTools,{
    refreshSearch(c){
      const input=document.getElementById('global-query'),panel=document.getElementById('search-results'),query=input.value.trim().toLowerCase();
      if(!open || !query){panel.hidden=true;input.setAttribute('aria-expanded','false');return;}
      const words=query.split(/\s+/),items=entries(c).filter(r=>words.every(q=>`${r.title} ${r.text}`.toLowerCase().includes(q)));
      panel.innerHTML=`<p class="subtext" role="status">找到 ${items.length} 项${items.length>50?'，显示前 50 项，请细化关键词':''}</p>${items.slice(0,50).map(r=>{const index=Math.max(0,r.text.toLowerCase().indexOf(words[0])-20),snippet=r.text.slice(index,index+90);return `<button class="search-result" type="button" data-search-type="${r.type}" data-search-id="${c.esc(r.id)}"><small>${r.label}</small><strong>${c.esc(r.title)}</strong><span>${c.esc(snippet)}</span></button>`;}).join('')}${items.length?'':c.empty('没有匹配内容，换一个关键词试试。')}`;
      panel.hidden=false;input.setAttribute('aria-expanded','true');
      panel.querySelectorAll('[data-search-id]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.searchType,b.dataset.searchId,c)));
    },
    initSearch(c){
      const input=document.getElementById('global-query'),panel=document.getElementById('search-results');input.value=c.draft('search').query || '';
      input.addEventListener('input',()=>{open=true;if(!c.persist(s=>{s.drafts.search={query:input.value};},'',false))this.refreshSearch(c);});
      input.addEventListener('focus',()=>{open=true;this.refreshSearch(c);});
      input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();panel.querySelector('button')?.focus();}if(e.key==='Escape')hide();});
      panel.addEventListener('keydown',e=>{
        if(e.key==='Escape'){hide();input.focus();hide();return;}
        if(!['ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();const buttons=[...panel.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
      });
      document.addEventListener('pointerdown',e=>{if(!e.target.closest('.global-search'))hide();});
    },
    mountGlobal(c){
      if(!pendingFocus || location.hash!==`#${pendingFocus.type}`)return;
      const {type,id}=pendingFocus;pendingFocus=null;
      const selectors={ideas:['[data-edit-idea]','editIdea'],topics:['[data-topic-status]','topicStatus'],live:['[data-open-live]','openLive'],templates:['[data-template-id]','templateId'],tasks:['[data-edit-task]','editTask'],analytics:['[data-edit-metric]','editMetric']};
      let target=type==='analysis'?document.getElementById('analysis-result'):type==='scripts'?document.getElementById('script-text'):null;
      if(selectors[type]){const [selector,key]=selectors[type];const button=[...document.querySelectorAll(selector)].find(b=>b.dataset[key]===id);target=button?.closest('.record,.panel') || button;}
      requestAnimationFrame(()=>{if(target?.isConnected){target.classList.add('highlight-record');target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
    }
  });
})();
