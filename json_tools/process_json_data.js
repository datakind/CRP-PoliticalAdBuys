const fs = require('fs');
const process = require('process');

const opts = require("node-getopt").create([
    ['h',   'help',       'display this help'],
    ['' ,   'file=ARG',   'JSON data file'],
    ['' ,   'count',      'count rows in file'],
    ['' ,   'first=ARG',  'first row to display'],
    ['' ,   'last=ARG',   'last row to display'],
    ['' ,   'findmoney',   'look for dollar amounts'],
  ])
    .bindHelp()
    .parseSystem()
;


let rowCount = 0;
let displayRange = {start: -1, end: -1};


// --- counter function
function count(row) {
  rowCount++;
  //if (rowCount % 1000 === 0) console.log("... %d", rowCount)
}
function countFinalize() {
  console.log("row count: ", rowCount);
}


// --- display function
function display(row) {
    rowCount++;
    if (rowCount >= displayRange.start && rowCount <= displayRange.end) {
      console.log(row);
    }
    if (rowCount > displayRange.end) {
      process.exit(0);
    }
}


// --- search for dollar amounts
function findMoney(row) {
  rowCount++;
  
  if (displayRange.start >= 0 && rowCount < displayRange.start)
    return;
  if (displayRange.end >= 0 && rowCount > displayRange.end) 
    process.exit(0);
  
  if ( !row.invoice_in_name && !row.invoice_in_content) {
    return;
  }
  
  let content = row.content;
  
  var re = /\$(\d+(,\d+)*)/g;
  var matches = content.match(re);
  if (matches) {
    matches.sort(function(strA, strB) {
      // remove commas inside numbers
      strA = strA.split(',').join('');
      strB = strB.split(',').join('');
      
      var numA = parseInt(strA.substr(1), 10);
      var numB = parseInt(strB.substr(1), 10);
      if (numA < numB) return -1;
      if (numA > numB) return 1;
      return 0;
    });
    console.log("row %d -- highest dollar amount match: %s    (PDF url: %s)", rowCount, matches[matches.length - 1], row.url);
  }
}



// --- main ---

// -- choose the processing function
let processFunc = null;
let finalizeFunc = null;

if (opts.options.count) {
  processFunc = count;
  finalizeFunc = countFinalize;
}

if (opts.options.first !== undefined && opts.options.last !== undefined) {
  displayRange.start = parseInt(opts.options.first, 10);
  displayRange.end = parseInt(opts.options.last, 10);
  processFunc = display;
}

if (opts.options.findmoney) {
  processFunc = findMoney;
}

if ( !processFunc) {
  console.log("** nothing to do. please try --help argument for instructions on available commands.")
  process.exit(1);
}


// -- open input file
if ( !opts.options.file) {
  console.log("** no input file. please try --help argument for instructions on available commands.")
  process.exit(1);
}
const jsonFile = opts.options.file;
let fsize = fs.statSync(jsonFile).size;
if (fsize < 1) {
  console.log("** no data file.");
  process.exit(1);
}
let fd = fs.openSync(jsonFile, 'r');

//console.log("data file size is: %d", fsize);

// read buffered
let numRows = 0;
let totalRead = 0;
let bufsize = 64*1024;
let fbuf = Buffer.alloc(bufsize);
let lineBuf = Buffer.alloc(0);
let iters = 0;
while (totalRead < fsize) {
  let numRead = fs.readSync(fd, fbuf, 0, bufsize, totalRead);
  if (numRead < 1)
    break;
  
  let buf = fbuf.slice(0, numRead);
  
  let idx = 0;
  let nextIdx;
  while ((nextIdx = buf.indexOf('\n', idx)) !== -1) {
    //lastLine += str.substr(idx, nextIdx - idx);
    lineBuf = Buffer.concat([lineBuf, buf.slice(idx, nextIdx)]);
    
    idx = nextIdx + 1;
    
    numRows++;
    
    let lineStr = lineBuf.toString();
    //console.log("row %d (iter %d), line length %d bytes -> %d chars", numRows, iters, lineBuf.length, lineStr.length);
    
    if (lineStr.length > 0) {
      try {
        let row = JSON.parse(lineStr);
        processFunc(row);
      } catch (e) {
        //console.log("** couldn't parse: ", lastLine);
        console.log("** error at row %d: ", numRows, e);
        process.exit(1);
      }      
    }
        
    lineBuf = Buffer.alloc(0);
  }
  lineBuf = Buffer.concat([lineBuf, buf.slice(idx)]);
  
  totalRead += numRead;
  iters++;
}

//console.log("total bytes read %d, iterations %d, parsed rows %d", totalRead, iters, numRows)

if (finalizeFunc) finalizeFunc();
