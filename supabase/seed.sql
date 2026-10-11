insert into onboarding.accounts(id,name,contact,notice_evidence,retention_review_on,security_review_on) values
('10000000-0000-0000-0000-000000000001','Harbour Analytics','Mira Chen','Demo collection notice reviewed',current_date+90,current_date+30),
('10000000-0000-0000-0000-000000000002','Kauri Systems','Leo Patel',null,current_date-2,current_date-3)
on conflict do nothing;
insert into onboarding.projects(id,account_id,name,owner,starts_on,target_on,budget_hours) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Harbour rollout','Aroha',current_date-30,current_date+7,40),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Kauri migration','Ben',current_date-21,current_date-2,24),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Harbour pilot','Aroha',current_date-14,current_date+1,16)
on conflict do nothing;
insert into onboarding.milestones(id,project_id,name,due_on,accepted_by,accepted_on,evidence) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Data ready',current_date-1,null,null,null),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Acceptance',current_date-2,null,null,null),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Pilot acceptance',current_date,'Mira Chen',current_date,'Demo signed checklist PA-01')
on conflict do nothing;
insert into onboarding.tasks(id,project_id,milestone_id,name,owner,responsible,due_on,status,effort_hours,evidence,completed_on) values
('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Supply customer records','Mira','customer',current_date-3,'waiting',2,null,null),
('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Validate records','Aroha','internal',current_date-1,'todo',6,null,null),
('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Approve migration rehearsal','Leo','customer',current_date-4,'waiting',3,null,null),
('40000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','Run pilot checklist','Aroha','internal',current_date-1,'done',8,'Demo checklist PA-01',current_date-1)
on conflict do nothing;
insert into onboarding.dependencies(id,project_id,task_id,needs_id) values
('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001') on conflict do nothing;
insert into onboarding.updates(id,project_id,name,actor,logged_on,hours) values
('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Waiting for approved customer records','Aroha',current_date-2,12),
('60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Rehearsal complete; customer review outstanding','Ben',current_date-12,28),
('60000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Pilot accepted','Aroha',current_date,10)
on conflict do nothing;
