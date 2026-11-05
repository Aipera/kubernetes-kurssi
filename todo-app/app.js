const http = require('node:http');

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  res.end('Todo app\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server started in port ${port}`);
});