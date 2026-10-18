'use strict';
window.WorkspaceModules = window.WorkspaceModules || {};
window.WorkspaceModules.analysis = (() => {
  function analyze(text, profile) {
    const parts = text.split(/[。！？!?\n]+/).map(x => x.trim()).filter(Boolean);
    const opening = parts[0] || text;
    const signals = [
      [/为什么|怎么|如何|凭什么|？|\?/, '提问', '用问题引出观众想知道的答案'],
      [/别|不要|千万|停止|避坑/, '避坑', '利用风险提醒吸引注意'],
      [/竟然|但是|却|反而|以为|其实/, '反差', '借助预期与结果之间的差异制造悬念'],
      [/\d|一招|三步|第一/, '具体数字', '用明确数量降低理解成本'],
      [/我|亲身|经历|以前/, '个人经历', '以第一人称提供故事入口']
    ];
    const matched = signals.filter(([rule]) => rule.test(opening));
    const groups = ['职场新人','宝妈','学生','创业者','老板','上班族','新手','家长','自由职业者','打工人','女生','男生'];
    const audience = groups.filter(word => text.includes(word));
    const conflict = parts.find(x => /但是|却|以为|其实|困难|焦虑|痛点|问题|失败|不会|没/.test(x));
    const highlights = signals.filter(([rule]) => rule.test(text)).map(([, name, reason]) => `${name}：${reason}`);
    return {
      hook: `开头原句：${opening}\n${matched.length ? matched.map(([, n, r]) => `${n}型：${r}`).join('；') : '叙述型开头：建议把结果、问题或具体场景前置。'}`,
      audience: audience.length ? `文案直接提及：${audience.join('、')}。这是关键词推断，建议结合评论验证。` : `未识别明确人群。${profile.niche ? `可结合你的定位「${profile.niche}」进一步判断。` : '建议明确观众所处阶段和具体需求。'}`,
      structure: parts.map((part, i) => `${i+1}. ${i === 0 ? '开头引入' : i === parts.length-1 ? '收尾落点' : /首先|然后|步骤|第一|第二/.test(part) ? '方法展开' : /例如|比如|有一次|我/.test(part) ? '案例 / 经历' : '观点展开'}：${part}`).join('\n'),
      conflict: conflict || '未发现明显冲突表达。可补充“原来如何、遇到什么问题、后来如何改变”的对照。',
      highlights: highlights.length ? highlights.join('\n') : '表达比较平直，可增加具体场景、可执行动作或前后对照。',
      advice: `1. 保留主题，换成你自己的真实案例。\n2. 前 5 秒明确“谁遇到什么问题”，避免照搬原句。\n3. 用一个可验证的细节支撑观点，结尾给出一个动作。\n4. ${profile.style ? `按你的风格「${profile.style}」调整表达。` : '朗读一遍，删掉不符合你日常表达的词语。'}\n以上仅为文本规则判断，不能预测流量或证明内容真实。`
    };
  }
  function reportHTML(report, c) {
    return `<h2>文本拆解报告</h2>${[['hook','开头钩子'],['audience','目标受众'],['structure','内容结构'],['conflict','核心矛盾'],['highlights','内容亮点'],['advice','创作建议']].map(([key,label])=>`<div class="report-section"><h3>${label}</h3><p>${c.esc(report[key])}</p></div>`).join('')}`;
  }
  return {
    render(c) {
      const d = c.draft('analysis');
      return `<p class="rule-note">粘贴抖音分享链接并补充原文。本地规则仅分析文案，不访问链接、不调用 AI；结论需人工核对。</p><div class="module-layout"><section class="panel"><h2>拆解一条内容</h2><form id="analysis-form">${c.field('url','抖音链接（可选）',d.url,{placeholder:'https://v.douyin.com/…'})}${c.area('text','粘贴视频文案',d.text,true)}<button class="primary">生成分析报告</button></form></section><section class="panel" id="analysis-result">${d.result ? `${reportHTML(d.result,c)}<button type="button" class="primary" id="save-report">保存报告入库</button>` : c.empty('输入文案后，这里将展示拆解结果。')}</section><section class="panel full-width"><h2>已保存报告 · ${c.state.reports.length}</h2>${c.state.reports.length ? c.state.reports.map(r=>`<article class="record"><h3>${c.esc(r.text.slice(0,45))}</h3><p class="subtext">${c.esc(r.url || '未添加链接')}</p><time>${c.date(r.createdAt)}</time><div class="actions"><button class="secondary" data-view="${c.esc(r.id)}">查看 / 继续拆解</button><button class="secondary danger" data-delete="${c.esc(r.id)}">删除报告</button></div></article>`).join('') : c.empty('还没有报告，分析后可保存入库。')}</section></div>`;
    },
    mount(c) {
      const form = document.getElementById('analysis-form'); c.bindDraft(form,'analysis');
      form.addEventListener('submit', e=>{
        e.preventDefault(); const v=c.values(form); const text=v.text.trim();
        if (!text) return c.notify('请粘贴有效文案');
        if (v.url.trim()) { try { const u = new URL(v.url.trim()); if(u.protocol !== 'https:' || !/(^|\.)douyin\.com$/.test(u.hostname)) throw new Error(); } catch { return c.notify('请输入有效的 HTTPS 抖音链接，或留空仅分析文案'); } }
        c.persist(s=>{s.drafts.analysis={...v,text,result:analyze(text,s.profile)};},'分析完成');
      });
      document.getElementById('save-report')?.addEventListener('click',()=>{
        const d=c.draft('analysis');
        if(c.state.reports.some(r=>r.text===d.text && r.url===d.url)) return c.notify('相同报告已在库中');
        c.persist(s=>{s.reports.unshift({id:c.uid(),url:d.url || '',text:d.text,report:d.result,createdAt:new Date().toISOString()});},'报告已保存');
      });
      document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{const r=c.state.reports.find(x=>x.id===b.dataset.view);c.persist(s=>{s.drafts.analysis={url:r.url,text:r.text,result:r.report};},'已打开报告');}));
      document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这份报告？此操作不可撤销。')) c.persist(s=>{s.reports=s.reports.filter(x=>x.id!==b.dataset.delete);},'报告已删除');}));
    }
  };
})();
