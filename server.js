import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 8787);
const sessions = new Map();
const oauthInstallations = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.vtt': 'text/vtt; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const securityHeaders = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self' https://appssdk.zoom.us",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self' https://*.zoom.us https://*.zoom.com"
  ].join('; '),
  'referrer-policy': 'strict-origin-when-cross-origin'
};

function withSecurityHeaders(headers = {}) {
  return { ...securityHeaders, ...headers };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, withSecurityHeaders({
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload)
  }));
  res.end(payload);
}

function sendText(res, status, body) {
  res.writeHead(status, withSecurityHeaders({ 'content-type': 'text/plain; charset=utf-8' }));
  res.end(body);
}

function sendHtml(res, status, body) {
  res.writeHead(status, withSecurityHeaders({ 'content-type': 'text/html; charset=utf-8' }));
  res.end(body);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, function(char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#039;',
      '"': '&quot;'
    }[char];
  });
}

function appUrl(req, path) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}${path}`;
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error('Request body too large');
    }
  }
  return body ? JSON.parse(body) : {};
}

function createSession(input = {}) {
  const slug = randomUUID().slice(0, 8);
  const createdAt = new Date().toISOString();
  const session = {
    id: slug,
    dashboardPath: `/m/${slug}`,
    topic: input.topic || 'Untitled meeting',
    host: input.host || 'Meeting host',
    attendees: Array.isArray(input.attendees) ? input.attendees : [],
    zoomMeetingId: input.zoomMeetingId || null,
    platform: input.platform || 'web',
    createdAt
  };
  sessions.set(slug, session);
  return session;
}

async function exchangeZoomOAuthCode(code) {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = process.env.ZOOM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    const missing = ['ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'ZOOM_REDIRECT_URI']
      .filter(function(name) { return !process.env[name]; });
    const error = new Error('Zoom OAuth is not configured. Missing: ' + missing.join(', '));
    error.status = 503;
    throw error;
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  });
  const credentials = Buffer.from(clientId + ':' + clientSecret).toString('base64');
  const response = await fetch('https://zoom.us/oauth/token?' + params.toString(), {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + credentials
    }
  });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok) {
    const message = body.reason || body.error_description || body.error || 'Zoom token exchange failed';
    const error = new Error(message);
    error.status = 502;
    error.details = body;
    throw error;
  }
  return body;
}

function renderOAuthPage(req, res, status, title, message) {
  sendHtml(res, status, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Meeting Decision Maker</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f6f4ef;color:#232524;display:grid;min-height:100vh;place-items:center}.card{max-width:560px;background:#fffdf8;border:1px solid #d9d5ca;border-radius:10px;padding:28px;box-shadow:0 18px 50px rgba(35,37,36,.1)}a{color:#2d5f91}</style></head><body><main class="card"><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(message) + '</p><p><a href="' + escapeHtml(appUrl(req, '/')) + '">Open Meeting Decision Maker</a></p></main></body></html>');
}

function resolveStaticPath(pathname) {
  const rawPath = pathname === '/' || pathname.startsWith('/m/') ? '/index.html' : pathname;
  const decoded = decodeURIComponent(rawPath);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  return join(rootDir, safePath);
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
    sendText(res, 404, 'Not found');
    return;
  }

  const data = await readFile(filePath);
  const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, withSecurityHeaders({
    'content-type': contentType,
    'cache-control': contentType.includes('text/html') ? 'no-store' : 'public, max-age=300'
  }));
  res.end(data);
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && (pathname === '/api/healthz' || pathname === '/healthz')) {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/sessions') {
    const input = await readBody(req);
    sendJson(res, 201, createSession(input));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/zoom/oauth/callback') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state') || 'development';
    const zoomError = url.searchParams.get('error');

    if (zoomError) {
      renderOAuthPage(req, res, 400, 'Zoom authorization was cancelled', zoomError);
      return;
    }
    if (!code || code === 'missing') {
      renderOAuthPage(req, res, 400, 'Zoom authorization needs a code', 'Zoom did not send an authorization code. Try adding the app again from Local Test.');
      return;
    }

    try {
      const token = await exchangeZoomOAuthCode(code);
      const installationId = randomUUID();
      oauthInstallations.set(installationId, {
        state: stateParam,
        scope: token.scope || '',
        tokenType: token.token_type || 'bearer',
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + Number(token.expires_in || 0) * 1000,
        installedAt: new Date().toISOString()
      });
      renderOAuthPage(req, res, 200, 'Meeting Decision Maker connected', 'Zoom authorized the development app. You can now open it from the Zoom Apps panel during a meeting.');
    } catch (error) {
      const status = error.status || 500;
      renderOAuthPage(req, res, status, 'Zoom authorization could not finish', error.message || 'Unknown error');
    }
    return;
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === 'GET' && sessionMatch) {
    const session = sessions.get(sessionMatch[1]);
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' });
      return;
    }
    sendJson(res, 200, session);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/zoom/rtms-webhook') {
    const event = await readBody(req);
    sendJson(res, 202, { received: true, event: event.event || null });
    return;
  }

  sendJson(res, 404, { error: 'API route not found' });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') {
      await handleApi(req, res, url.pathname);
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`Meeting Decision Maker listening on http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
