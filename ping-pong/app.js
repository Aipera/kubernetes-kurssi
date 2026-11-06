const http = require('node:http');
const { readFileSync, writeFileSync, renameSync } = require('node:fs');

const countFile = '/persistent/count.txt';

function readCount() {
  try {
    return Number(readFileSync(countFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return 0;
    throw error;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/pingpong') {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const count = readCount();
    writeFileSync(`${countFile}.tmp`, `${count + 1}\n`);
    renameSync(`${countFile}.tmp`, countFile);

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`pong ${count}\n`);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Could not update the counter.\n');
  }
});

server.listen(3000, '0.0.0.0');