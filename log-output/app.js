const http = require('node:http');
const { readFile } = require('node:fs/promises');

async function readServiceText(url, service) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`${service} returned HTTP ${response.status}`);
  }

  return (await response.text()).trim();
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('ok\n');
    return;
  }

  if (req.method !== 'GET' || req.url !== '/log') {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const information = await readFile('/config/information.txt', 'utf8');
    const log = await readFile('/shared/output.log', 'utf8');
    const latestLine = log.trimEnd().split('\n').at(-1);
    const [count, greeting] = await Promise.all([
      readServiceText(process.env.PING_PONG_URL || 'http://ping-pong/pongs', 'Ping-pong'),
      process.env.GREETER_URL
        ? readServiceText(process.env.GREETER_URL, 'Greeter')
        : undefined
    ]);

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(
      `file content: ${information.trimEnd()}\n` +
      `env variable: MESSAGE=${process.env.MESSAGE ?? ''}\n` +
      `${latestLine}\n` +
      `Ping / Pongs: ${count}\n` +
      (greeting === undefined ? '' : `Greeting: ${greeting}\n`)
    );
  } catch (error) {
    console.error(error);
    res.writeHead(error.code === 'ENOENT' ? 503 : 500);
    res.end('Log data is not available.\n');
  }
});

server.listen(Number(process.env.PORT || 3000), '0.0.0.0');
