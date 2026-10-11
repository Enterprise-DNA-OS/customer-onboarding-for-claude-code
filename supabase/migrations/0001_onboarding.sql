create schema onboarding;
revoke all on schema onboarding from public;
create function onboarding.touch() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end$$;
create table onboarding.accounts (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name))>0),
 contact text not null default '', notice_evidence text, retention_review_on date, security_review_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table onboarding.projects (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references onboarding.accounts,
 name text not null check(length(trim(name))>0), owner text not null check(length(trim(owner))>0),
 starts_on date not null, target_on date not null, status text not null default 'active' check(status in ('active','launched')),
 budget_hours numeric not null default 0 check(budget_hours>=0), launched_on date, launch_evidence text,
 source_id text unique, source_data jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(target_on>=starts_on), check(status!='launched' or (launched_on is not null and length(trim(coalesce(launch_evidence,'')))>0))
);
create table onboarding.milestones (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references onboarding.projects,
 name text not null check(length(trim(name))>0), due_on date not null, accepted_by text, accepted_on date, evidence text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(project_id,id), unique(project_id,name),
 check(accepted_on is null or (length(trim(coalesce(accepted_by,'')))>0 and length(trim(coalesce(evidence,'')))>0))
);
create table onboarding.tasks (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references onboarding.projects,
 milestone_id uuid not null, name text not null check(length(trim(name))>0), owner text not null check(length(trim(owner))>0),
 responsible text not null check(responsible in ('internal','customer')), due_on date not null,
 status text not null default 'todo' check(status in ('todo','doing','waiting','done')), evidence text,
 effort_hours numeric not null default 0 check(effort_hours>=0), completed_on date,
 source_id text unique, source_data jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,id),
 foreign key(project_id,milestone_id) references onboarding.milestones(project_id,id),
 check(status!='done' or (completed_on is not null and length(trim(coalesce(evidence,'')))>0))
);
create table onboarding.dependencies (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references onboarding.projects,
 task_id uuid not null, needs_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(task_id,needs_id),
 foreign key(project_id,task_id) references onboarding.tasks(project_id,id),
 foreign key(project_id,needs_id) references onboarding.tasks(project_id,id), check(task_id<>needs_id)
);
create table onboarding.updates (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references onboarding.projects,
 name text not null check(length(trim(name))>0), actor text not null, logged_on date not null default current_date,
 hours numeric not null default 0 check(hours>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table onboarding.activity (
 id uuid primary key default gen_random_uuid(), name text not null, actor text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$declare n text; begin foreach n in array array['accounts','projects','milestones','tasks','dependencies','updates','activity'] loop
 execute format('create trigger touch before update on onboarding.%I for each row execute function onboarding.touch()',n);
 execute format('alter table onboarding.%I enable row level security',n);
 execute format('revoke all on onboarding.%I from public',n);
end loop; end$$;
create view onboarding.task_board as
select t.id,t.project_id,p.name project,m.name milestone,t.name,t.owner,t.responsible,t.status,t.due_on,t.effort_hours,
 (t.status!='done' and t.due_on<current_date) overdue,
 (select count(*)::int from onboarding.dependencies d join onboarding.tasks n on n.id=d.needs_id where d.task_id=t.id and n.status!='done') blockers
from onboarding.tasks t join onboarding.projects p on p.id=t.project_id join onboarding.milestones m on m.id=t.milestone_id;
create view onboarding.launch_readiness as
select p.id,p.name,a.name customer,p.owner,p.status,p.target_on,
 (select count(*)::int from onboarding.tasks t where t.project_id=p.id and t.status!='done') open_tasks,
 (select count(*)::int from onboarding.milestones m where m.project_id=p.id and m.accepted_on is null) unaccepted,
 (select count(*)::int from onboarding.milestones m where m.project_id=p.id) milestones,
 (exists(select 1 from onboarding.milestones m where m.project_id=p.id)
 and exists(select 1 from onboarding.tasks t where t.project_id=p.id)
 and not exists(select 1 from onboarding.tasks t where t.project_id=p.id and t.status!='done')
 and not exists(select 1 from onboarding.milestones m where m.project_id=p.id and (m.accepted_on is null or not exists(select 1 from onboarding.tasks t where t.milestone_id=m.id)))) ready
from onboarding.projects p join onboarding.accounts a on a.id=p.account_id;
create view onboarding.project_health as
select r.*,p.budget_hours,coalesce((select sum(u.hours) from onboarding.updates u where u.project_id=p.id),0) logged_hours,
 coalesce((select max(u.logged_on) from onboarding.updates u where u.project_id=p.id),p.starts_on) last_update,
 (select count(*)::int from onboarding.tasks t where t.project_id=p.id and t.responsible='customer' and t.status!='done') customer_waits
from onboarding.launch_readiness r join onboarding.projects p on p.id=r.id;
create view onboarding.privacy_review as
select id,name,
 nullif(concat_ws('; ',case when coalesce(trim(notice_evidence),'')='' then 'Notice evidence missing (IPP3)' end,
 case when retention_review_on is null or retention_review_on<current_date then 'Retention review due (IPP9)' end,
 case when security_review_on is null or security_review_on<current_date then 'Security review due (IPP5)' end),'') finding
from onboarding.accounts;
revoke all on all tables in schema onboarding from public;
