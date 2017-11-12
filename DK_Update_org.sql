--11/12/2017
--SQL to update the organization names based on the new table.
--DK_FCCorgsstandardized Table is an import from Python code.

--Update the table with New organization names
update DK_FCCorgsstandardized
set neworgname=t2.NewOrgname
from DK_FCCorgsstandardized t1
join new_orgnames t2 on t1.docid=t2.docid


--Query to show the the comparision
select docid,neworgname 'New Name',orgnamecrp 'OLD name'
from DK_FCCorgsstandardized
where neworgname is not null
and (orgnamecrp is null or orgnamecrp='UBER')
order by docid