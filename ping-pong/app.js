const http = require('node:http');

let count = 0;

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/pingpong') {
    res.writeHead(404);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`pong ${count}\n`);
  count += 1;
});

server.listen(3000, '0.0.0.0');