const http = require('node:http');
const { connect } = require('@nats-io/transport-node');

const port = Number(process.env.PORT || '3000');
const namespace = process.env.POD_NAMESPACE || 'project';
const subject = `todos.${namespace}.events`;
const queue = process.env.NATS_QUEUE || 'todo-broadcasters';
const instance = process.env.HOSTNAME || `broadcaster-${process.pid}`;
const mode = process.env.BROADCAST_MODE || 'webhook';
const webhookUrl = mode === 'webhook' ? new URL(process.env.WEBHOOK_URL) : undefined;
const webhookTimeoutMs = Number(process.env.WEBHOOK_TIMEOUT_MS || '10000');

if (!['webhook', 'log'].includes(mode)) {
  throw new Error('BROADCAST_MODE must be webhook or log');
}
if (!process.env.NATS_URL || (mode === 'webhook' && !['http:', 'https:'].includes(webhookUrl.protocol))) {
  throw new Error('NATS_URL is required; webhook mode also requires an HTTP(S) WEBHOOK_URL');
}
if (!Number.isInteger(port) || port < 1 || port > 65535 ||
    !Number.isSafeInteger(webhookTimeoutMs) || webhookTimeoutMs < 1 || webhookTimeoutMs > 2147483647) {
  throw new Error('PORT and WEBHOOK_TIMEOUT_MS must be valid positive integers');
}

let connection;
let ready = false;
let stopping = false;

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' || !['/healthz', '/readyz'].includes(req.url)) {
    res.writeHead(404);
    res.end();
    return;
  }

  const healthy = req.url === '/healthz' || ready;
  res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(healthy ? 'ok\n' : 'not ready\n');
});

async function forwardMessage(message) {
  let eventId;
  try {
    const event = JSON.parse(Buffer.from(message.data).toString('utf8'));
    eventId = event.id;
    const todo = event.todo;
    if (typeof eventId !== 'string' || !['todo.created', 'todo.updated'].includes(event.type) ||
        typeof todo?.id !== 'string' || typeof todo.text !== 'string' || typeof todo.done !== 'boolean') {
      throw new Error('Invalid todo event');
    }

    const action = event.type === 'todo.created' ? 'created' : 'updated';
    const payload = {
      user: 'bot',
      message: `Todo ${todo.id} was ${action}: ${todo.text} (done: ${todo.done})`
    };
    if (mode === 'log') {
      console.log(JSON.stringify({ event: 'todo_event_logged', eventId, instance, type: event.type, todoId: todo.id, ...payload }));
      return;
    }
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Todo-Event-Id': eventId,
        'X-Broadcaster-Instance': instance
      },
      body: JSON.stringify(payload),
      redirect: 'error',
      signal: AbortSignal.timeout(webhookTimeoutMs)
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);

    console.log(JSON.stringify({ event: 'webhook_sent', eventId, instance, type: event.type, todoId: todo.id }));
  } catch (error) {
    console.error(JSON.stringify({ event: 'webhook_failed', eventId, instance, message: error.message }));
  }
}

async function watchConnection(nats) {
  for await (const status of nats.status()) {
    if (status.type === 'disconnect') ready = false;
    if (status.type === 'reconnect' && !stopping) ready = true;
    console.log(JSON.stringify({ event: 'nats_status', instance, status: status.type }));
  }
}

async function main() {
  connection = await connect({
    servers: process.env.NATS_URL,
    name: instance,
    waitOnFirstConnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 1000,
    timeout: 2000
  });
  const subscription = connection.subscribe(subject, { queue });
  watchConnection(connection).catch((error) => console.error('NATS status failed:', error.message));
  await connection.flush();
  ready = true;
  console.log(JSON.stringify({ event: 'broadcaster_ready', instance, subject, queue, mode }));

  for await (const message of subscription) {
    await forwardMessage(message);
  }
  if (!stopping) throw new Error('NATS subscription closed');
}

async function stop() {
  stopping = true;
  ready = false;
  server.close();
  try {
    await connection?.drain();
  } finally {
    process.exit(0);
  }
}

process.once('SIGTERM', () => stop().catch(() => process.exit(1)));
process.once('SIGINT', () => stop().catch(() => process.exit(1)));
server.listen(port, '0.0.0.0');
main().catch((error) => {
  console.error('Broadcaster failed:', error.message);
  process.exit(1);
});
