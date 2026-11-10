const http = require('node:http');

function positiveInteger(name, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new Error(`${name} must be an integer between 1 and ${max}`);
  }
  return value;
}

const port = positiveInteger('PORT', 65535);
const host = process.env.HOST;
const todosPath = process.env.TODOS_PATH;
const maxBodyBytes = positiveInteger('MAX_BODY_BYTES');
const maxTodoLength = positiveInteger('TODO_MAX_LENGTH');
const todos = JSON.parse(process.env.INITIAL_TODOS);

if (!host || !todosPath?.startsWith('/') || !Array.isArray(todos)) {
  throw new Error('HOST, TODOS_PATH and a JSON array in INITIAL_TODOS are required');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.url !== todosPath) {
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
      if (bytes <= maxBodyBytes) body += chunk;
    }
  } catch {
    return;
  }

  if (bytes > maxBodyBytes) {
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
  if (text.length < 1 || text.length > maxTodoLength) {
    sendJson(res, 400, {
      error: `Tehtävän pituuden pitää olla 1–${maxTodoLength} merkkiä.`
    });
    return;
  }

  todos.push(text);
  sendJson(res, 201, { text });
});

server.listen(port, host);