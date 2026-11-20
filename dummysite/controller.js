const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');

const group = 'stable.dwk';
const version = 'v1';
const plural = 'dummysites';
const maxHtmlBytes = 512 * 1024;

function log(event, fields = {}) {
  console.log(JSON.stringify({ event, ...fields }));
}

// The API client uses the mounted ServiceAccount token and verifies the API
// server's certificate. Read the token again for each request so rotation works.
function createKubeClient({ server, tokenFile, caFile, signal }) {
  const agent = new https.Agent({ ca: fs.readFileSync(caFile), keepAlive: true });
  function open(method, path, value, contentType = 'application/json', timeout = 15000) {
    return new Promise((resolve, reject) => {
      const body = value === undefined ? undefined : JSON.stringify(value);
      const request = https.request(new URL(path, server), {
        agent,
        method,
        signal,
        headers: {
          Authorization: `Bearer ${fs.readFileSync(tokenFile, 'utf8').trim()}`,
          Accept: 'application/json',
          ...(body === undefined ? {} : {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(body)
          })
        }
      }, resolve);
      request.setTimeout(timeout, () => request.destroy(new Error('Kubernetes API timeout')));
      request.on('error', reject);
      request.end(body);
    });
  }
  async function read(response) {
    let text = '';
    response.setEncoding('utf8');
    for await (const chunk of response) text += chunk;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      const error = new Error(`Kubernetes API HTTP ${response.statusCode}: ${text.slice(0, 500)}`);
      error.statusCode = response.statusCode;
      throw error;
    }
    return text ? JSON.parse(text) : {};
  }
  return {
    json: async (...args) => read(await open(...args)),
    async watch(path, onEvent) {
      const response = await open('GET', path, undefined, undefined, 45000);
      if (response.statusCode !== 200) return read(response);
      response.setEncoding('utf8');
      let buffer = '';
      for await (const chunk of response) {
        buffer += chunk;
        let newline;
        while ((newline = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (line) onEvent(JSON.parse(line));
        }
      }
      if (buffer.trim()) onEvent(JSON.parse(buffer));
    },
    close: () => agent.destroy()
  };
}

