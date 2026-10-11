create or replace view onboarding.privacy_review as
select id,name,
 nullif(concat_ws('; ',case when coalesce(trim(notice_evidence),'')='' then 'Notice evidence missing (IPP3/3A)' end,
 case when retention_review_on is null or retention_review_on<current_date then 'Retention review due (IPP9)' end,
 case when security_review_on is null or security_review_on<current_date then 'Security review due (IPP5)' end),'') finding
from onboarding.accounts;
