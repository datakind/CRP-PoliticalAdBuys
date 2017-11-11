import pyodbc
#source venv/bin/activate

server = "datakind.opensecrets.org"
database = "fcc"
tablename = "dk_data_documents"
username = "datakind"
password = "dkdkdk123"
driver= "{ODBC Driver 13 for SQL Server}"
cnxn = pyodbc.connect(
    'DRIVER='+driver+';PORT=1433;SERVER='+server+';'
    'PORT=1443;DATABASE='+database+';UID='+username+';PWD='+ password
)
cursor = cnxn.cursor()

sql = "select top 5 * from dk_data_documents"

cursor.execute(sql)

rows = cursor.fetchall()

for row in rows:
    print(row)