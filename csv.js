'use strict';
(()=>{
  const specs={
    ideas:{label:'灵感库',required:['title'],columns:[['id','ID'],['title','标题'],['content','内容'],['tags','标签'],['createdAt','创建时间'],['updatedAt','更新时间']]},
    topics:{label:'选题库',required:['title'],columns:[['id','ID'],['title','标题'],['cover','封面文案'],['hook','5秒钩子'],['status','状态'],['source','来源素材'],['ideaId','灵感ID'],['angle','选题角度'],['createdAt','创建时间']]},
    metrics:{label:'视频复盘',required:['title','date'],columns:[['id','ID'],['topicId','选题ID'],['title','标题'],['date','发布日期'],['plays','播放'],['likes','点赞'],['comments','评论'],['shares','分享'],['messages','私信'],['leads','询盘'],['contacts','留资'],['notes','复盘备注'],['updatedAt','更新时间']]},
    lives:{label:'直播记录',required:['title','date'],columns:[['id','ID'],['title','标题'],['kind','直播类型'],['date','计划日期'],['duration','时长分钟'],['goal','本场目标'],['material','演示素材'],['script','直播脚本'],['todos','待办JSON'],['reviewed','已复盘'],['viewers','累计观看'],['peak','最高在线'],['leads','询盘'],['wins','亮点'],['problems','问题'],['next','改进动作'],['reviewAt','复盘时间'],['createdAt','创建时间']]}
  };
  const dangerous=value=>/^[\s\u0000-\u001f]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value);
  function protect(value){const s=String(value ?? '');return s.startsWith("'") || dangerous(s)?"'"+s:s;}
  function unprotect(value){return value.startsWith("''") || (value.startsWith("'") && dangerous(value.slice(1)))?value.slice(1):value;}
  function encode(rows){return '\uFEFF'+rows.map(row=>row.map(value=>'"'+protect(value).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';}
  function parse(input){
    const source=input.replace(/^\uFEFF/,''),rows=[];let row=[],cell='',quoted=false,closed=false;
    const endCell=()=>{row.push(unprotect(cell));cell='';closed=false;};
    const endRow=()=>{endCell();if(row.some(v=>v!==''))rows.push(row);row=[];};
    for(let i=0;i<source.length;i++){
      const char=source[i];
      if(quoted){if(char==='"'){if(source[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=char;continue;}
      if(char==='"'){if(cell || closed)throw new Error('CSV 引号位置错误');quoted=true;}
      else if(char===',')endCell();
      else if(char==='\r' || char==='\n'){if(char==='\r' && source[i+1]==='\n')i++;endRow();}
      else {if(closed)throw new Error('CSV 闭引号后存在多余字符');cell+=char;}
    }
    if(quoted)throw new Error('CSV 存在未闭合的引号');
    if(cell || row.length || closed)endRow();
    return rows;
  }
  function readRows(source,type){
    const rows=parse(source),spec=specs[type];if(rows.length<2)throw new Error('CSV 仅有表头或没有数据行');
    const aliases=new Map(spec.columns.flatMap(([key,label])=>[[key.toLowerCase(),key],[label.toLowerCase(),key]]));
    const keys=rows[0].map(header=>{const key=aliases.get(header.trim().toLowerCase());if(!key)throw new Error(`未知列：${header}，请使用本模块导出的表头`);return key;});
    if(new Set(keys).size!==keys.length)throw new Error('CSV 包含重复列');
    if(!spec.required.every(key=>keys.includes(key)))throw new Error(`缺少必需列：${spec.required.map(k=>spec.columns.find(([key])=>key===k)[1]).join('、')}`);
    if(rows.length>10001)throw new Error('一次最多导入 10000 行');
    return rows.slice(1).map((row,index)=>{if(row.length!==keys.length)throw new Error(`第 ${index+2} 行列数与表头不一致`);return Object.fromEntries(keys.map((key,i)=>[key,row[i]]));});
  }
  const own=(o,k)=>Object.hasOwn(o,k);
  function num(value,name,min=0,max=1e12){const n=value===''?0:Number(value);if(!Number.isSafeInteger(n) || n<min || n>max)throw new Error(`${name}必须为 ${min}–${max} 的整数`);return n;}
  function tagList(value){if(value.trim().startsWith('[')){const v=JSON.parse(value);if(!Array.isArray(v) || v.some(t=>typeof t!=='string'))throw new Error('标签 JSON 格式无效');return [...new Set(v)];}return [...new Set(value.split(/[,，、|｜]/).map(t=>t.trim()).filter(Boolean))];}
  function natural(row,type){return type==='ideas'?row.title+'\u0001'+row.content:type==='topics'?row.title+'\u0001'+row.hook:row.title+'\u0001'+row.date;}
  function prepare(rows,type,c){
    const output=JSON.parse(JSON.stringify(c.state[type])),seenIds=new Set(),seenNatural=new Set();let added=0,updated=0;
    rows.forEach((values,index)=>{
      try{
        const now=new Date().toISOString(),v={...values};
        if(!v.title?.trim())throw new Error('标题不能为空');v.title=v.title.trim();
        if((type==='metrics' || type==='lives') && !v.date)throw new Error('日期不能为空');
        let old=v.id?output.find(r=>r.id===v.id):null;
        if(!old && !v.id){old=output.find(r=>natural(r,type)===natural(v,type) || (type==='metrics' && v.topicId && r.topicId===v.topicId));}
        const id=v.id || old?.id || c.uid();
        if(seenIds.has(id))throw new Error('同一 ID 在文件中重复');seenIds.add(id);
        const naturalKey=natural(v,type);if(seenNatural.has(naturalKey))throw new Error('文件内存在重复记录');seenNatural.add(naturalKey);
        let item;
        if(type==='ideas'){
          item={id,title:v.title,content:'',tags:[],createdAt:now,updatedAt:now,...old,...v,id};
          item.tags=own(v,'tags')?tagList(v.tags):old?.tags || [];
          if(!item.content.trim())throw new Error('灵感内容不能为空');
        }else if(type==='topics'){
          item={id,title:v.title,cover:'',hook:'',status:'待撰写',source:'',ideaId:'',angle:'CSV 导入',createdAt:now,...old,...v,id};
          item.status=({'待写':'待撰写','制作':'拍摄中'}[item.status] || item.status);
          if(!item.cover.trim() || !item.hook.trim())throw new Error('封面文案和 5 秒钩子不能为空');
        }else if(type==='metrics'){
          item={id,topicId:'',notes:'',plays:0,likes:0,comments:0,shares:0,messages:0,leads:0,contacts:0,updatedAt:now,...old,...v,id};
          for(const key of ['plays','likes','comments','shares','messages','leads','contacts'])item[key]=num(item[key],key);
        }else{
          const base={id,title:v.title,kind:'探厂',date:v.date,duration:60,goal:'待补充本场目标',material:'',script:'',todos:[],review:null,createdAt:now,...old};
          item={...base,...Object.fromEntries(Object.entries(v).filter(([k])=>!['viewers','peak','leads','wins','problems','next','reviewed','reviewAt','todos'].includes(k))),id};
          item.duration=num(item.duration,'时长分钟',10,240);
          item.todos=own(v,'todos')?JSON.parse(v.todos || '[]'):base.todos;
          if(own(v,'reviewed') && !['是','否','1','0','true','false',''].includes(v.reviewed))throw new Error('已复盘列应为“是”或“否”');
          const hasReview=own(v,'reviewed')?['是','1','true'].includes(v.reviewed):!!base.review || ['viewers','peak','leads','wins','problems','next'].some(k=>v[k] && v[k]!=='0');
          if(hasReview){item.review={viewers:0,peak:0,leads:0,wins:'',problems:'',next:'',updatedAt:now,...base.review};for(const key of ['viewers','peak','leads'])if(own(v,key))item.review[key]=num(v[key],key);for(const key of ['wins','problems','next'])if(own(v,key))item.review[key]=v[key];if(v.reviewAt)item.review.updatedAt=v.reviewAt;}else item.review=null;
        }
        for(const key of ['createdAt','updatedAt'])if(own(item,key) && !item[key])item[key]=old?.[key] || now;
        const conflict=output.find(r=>r.id!==id && (natural(r,type)===natural(item,type) || (type==='metrics' && item.topicId && r.topicId===item.topicId)));
        if(conflict)throw new Error('与已有记录重复，请保留原 ID 后回填');
        const i=output.findIndex(r=>r.id===id);if(i<0){output.unshift(item);added++;}else{output[i]=item;updated++;}
      }catch(error){throw new Error(`第 ${index+2} 行：${error.message}`);}
    });
    const candidate={...c.state,[type]:output};
    const validated=window.WorkspaceModules.profile.validate(candidate,c);
    return {items:validated[type],added,updated};
  }
  function exportRows(type,c){
    const spec=specs[type];return [spec.columns.map(([,label])=>label),...c.state[type].map(row=>spec.columns.map(([key])=>{
      if(type==='ideas' && key==='tags')return JSON.stringify(row.tags);
      if(type==='lives'){
        if(key==='todos')return JSON.stringify(row.todos);
        if(key==='reviewed')return row.review?'是':'否';
        if(key==='reviewAt')return row.review?.updatedAt || '';
        if(['viewers','peak','leads','wins','problems','next'].includes(key))return row.review?.[key] ?? '';
      }
      return row[key] ?? '';
    }))];
  }
  Object.assign(window.WorkspaceTools,{
    CSV:{parse,encode,readRows,prepare,exportRows},
    csvTools(type,c){return `<section class="csv-tools" data-csv-kind="${type}" aria-label="${specs[type].label} CSV 数据交换"><button class="secondary" data-csv-export="${type}">导出 CSV</button><label class="secondary" for="csv-${type}">导入 CSV 批量回填</label><input class="sr-only" id="csv-${type}" data-csv-file="${type}" type="file" accept=".csv,text/csv"><span class="subtext">支持 Excel · UTF-8 · 同 ID 更新，无 ID 按内容匹配</span><div class="csv-preview full-width" data-csv-preview="${type}" hidden></div></section>`;},
    mountCSV(c){
      document.querySelectorAll('[data-csv-export]').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.csvExport;this.download(encode(exportRows(type,c)),`gongzuo-${type}-${c.today()}.csv`,'text/csv;charset=utf-8');c.notify(c.state[type].length?`已导出 ${c.state[type].length} 条${specs[type].label}记录`:'已导出 CSV 表头，可填写后导入');}));
      document.querySelectorAll('[data-csv-file]').forEach(input=>input.addEventListener('change',async()=>{
        const type=input.dataset.csvFile,file=input.files[0],preview=document.querySelector(`[data-csv-preview="${type}"]`);if(!file)return;
        try{
          if(file.size>10*1024*1024)throw new Error('CSV 最大支持 10 MB');
          const source=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());if(c.signal.aborted || !input.isConnected)return;
          const rows=readRows(source,type),plan=prepare(rows,type,c);preview.hidden=false;
          preview.innerHTML=`<p>校验通过：新增 ${plan.added} 条 / 更新 ${plan.updated} 条</p><p class="subtext">${c.esc(rows.slice(0,3).map(r=>r.title).join(' · '))}${rows.length>3?'…':''}</p><div class="actions"><button class="primary" data-csv-confirm>确认导入 ${rows.length} 条</button><button class="secondary" data-csv-cancel>取消</button></div>`;
          preview.querySelector('[data-csv-confirm]').addEventListener('click',()=>{
            try{const current=prepare(rows,type,c);c.persist(s=>{s[type]=current.items;if(type==='metrics')for(const m of current.items){const t=s.topics.find(t=>t.id===m.topicId);if(t)t.status='已发布';}},`CSV 导入完成：新增 ${current.added} 条，更新 ${current.updated} 条`);}catch(error){c.notify('未导入：'+error.message);}
          });
          preview.querySelector('[data-csv-cancel]').addEventListener('click',()=>{preview.hidden=true;preview.innerHTML='';input.value='';c.notify('已取消导入，原数据保留');});
        }catch(error){preview.hidden=true;c.notify('未导入：'+(error instanceof TypeError?'请选择 UTF-8 编码 CSV（Excel 另存为 CSV UTF-8）':error.message));}
        finally{input.value='';}
      }));
    }
  });
})();
