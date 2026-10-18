'use strict';
window.WorkspaceModules.scripts = (()=>{
  const count = text => [...text.replace(/\s/g,'')].length;
  function generate(v,c) {
    const target=Math.round(Number(v.duration)*3.5),title=v.title.trim().slice(0,120);
    const points=v.notes.split(/[。！？!?\n]+/).map(t=>t.trim()).filter(Boolean).map(t=>t.slice(0,180));
    const latest=c.state.scripts.flatMap(s=>s.versions.slice(-1)).slice(0,5).map(s=>s.text).join('');
    const sentences=latest.split(/[。！？]/).filter(Boolean);
    const brief=/简洁|直接|短句/.test(c.state.profile.style) || (sentences.length>0 && count(latest)/sentences.length<30);
    const warm=/温柔|亲切|陪伴/.test(c.state.profile.style);
    const shortTitle=[...title].slice(0,Math.min(40,Math.max(6,Math.floor(target*0.25)))).join('');
    const opening=v.hook?.trim() && count(v.hook)<=target*0.4 ? v.hook.trim() : `关于${shortTitle}，先想清一个问题。`;
    const intro=warm ? '先别着急，我们把这件事一步一步说清楚。' : brief ? '先说重点，从最小的一步开始。' : '与其一开始追求完整答案，不如先把眼前的问题讲清楚。';
    const subject=points.length?points:['先确定你具体想解决的问题','选择一个能在今天完成的小动作','做完后记录反馈，再调整下一步'];
    const templates=[
      p=>`先看这一点：${p}。把它放进你自己的场景里，想一想，最困扰你的到底是哪一个环节？`,
      p=>`围绕“${p}”，不要急着照搬别人的答案。先列出你已有的条件，再确定下一步能做什么。`,
      p=>`具体怎么落地？从“${p}”里挑一个最容易执行的动作，给它留出明确的时间，完成后马上记下来。`,
      p=>`如果卡住了，就把“${p}”拆得更小。今天只验证一个问题，不用同时改变所有事情。`,
      p=>`判断“${p}”有没有用，不能只凭当时的感觉。试着保留过程和结果，过一段时间再做对照。`,
      p=>`这里容易忽略的，是自己的实际限制。“${p}”需要哪些时间或资源？先把这些条件讲明白。`,
      p=>`也要给“${p}”设置边界。适合当前阶段的方法，换一个场景未必适用，别把单次体验当成普遍规律。`,
      p=>`关于“${p}”，你可以找一个熟悉的人交流。先听对方遇到了什么，再回头检查自己的理解。`,
      p=>`再换一个角度看“${p}”：如果只能保留一个动作，你会留下什么？这个问题能帮你确定优先顺序。`,
      p=>`把“${p}”写成一句清楚的行动说明。谁来做、什么时候做、做到什么程度，都尽量具体。`,
      p=>`执行“${p}”的时候，记下最费力的地方。这些卡点比一句笼统的评价更能帮助你改进。`,
      p=>`如果“${p}”没有达到预期，先检查执行条件，再检查方法。不要因为一次结果就急着否定整个方向。`,
      p=>`要让“${p}”变得可持续，可以固定一个简单的触发点。把它接在已有习惯之后，减少每次重新决定的成本。`,
      p=>`对于“${p}”，也别忽略你已经做对的部分。保留有效的动作，再单独调整那个最不顺的环节。`,
      p=>`最后再检查“${p}”：这个建议是否适合你现在的情况？遇到专业问题时，记得向相关专业人士核实。`
    ];
    const ending=target<120 ? '先做一个小动作，做完再复盘。' : `回到${shortTitle}，先选一个你能完成的小动作。做完再复盘，比停留在想法里更有价值。你准备先试哪一步？`;
    let text=opening;
    if(count(text+intro+ending)<target*0.8)text+='\n\n'+intro;
    let index=0;
    while(count(text+ending)<target*0.9 && index<60) {
      const block=templates[Math.floor(index/subject.length)%templates.length](subject[index%subject.length]);
      const chunks=block.match(/[^。！？]+[。！？]?/g)||[block];
      for(const chunk of chunks) {
        if(count(text+ending)>=target*0.9)break;
        if(count(text+chunk+ending)<=target*1.1)text+='\n'+chunk;
      }
      index++;
    }
    for(const extra of ['先把目标写清楚。','别急着做大，先验证一小步。','观察反馈，再做调整。']){
      if(count(text+ending)>=target*0.9)break;
      if(count(text+extra+ending)<=target*1.1)text+='\n'+extra;
    }
    return {text:text+'\n\n'+ending,target,brief};
  }
  function docName(d) {return `${d.title}（${d.versions.length} 个版本）`;}
  return {
    render(c) {
      const d=c.draft('scripts'),doc=c.state.scripts.find(s=>s.id===d.docId);
      return `<p class="rule-note">按约 3.5 字 / 秒估算篇幅，实际时长需朗读确认。生成采用本地模板，参考 IP 风格与最近保存稿件的句长偏好；请补充真实案例和专业事实。</p><div class="module-layout"><section class="panel"><h2>口播创作</h2><form id="script-form">${c.select('topicId','选用已有选题（也可直接输入）',[['','自定义选题'],...c.state.topics.map(t=>[t.id,t.title])],d.topicId)}${c.field('title','选题标题',d.title,{required:true,maxlength:200})}${c.field('duration','视频时长（秒，10–600）',d.duration || 60,{type:'number',min:10,max:600,required:true})}${c.area('notes','核心观点 / 案例素材',d.notes)}${c.field('hook','开头钩子（可选）',d.hook)}<div class="actions"><button class="primary">生成口播稿</button><button class="secondary" type="button" id="new-script">新建文案</button></div></form></section><section class="panel"><h2>${doc ? '编辑文案 · '+c.esc(doc.title) : '文案草稿'}</h2><div class="toolbar">${c.select('version','历史版本',[['','选择历史版本'],...(doc?.versions || []).map((v,i)=>[v.id,`V${i+1} · ${c.date(v.createdAt)}`])],d.versionId)}</div><div class="field"><label for="script-text">口播正文（编辑后自动保存草稿）</label><textarea class="script-editor" id="script-text" maxlength="30000">${c.esc(d.text || '')}</textarea></div><p class="subtext" id="script-count"></p><div class="actions"><button class="primary" id="save-version" ${d.text?.trim() ? '' : 'disabled'}>保存为新版本</button></div></section><section class="panel full-width"><h2>文案库 · ${c.state.scripts.length}</h2>${c.state.scripts.length ? c.state.scripts.map(s=>`<article class="record"><h3>${c.esc(docName(s))}</h3><p class="subtext">${c.esc(s.duration)} 秒 · 最近更新 ${c.date(s.updatedAt)}</p><div class="actions"><button class="secondary" data-open-script="${c.esc(s.id)}">打开 / 切换版本</button><button class="secondary danger" data-delete-script="${c.esc(s.id)}">删除文案</button></div></article>`).join('') : c.empty('生成或编辑正文后，保存你的第一个版本。')}</section></div>`;
    },
    mount(c) {
      const form=document.getElementById('script-form'),editor=document.getElementById('script-text');c.bindDraft(form,'scripts');
      const updateCount=()=>{const n=count(editor.value);document.getElementById('script-count').textContent=`${n} 字（不含空白） · 预计 ${Math.round(n/3.5)} 秒 · 目标 ${c.draft('scripts').duration || 60} 秒`;document.getElementById('save-version').disabled=!editor.value.trim();};
      updateCount();
      editor.addEventListener('input',()=>{c.persist(s=>{s.drafts.scripts={...s.drafts.scripts,text:editor.value};},'',false);updateCount();});
      form.elements.duration.addEventListener('input',updateCount);
      form.elements.topicId.addEventListener('change',()=>{
        const t=c.state.topics.find(t=>t.id===form.elements.topicId.value);if(!t)return;
        if(c.draft('scripts').text && !confirm('更换选题会新建工作草稿，已有历史版本保留。继续？')){c.render();return;}
        c.persist(s=>{s.drafts.scripts={topicId:t.id,title:t.title,notes:t.source || '',hook:t.hook,duration:form.elements.duration.value};},'已载入选题');
      });
      form.addEventListener('submit',e=>{
        e.preventDefault();const v=c.values(form);if(!v.title.trim())return c.notify('请填写选题标题');
        if(c.draft('scripts').text && !confirm('重新生成会替换当前编辑草稿，已保存版本保留。继续？'))return;
        const result=generate(v,c),old=c.draft('scripts'),doc=c.state.scripts.find(s=>s.id===old.docId);
        c.persist(s=>{s.drafts.scripts={...v,text:result.text,docId:doc?.title===v.title.trim()?doc.id:'',target:result.target};},'口播稿已生成，请核对内容并保存版本');
      });
      document.getElementById('new-script').addEventListener('click',()=>{if(!c.draft('scripts').text || confirm('清空当前草稿？已保存的版本不受影响。'))c.persist(s=>{s.drafts.scripts={duration:'60'};},'已新建文案');});
      document.getElementById('save-version').addEventListener('click',()=>{
        const v={...c.draft('scripts'),...c.values(form)},text=editor.value.trim();if(!text || !v.title.trim())return c.notify('请填写标题和正文');
        if(!form.reportValidity())return;
        const doc=c.state.scripts.find(s=>s.id===v.docId),last=doc?.versions.at(-1);
        if(last?.text===text && doc.title===v.title.trim() && doc.duration===Number(v.duration))return c.notify('内容未变化，无需重复保存');
        c.persist(s=>{
          const now=new Date().toISOString(),version={id:c.uid(),text,createdAt:now,duration:Number(v.duration),title:v.title.trim()};
          let item=s.scripts.find(x=>x.id===v.docId);
          if(!item){item={id:c.uid(),title:v.title.trim(),topicId:v.topicId || '',notes:v.notes || '',hook:v.hook || '',duration:Number(v.duration),versions:[],createdAt:now,updatedAt:now};s.scripts.unshift(item);}
          item.title=v.title.trim();item.duration=Number(v.duration);item.notes=v.notes || '';item.hook=v.hook || '';item.updatedAt=now;item.versions.push(version);
          s.drafts.scripts={...v,text,docId:item.id,versionId:version.id};
          const topic=s.topics.find(t=>t.id===item.topicId);if(topic?.status==='待写')topic.status='制作';
        },'新版本已保存，历史版本保留');
      });
      document.getElementById('f-version').addEventListener('change',e=>{
        const doc=c.state.scripts.find(s=>s.id===c.draft('scripts').docId),version=doc?.versions.find(v=>v.id===e.target.value);if(!version)return;
        if(!confirm('载入历史版本将替换当前编辑草稿。继续？')){c.render();return;}
        c.persist(s=>{s.drafts.scripts={...s.drafts.scripts,text:version.text,versionId:version.id,title:version.title || doc.title,duration:String(version.duration || doc.duration)};},'已载入历史版本，可继续编辑');
      });
      document.querySelectorAll('[data-open-script]').forEach(b=>b.addEventListener('click',()=>{
        if(c.draft('scripts').text && !confirm('打开文案会替换当前草稿，已保存版本保留。继续？'))return;
        const doc=c.state.scripts.find(s=>s.id===b.dataset.openScript),v=doc.versions.at(-1);
        c.persist(s=>{s.drafts.scripts={docId:doc.id,title:doc.title,topicId:doc.topicId,duration:String(doc.duration),notes:doc.notes,hook:doc.hook,text:v.text,versionId:v.id};},'文案已打开');
      }));
      document.querySelectorAll('[data-delete-script]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除文案及其全部历史版本？不可撤销。'))c.persist(s=>{s.scripts=s.scripts.filter(d=>d.id!==b.dataset.deleteScript);if(s.drafts.scripts?.docId===b.dataset.deleteScript)s.drafts.scripts={};},'文案已删除');}));
    }
  };
})();