async function copyHtml(websiteUrl, shutdownSignal) {
  const url = new URL(websiteUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS URL');
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'DummySiteController/1.0' },
    signal: AbortSignal.any([shutdownSignal, AbortSignal.timeout(20000)])
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Website HTTP ${response.status}`);
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > maxHtmlBytes) throw new Error('HTML exceeds the controller\'s 512 KiB limit');
    chunks.push(chunk);
  }
  const html = Buffer.concat(chunks).toString('utf8');
  if (!html.trim()) throw new Error('Website returned an empty body');
  // Invalid UTF-8 may expand when converted to a ConfigMap string.
  if (Buffer.byteLength(html) > maxHtmlBytes) throw new Error('Decoded HTML exceeds 512 KiB');
  return { html, url: response.url };
}

function resourceName(site) {
  const stem = site.metadata.name.replace(/[^a-z0-9-]/g, '-').slice(0, 40);
  const suffix = crypto.createHash('sha256').update(site.metadata.uid).digest('hex').slice(0, 10);
  return `dummysite-${stem}-${suffix}`;
}

async function reconcile(site, api, namespace, websiteImage, signal) {
  const name = resourceName(site);
  const { html, url } = await copyHtml(site.spec.website_url, signal);
  const hash = crypto.createHash('sha256').update(html).digest('hex');
  const labels = { app: 'dummysite', 'dummysite-uid': site.metadata.uid };
  const metadata = {
    name,
    namespace,
    labels,
    ownerReferences: [{
      apiVersion: `${group}/${version}`,
      kind: 'DummySite',
      name: site.metadata.name,
      uid: site.metadata.uid,
      controller: true
    }]
  };
  const core = `/api/v1/namespaces/${namespace}`;
  const apps = `/apis/apps/v1/namespaces/${namespace}`;
  const apply = (path, object) => api.json(
    'PATCH', `${path}/${name}?fieldManager=dummysite-controller`, object,
    'application/apply-patch+yaml'
  );

  // These are real page bytes, served locally; no redirect or iframe is used.
  await apply(`${core}/configmaps`, {
    apiVersion: 'v1', kind: 'ConfigMap', metadata, data: { 'index.html': html }
  });
  await apply(`${apps}/deployments`, {
    apiVersion: 'apps/v1', kind: 'Deployment', metadata,
    spec: {
      replicas: 1,
      selector: { matchLabels: labels },
      template: {
        metadata: { labels, annotations: { 'dummysite.dwk/content-sha256': hash } },
        spec: {
          automountServiceAccountToken: false,
          containers: [{
            name: 'website', image: websiteImage,
            ports: [{ name: 'http', containerPort: 80 }],
            resources: {
              requests: { cpu: '0', memory: '8Mi' },
              limits: { cpu: '100m', memory: '64Mi' }
            },
            readinessProbe: { httpGet: { path: '/', port: 'http' }, periodSeconds: 3 },
            volumeMounts: [{ name: 'html', mountPath: '/usr/share/nginx/html', readOnly: true }]
          }],
          volumes: [{ name: 'html', configMap: { name } }]
        }
      }
    }
  });
  await apply(`${core}/services`, {
    apiVersion: 'v1', kind: 'Service', metadata,
    spec: { type: 'ClusterIP', selector: labels, ports: [{ name: 'http', port: 80, targetPort: 'http' }] }
  });
  await api.json('PATCH', `/apis/${group}/${version}/namespaces/${namespace}/${plural}/${site.metadata.name}/status`, {
    status: {
      phase: 'Provisioned',
      observedGeneration: site.metadata.generation,
      serviceName: name,
      deploymentName: name,
      configMapName: name,
      sourceUrl: url,
      message: 'HTML copied and Kubernetes resources created; check Deployment readiness.'
    }
  }, 'application/merge-patch+json');
  log('dummysite_provisioned', { namespace, site: site.metadata.name, service: name, bytes: Buffer.byteLength(html), url });
}

async function runController() {
  const account = process.env.SERVICE_ACCOUNT_DIR || '/var/run/secrets/kubernetes.io/serviceaccount';
  const namespace = process.env.POD_NAMESPACE || fs.readFileSync(`${account}/namespace`, 'utf8').trim();
  const host = process.env.KUBERNETES_SERVICE_HOST || 'kubernetes.default.svc';
  const port = process.env.KUBERNETES_SERVICE_PORT_HTTPS || '443';
  const server = `https://${host.includes(':') ? `[${host}]` : host}:${port}`;
  const websiteImage = process.env.WEBSITE_IMAGE || 'nginx:alpine';
  const shutdown = new AbortController();
  const api = createKubeClient({ server, tokenFile: `${account}/token`, caFile: `${account}/ca.crt`, signal: shutdown.signal });
  const collection = `/apis/${group}/${version}/namespaces/${namespace}/${plural}`;
  let ready = false;
  let processing = false;
  const pending = new Map();
  const completed = new Map();
  const attempted = new Map();
  const health = http.createServer((req, res) => {
    const healthy = req.url === '/healthz' || (req.url === '/readyz' && ready);
    res.writeHead(healthy ? 200 : 503);
    res.end(healthy ? 'ok\n' : 'not ready\n');
  }).listen(Number(process.env.PORT || 3000), '0.0.0.0');
  const stop = () => {
    shutdown.abort();
    health.close();
    api.close();
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);

  async function drain() {
    if (processing) return;
    processing = true;
    try {
      while (pending.size && !shutdown.signal.aborted) {
        const [uid, site] = pending.entries().next().value;
        pending.delete(uid);
        if (completed.get(uid) === site.metadata.generation || attempted.get(uid) === site.metadata.generation) continue;
        // Ignore our own status events; failed copies are retried on the next list.
        attempted.set(uid, site.metadata.generation);
        try {
          await reconcile(site, api, namespace, websiteImage, shutdown.signal);
          completed.set(uid, site.metadata.generation);
        } catch (error) {
          if (shutdown.signal.aborted) return;
          log('dummysite_error', { site: site.metadata.name, message: error.message });
          try {
            await api.json('PATCH', `${collection}/${site.metadata.name}/status`, {
              status: { phase: 'Error', message: error.message.slice(0, 500) }
            }, 'application/merge-patch+json');
          } catch (statusError) {
            log('status_error', { site: site.metadata.name, message: statusError.message });
          }
        }
      }
    } finally { processing = false; }
  }
  function enqueue(site) {
    if (site.metadata.deletionTimestamp) return;
    pending.set(site.metadata.uid, site);
    void drain();
  }

  try {
    while (!shutdown.signal.aborted) {
      try {
        const list = await api.json('GET', collection);
        attempted.clear();
        for (const site of list.items) enqueue(site);
        ready = true;
        log('watch_started', { namespace });
        const query = new URLSearchParams({
          watch: 'true', resourceVersion: list.metadata.resourceVersion,
          timeoutSeconds: '30', allowWatchBookmarks: 'true'
        });
        await api.watch(`${collection}?${query}`, (event) => {
          if (event.type === 'ERROR') throw new Error(`Watch error: ${event.object.message}`);
          if (event.type === 'ADDED' || event.type === 'MODIFIED') enqueue(event.object);
          if (event.type === 'DELETED') {
            pending.delete(event.object.metadata.uid);
            completed.delete(event.object.metadata.uid);
            attempted.delete(event.object.metadata.uid);
          }
        });
      } catch (error) {
        ready = false;
        if (!shutdown.signal.aborted) {
          log('api_watch_error', { message: error.message });
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
  } finally { stop(); }
}

if (require.main === module) {
  runController().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
module.exports = { createKubeClient, copyHtml, resourceName, reconcile };
