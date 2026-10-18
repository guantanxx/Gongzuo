'use strict';
window.WorkspaceModules.analytics = (()=>{
  const number=n=>Number(n).toLocaleString('zh-CN');
  const filtered=c=>{const d=c.draft('metricFilter');return c.state.metrics.filter(m=>(!d.from || m.date>=d.from) && (!d.to || m.date<=d.to));};
  function chart(canvas,labels,series,line,c) {
    if(!canvas)return;
    const draw=()=>{
      const rect=canvas.getBoundingClientRect();if(!rect.width)return;
      const dpr=window.devicePixelRatio || 1;
      canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(240*dpr);
      const x=canvas.getContext('2d');x.scale(dpr,dpr);
      const width=rect.width,height=240,left=55,right=18,top=18,bottom=45,w=width-left-right,h=height-top-bottom;
      const muted=getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
      x.font='11px system-ui';x.fillStyle=muted;
      if(!labels.length){x.textAlign='center';x.fillText('暂无数据，请先录入视频发布表现',width/2,120);return;}
      const max=Math.max(1,...series.flatMap(s=>s.values));
      const compact=n=>n>=1e8?(n/1e8).toFixed(1)+'亿':n>=1e4?(n/1e4).toFixed(1)+'万':Math.round(n).toString();
      for(let i=0;i<=4;i++){
        const yy=top+h-h*i/4;x.strokeStyle=muted+'30';x.beginPath();x.moveTo(left,yy);x.lineTo(width-right,yy);x.stroke();x.fillStyle=muted;x.textAlign='right';x.fillText(compact(max*i/4),left-8,yy+4);
      }
      const visible=Math.max(1,Math.floor(w/70)),step=Math.max(1,Math.ceil(labels.length/visible));
      const pos=i=>left+w*(i+0.5)/labels.length;
      labels.forEach((label,i)=>{if(i%step===0 || i===labels.length-1){x.textAlign='center';x.fillStyle=muted;x.fillText(label.slice(5),pos(i),height-20);}});
      series.forEach((s,j)=>{
        x.strokeStyle=s.color;x.fillStyle=s.color;x.lineWidth=2;
        if(line){x.beginPath();s.values.forEach((value,i)=>{const yy=top+h-h*value/max;i?x.lineTo(pos(i),yy):x.moveTo(pos(i),yy);});x.stroke();s.values.forEach((value,i)=>{x.beginPath();x.arc(pos(i),top+h-h*value/max,3,0,Math.PI*2);x.fill();});}
        else {const bw=Math.max(1,Math.min(22,w/labels.length/3));s.values.forEach((value,i)=>{const hh=h*value/max;x.fillRect(pos(i)+(j-series.length/2)*bw,top+h-hh,bw-1,hh);});}
      });
    };
    draw();
    if(window.ResizeObserver){const observer=new ResizeObserver(draw);observer.observe(canvas);c.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});}
  }
  return {
    render(c) {
      const d=c.draft('metrics'),f=c.draft('metricFilter'),items=filtered(c),total=items.reduce((s,m)=>({plays:s.plays+m.plays,likes:s.likes+m.likes,leads:s.leads+m.leads}),{plays:0,likes:0,leads:0});
      const best=[...items].sort((a,b)=>b.plays-a.plays)[0];
      return `<p class="rule-note">每条视频记录一份最新累计数据，更新请使用“编辑”，避免重复累计。图表按发布日期聚合，不代表播放发生日趋势；数据由你手动录入。</p><div class="module-layout"><section class="panel"><h2>${d.editId?'编辑视频数据':'录入视频数据'}</h2><form id="metric-form">${c.select('topicId','关联选题（可选）',[['','不关联'],...c.state.topics.map(t=>[t.id,t.title])],d.topicId)}${c.field('title','视频标题',d.title,{required:true,maxlength:200})}${c.field('date','发布日期',d.date || c.today(),{type:'date',required:true})}<div class="metrics-grid">${[['plays','播放量'],['likes','点赞量'],['comments','评论量'],['shares','分享量'],['leads','有效询盘数']].map(([key,label])=>c.field(key,label,d[key] || 0,{type:'number',required:true})).join('')}</div>${c.area('notes','复盘备注',d.notes)}<div class="actions"><button class="primary">保存视频数据</button><button class="secondary" type="button" id="new-metric">清空 / 新建</button></div></form></section><section class="panel"><h2>账号内容统计</h2><form id="metric-filter-form"><div class="toolbar">${c.field('from','发布起始日',f.from,{type:'date'})}${c.field('to','发布截止日',f.to,{type:'date'})}<button class="secondary">筛选</button><button class="secondary" type="button" id="clear-metric-filter">全部</button></div></form><div class="stats" style="grid-template-columns:repeat(2,1fr)">${[['视频数',items.length],['总播放',total.plays],['总点赞',total.likes],['总询盘',total.leads]].map(([label,value])=>`<div class="stat"><span class="subtext">${label}</span><strong>${number(value)}</strong></div>`).join('')}</div><p>点赞率：${total.plays ? (total.likes/total.plays*100).toFixed(2) : '0.00'}% · 询盘率：${total.plays ? (total.leads/total.plays*100).toFixed(2) : '0.00'}%</p><div class="report-section"><h3>复盘提示</h3><p>${best ? `当前播放最高的是「${c.esc(best.title)}」，播放 ${number(best.plays)}。可对比其选题与开头，结合询盘判断是否触达目标人群。`:'先记录内容数据，再比较不同选题的表现。'}${items.length<5?' 当前样本不足 5 条，暂不宜据此得出稳定趋势。':''} 相关性不等于因果，注意发布时间和曝光差异。</p></div></section><section class="panel"><h2>发布批次累计播放 · 折线图</h2><canvas id="plays-chart" class="chart" role="img" aria-label="按发布日期聚合的累计播放，详细数值见下方数据表"></canvas></section><section class="panel"><h2>发布批次互动 · 柱状图</h2><div class="chart-legend"><span><i class="color-dot"></i>点赞</span><span><i class="color-dot" style="background:#38b697"></i>询盘</span></div><canvas id="engagement-chart" class="chart" role="img" aria-label="按发布日期聚合的点赞和询盘，详细数值见下方数据表"></canvas></section><section class="panel full-width"><h2>视频数据明细 · ${items.length}</h2>${items.length?`<div class="table-wrap"><table><caption class="subtext">筛选范围内的视频最新累计数据</caption><thead><tr>${['视频','发布日','播放','点赞','评论','分享','询盘','操作'].map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${[...items].sort((a,b)=>b.date.localeCompare(a.date)).map(m=>`<tr><td>${c.esc(m.title)}</td><td>${c.esc(m.date)}</td>${['plays','likes','comments','shares','leads'].map(k=>`<td>${number(m[k])}</td>`).join('')}<td><button class="secondary" data-edit-metric="${c.esc(m.id)}">编辑</button> <button class="secondary danger" data-delete-metric="${c.esc(m.id)}">删除</button></td></tr>`).join('')}</tbody></table></div>`:c.empty('暂无数据，或筛选范围内没有记录。')}</section></div>`;
    },
    mount(c) {
      const form=document.getElementById('metric-form');c.bindDraft(form,'metrics');
      form.elements.topicId.addEventListener('change',()=>{const topic=c.state.topics.find(t=>t.id===form.elements.topicId.value);if(topic){form.elements.title.value=topic.title;c.persist(s=>{s.drafts.metrics={...s.drafts.metrics,...c.values(form)};},'',false);}});
      form.addEventListener('submit',e=>{
        e.preventDefault();const v=c.values(form);if(!v.title.trim())return c.notify('请填写视频标题');
        const id=c.draft('metrics').editId;
        if(c.state.metrics.some(m=>m.id!==id && ((m.title===v.title.trim() && m.date===v.date) || (v.topicId && m.topicId===v.topicId))))return c.notify('该视频已有数据，请编辑已有记录，避免重复累计');
        c.persist(s=>{const item={id:id || c.uid(),topicId:v.topicId,title:v.title.trim(),date:v.date,notes:v.notes,updatedAt:new Date().toISOString()};for(const k of ['plays','likes','comments','shares','leads'])item[k]=Number(v[k]);const i=s.metrics.findIndex(m=>m.id===id);if(i>=0)s.metrics[i]=item;else s.metrics.unshift(item);const topic=s.topics.find(t=>t.id===item.topicId);if(topic)topic.status='已发布';s.drafts.metrics={};},'视频数据已保存');
      });
      document.getElementById('new-metric').addEventListener('click',()=>c.persist(s=>{s.drafts.metrics={};},'已切换为新记录'));
      document.querySelectorAll('[data-edit-metric]').forEach(b=>b.addEventListener('click',()=>{const m=c.state.metrics.find(m=>m.id===b.dataset.editMetric);c.persist(s=>{s.drafts.metrics={...m,editId:m.id};},'已载入记录，保存将更新数据');}));
      document.querySelectorAll('[data-delete-metric]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这条视频数据？'))c.persist(s=>{s.metrics=s.metrics.filter(m=>m.id!==b.dataset.deleteMetric);if(s.drafts.metrics?.editId===b.dataset.deleteMetric)s.drafts.metrics={};},'视频记录已删除');}));
      const filter=document.getElementById('metric-filter-form');
      filter.addEventListener('submit',e=>{e.preventDefault();const v=c.values(filter);if(v.from && v.to && v.from>v.to)return c.notify('起始日不能晚于截止日');c.persist(s=>{s.drafts.metricFilter=v;},'数据筛选已更新');});
      document.getElementById('clear-metric-filter').addEventListener('click',()=>c.persist(s=>{s.drafts.metricFilter={};},'已展示全部数据'));
      const daily=new Map();for(const m of filtered(c)){const row=daily.get(m.date)||{plays:0,likes:0,leads:0};for(const k of ['plays','likes','leads'])row[k]+=m[k];daily.set(m.date,row);}
      const labels=[...daily.keys()].sort();
      chart(document.getElementById('plays-chart'),labels,[{color:'#7583ff',values:labels.map(k=>daily.get(k).plays)}],true,c);
      chart(document.getElementById('engagement-chart'),labels,[{color:'#7583ff',values:labels.map(k=>daily.get(k).likes)},{color:'#38b697',values:labels.map(k=>daily.get(k).leads)}],false,c);
    }
  };
})();
