const http = require('node:http');

const todos = [
  'Opettele Kubernetesin perusteet',
  'Vie sovellus klusteriin',
  'Ota käyttöön pysyvä tallennustila'
];

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.url !== '/todos') {
    sendJson(res, 404, { error: 'Reittiä ei löydy.' });
    return;
  }

  if (req.method === 'GET') {
    sendJson(res, 200, todos);
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: 'Pyyntötyyppiä ei tueta.' });
    return;
  }

  let body = '';
  let bytes = 0;

  try {
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes <= 4096) body += chunk;
    }
  } catch {
    return;
  }

  if (bytes > 4096) {
    sendJson(res, 413, { error: 'Pyyntö on liian suuri.' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    sendJson(res, 400, { error: 'Pyynnön pitää sisältää kelvollista JSONia.' });
    return;
  }

  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  if (text.length < 1 || text.length > 140) {
    sendJson(res, 400, { error: 'Tehtävän pituuden pitää olla 1–140 merkkiä.' });
    return;
  }

  todos.push(text);
  sendJson(res, 201, { text });
});

server.listen(3000, '0.0.0.0');