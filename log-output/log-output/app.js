const http = require('node:http');
const { readFile } = require('node:fs');

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/log') {
    res.writeHead(404);
    res.end();
    return;
  }

  readFile('/shared/output.log', 'utf8', (error, content) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 503 : 500);
      res.end('Log file is not available yet.\n');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(content);
  });
});

server.listen(3000, '0.0.0.0');