'use strict';
// Run with: node --test tests/native.test.js (Node built-ins only).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sandbox={window:{WorkspaceTools:{},WorkspaceModules:{}}};
for(const file of ['modules/profile.js','csv.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const CSV=sandbox.window.WorkspaceTools.CSV,validate=sandbox.window.WorkspaceModules.profile.validate;
const clone=v=>JSON.parse(JSON.stringify(v));
const now='2026-10-18T08:00:00.000Z';
function initial(){return {schemaVersion:2,theme:'dark',profile:{name:'测试工厂',niche:'总包',style:'专业克制',products:'投影灯',contact:''},reports:[],ideas:[],topics:[],scripts:[],lives:[],metrics:[],templates:[],tasks:[],drafts:{}};}
function context(){let counter=0;return {state:initial(),initial,uid:()=>`new-${++counter}`};}
const metric=()=>({id:'video-1',topicId:'',title:'投影灯实测',date:'2026-10-18',plays:1000,likes:50,comments:3,shares:2,messages:30,leads:10,contacts:4,notes:'现场记录',updatedAt:now});
test('CSV preserves Chinese, multiline, quotes, apostrophes and formula-looking text',()=>{
 const rows=[['标题','内容'],['=SUM(1,2)','逗号,引号"\n下一行'],["'=literal",'\t开头'],['-负号','+前缀'],['@name',"'普通引号"]];
 const encoded=CSV.encode(rows);assert.ok(encoded.startsWith('\uFEFF'));assert.ok(encoded.includes("'=SUM"));assert.deepEqual(clone(CSV.parse(encoded)),rows);
});
test('CSV rejects unmatched quotes, misplaced quotes and mismatched columns',()=>{
 assert.throws(()=>CSV.parse('"未结束'));assert.throws(()=>CSV.parse('a"b,c'));assert.throws(()=>CSV.parse('"a"x,b'));
 assert.throws(()=>CSV.readRows('标题,内容\n测试,正文,多余','ideas'));
});
test('CSV recognizes mixed-case Chinese ID and JSON headers',()=>{
 const rows=CSV.readRows('标题,灵感ID,封面文案,5秒钩子\n选题,idea-1,封面,钩子','topics');assert.equal(rows[0].ideaId,'idea-1');
 assert.equal(CSV.readRows('标题,计划日期,待办JSON\n直播,2026-10-18,[]','lives')[0].todos,'[]');
});
test('Partial CSV upsert retains omitted fields and never mutates original state',()=>{
 const c=context();c.state.metrics=[metric()];const before=clone(c.state);
 const result=CSV.prepare([{id:'video-1',title:'投影灯实测',date:'2026-10-18',leads:'12'}],'metrics',c);
 assert.equal(result.updated,1);assert.equal(result.items[0].plays,1000);assert.equal(result.items[0].contacts,4);assert.equal(result.items[0].leads,12);assert.deepEqual(c.state,before);
});
test('Invalid row rejects the entire batch without mutating state',()=>{
 const c=context(),before=clone(c.state);
 assert.throws(()=>CSV.prepare([{title:'有效',date:'2026-10-18',plays:'100'},{title:'无效',date:'2026-10-18',plays:'-1'}],'metrics',c));assert.deepEqual(c.state,before);
 assert.throws(()=>CSV.prepare([{title:'无效日期',date:'2026-02-30'}],'metrics',c));
});
test('Repeated IDs and invalid topic status are rejected',()=>{
 const c=context();assert.throws(()=>CSV.prepare([{id:'same',title:'甲',content:'内容'},{id:'same',title:'乙',content:'内容'}],'ideas',c));
 assert.throws(()=>CSV.prepare([{title:'选题',cover:'封面',hook:'钩子',status:'无效状态'}],'topics',c));
});
test('Live CSV roundtrip retains full scripts, completed todos and review data',()=>{
 const c=context();c.state.lives=[{id:'live-1',title:'样品演示',kind:'样品演示',date:'2026-10-18',duration:60,goal:'需求核对',material:'距离与环境光',script:'开场\n"先讲条件",再展示',todos:[{id:'todo-1',text:'核对参数',done:true}],review:{viewers:100,peak:20,leads:5,wins:'问题具体',problems:'素材不足',next:'增加安装镜头',updatedAt:now},createdAt:now}];
 const encoded=CSV.encode(CSV.exportRows('lives',c)),rows=CSV.readRows(encoded,'lives'),result=CSV.prepare(rows,'lives',c);
 assert.deepEqual(clone(result.items),c.state.lives);
});
test('Legacy backups migrate statuses and add new funnel fields',()=>{
 const c=context(),legacy=initial();legacy.schemaVersion=1;delete legacy.tasks;delete legacy.templates;legacy.profile={name:'旧 IP',niche:'工程',style:'简洁'};
 legacy.topics=[{id:'topic-1',title:'选题',cover:'封面',hook:'钩子',status:'待写',source:'现场',ideaId:'',angle:'案例',createdAt:now}];legacy.metrics=[metric()];delete legacy.metrics[0].messages;delete legacy.metrics[0].contacts;
 const result=validate({app:'Gongzuo',version:1,data:legacy},c);assert.equal(result.schemaVersion,2);assert.equal(result.topics[0].status,'待撰写');assert.equal(result.metrics[0].messages,0);assert.equal(result.metrics[0].contacts,0);
});
test('Version 2 backups preserve custom templates and reminders',()=>{
 const c=context();c.state.templates=[{id:'custom-1',title:'需求话术',category:'询盘话术',body:'核对条件',createdAt:now,updatedAt:now}];c.state.tasks=[{id:'task-1',title:'拍样品',category:'拍摄',due:'2026-10-18',notes:'同曝光',done:false,createdAt:now,updatedAt:now}];
 assert.deepEqual(clone(validate({app:'Gongzuo',version:2,data:c.state},c)),c.state);
});
test('Malformed backups and prototype keys cannot pass validation',()=>{
 const c=context(),bad=initial();bad.drafts=JSON.parse('{"__proto__":{}}');assert.throws(()=>validate(bad,c));
 const missing=initial();delete missing.templates;assert.throws(()=>validate(missing,c));
 const wrongDraft=initial();wrongDraft.drafts.scripts={text:5};assert.throws(()=>validate(wrongDraft,c));
});
