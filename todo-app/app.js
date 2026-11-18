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
let isHealthy = true;

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

function sendFailurePage(res) {
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(`<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>System Failure</title>
  <style>
    body { margin: 2rem; font-family: system-ui, sans-serif; }
    main { max-width: 640px; margin: 4rem auto; padding: 2rem; text-align: center;
           color: #861d1d; background: #fff1f1; border: 1px solid #dfaaaa; border-radius: 12px; }
    a { color: inherit; }
  </style>
</head>
<body>
  <main>
    <h1>System Failure</h1>
    <p>Todo App on hetkellisesti poissa käytöstä. Yritä hetken kuluttua uudelleen.</p>
    <a href="${homePath}">Palaa Todo Appiin</a>
  </main>
</body>
</html>`);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(isHealthy ? 200 : 500, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(isHealthy ? 'ok\n' : 'unhealthy\n');
    return;
  }

  if (req.method === 'POST' && req.url === '/break') {
    isHealthy = false;
    sendFailurePage(res);
    return;
  }

  if (!isHealthy) {
    sendFailurePage(res);
    return;
  }

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
    #todo-list { max-width: 800px; margin: 1rem auto; padding: 0; list-style: none; text-align: left; }
    .todo-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem;
                 margin: 0.75rem 0; padding: 1rem; background: #f7f7f7;
                 border-left: 5px solid #4caf50; border-radius: 6px; }
    .todo-text { min-width: 0; overflow-wrap: anywhere; }
    .todo-done { background: #eee; border-left-color: #999; }
    .todo-done .todo-text { color: #666; text-decoration: line-through; }
    .done-label { color: #2e7d32; font-weight: bold; }
    .mark-done { flex-shrink: 0; padding: 0.5rem 0.8rem; font: inherit; cursor: pointer;
                 color: #fff; background: #1e74cf; border: 0; border-radius: 6px; }
    .mark-done:disabled { opacity: 0.6; cursor: wait; }
    .break-app { margin-top: 1rem; padding: 0.6rem 1rem; font: inherit; cursor: pointer;
                 color: #fff; background: #ae2929; border: 0; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Todo App - GitOps 4.8</h1>
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
    <ul id="todo-list"></ul>
  </section>

  <form action="/break" method="post">
    <button class="break-app" type="submit">Break the app</button>
  </form>

  <p>DevOps with Kubernetes 2026</p>

  <script>
    const form = document.getElementById('todo-form');
    const input = document.getElementById('new-todo');
    const list = document.getElementById('todo-list');
    const status = document.getElementById('todo-status');
    const button = form.querySelector('button');
    const todosPath = form.dataset.todosPath;
    let latestLoad = 0;

    async function loadTodos() {
      const loadNumber = ++latestLoad;
      const response = await fetch(todosPath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Tehtävälistaa ei saatu ladattua.');
      }

      const todos = await response.json();
      if (loadNumber !== latestLoad) return;
      list.replaceChildren();

      for (const todo of todos) {
        const item = document.createElement('li');
        item.className = 'todo-item';
        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = typeof todo === 'string' ? todo : todo.text;
        item.append(text);

        if (todo.done === true) {
          item.classList.add('todo-done');
          const label = document.createElement('span');
          label.className = 'done-label';
          label.textContent = 'Done';
          item.append(label);
        } else if (todo.id !== undefined) {
          const doneButton = document.createElement('button');
          doneButton.type = 'button';
          doneButton.className = 'mark-done';
          doneButton.textContent = 'Mark done';
          doneButton.addEventListener('click', () => markDone(todo.id, doneButton));
          item.append(doneButton);
        }

        list.append(item);
      }
    }

    async function markDone(id, doneButton) {
      status.textContent = '';
      doneButton.disabled = true;

      try {
        const response = await fetch(todosPath.replace(/\\/$/, '') + '/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: true })
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || 'Tehtävän päivittäminen epäonnistui.');
        }

        await loadTodos();
        status.textContent = 'Tehtävä merkitty valmiiksi.';
      } catch (error) {
        status.textContent = error.message;
        doneButton.disabled = false;
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
