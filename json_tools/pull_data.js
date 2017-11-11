const fs = require('fs');
const process = require('process');

const tdsConnection = require('tedious').Connection;
const tdsRequest = require('tedious').Request;
const tdsTypes = require('tedious').TYPES;



const dbConfig = {
  server: "datakind.opensecrets.org",
  userName: "datakind",
  password: "dkdkdk123",
  options: {
    encrypt: true,
    database: "fcc",
    requestTimeout: 3000,
    debug: {
      //packet: true
    },
    useColumnNames: true
  } 
};

let conn = new tdsConnection(dbConfig);

conn.on('connect', err => {
  if (err) {
    console.log("** error connecting to db: ", err)
    return;
  }
  console.log("connected to db");
  
  runDbQuery();
});
conn.on('error', err => {
  console.log("** connection error: ", err);
});
/*conn.on('debug', msg => {
  console.log("connection debug msg: ", msg);
});
conn.on('infoMessage', msg => {
  console.log("connection info msg: ", msg);
});*/


const jsonFile = `${__dirname}/data.json`;
let fd = fs.openSync(jsonFile, 'w');

let rowsWritten = 0;

function runDbQuery() {
  req = new tdsRequest("SELECT * FROM dbo.DK_data_documents;", (err, rowCount, rows) => {
    if (err) {
      console.log("** request failed: ", err);
      return;
    }
    console.log("request complete, %d rows read, %d rows written to file", rowCount, rowsWritten);
    process.exit(0);
  });
  
  let rowsDone = 0;
  
  req.on('row', (cols) => {
    //console.log("row: ", cols);
    let json = {};
    for (let key in cols) {
      let value = cols[key].value;
      json[key] = value;
    }
    //console.log("row json: ", json);
    
    rowsDone++;
    
    try {
      const s = JSON.stringify(json);
      const buf = new Buffer(s);
      fs.writeSync(fd, buf);
      fs.writeSync(fd, '\n');
      rowsWritten++;
      console.log("row %d, json length %d (%d bytes); file size now %d", rowsDone, s.length, buf.length, fs.statSync(jsonFile).size);
    } catch (e) {
      console.log("** row %d: error writing to file: ", rowsDone, e);
      process.exit(1);      
    }
  });

  console.log("running request...");
  conn.execSql(req);
}
