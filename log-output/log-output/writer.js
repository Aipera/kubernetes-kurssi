const { randomUUID } = require('node:crypto');
const { appendFileSync } = require('node:fs');

const id = randomUUID();
const logFile = '/shared/output.log';

function writeLine() {
  appendFileSync(logFile, `${new Date().toISOString()}: ${id}\n`);
}

writeLine();
setInterval(writeLine, 5000);