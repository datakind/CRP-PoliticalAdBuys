const fs = require('fs');
const process = require('process');

const tdsConnection = require('tedious').Connection;
const tdsRequest = require('tedious').Request;
const tdsTypes = require('tedious').TYPES;

const opts = require("node-getopt").create([
    ['h',   'help',           'display this help'],
    ['' ,   'outputfile=ARG',   'name of output file'],
    ['' ,   'server=ARG',       'MS SQL database server (e.g. database.example.com)'],
    ['' ,   'username=ARG',     'SQL username'],
    ['' ,   'password=ARG',     'SQL password'],
    ['' ,   'database=ARG',     'SQL database name'],
    ['' ,   'table=ARG',        'SQL database table name'],
  ])
    .bindHelp()
    .parseSystem()
;

if ( !opts.options.outputfile || opts.options.outputfile.length < 1) {
  console.log("** no output file specified. try --help for usage info.");
  process.exit(1);
}

const jsonFile = opts.options.outputfile;
let fd = fs.openSync(jsonFile, 'w');



const dbConfig = {
  server:   opts.options.server,
  userName: opts.options.username,
  password: opts.options.password,
  options: {
    encrypt: true,
    database: opts.options.database,
    requestTimeout: 5000,
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


let rowsWritten = 0;

function runDbQuery() {
  req = new tdsRequest(`SELECT * FROM dbo.${opts.options.table};`, (err, rowCount, rows) => {
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
