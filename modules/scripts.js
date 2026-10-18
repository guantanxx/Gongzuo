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
    const opening=v.hook?.trim() && count(v.hook)<=target*0.4 ? v.hook.trim() : `选${shortTitle}，先核对现场。`;
    const intro=warm ? '不着急定配置，我们先一起把项目条件说清楚。' : brief ? '先看场景，再核参数，最后谈交付。' : `面向${c.state.profile.niche || '总包、装修公司与甲方'}，先把需求与现场条件放在同一张表上。`;
    const subject=points.length?points:['确认环境光、安装距离和预期画面尺寸','核对灯具防护、供电、控制和安装条件','用样品验证效果，再确认数量与交付排期'];
    const templates=[
      p=>`先看这一点：${p}。同样的灯具，安装距离和环境光不同，效果不能直接照搬。`,
      p=>`再核对“${p}”。演示时保持曝光和测试距离一致，把使用条件标在画面上，客户才有比较依据。`,
      p=>`落实“${p}”，需要把安装位置、供电和走线条件记录清楚，施工接口也提前对齐。`,
      p=>`关于“${p}”，建议先安排样品验证。效果是否满足项目要求，应以约定条件下的实测为准。`,
      p=>`采购时别只看单台价格。“${p}”还涉及配件、安装、控制和维护，报价范围要放在同一口径下比较。`,
      p=>`交付前再检查“${p}”。把数量、配置、交付时间和验收方法写清，减少现场临时变更。`,
      p=>`户外项目还要补充“${p}”的使用边界。防护等级、散热、固定方式与检修空间，需要结合实际环境核对。`,
      p=>`如果是水纹灯或投影灯，“${p}”不能只凭近景样片判断。先说明投射介质、距离和环境照度。`,
      p=>`文旅亮化项目里，“${p}”也要和整体灯光节奏配合，控制接口、场景切换与调试责任提前确认。`,
      p=>`激光类产品涉及专门的安全与使用条件。“${p}”应由具备相关能力的人员核实，避免对人眼或交通造成风险。`,
      p=>`对总包和装修公司来说，“${p}”最终要落到施工衔接。谁确认点位、谁安排调试、谁记录验收，都应明确。`,
      p=>`对于经销合作，“${p}”可以先从小批量样品沟通开始。产品资料、售后范围与备货计划，要用可核实的信息说明。`,
      p=>`甲方通常关心效果能否持续。“${p}”之外，也应明确易损件、维护方式及质保条款，不用未经验证的寿命做承诺。`,
      p=>`把“${p}”拍成一个清楚的镜头：先交代条件，再展示过程，最后给出适用范围。不要用滤镜替代真实演示。`,
      p=>`结论回到“${p}”。没有现场数据时，先说明需要确认什么，而不是直接保证亮度、交期或节省比例。`
    ];
    const ending=target<200 ? '项目条件私信沟通，先核对再选型。' : `有${shortTitle}相关项目，可以私信应用场景、安装距离、预计数量和交付时间。先核对参数与打样条件，再讨论适合的配置。${target>500 ? (c.state.profile.contact || '').slice(0,80) : ''}`;
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
    for(const extra of ['先确认现场条件。','参数以实测为准。','打样后再确认配置。']){
      if(count(text+ending)>=target*0.9)break;
      if(count(text+extra+ending)<=target*1.1)text+='\n'+extra;
    }
    return {text:text+'\n\n'+ending,target,brief};
  }
  function docName(d) {return `${d.title}（${d.versions.length} 个版本）`;}
  return {
    render(c) {
      const d=c.draft('scripts'),doc=c.state.scripts.find(s=>s.id===d.docId);
      return `<p class="rule-note">按约 3.5 字 / 秒估算篇幅，实际时长需朗读确认。生成采用本地模板，参考 IP 风格与最近保存稿件的句长偏好；请补充真实案例和专业事实。</p><div class="module-layout"><section class="panel"><h2>工程向口播</h2><form id="script-form">${c.select('topicId','选用已有选题（也可直接输入）',[['','自定义选题'],...c.state.topics.map(t=>[t.id,t.title])],d.topicId)}${c.field('title','选题标题',d.title,{required:true,maxlength:200})}${c.field('duration','视频时长（秒，10–600）',d.duration || 60,{type:'number',min:10,max:600,required:true})}${c.area('notes','工程条件 / 真实参数 / 案例素材',d.notes)}${c.field('hook','开头钩子（可选）',d.hook)}<div class="actions"><button class="primary">生成口播稿</button><button class="secondary" type="button" id="new-script">新建文案</button></div></form></section><section class="panel"><h2>${doc ? '编辑文案 · '+c.esc(doc.title) : '文案草稿'}</h2><div class="toolbar">${c.select('version','历史版本',[['','选择历史版本'],...(doc?.versions || []).map((v,i)=>[v.id,`V${i+1} · ${c.date(v.createdAt)}`])],d.versionId)}</div><div class="field"><label for="script-text">口播正文（编辑后自动保存草稿）</label><textarea class="script-editor" id="script-text" maxlength="30000">${c.esc(d.text || '')}</textarea></div><p class="subtext" id="script-count"></p><div class="actions"><button class="primary" id="save-version" ${d.text?.trim() ? '' : 'disabled'}>保存为新版本</button><button class="secondary" data-copy-target="script-text">复制当前文案</button></div></section><section class="panel full-width"><h2>文案库 · ${c.state.scripts.length}</h2>${c.state.scripts.length ? c.state.scripts.map(s=>`<article class="record"><h3>${c.esc(docName(s))}</h3><p class="subtext">${c.esc(s.duration)} 秒 · 最近更新 ${c.date(s.updatedAt)}</p><div class="actions"><button class="secondary" data-open-script="${c.esc(s.id)}">打开 / 切换版本</button><button class="secondary" data-copy-text="${c.esc(s.versions.at(-1).text)}">复制最新版本</button><button class="secondary danger" data-delete-script="${c.esc(s.id)}">删除文案</button></div></article>`).join('') : c.empty('生成或编辑正文后，保存你的第一个版本。')}</section></div>`;
    },
    mount(c) {
      const form=document.getElementById('script-form'),editor=document.getElementById('script-text');c.bindDraft(form,'scripts',['topicId']);
      const updateCount=()=>{const n=count(editor.value);document.getElementById('script-count').textContent=`${n} 字（不含空白） · 预计 ${Math.round(n/3.5)} 秒 · 目标 ${c.draft('scripts').duration || 60} 秒`;document.getElementById('save-version').disabled=!editor.value.trim();};
      updateCount();
      editor.addEventListener('input',()=>{c.persist(s=>{s.drafts.scripts={...s.drafts.scripts,text:editor.value};},'',false);updateCount();});
      form.elements.duration.addEventListener('input',updateCount);
      form.elements.topicId.addEventListener('change',()=>{
        const t=c.state.topics.find(t=>t.id===form.elements.topicId.value);if(!t){c.persist(s=>{s.drafts.scripts={...s.drafts.scripts,topicId:''};},'',false);return;}
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
          const topic=s.topics.find(t=>t.id===item.topicId);if(topic?.status==='待撰写')topic.status='拍摄中';
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
