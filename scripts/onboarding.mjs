#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {parseCsv,pick} from './lib/csv.mjs';

export const reads={
 accounts:'select id,name,contact from onboarding.accounts order by name',
 projects:'select * from onboarding.project_health order by target_on,name',
 tasks:'select * from onboarding.task_board order by due_on,name',
 milestones:'select m.*,p.name project from onboarding.milestones m join onboarding.projects p on p.id=m.project_id order by due_on,m.name',
 'customer-chase':"select b.* from onboarding.task_board b join onboarding.projects p on p.id=b.project_id where p.status='active' and b.responsible='customer' and b.status!='done' order by b.due_on,b.name",
 blockers:"select b.* from onboarding.task_board b join onboarding.projects p on p.id=b.project_id where p.status='active' and b.status!='done' and b.blockers>0 order by b.due_on,b.name",
 'launch-readiness':'select * from onboarding.launch_readiness order by target_on,name',
 attention:"select * from onboarding.project_health where status='active' and (target_on<current_date or last_update<current_date-7 or customer_waits>0 or logged_hours>budget_hours) order by target_on,name",
 'effort-review':'select name,owner,budget_hours,logged_hours,logged_hours-budget_hours variance_hours from onboarding.project_health order by variance_hours desc,name',
 'owner-load':"select owner,count(*)::int open_tasks,sum(effort_hours) planned_hours,count(*) filter(where due_on<current_date)::int overdue from onboarding.tasks where status!='done' group by owner order by overdue desc,owner",
 compliance:'select * from onboarding.privacy_review where finding is not null order by name',
 updates:'select u.*,p.name project from onboarding.updates u join onboarding.projects p on p.id=u.project_id order by u.logged_on desc,u.id',
 history:'select * from onboarding.activity order by created_at,id'
};
const spec={
 ...Object.fromEntries(Object.keys(reads).map(k=>[k,[]])),help:[],
 'weekly-review':[],kickoff:['project'],'handover':['project'],
 'add-account':['name','contact','notice','retention','security'],
 'add-project':['account','name','owner','start','due','hours'],
 'add-milestone':['project','name','due'],
 'add-task':['project','milestone','name','owner','responsible','due','hours'],
 'task-status':['task','status','evidence'],
 depend:['task','needs'],
 accept:['milestone','by','evidence'],
 launch:['project','evidence'],
 'reopen-project':['project','evidence'],
 log:['project','note','date','hours'],
 'review-privacy':['account','notice','retention','security'],
 import:['projects','tasks','mapping','dry-run'],export:['out'],
 'draft-status':['project'],'draft-handover':['project']
};
export const commands=Object.keys(spec);
const writeCommands=new Set(['add-account','add-project','add-milestone','add-task','task-status','depend','accept','launch','reopen-project','log','review-privacy','import']);
function parse(args){const [cmd='help',...rest]=args;const opts={},pos=[];for(const v of rest){if(!v.startsWith('--')){pos.push(v);continue}const i=v.indexOf('=');const k=v.slice(2,i<0?undefined:i);if(k in opts)throw Error(`Duplicate flag --${k}`);opts[k]=i<0?true:v.slice(i+1)}if(!spec[cmd])throw Error(`Unknown command ${cmd}`);for(const k of Object.keys(opts))if(![...spec[cmd],'json',...(writeCommands.has(cmd)?['actor']:[])].includes(k))throw Error(`Unknown flag --${k}`);if(pos.length&&(cmd!=='import'||pos.length!==1||pos[0]!=='rocketlane'))throw Error('Unexpected argument; import requires rocketlane');if(cmd==='import'&&pos[0]!=='rocketlane')throw Error('Use import rocketlane');return {cmd,opts}}
function need(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=value`);return o[k].trim()}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date ${v}; use YYYY-MM-DD`);return v}
function number(v='0'){if(v===true||String(v).trim()===''||!Number.isFinite(Number(v))||Number(v)<0)throw Error(`Invalid nonnegative hours ${v}`);return Number(v)}
async function resolve(db,kind,value,project=null){if(!value)throw Error(`Missing ${kind} selector`);const rows=await db.query(`select * from onboarding.${kind} where (lower(name)=lower($1) or id::text ilike $2) ${project?'and project_id=$3':''} order by name,id`,project?[value,`${value}%`,project]:[value,`${value}%`]);if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${kind}: ${value}${rows.length?'\n'+rows.map(r=>`${r.id}  ${r.name}`).join('\n'):''}`);return rows[0]}
async function active(db,id){const [p]=await db.query('select * from onboarding.projects where id=$1',[id]);if(p.status!=='active')throw Error('Project is launched; reopen-project with evidence first');return p}
async function invalidate(db,milestone){await db.query('update onboarding.milestones set accepted_on=null,accepted_by=null,evidence=null where id=$1',[milestone])}
async function insert(db,kind,values){const keys=Object.keys(values);return (await db.query(`insert into onboarding.${kind} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0]}
const today=()=>new Date().toISOString().slice(0,10);
async function projectPack(db,selector){const p=await resolve(db,'projects',selector);return {project:(await db.query('select * from onboarding.project_health where id=$1',[p.id]))[0],milestones:await db.query('select * from onboarding.milestones where project_id=$1 order by due_on,name',[p.id]),tasks:await db.query('select * from onboarding.task_board where project_id=$1 order by due_on,name',[p.id]),updates:await db.query('select name,actor,logged_on,hours from onboarding.updates where project_id=$1 order by logged_on,id',[p.id])}}
async function action(db,cmd,o){
 if(cmd==='help')return commands.map(command=>({command,flags:spec[command].map(f=>`--${f}`).join(' ')}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='weekly-review')return {attention:await db.query(reads.attention),launches:await db.query(reads['launch-readiness']),privacy:await db.query(reads.compliance)};
 if(cmd==='kickoff'||cmd==='handover')return projectPack(db,need(o,'project'));
 if(cmd==='add-account')return insert(db,'accounts',{name:need(o,'name'),contact:o.contact||'',notice_evidence:o.notice||null,retention_review_on:o.retention?date(o.retention):null,security_review_on:o.security?date(o.security):null});
 if(cmd==='add-project'){const a=await resolve(db,'accounts',need(o,'account'));return insert(db,'projects',{account_id:a.id,name:need(o,'name'),owner:need(o,'owner'),starts_on:date(need(o,'start')),target_on:date(need(o,'due')),budget_hours:number(o.hours)})}
 if(cmd==='add-milestone'){const p=await resolve(db,'projects',need(o,'project'));await active(db,p.id);return insert(db,'milestones',{project_id:p.id,name:need(o,'name'),due_on:date(need(o,'due'))})}
 if(cmd==='add-task'){const p=await resolve(db,'projects',need(o,'project'));await active(db,p.id);const m=await resolve(db,'milestones',need(o,'milestone'),p.id);await invalidate(db,m.id);return insert(db,'tasks',{project_id:p.id,milestone_id:m.id,name:need(o,'name'),owner:need(o,'owner'),responsible:need(o,'responsible'),due_on:date(need(o,'due')),effort_hours:number(o.hours)})}
 if(cmd==='task-status'){
  const t=await resolve(db,'tasks',need(o,'task'));await active(db,t.project_id);const status=need(o,'status');
  if(!['todo','doing','waiting','done'].includes(status))throw Error('Invalid task status');
  if(status==='done'){need(o,'evidence');const [b]=await db.query('select blockers from onboarding.task_board where id=$1',[t.id]);if(b.blockers)throw Error('Complete prerequisites first')}
  if(t.status==='done'&&status!=='done'){const downstream=await db.query("select n.name from onboarding.dependencies d join onboarding.tasks n on n.id=d.task_id where d.needs_id=$1 and n.status='done'",[t.id]);if(downstream.length)throw Error('Reopen completed dependent tasks first: '+downstream.map(t=>t.name).join(', '))}
  await invalidate(db,t.milestone_id);return (await db.query('update onboarding.tasks set status=$2,evidence=$3,completed_on=$4 where id=$1 returning *',[t.id,status,o.evidence||null,status==='done'?today():null]))[0];
 }
 if(cmd==='depend'){
  const t=await resolve(db,'tasks',need(o,'task'));await active(db,t.project_id);const n=await resolve(db,'tasks',need(o,'needs'),t.project_id);
  if(t.status==='done')throw Error('Reopen completed task before adding dependencies');
  const cycle=await db.query('with recursive chain(id) as (select $1::uuid union select d.needs_id from onboarding.dependencies d join chain c on c.id=d.task_id) select id from chain where id=$2',[n.id,t.id]);
  if(cycle.length)throw Error('Dependency cycle refused');await invalidate(db,t.milestone_id);return insert(db,'dependencies',{project_id:t.project_id,task_id:t.id,needs_id:n.id});
 }
 if(cmd==='accept'){
  const m=await resolve(db,'milestones',need(o,'milestone'));await active(db,m.project_id);
  const [counts]=await db.query("select count(*)::int total,count(*) filter(where status!='done')::int unfinished from onboarding.tasks where milestone_id=$1",[m.id]);
  if(!counts.total||counts.unfinished)throw Error('Acceptance needs at least one task and every task done');
  return (await db.query('update onboarding.milestones set accepted_on=current_date,accepted_by=$2,evidence=$3 where id=$1 returning *',[m.id,need(o,'by'),need(o,'evidence')]))[0];
 }
 if(cmd==='launch'||cmd==='reopen-project'){
  const p=await resolve(db,'projects',need(o,'project'));const evidence=need(o,'evidence');
  if(cmd==='launch'){await active(db,p.id);const [r]=await db.query('select ready from onboarding.launch_readiness where id=$1',[p.id]);if(!r.ready)throw Error('Launch needs completed tasks and accepted milestones');return (await db.query("update onboarding.projects set status='launched',launched_on=current_date,launch_evidence=$2 where id=$1 returning *",[p.id,evidence]))[0]}
  if(p.status!=='launched')throw Error('Project is already active');
  await db.query('update onboarding.milestones set accepted_on=null,accepted_by=null,evidence=null where project_id=$1',[p.id]);
  return (await db.query("update onboarding.projects set status='active',launched_on=null,launch_evidence=null where id=$1 returning *",[p.id]))[0];
 }
 if(cmd==='log'){const p=await resolve(db,'projects',need(o,'project'));const d=o.date?date(o.date):today();if(d>today())throw Error('An update cannot be future dated');return insert(db,'updates',{project_id:p.id,name:need(o,'note'),actor:need(o,'actor'),logged_on:d,hours:number(o.hours)})}
 if(cmd==='review-privacy'){const a=await resolve(db,'accounts',need(o,'account'));return (await db.query('update onboarding.accounts set notice_evidence=$2,retention_review_on=$3,security_review_on=$4 where id=$1 returning *',[a.id,need(o,'notice'),date(need(o,'retention')),date(need(o,'security'))]))[0]}
 if(cmd==='import')return importRocketlane(db,o);
 if(cmd==='export'){
  const out={format:'customer-onboarding-v1',exported_at:new Date().toISOString()};
  for(const k of ['accounts','projects','milestones','tasks','dependencies','updates','activity'])out[k]=await db.query(`select * from onboarding.${k} order by id`);
  if(!o.out)return out;const file=path.resolve(need(o,'out'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n',{flag:'wx',mode:0o600});return {file,records:Object.values(out).filter(Array.isArray).reduce((n,r)=>n+r.length,0)};
 }
 if(cmd.startsWith('draft-')){
  const pack=await projectPack(db,need(o,'project'));const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`${cmd}-${pack.project.id}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# DRAFT: ${cmd==='draft-status'?'Customer status update':'Handover record'}\n\nPrivate working draft. Review recipients and facts before sharing.\n\n${human(pack)}\n`,{flag:'wx',mode:0o600});return {file};
 }
 throw Error('Command has no implementation');
}
function hash(v){return createHash('sha256').update(JSON.stringify(v)).digest('hex')}
async function importRocketlane(db,o){
 const mapping=o.mapping?JSON.parse(fs.readFileSync(need(o,'mapping'),'utf8')):{};
 const field=(row,kind,key,...aliases)=>{const mapped=mapping[kind]?.[key];return mapped?pick(row,mapped):pick(row,...aliases)};
 const projects=parseCsv(fs.readFileSync(need(o,'projects'),'utf8')),tasks=parseCsv(fs.readFileSync(need(o,'tasks'),'utf8'));
 if(!projects.length||!tasks.length)throw Error('Both project and task CSV files need records');
 const counts={projects:0,tasks:0,skipped:0,dry_run:Boolean(o['dry-run'])},seen=new Set(),projectLookup=new Map();
 for(const row of projects){
  const name=field(row,'projects','name','Project name','Project','Name').trim(),customer=field(row,'projects','customer','Customer','Company','Customer name').trim(),owner=field(row,'projects','owner','Project owner','Owner').trim();
  if(!name||!customer||!owner)throw Error('Project CSV needs project name, customer and owner');
  const source_id='rocketlane:'+ (field(row,'projects','id','Project ID','ID').trim()||`${customer}/${name}`);
  if(seen.has(source_id))throw Error('Duplicate project source ID');seen.add(source_id);
  const starts_on=date(field(row,'projects','start','Start Date','Start date')),target_on=date(field(row,'projects','due','Due Date','End Date','Due date'));
  const source_hash=hash(row);let [p]=await db.query('select * from onboarding.projects where source_id=$1',[source_id]);
  if(p){if(p.source_hash!==source_hash)throw Error(`Changed project export ${source_id}; reconcile before importing`);counts.skipped++}
  else{
   const accounts=await db.query('select * from onboarding.accounts where lower(name)=lower($1)',[customer]);if(accounts.length>1)throw Error('Ambiguous imported customer');
   const a=accounts[0]||await insert(db,'accounts',{name:customer});
   p=await insert(db,'projects',{name,account_id:a.id,owner,starts_on,target_on,source_id,source_hash,source_data:JSON.stringify(row),budget_hours:0});
   await insert(db,'milestones',{project_id:p.id,name:'Imported plan',due_on:target_on});counts.projects++;
  }
  const keys=[name,field(row,'projects','id','Project ID','ID')].filter(Boolean);
  for(const k of keys){const key=k.toLowerCase();if(projectLookup.has(key)&&projectLookup.get(key)!==p.id)throw Error('Ambiguous project name; split source export');projectLookup.set(key,p.id)}
 }
 seen.clear();
 for(const row of tasks){
  const name=field(row,'tasks','name','Task name','Task','Name').trim(),project=field(row,'tasks','project','Project ID','Project','Project name').trim();
  const project_id=projectLookup.get(project.toLowerCase());if(!project_id||!name)throw Error('Task CSV needs a project in this export and a task name');
  const owner=field(row,'tasks','owner','Assignee','Owner').trim();if(!owner)throw Error(`Task ${name}: missing assignee`);
  const source_id='rocketlane:'+(field(row,'tasks','id','Task ID','ID').trim()||`${project_id}/${name}`);
  if(seen.has(source_id))throw Error('Duplicate task source ID');seen.add(source_id);
  const statusText=field(row,'tasks','status','Status').trim().toLowerCase();
  const statuses={'to do':'todo',todo:'todo','not started':'todo','in progress':'doing',doing:'doing',waiting:'waiting',blocked:'waiting',completed:'done',complete:'done',done:'done'};
  const status=statuses[statusText];if(!status)throw Error(`Unknown task status ${statusText}; map it before importing`);
  const who=field(row,'tasks','responsible','Responsible').trim().toLowerCase();
  const responsible={internal:'internal',team:'internal',customer:'customer',client:'customer'}[who];if(!responsible)throw Error(`Unknown responsible value ${who}; use internal or customer`);
  const due_on=date(field(row,'tasks','due','Due Date','Due date'));
  const source_hash=hash(row);const [existing]=await db.query('select * from onboarding.tasks where source_id=$1',[source_id]);
  if(existing){if(existing.source_hash!==source_hash||existing.project_id!==project_id)throw Error(`Changed task export ${source_id}; reconcile before importing`);counts.skipped++;continue}
  await active(db,project_id);
  const [m]=await db.query("select id from onboarding.milestones where project_id=$1 and name='Imported plan'",[project_id]);if(!m)throw Error('Imported plan milestone missing');
  await invalidate(db,m.id);
  await insert(db,'tasks',{project_id,milestone_id:m.id,name,owner,responsible,due_on,status,source_id,source_hash,source_data:JSON.stringify(row),evidence:status==='done'?'Completion reported in Rocketlane export; acceptance still required':null,completed_on:status==='done'?today():null});counts.tasks++;
 }
 return counts;
}
export async function run(db,args){const {cmd,opts}=parse(args);if(!writeCommands.has(cmd))return action(db,cmd,opts);need(opts,'actor');await db.exec('BEGIN');try{
 await db.exec('LOCK TABLE onboarding.projects IN SHARE ROW EXCLUSIVE MODE');
 const out=await action(db,cmd,opts);
 if(cmd==='import'&&opts['dry-run']){await db.exec('ROLLBACK');return out}
 await insert(db,'activity',{name:cmd,actor:opts.actor,detail:JSON.stringify({options:opts,result:out})});await db.exec('COMMIT');return out;
 }catch(e){await db.exec('ROLLBACK');throw e}}
export function human(value){if(Array.isArray(value)){if(!value.length)return '(none)';const hidden=new Set(['id','source_data','source_hash','updated_at','created_at','project_id','milestone_id','account_id']);const cols=Object.keys(value[0]).filter(k=>!hidden.has(k));return table(value,cols.map(key=>({key,label:key,width:key==='id'?8:50,format:v=>v&&typeof v==='object'?JSON.stringify(v):v}))) }if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>Array.isArray(v)||v&&typeof v==='object'?`\n${k}\n${human(v)}`:`${k}: ${v??''}`).join('\n');return String(value)}
if(process.argv[1]&&path.resolve(process.argv[1])===path.join(REPO_ROOT,'scripts/onboarding.mjs')){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result))}catch(e){if(process.argv.includes('--json'))console.log(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1}finally{await db?.close()}}
