const http = require('node:http');
const { readFile, rename, stat, writeFile } = require('node:fs/promises');

const port = Number(process.env.PORT ?? 3000);
const imagePath = '/cache/image.jpg';
const maxAgeMs = 10 * 60 * 1000;
let download;

async function downloadImage() {
  const response = await fetch(`https://picsum.photos/1200?random=${Date.now()}`, {
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`Picsum returned HTTP ${response.status}`);
  }

  const image = Buffer.from(await response.arrayBuffer());
  await writeFile(`${imagePath}.tmp`, image);
  await rename(`${imagePath}.tmp`, imagePath);
  return image;
}

async function getImage() {
  const cached = await stat(imagePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

  if (cached && Date.now() - cached.mtimeMs < maxAgeMs) {
    return readFile(imagePath);
  }

  if (!download) {
    download = downloadImage().finally(() => {
      download = undefined;
    });
  }

  return download;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Todo App</title>
  <style>
    body { margin: 2rem; text-align: center; font-family: system-ui, sans-serif; }
    img { width: min(100%, 600px); height: auto; border-radius: 12px; }
  </style>
</head>
<body>
  <h1>Todo App</h1>
  <img src="/image.jpg" alt="Satunnainen kuva Lorem Picsumista">
  <p>DevOps with Kubernetes 2026</p>
</body>
</html>`);
    return;
  }

  if (req.method === 'GET' && req.url === '/image.jpg') {
    try {
      const image = await getImage();
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store'
      });
      res.end(image);
    } catch (error) {
      console.error(error);
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Kuvaa ei saatu ladattua.');
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server started in port ${port}`);
});