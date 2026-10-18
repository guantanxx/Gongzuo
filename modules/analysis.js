'use strict';
window.WorkspaceModules = window.WorkspaceModules || {};
window.WorkspaceModules.analysis = (() => {
  function analyze(text, profile) {
    const parts=text.split(/[。！？!?\n]+/).map(x=>x.trim()).filter(Boolean),opening=parts[0] || text;
    const hooks=[[/为什么|怎么|如何|？|\?/,'问题切入'],[/别|不要|千万|避坑/,'风险提醒'],[/以为|其实|却|不是|反而/,'认知反差'],[/现场|实拍|打样|测试|对比/,'现场验证'],[/\d|三点|一步/,'具体信息']].filter(([rule])=>rule.test(opening)).map(([,label])=>label);
    const groups=['总包','装修公司','经销商','甲方','设计师','工程商','采购','施工方','业主'];
    const painRules=[[/亮度|看不清|照度|流明/,'亮度与环境光：需明确投射距离、画面尺寸、环境照度和测试条件。'],[/防水|户外|下雨|防护/,'户外可靠性：核对防护等级、安装位置、散热与实际使用边界。'],[/工期|交期|交付|安装|布线/,'项目交付：明确数量、接口、安装条件与排期，避免只谈单台价格。'],[/价格|报价|预算|成本/,'预算与配置：先确定效果和配置边界，再给出可比较的报价。'],[/售后|质保|维修|维护/,'维护成本：说明可核实的质保范围、易损件与检修方式。'],[/效果|图案|水纹|投影|激光/,'效果一致性：用相同距离与曝光的现场演示，核对样片与实装条件。']];
    const pains=painRules.filter(([rule])=>rule.test(text)).map(([,line])=>line);
    const calls=parts.filter(x=>/私信|留言|联系|询价|询盘|发.*图|清单|报价|样品|参数表|需求/.test(x));
    const audience=groups.filter(x=>text.includes(x));
    const evidence=parts.filter(x=>/实测|测试|现场|实拍|检测|参数|案例|样品/.test(x));
    return {
      hook:`原句：${opening}\n${hooks.length?hooks.join(' / '):'叙述切入，建议前置客户角色、现场问题或可核查的演示结果。'}。`,
      audience:audience.length?`直接提及：${audience.join('、')}。需结合项目类型、采购阶段和评论核对。`:`尚未明确采购角色。可针对${profile.niche || '总包、装修公司、经销商或甲方客户'}选择一个对象展开。`,
      pain:pains.length?pains.join('\n'):'未识别明确工程痛点。建议补充安装距离、使用环境、工期、预算或维护约束。',
      structure:parts.map((x,i)=>`${i+1}. ${i===0?'客户场景 / 钩子':/私信|留言|联系|报价/.test(x)?'需求承接':/测试|现场|参数|实拍/.test(x)?'证据展示':'方案展开'}：${x}`).join('\n'),
      conflict:parts.find(x=>/但是|却|以为|其实|不够|看不清|返工|超预算|故障/.test(x)) || '可围绕“样片效果与现场条件”“单台价格与交付成本”的差异组织冲突，避免制造无依据的焦虑。',
      highlights:evidence.length?`找到可作为证据入口的表达：\n${evidence.join('\n')}\n这些只是文案线索，不能替代真实测试或项目证明。`:'缺少明确证据入口。可增加样品演示、条件一致的前后对比、安装细节和可核实参数。',
      conversion:calls.length?`识别到的承接表达：\n${calls.join('\n')}\n建议只要求必要的项目条件：应用场景、投射距离、预估数量、交付时间，再提供参数或打样沟通。`:'暂无明确转化动作。可使用：“有类似项目，私信应用场景、安装距离和预计数量，我们先核对配置，再确认打样与排期。”',
      advice:`1. 每条视频只回答一个采购问题，明确面向谁。\n2. 展示真实测试条件，不虚构亮度、交期、价格或工程案例。\n3. 结尾用一个具体的资料 / 需求核对动作承接询盘。\n4. ${profile.style?`表达参考：${profile.style}。`:'语言专业克制，参数与结论分开讲。'}\n本报告为本地文本规则分析，不预测流量或保证成交。`
    };
  }
  function reportHTML(report, c) {
    return `<h2>文本拆解报告</h2>${[['hook','开头钩子'],['audience','采购角色'],['pain','客户痛点'],['conversion','转化话术'],['structure','内容结构'],['conflict','核心矛盾'],['highlights','内容亮点'],['advice','创作建议']].map(([key,label])=>`<div class="report-section"><h3>${label}</h3><p>${c.esc(report[key])}</p></div>`).join('')}`;
  }
  return {
    render(c) {
      const d = c.draft('analysis');
      return `<p class="rule-note">粘贴 B 端短视频文案。本地规则分析客户痛点、证据与询盘承接，不访问来源链接。</p><div class="module-layout"><section class="panel"><h2>拆解一条内容</h2><form id="analysis-form">${c.field('url','来源 HTTPS 链接（可选）',d.url,{placeholder:'https://v.douyin.com/…'})}${c.area('text','粘贴 B 端短视频文案',d.text,true)}<button class="primary">生成分析报告</button></form></section><section class="panel" id="analysis-result">${d.result ? `${reportHTML(d.result,c)}<button type="button" class="primary" id="save-report">保存报告入库</button>` : c.empty('输入文案后，这里将展示拆解结果。')}</section><section class="panel full-width"><h2>已保存报告 · ${c.state.reports.length}</h2>${c.state.reports.length ? c.state.reports.map(r=>`<article class="record"><h3>${c.esc(r.text.slice(0,45))}</h3><p class="subtext">${c.esc(r.url || '未添加链接')}</p><time>${c.date(r.createdAt)}</time><div class="actions"><button class="secondary" data-view="${c.esc(r.id)}">查看 / 继续拆解</button><button class="secondary danger" data-delete="${c.esc(r.id)}">删除报告</button></div></article>`).join('') : c.empty('还没有报告，分析后可保存入库。')}</section></div>`;
    },
    mount(c) {
      const form = document.getElementById('analysis-form'); c.bindDraft(form,'analysis');
      form.addEventListener('input',()=>{
        if(c.draft('analysis').result && c.persist(s=>{delete s.drafts.analysis.result;},'',false)) document.getElementById('analysis-result').innerHTML=c.empty('文案或链接已修改，请重新生成报告。');
      });
      form.addEventListener('submit', e=>{
        e.preventDefault(); const v=c.values(form); const text=v.text.trim();
        if (!text) return c.notify('请粘贴有效文案');
        if (v.url.trim()) { try { const u = new URL(v.url.trim()); if(u.protocol !== 'https:') throw new Error(); } catch { return c.notify('请输入有效的 HTTPS 来源链接，或留空仅分析文案'); } }
        c.persist(s=>{s.drafts.analysis={...v,text,result:analyze(text,s.profile)};},'分析完成');
      });
      document.getElementById('save-report')?.addEventListener('click',()=>{
        const d=c.draft('analysis');
        if(!d.result)return c.notify('请先重新生成报告');
        if(c.state.reports.some(r=>r.text===d.text && r.url===d.url)) return c.notify('相同报告已在库中');
        c.persist(s=>{s.reports.unshift({id:c.uid(),url:d.url || '',text:d.text,report:d.result,createdAt:new Date().toISOString()});},'报告已保存');
      });
      document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{const r=c.state.reports.find(x=>x.id===b.dataset.view);c.persist(s=>{s.drafts.analysis={url:r.url,text:r.text,result:r.report};},'已打开报告');}));
      document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这份报告？此操作不可撤销。')) c.persist(s=>{s.reports=s.reports.filter(x=>x.id!==b.dataset.delete);},'报告已删除');}));
    }
  };
})();
