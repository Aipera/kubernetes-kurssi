const http = require('node:http');
const { randomUUID } = require('node:crypto');

const id = randomUUID();

function currentStatus() {
  return `${new Date().toISOString()}: ${id}`;
}

setInterval(() => {
  console.log(currentStatus());
}, 5000);

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/log') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`${currentStatus()}\n`);
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3000, '0.0.0.0');