const http = require('node:http');

const version = process.env.GREETER_VERSION || 'v1';
const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' || (req.url !== '/' && req.url !== '/healthz')) {
    res.writeHead(404);
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Greeter-Version': version
  });
  res.end(req.url === '/healthz' ? 'ok\n' : 'Hello from greeter ' + version + '\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log('Greeter ' + version + ' listening on port ' + port);
});
