'use strict';
window.WorkspaceModules.templates = (()=>{
  const builtins=[
    {id:'builtin-selection',title:'工程选型 · 先现场后参数',category:'口播模板',body:'{{客户}}在选{{产品}}时，先别只看演示画面。\n先确认【应用场景】、【安装距离】和【环境照度】，再核对【画面尺寸 / 控制方式 / 防护条件】。\n这里展示的是【真实测试条件与现象】，适用范围是【经确认的范围】。\n如果你有类似项目，可以私信场景、距离、数量与工期，先核需求，再讨论配置。'},
    {id:'builtin-case',title:'工程案例 · 条件、过程、边界',category:'口播模板',body:'这个【项目类型】为什么这样选择灯具？\n先说明真实条件：【安装位置 / 距离 / 环境光】。客户要解决的是【具体问题】。\n我们展示【已确认的配置与施工过程】，对比【同条件下的实测表现】。\n效果与报价取决于现场条件，不用单个案例做普遍保证。有类似需求，欢迎提供必要项目资料，进一步核对。'},
    {id:'builtin-factory',title:'探厂开场 · 展示可验证的流程',category:'直播开场',body:'大家好，我是{{IP}}。今天带大家看【已授权展示的工厂区域】，围绕{{产品}}的装配、检测与包装展开。\n总包、装修公司、经销商和甲方朋友，可以先说你关注的应用场景。\n我们只讲现场能够验证的信息；涉及产能、交期和定制条件，会在核对实际项目后回复。'},
    {id:'builtin-demo',title:'样品演示开场 · 先讲测试条件',category:'直播开场',body:'大家好，我是{{IP}}。本场演示【样品名称】，先把【距离】、【环境光】、【画面尺寸】与【相机曝光】交代清楚。\n接下来展示效果、安装和控制接口，再回答你们的工程问题。\n需要选型的朋友可以提供场景、数量与工期，我们先确认适用条件，再安排进一步沟通。'},
    {id:'builtin-inquiry',title:'询盘引导 · 四项需求核对',category:'询盘话术',body:'感谢关注{{产品}}。为避免只凭样片选型，请先提供：\n1. 应用场景与使用环境；\n2. 安装距离与预期画面尺寸；\n3. 预计数量与控制需求；\n4. 交付时间与安装条件。\n我们据此核对参数、样品验证和报价范围。{{联系}}'},
    {id:'builtin-dealer',title:'经销跟进 · 样品验证与合作边界',category:'询盘话术',body:'如果你在做{{产品}}的渠道选品，可以先沟通目标场景与常见项目需求。\n建议先验证样品效果、配置边界与售后条款，再讨论批量数量和备货节奏。\n可先发送关注的产品方向与预计数量，进一步核对产品资料与打样安排；不以未经确认的信息承诺区域权益或交期。'}
  ];
  const resolved=(t,c)=>t.body.replaceAll('{{IP}}',c.state.profile.name || '【IP 名称】').replaceAll('{{客户}}',c.state.profile.niche || '工程客户').replaceAll('{{产品}}',c.state.profile.products || '商业照明灯具').replaceAll('{{联系}}',c.state.profile.contact || '');
  return {
    builtins,
    render(c){const d=c.draft('templates');return `<p class="rule-note">内置模板提供表达骨架，【方括号】内容需要真实补充。载入编辑器会带入 IP 设置，不自动编造参数与项目证明。</p><div class="module-layout"><section class="panel"><h2>${d.editId?'编辑自定义模板':'新增自定义模板'}</h2><form id="template-form">${c.field('title','模板名称',d.title,{required:true,maxlength:160})}${c.select('category','模板类型',['口播模板','直播开场','询盘话术'].map(x=>[x,x]),d.category)}${c.area('body','模板正文',d.body,true)}<p class="subtext">可用占位符：{{IP}}、{{客户}}、{{产品}}、{{联系}}</p><div class="actions"><button class="primary">保存模板</button><button class="secondary" type="button" id="new-template">清空 / 新建</button></div></form></section><section class="panel"><h2>模板检索</h2><div class="toolbar">${c.field('templateSearch','关键词',d.templateSearch)}${c.select('templateCategory','类型筛选',[['','全部类型'],...['口播模板','直播开场','询盘话术'].map(x=>[x,x])],d.templateCategory)}</div><p class="subtext">${builtins.length} 个内置模板 · ${c.state.templates.length} 个自定义模板</p><p class="subtext">口播与询盘模板进入文案编辑器；直播模板进入直播开场编辑器。内置模板可复制到自定义模板后修改。</p></section><section class="template-grid full-width" id="template-list"></section></div>`;},
    mount(c){
      const form=document.getElementById('template-form');c.bindDraft(form,'templates');
      form.addEventListener('submit',e=>{
        e.preventDefault();const v=c.values(form),editId=c.draft('templates').editId;if(!v.title.trim() || !v.body.trim())return c.notify('请填写模板名称与正文');
        c.persist(s=>{const now=new Date().toISOString(),item={id:editId || c.uid(),title:v.title.trim(),category:v.category,body:v.body.trim(),createdAt:now,updatedAt:now},index=s.templates.findIndex(t=>t.id===editId);if(index<0)s.templates.unshift(item);else s.templates[index]={...item,createdAt:s.templates[index].createdAt};s.drafts.templates={};},'模板已保存');
      });
      document.getElementById('new-template').addEventListener('click',()=>c.persist(s=>{s.drafts.templates={};},'已新建模板'));
      const search=document.getElementById('f-templateSearch'),category=document.getElementById('f-templateCategory');
      const draw=()=>{
        const items=[...c.state.templates,...builtins].filter(t=>(!category.value || t.category===category.value) && `${t.title} ${t.body}`.toLowerCase().includes(search.value.trim().toLowerCase()));
        document.getElementById('template-list').innerHTML=items.length?items.map(t=>`<article class="panel" data-template-id="${c.esc(t.id)}"><span class="tag">${c.esc(t.category)}</span><span class="tag">${t.id.startsWith('builtin-')?'内置':'自定义'}</span><h2 style="margin:17px 0">${c.esc(t.title)}</h2><p class="template-body">${c.esc(resolved(t,c))}</p><div class="actions"><button class="primary" data-load-template="${c.esc(t.id)}">${t.category==='直播开场'?'载入直播开场编辑器':'载入文案编辑器'}</button><button class="secondary" data-copy-text="${c.esc(resolved(t,c))}">复制文案</button><button class="secondary" data-edit-template="${c.esc(t.id)}">${t.id.startsWith('builtin-')?'另存为自定义':'编辑'}</button>${t.id.startsWith('builtin-')?'':`<button class="secondary danger" data-delete-template="${c.esc(t.id)}">删除</button>`}</div></article>`).join(''):c.empty('没有匹配的模板。');
        const find=id=>[...c.state.templates,...builtins].find(t=>t.id===id);
        document.querySelectorAll('[data-load-template]').forEach(b=>b.addEventListener('click',()=>{
          const t=find(b.dataset.loadTemplate),live=t.category==='直播开场';
          if((live?c.draft('livePlan').opening:c.draft('scripts').text) && !confirm('载入模板会替换当前编辑草稿，已保存内容保留。继续？'))return;
          if(c.persist(s=>{if(live)s.drafts.livePlan={...s.drafts.livePlan,title:t.title,opening:resolved(t,c),kind:t.id==='builtin-demo'?'样品演示':'探厂'};else s.drafts.scripts={title:t.title,text:resolved(t,c),duration:'60',notes:'',hook:''};},'',false)){c.go(live?'live':'scripts');c.notify('模板已载入，可直接编辑');}
        }));
        document.querySelectorAll('[data-edit-template]').forEach(b=>b.addEventListener('click',()=>{const t=find(b.dataset.editTemplate);c.persist(s=>{s.drafts.templates={title:t.title,category:t.category,body:t.body,...(t.id.startsWith('builtin-')?{}:{editId:t.id})};},'已载入模板，请修改后保存');}));
        document.querySelectorAll('[data-delete-template]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这个自定义模板？'))c.persist(s=>{s.templates=s.templates.filter(t=>t.id!==b.dataset.deleteTemplate);if(s.drafts.templates?.editId===b.dataset.deleteTemplate)s.drafts.templates={};},'模板已删除');}));
      };
      for(const el of [search,category])el.addEventListener('input',()=>{c.persist(s=>{s.drafts.templates={...s.drafts.templates,templateSearch:search.value,templateCategory:category.value};},'',false);draw();});draw();
    }
  };
})();
