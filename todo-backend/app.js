const http = require('node:http');
const { Pool } = require('pg');

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

if (!host || !todosPath?.startsWith('/')) {
  throw new Error('HOST and TODOS_PATH are required');
}

const pool = new Pool({ connectionTimeoutMillis: 5000 });
pool.on('error', (error) => console.error('PostgreSQL connection error:', error));

async function initializeTodos() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      text text NOT NULL
    )
  `);

  if (process.env.INITIAL_TODOS === undefined) return;

  const initialTodos = JSON.parse(process.env.INITIAL_TODOS);
  if (!Array.isArray(initialTodos) || initialTodos.some((text) => typeof text !== 'string')) {
    throw new Error('INITIAL_TODOS must be a JSON array of strings');
  }

  await pool.query(`
    INSERT INTO todos (text)
    SELECT seed.text
    FROM unnest($1::text[]) WITH ORDINALITY AS seed(text, position)
    WHERE NOT EXISTS (SELECT 1 FROM todos)
    ORDER BY seed.position
  `, [initialTodos]);
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

  const requestLog = { event: 'todo_request', method: req.method, path: req.url };
  if (req.method === 'POST') {
    res.once('finish', () => {
      console.log(JSON.stringify({ ...requestLog, status: res.statusCode }));
    });
  }

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT text FROM todos ORDER BY id');
      sendJson(res, 200, rows.map((row) => row.text));
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      sendJson(res, 405, { error: 'Pyyntötyyppiä ei tueta.' });
      return;
    }

    const chunks = [];
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes <= maxBodyBytes) chunks.push(chunk);
      }
    } catch {
      return;
    }

    if (bytes > maxBodyBytes) {
      requestLog.reason = 'body_too_large';
      requestLog.bodyBytes = bytes;
      sendJson(res, 413, { error: 'Pyyntö on liian suuri.' });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      requestLog.reason = 'invalid_json';
      sendJson(res, 400, { error: 'Pyynnön pitää sisältää kelvollista JSONia.' });
      return;
    }

    const submittedText = typeof payload?.text === 'string' ? payload.text : '';
    const text = submittedText.trim();
    requestLog.text = submittedText;
    requestLog.length = text.length;

    if (text.length < 1 || text.length > maxTodoLength) {
      requestLog.reason = text.length > maxTodoLength ? 'too_long' : 'empty_or_invalid';
      sendJson(res, 400, {
        error: `Tehtävän pituuden pitää olla 1–${maxTodoLength} merkkiä.`
      });
      return;
    }

    await pool.query('INSERT INTO todos (text) VALUES ($1)', [text]);
    requestLog.reason = 'accepted';
    sendJson(res, 201, { text });
  } catch (error) {
    requestLog.reason = 'database_error';
    console.error('Todo database query failed:', error);
    sendJson(res, 503, { error: 'Tietokanta ei ole juuri nyt käytettävissä.' });
  }
});

initializeTodos()
  .then(() => server.listen(port, host))
  .catch(async (error) => {
    console.error('Could not initialize todos:', error);
    process.exitCode = 1;
    await pool.end();
  });