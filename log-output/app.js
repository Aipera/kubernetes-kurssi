const http = require('node:http');
const { readFile } = require('node:fs/promises');

async function readPingCount() {
  const response = await fetch('http://ping-pong/pongs', {
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`Ping-pong returned HTTP ${response.status}`);
  }

  return (await response.text()).trim();
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' || req.url !== '/log') {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const information = await readFile('/config/information.txt', 'utf8');
    const log = await readFile('/shared/output.log', 'utf8');
    const latestLine = log.trimEnd().split('\n').at(-1);
    const count = await readPingCount();

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(
      `file content: ${information}\n` +
      `env variable: MESSAGE=${process.env.MESSAGE}\n` +
      `${latestLine}\n` +
      `Ping / Pongs: ${count}\n`
    );
  } catch (error) {
    console.error(error);
    res.writeHead(error.code === 'ENOENT' ? 503 : 500);
    res.end('Log data is not available.\n');
  }
});

server.listen(3000, '0.0.0.0');