const http = require('node:http');
const { readFile } = require('node:fs/promises');

async function readPingCount() {
  try {
    return (await readFile('/persistent/count.txt', 'utf8')).trim();
  } catch (error) {
    if (error.code === 'ENOENT') return '0';
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' || req.url !== '/log') {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const log = await readFile('/shared/output.log', 'utf8');
    const latestLine = log.trimEnd().split('\n').at(-1);
    const count = await readPingCount();

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`${latestLine}\nPing / Pongs: ${count}\n`);
  } catch (error) {
    console.error(error);
    res.writeHead(error.code === 'ENOENT' ? 503 : 500);
    res.end('Log data is not available.\n');
  }
});

server.listen(3000, '0.0.0.0');