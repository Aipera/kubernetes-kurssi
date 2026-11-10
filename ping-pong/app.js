const http = require('node:http');
const { Pool } = require('pg');

const pool = new Pool({ connectionTimeoutMillis: 5000 });

pool.on('error', (error) => {
  console.error('PostgreSQL connection error:', error);
});

async function initializeCounter() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ping_counter (
      id integer PRIMARY KEY CHECK (id = 1),
      count bigint NOT NULL CHECK (count >= 0)
    )
  `);

  await pool.query(`
    INSERT INTO ping_counter (id, count)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `);
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' || (req.url !== '/' && req.url !== '/pongs')) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    let response;

    if (req.url === '/') {
      const { rows } = await pool.query(`
        UPDATE ping_counter
        SET count = count + 1
        WHERE id = 1
        RETURNING count - 1 AS count
      `);
      response = `pong ${rows[0].count}`;
    } else {
      const { rows } = await pool.query('SELECT count FROM ping_counter WHERE id = 1');
      response = rows[0].count;
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(`${response}\n`);
  } catch (error) {
    console.error('Could not read or update the counter:', error);
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Counter is temporarily unavailable.\n');
  }
});

initializeCounter()
  .then(() => server.listen(3000, '0.0.0.0'))
  .catch(async (error) => {
    console.error('Could not initialize the counter:', error);
    process.exitCode = 1;
    await pool.end();
  });