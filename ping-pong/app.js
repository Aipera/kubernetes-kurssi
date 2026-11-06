const http = require('node:http');

let count = 0;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/pingpong') {
    const response = `pong ${count}\n`;
    count += 1;

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(response);
    return;
  }

  if (req.method === 'GET' && req.url === '/pongs') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`${count}\n`);
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3000, '0.0.0.0');