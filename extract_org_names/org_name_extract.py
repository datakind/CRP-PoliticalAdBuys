import csv
import re
import pyodbc
from collections import OrderedDict, Counter

server = "datakind.opensecrets.org"
database = "fcc"
username = "datakind"
password = "dkdkdk123"
driver= "{ODBC Driver 13 for SQL Server}"

cnxn = pyodbc.connect(
    'DRIVER=' + driver + ';PORT=1433;SERVER=' + server + ';'
    'PORT=1443;DATABASE=' + database + ';UID=' + username + ';PWD=' + password
)

cursor = cnxn.cursor()
# Selects the rows in FccOrgsStandardized table which start with the word 'NCC Cable'
sql = """SELECT * FROM (
                SELECT
                  a.docID,
                  a.url,
                  a.orgnamecrp,
                  a.sourcestring,
                  b.content,
                  SUBSTRING(LTRIM(b.content), 1, 10) AS first10
                FROM FCCorgsstandardized AS a
                JOIN DK_data_documents AS b
                ON a.docID = b.id
              ) a
WHERE a.first10 = 'NCC Cable '"""

cursor.execute(sql)

pattern = re.compile("Advertiser(.*)Show")

with open("new_org_names.csv", "w", newline = "") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["docID", "OrgNameCrp", "NewOrgName"])
    for i in range(1, 1000):
    # row = True
    # while row:
        row = cursor.fetchone()
        if row:
            # print("Processing document {0}...".format(row.docID))
            result = pattern.search(row.content)
            if result:
                neworg = result.group(1).strip()
                writer.writerow([row.docID, row.orgnamecrp, neworg]) 
            else:
                print("WARNING: extracted org name is empty for doc ID {}.".format(row.docID))


print("Done.")
csvfile.close()
    



          
