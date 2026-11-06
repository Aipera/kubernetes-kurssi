const http = require('node:http');

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html lang="fi"><meta charset="utf-8"><title>Todo app</title><h1>Todo app</h1><p>Sovellus toimii Kubernetesissa.</p></html>');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Sivua ei löydy');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server started in port ${port}`);
});