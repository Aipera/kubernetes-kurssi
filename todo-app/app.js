const http = require('node:http');
const { readFile, rename, stat, writeFile } = require('node:fs/promises');

function positiveInteger(name, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new Error(`${name} must be an integer between 1 and ${max}`);
  }
  return value;
}

const port = positiveInteger('PORT', 65535);
const host = process.env.HOST;
const homePath = process.env.HOME_PATH;
const imageRoute = process.env.IMAGE_ROUTE;
const todosPath = process.env.TODOS_PATH;
const imageUrl = new URL(process.env.IMAGE_URL);
const imagePath = process.env.IMAGE_CACHE_PATH;
const maxAgeMs = positiveInteger('IMAGE_CACHE_TTL_MS');
const fetchTimeoutMs = positiveInteger('IMAGE_FETCH_TIMEOUT_MS', 2147483647);
const maxTodoLength = positiveInteger('TODO_MAX_LENGTH');

const localPath = /^\/(?!\/)[A-Za-z0-9._~/-]*$/;
if (![homePath, imageRoute, todosPath].every((path) => localPath.test(path))) {
  throw new Error('HOME_PATH, IMAGE_ROUTE and TODOS_PATH must be local URL paths');
}
if (!host || !imagePath) {
  throw new Error('HOST and IMAGE_CACHE_PATH are required');
}

let download;

async function downloadImage() {
  const url = new URL(imageUrl);
  url.searchParams.set('random', String(Date.now()));
  const response = await fetch(url, {
    signal: AbortSignal.timeout(fetchTimeoutMs)
  });

  if (!response.ok) {
    throw new Error(`Image source returned HTTP ${response.status}`);
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
  if (req.method === 'GET' && req.url === homePath) {
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
  <img src="${imageRoute}" alt="Satunnainen kuva">

  <section aria-labelledby="todos-heading">
    <form id="todo-form" data-todos-path="${todosPath}">
      <label for="new-todo">Uusi tehtävä (enintään ${maxTodoLength} merkkiä)</label><br>
      <input id="new-todo" name="todo" type="text" maxlength="${maxTodoLength}"
             placeholder="Kirjoita uusi tehtävä" required>
      <button type="submit" disabled>Send</button>
    </form>

    <p id="todo-status" role="status"></p>
    <h2 id="todos-heading">Todos</h2>
    <ul id="todo-list" style="display: inline-block; text-align: left;"></ul>
  </section>

  <p>DevOps with Kubernetes 2026</p>

  <script>
    const form = document.getElementById('todo-form');
    const input = document.getElementById('new-todo');
    const list = document.getElementById('todo-list');
    const status = document.getElementById('todo-status');
    const button = form.querySelector('button');
    const todosPath = form.dataset.todosPath;

    async function loadTodos() {
      const response = await fetch(todosPath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Tehtävälistaa ei saatu ladattua.');
      }

      const todos = await response.json();
      list.replaceChildren();

      for (const text of todos) {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '';
      button.disabled = true;

      try {
        const response = await fetch(todosPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input.value })
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || 'Tallennus epäonnistui.');
        }

        input.value = '';
        await loadTodos();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });

    loadTodos()
      .catch((error) => {
        status.textContent = error.message;
      })
      .finally(() => {
        button.disabled = false;
      });
  </script>
</body>
</html>`);
    return;
  }

  if (req.method === 'GET' && req.url === imageRoute) {
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

server.listen(port, host, () => {
  console.log(`Server started in port ${port}`);
});