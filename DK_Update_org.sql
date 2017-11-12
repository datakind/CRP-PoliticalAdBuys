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

--For the records that doesn't get match using the python code, Run SQL string functions 
--Some are in the code below.
--Keep runing the search until you find satistfactory match.
--Use STUFF, PATINDEX, CHARINDEX, REPLACE, SUBSTRING, LEFT and RIGHT to run string manipulation.

select t1.id,t1.url,substring(content,CHARINDEX('Advertiser',content,1)+10,250)
--charindex('Advertiser                                      Product                           Estimate Number Billing Address:                                                        ',content,1)
from DK_documents t1
join FCCorgsstandardized t2 on t1.id=t2.docID
where t2.orgnamecrp is null
and t1.content like '%Advertiser%Product%Estimate Number%'

select t1.id,t1.url,substring(content,CHARINDEX('Advertiser',content,1)+10,250)
--charindex('Advertiser                                      Product                           Estimate Number Billing Address:                                                        ',content,1)
from DK_documents t1
join FCCorgsstandardized t2 on t1.id=t2.docID
where t2.orgnamecrp is null
and t1.content like '%Advertiser%'
