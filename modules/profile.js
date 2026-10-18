'use strict';
window.WorkspaceModules.profile = (()=>{
  const fail=message=>{throw new Error(message);};
  const obj=v=>!!v && typeof v==='object' && !Array.isArray(v);
  function text(v,max=30000) {if(typeof v!=='string' || v.length>max)fail('备份包含无效或过长的文本');return v;}
  function list(v) {if(!Array.isArray(v) || v.length>50000)fail('备份列表格式或条目数量无效');return v;}
  function integer(v,min=0,max=1e12) {if(!Number.isSafeInteger(v) || v<min || v>max)fail('备份包含无效数值');return v;}
  function timestamp(v){text(v,100);if(!Number.isFinite(Date.parse(v)))fail('备份包含无效时间');return v;}
  function day(v){text(v,10);const d=new Date(v+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==v)fail('备份包含无效日期');return v;}
  function id(v){text(v,200);if(!v)fail('备份记录缺少 ID');return v;}
  function unique(items){const ids=new Set();for(const item of items){id(item.id);if(ids.has(item.id))fail('备份存在重复 ID');ids.add(item.id);}return items;}
  function safeTree(value,depth=0){
    if(depth>12)fail('备份结构层级过深');
    if(value===null || typeof value==='boolean')return value;
    if(typeof value==='string')return text(value,500000);
    if(typeof value==='number'){if(!Number.isFinite(value))fail('备份包含无效数值');return value;}
    if(Array.isArray(value))return list(value).map(v=>safeTree(v,depth+1));
    if(!obj(value) || Object.keys(value).length>1000)fail('备份对象格式无效');
    const result={};for(const [key,val] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))fail('备份包含不安全的属性');result[key]=safeTree(val,depth+1);}return result;
  }
  function validateDrafts(drafts){
    if(!obj(drafts))fail('草稿格式无效');
    const result=safeTree(drafts);
    const allowed=['analysis','ideas','topics','scripts','livePlan','liveReviews','metrics','metricFilter'];
    for(const key of Object.keys(result)){
      if(!allowed.includes(key))fail('备份包含未知草稿类型');
      if(!obj(result[key]))fail('草稿必须为对象');
      if(key==='liveReviews'){
        for(const review of Object.values(result[key])){if(!obj(review) || Object.values(review).some(v=>typeof v!=='string'))fail('直播复盘草稿无效');}
      }else for(const [name,value] of Object.entries(result[key])){
        if(name==='result' && key==='analysis'){report(value);continue;}
        if(key==='topics' && name==='autoGenerate'){if(typeof value!=='boolean')fail('选题草稿无效');continue;}
        if(typeof value==='number'){
          const numeric=(key==='metrics' && ['plays','likes','comments','shares','leads'].includes(name)) || (key==='scripts' && name==='target');
          if(!numeric)fail('草稿字段类型无效');integer(value);
        } else if(typeof value!=='string')fail('草稿字段格式无效');
      }
    }
    return result;
  }
  function report(r){if(!obj(r))fail('分析报告格式无效');return Object.fromEntries(['hook','audience','structure','conflict','highlights','advice'].map(k=>[k,text(r[k],500000)]));}
  function validate(payload,c){
    if(!obj(payload))fail('请选择有效的 JSON 备份');
    if(payload.app!==undefined && payload.app!=='Gongzuo')fail('这不是创作舱备份');
    if(payload.version!==undefined && payload.version!==1)fail('不支持此备份版本');
    const raw=payload.app==='Gongzuo'?payload.data:payload;
    if(!obj(raw) || (raw.schemaVersion!==undefined && raw.schemaVersion!==1))fail('备份数据版本无效');
    safeTree(raw);
    if(!obj(raw.profile) || !['light','dark'].includes(raw.theme))fail('备份缺少有效个人设置');
    const state=c.initial();state.theme=raw.theme;
    state.profile={name:text(raw.profile.name,60),niche:text(raw.profile.niche,200),style:text(raw.profile.style)};
    for(const key of ['reports','ideas','topics','scripts','lives','metrics']){
      if(raw[key]===undefined && raw.schemaVersion===undefined)continue;
      state[key]=unique(list(raw[key])).map(row=>{
        if(!obj(row))fail('备份记录格式无效');
        const base={id:id(row.id)};
        switch(key){
          case 'reports': return {...base,url:text(row.url,500),text:text(row.text),report:report(row.report),createdAt:timestamp(row.createdAt)};
          case 'ideas': return {...base,title:text(row.title,120),content:text(row.content),tags:list(row.tags).map(t=>text(t,500)),createdAt:timestamp(row.createdAt),updatedAt:timestamp(row.updatedAt)};
          case 'topics':
            if(!['待写','制作','已发布'].includes(row.status))fail('选题状态无效');
            return {...base,title:text(row.title,500),cover:text(row.cover,500),hook:text(row.hook,1000),angle:text(row.angle,100),source:text(row.source),ideaId:text(row.ideaId,200),status:row.status,createdAt:timestamp(row.createdAt)};
          case 'scripts':{
            const versions=unique(list(row.versions)).map(v=>({id:id(v.id),text:text(v.text),createdAt:timestamp(v.createdAt),duration:integer(v.duration,10,600),title:text(v.title,200)}));
            if(!versions.length)fail('文案缺少历史版本');
            return {...base,title:text(row.title,200),topicId:text(row.topicId,200),notes:text(row.notes),hook:text(row.hook,500),duration:integer(row.duration,10,600),versions,createdAt:timestamp(row.createdAt),updatedAt:timestamp(row.updatedAt)};
          }
          case 'lives':{
            const todos=unique(list(row.todos)).map(t=>{if(typeof t.done!=='boolean')fail('待办状态无效');return {id:id(t.id),text:text(t.text,200),done:t.done};});
            let review=null;
            if(row.review!==null){const r=row.review;if(!obj(r))fail('复盘格式无效');review={viewers:integer(r.viewers),peak:integer(r.peak),leads:integer(r.leads),wins:text(r.wins),problems:text(r.problems),next:text(r.next),updatedAt:timestamp(r.updatedAt)};if(review.peak>review.viewers)fail('直播数据无效');}
            return {...base,title:text(row.title,160),date:day(row.date),duration:integer(row.duration,10,240),goal:text(row.goal),material:text(row.material),script:text(row.script),todos,review,createdAt:timestamp(row.createdAt)};
          }
          case 'metrics': return {...base,topicId:text(row.topicId,200),title:text(row.title,200),date:day(row.date),notes:text(row.notes),updatedAt:timestamp(row.updatedAt),...Object.fromEntries(['plays','likes','comments','shares','leads'].map(k=>[k,integer(row[k])]))};
        }
      });
    }
    state.drafts=validateDrafts(raw.drafts || {});return state;
  }
  function download(content,name,c) {
    const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);c.notify('备份文件已生成，请保管好下载的 JSON');
  }
  return {
    validate,
    render(c){return `<div class="module-layout"><section class="panel"><h2>创作者档案</h2><p class="subtext">输入自动保存，生成时参考定位与表达风格。</p><form id="profile-form">${c.field('name','IP 名称',c.state.profile.name,{maxlength:60})}${c.field('niche','内容领域 / 目标人群',c.state.profile.niche,{maxlength:200})}${c.area('style','表达风格',c.state.profile.style)}<button class="primary">保存档案</button></form></section><div class="module-stack"><section class="panel"><h2>工作台外观</h2><p class="subtext">当前：${c.state.theme==='dark'?'深色':'浅色'}主题</p><button class="secondary" id="profile-theme">切换深色 / 浅色</button></section><section class="panel"><h2>数据备份与恢复</h2><p class="subtext">包含所有报告、灵感、选题、文案版本、直播、数据、设置及未完成草稿。数据只存于此浏览器，请定期备份。</p><button class="primary" id="export-data">${c.readError ? '导出原始存储（用于排查）' : '导出全部数据 JSON'}</button><form id="import-form"><div class="field"><label for="backup-file">选择备份文件（最大 20 MB）</label><input class="file-input" type="file" id="backup-file" accept=".json,application/json" required></div><p class="rule-note">恢复会覆盖当前全部数据。请先导出当前备份；导入前会校验格式，取消或校验失败不会修改数据。</p><button class="secondary" type="submit">校验并恢复备份</button></form></section></div></div>`;},
    mount(c){
      const form=document.getElementById('profile-form');
      form.addEventListener('input',()=>c.persist(s=>{s.profile=c.values(form);},'',false));
      form.addEventListener('submit',e=>{e.preventDefault();c.persist(s=>{s.profile=c.values(form);},'档案已保存',false);});
      document.getElementById('profile-theme').addEventListener('click',()=>{document.getElementById('theme-toggle').click();});
      document.getElementById('export-data').addEventListener('click',()=>{
        if(c.readError){try{download(localStorage.getItem(c.storageKey) || '',`gongzuo-raw-${c.today()}.json`,c);}catch{c.notify('无法读取本地存储，请检查浏览器权限');}return;}
        download(JSON.stringify({app:'Gongzuo',version:1,exportedAt:new Date().toISOString(),data:c.state},null,2),`gongzuo-backup-${c.today()}.json`,c);
      });
      document.getElementById('import-form').addEventListener('submit',async e=>{
        e.preventDefault();const input=document.getElementById('backup-file'),file=input.files[0];if(!file)return c.notify('请选择备份 JSON 文件');
        if(file.size>20*1024*1024)return c.notify('备份超过 20 MB，请选择较小文件');
        const button=e.target.querySelector('button');button.disabled=true;
        try {
          const parsed=JSON.parse((await file.text()).replace(/^\uFEFF/,'')),next=validate(parsed,c);
          if(confirm(`备份校验通过：${next.ideas.length} 条灵感、${next.topics.length} 条选题、${next.scripts.length} 份文案、${next.lives.length} 场直播。\n恢复将覆盖当前全部数据，是否继续？`))c.replaceState(next);
          else c.notify('已取消恢复，原数据保留');
        }catch(error){c.notify(`未导入：${error instanceof SyntaxError ? 'JSON 格式错误' : error.message}`);}
        finally{input.value='';button.disabled=false;}
      });
    }
  };
})();
