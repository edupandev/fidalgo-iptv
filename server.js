const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { execFile } = require('child_process');

const { handleStreamRequest, handleSegmentRequest, fetchWithSegmentRetry } = require('./server/streaming/segmentProxy');
const { resolvePlayable, getOrCreateSession, getSession } = require('./server/streaming/sessionStore');
const { validateUrlSsrf } = require('./server/streaming/ssrf');
const { classifyNetworkError } = require('./server/streaming/errorClassifier');
const { isHlsManifest, MAX_MANIFEST_BYTES } = require('./server/streaming/hlsRewrite');
const { readBodyWithCeiling } = require('./server/streaming/agent');
const saimoBridge = require('./server/saimoBridge');
// fidalGO: frontend novo (visual fidalGO sobre a base Saimo-TV) — listas, proxy e telemetria local
const fidalgoFront = require('./server/fidalgoSaimo');

// Prevenção de crashes por abortos de clientes e resets de conexões de streaming
process.on('uncaughtException', (err) => {
  const ignorableCodes = ['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET', 'ECANCELED', 'ERR_STREAM_PREMATURE_CLOSE', 'ABORT_ERR'];
  if (err && (ignorableCodes.includes(err.code) || err.name === 'AbortError')) {
    return;
  }
  console.error('[Server] Uncaught exception:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  const ignorableCodes = ['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET', 'ECANCELED', 'ERR_STREAM_PREMATURE_CLOSE', 'ABORT_ERR'];
  if (reason && (ignorableCodes.includes(reason.code) || reason.name === 'AbortError')) {
    return;
  }
  console.error('[Server] Unhandled rejection:', reason?.message || reason);
});

const PORT = process.env.PORT || 3080;
const PUBLIC_DIR = path.join(__dirname, 'public');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const VIP_USER = process.env.VIP_USER || '11duckx@gmail.com';
const VIP_PASS = process.env.VIP_PASS || 'Minecraft234';
let vipAuthCookie = 'VIPCANAIS_LOGIN=MzQzMzR8MTc5NTI3NTA2M3wyM2VkMzY5ODQ0N2JiNzZiYmI3ZDUyM2U2MjUzYjNhNDM2ZDI1NTZlZDlhNWE3NTRhMjQ1ZTcxZTdmYzAwYzNj.507786288464f5cecb900db68f0d9cfe4bb4b657508fbe27e798587eb28569f0; PHPSESSID=3rhkho5lot9b667ddgmupeftg7';
let vipAuthExpiry = Date.now() + 25 * 86400 * 1000;

function getVipSession(forceRefresh = false) {
  return new Promise((resolve) => {
    if (!forceRefresh && vipAuthCookie && Date.now() < vipAuthExpiry) {
      return resolve(vipAuthCookie);
    }
    const postData = `redirect=${encodeURIComponent('https://vipcanais.net/minha-conta/')}&email=${encodeURIComponent(VIP_USER)}&password=${encodeURIComponent(VIP_PASS)}`;
    const parsed = new URL('https://vipcanais.net/login.php?redirect=https%3A%2F%2Fvipcanais.net%2Fminha-conta%2F');
    const req = https.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://vipcanais.net/login.php'
      },
      timeout: 10000
    }, (res) => {
      const setCookies = res.headers['set-cookie'];
      if (Array.isArray(setCookies) && setCookies.length > 0) {
        const cookies = setCookies.map(c => c.split(';')[0]).join('; ');
        if (cookies.includes('VIPCANAIS_LOGIN')) {
          vipAuthCookie = cookies;
          vipAuthExpiry = Date.now() + 25 * 86400 * 1000;
          console.log('[VIP] Sessão autenticada atualizada com sucesso para', VIP_USER);
        }
      }
      res.resume();
      resolve(vipAuthCookie);
    });
    req.on('error', (err) => {
      console.warn('[VIP] Erro na autenticação:', err.message);
      resolve(vipAuthCookie);
    });
    req.write(postData);
    req.end();
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive'
};

function fetchRemote(targetUrl, headers = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error('Too many redirects'));
    }
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (err) {
      return reject(err);
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          Accept: '*/*',
          ...headers
        },
        timeout: 15000
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const nextUrl = new URL(res.headers.location, targetUrl).toString();
          res.resume();
          return resolve(fetchRemote(nextUrl, headers, redirectCount + 1));
        }
        resolve(res);
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function fetchText(targetUrl, headers = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetchRemote(targetUrl, headers);
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      res.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Cache for cleitonleonel/redecanais settings fetched from GitHub
let redeCanaisConfigCache = null;

async function getRedeCanaisConfig() {
  if (redeCanaisConfigCache) return redeCanaisConfigCache;
  const branches = ['master', 'main'];
  for (const branch of branches) {
    try {
      const settingsUrl = `https://raw.githubusercontent.com/cleitonleonel/redecanais/${branch}/redecanais/settings.py`;
      const { status, data } = await fetchText(settingsUrl);
      if (status === 200 && data) {
        const urlServerMatch = data.match(/URL_SERVER\s*=\s*['"]([^'"]+)['"]/);
        const urlTvServerMatch = data.match(/URL_TV_SERVER\s*=\s*['"]([^'"]+)['"]/);
        redeCanaisConfigCache = {
          repo: 'https://github.com/cleitonleonel/redecanais.git',
          branch,
          urlServer: urlServerMatch ? urlServerMatch[1] : 'https://redecanais.la',
          urlTvServer: urlTvServerMatch ? urlTvServerMatch[1] : 'https://redecanaistv.in',
          rawSettings: data
        };
        return redeCanaisConfigCache;
      }
    } catch (_) {
      // try next branch
    }
  }
  return {
    repo: 'https://github.com/cleitonleonel/redecanais.git',
    branch: 'master',
    urlServer: 'https://redecanais.la',
    urlTvServer: 'https://redecanaistv.in'
  };
}

// Parse HTML links similar to cleitonleonel/redecanais ChannelsNetwork
function parseRedeCanaisHtml(html, baseUrl, isTv = false) {
  const items = [];
  const seen = new Set();
  // Match movie/series/channel cards (<a href="..."> with images or titles)
  const linkRegex = /<a[^>]+href=["']([^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const inner = match[2];
    if (href.includes('browse-') || href.includes('index.html') || href.includes('contact')) continue;

    let fullUrl;
    try {
      fullUrl = new URL(href, baseUrl).toString();
    } catch (_) {
      continue;
    }
    if (seen.has(fullUrl)) continue;

    const imgMatch = inner.match(/<img[^>]+(?:data-echo|src)=["']([^"']+)["'][^>]*>/i);
    const altMatch = inner.match(/alt=["']([^"']+)["']/i);
    const textClean = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const title = (altMatch ? altMatch[1] : textClean).trim();

    if (!title || title.length < 2) continue;
    seen.add(fullUrl);

    let logo = '';
    if (imgMatch && imgMatch[1]) {
      try {
        logo = new URL(imgMatch[1], baseUrl).toString();
      } catch (_) {
        logo = imgMatch[1];
      }
    }

    items.push({
      name: title,
      url: fullUrl,
      logo,
      group: isTv ? 'RedeCanais TV Ao Vivo' : 'RedeCanais Filmes & Séries',
      source: 'cleitonleonel/redecanais',
      isWebEmbed: true
    });
  }
  return items;
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 0. fidalGO frontend: /listas/*, /api/proxy, /api/resolve-vod, /api/events, /api/online/*
  try {
    if (await fidalgoFront.handle(req, res, reqUrl)) return;
  } catch (err) {
    console.error('[fidalGO] erro na rota', reqUrl.pathname, err && err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'internal' }));
    }
    return;
  }

  // 1a. Streaming Proxy Principal: GET /api/stream/:sessionId/:kind/:id/:ext
  const streamMatch = reqUrl.pathname.match(/^\/api\/stream\/([^\/]+)\/(live|movie|series)\/([^\/]+)\/([^\/]+)$/);
  if (streamMatch) {
    const [, sessionId, kind, id, ext] = streamMatch;
    return handleStreamRequest(req, res, { sessionId, kind, id, ext });
  }

  // 1b. Streaming de Segmentos e Renditions: GET /api/stream/:sessionId/seg?u=<base64url>
  const segMatch = reqUrl.pathname.match(/^\/api\/stream\/([^\/]+)\/seg$/);
  if (segMatch) {
    const [, sessionId] = segMatch;
    const token = reqUrl.searchParams.get('u');
    return handleSegmentRequest(req, res, sessionId, token);
  }

  // 1c. Resolução de URL Playable: GET /api/playable/:type/:id
  const playableMatch = reqUrl.pathname.match(/^\/api\/playable\/(live|movie|series)\/([^\/]+)$/);
  if (playableMatch) {
    const [, type, id] = playableMatch;
    const sessionId = reqUrl.searchParams.get('sessionId') || 'default-session';
    const containerExtension = reqUrl.searchParams.get('ext') || null;

    try {
      if (!getSession(sessionId)) {
        getOrCreateSession({
          sessionId: sessionId,
          username: VIP_USER,
          password: VIP_PASS,
          portalOrigin: `http://${req.headers.host || '127.0.0.1:3000'}`
        });
      }

      const playable = await resolvePlayable({
        sessionId,
        type,
        id,
        containerExtension
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(playable));
    } catch (err) {
      const classified = classifyNetworkError(err);
      res.writeHead(classified.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: { code: classified.code, message: classified.message } }));
    }
  }

  // 1c-1. Download direto do APK para TV Box & Downloader
  if (['/apk', '/tv.apk', '/app.apk', '/FIDAL_GO_TV.apk'].includes(reqUrl.pathname)) {
    const apkFile = path.join(__dirname, 'FIDAL_GO_TV.apk');
    if (fs.existsSync(apkFile)) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="FIDAL_GO_TV.apk"',
        'Access-Control-Allow-Origin': '*'
      });
      return fs.createReadStream(apkFile).pipe(res);
    }
  }

  // 1c-2. Catálogo Oficial Saimo TV (350+ canais ao vivo organizados e resilientes)
  if (reqUrl.pathname === '/api/saimo-channels') {
    try {
      const channels = saimoBridge.getSaimoChannels();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({ status: 'ok', count: channels.length, channels }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
  }

  // 1c-3. Catálogo VOD Saimo TV (Filmes, Séries, Destaques e Busca com dublado/legendado)
  if (reqUrl.pathname === '/api/saimo-vod') {
    try {
      const q = reqUrl.searchParams.get('q');
      const title = reqUrl.searchParams.get('title');
      const type = reqUrl.searchParams.get('type') || 'movie';

      if (q) {
        const items = saimoBridge.searchSaimoVod(q);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ status: 'ok', count: items.length, items }));
      }

      if (title) {
        const streams = saimoBridge.resolveVodStreams(title, type);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ status: 'ok', title, count: streams.length, streams }));
      }

      const highlights = saimoBridge.getSaimoVodHighlights();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ status: 'ok', highlights }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
  }

  // 1d. Endpoint to proxy M3U playlists or HLS streams (com pipeline resiliente de streaming e Range 206)
  // Proxy antigo do fidalGO, preservado (o /api/proxy agora é o do frontend novo).
  if (reqUrl.pathname === '/api/proxy-legacy') {
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing url parameter' }));
    }

    const customReferer = reqUrl.searchParams.get('referer');
    const customUserAgent = reqUrl.searchParams.get('userAgent');
    const extraHeaders = {};
    if (customReferer) extraHeaders['Referer'] = customReferer;

    const abortController = new AbortController();
    const onClientClose = () => abortController.abort();
    req.on('close', onClientClose);

    try {
      await validateUrlSsrf(target);
      const rangeHeader = req.headers['range'] || null;

      const upstream = await fetchWithSegmentRetry({
        targetUrl: target,
        rangeHeader,
        userAgent: customUserAgent || undefined,
        extraHeaders,
        isLive: true,
        signal: abortController.signal,
        isSegment: /\.(ts|m4s|mp4)/i.test(target)
      });

      const maybeManifest = isHlsManifest(upstream.headers['content-type'], target);

      if (maybeManifest || (!target.match(/\.(ts|mp4|m4s)($|\?)/i) && !req.headers['range'])) {
        // Tenta ler como texto se parecer manifest HLS
        const bodyBuf = await readBodyWithCeiling(upstream.body, MAX_MANIFEST_BYTES, abortController.signal);
        const asText = bodyBuf.toString('utf8');

        if (asText.trimStart().startsWith('#EXTM3U')) {
          const lines = asText.split(/\r?\n/);
          const rewritten = lines.map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith('#')) {
              return line.replace(/URI="([^"]+)"/g, (m, uri) => {
                try {
                  const resolved = new URL(uri, upstream.finalUrl).toString();
                  return `URI="/api/proxy?url=${encodeURIComponent(resolved)}"`;
                } catch (_) {
                  return m;
                }
              });
            }
            try {
              const resolved = new URL(trimmed, upstream.finalUrl).toString();
              return `/api/proxy?url=${encodeURIComponent(resolved)}`;
            } catch (_) {
              return line;
            }
          }).join('\n');

          const rewrittenBuf = Buffer.from(rewritten, 'utf8');
          res.writeHead(upstream.statusCode || 200, {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Content-Length': rewrittenBuf.length,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          });
          return res.end(rewrittenBuf);
        } else {
          // Não era manifest, envia o buffer original
          const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          };
          ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'].forEach((h) => {
            if (upstream.headers[h] !== undefined) responseHeaders[h] = upstream.headers[h];
          });
          res.writeHead(upstream.statusCode || 200, responseHeaders);
          return res.end(bodyBuf);
        }
      }

      const responseHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      };

      const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
      forwardHeaders.forEach((h) => {
        if (upstream.headers[h] !== undefined) {
          responseHeaders[h] = upstream.headers[h];
        }
      });

      res.writeHead(upstream.statusCode || 200, responseHeaders);

      const { pipeline: streamPipeline } = require('stream');
      streamPipeline(upstream.body, res, (err) => {
        req.removeListener('close', onClientClose);
        if (err) abortController.abort();
      });
      return;
    } catch (err) {
      req.removeListener('close', onClientClose);
      abortController.abort();
      const classified = classifyNetworkError(err);
      if (classified.isClientAbort) return;

      if (!res.headersSent) {
        res.writeHead(classified.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: { code: classified.code, message: classified.message } }));
      } else {
        res.destroy();
      }
      return;
    }
  }

  // 2. Endpoint to recursively list all .m3u / .m3u8 / .json files inside a GitHub repository
  if (reqUrl.pathname === '/api/github-repo') {
    const repo = (reqUrl.searchParams.get('repo') || 'Ramys/Iptv-Brasil-2026')
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/+$/, '');

    try {
      // Try recursive git tree first so subdirectories are also discovered
      const treeUrl = `https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`;
      const treeRes = await fetchText(treeUrl, { Accept: 'application/vnd.github.v3+json' });

      if (treeRes.status === 200) {
        const parsed = JSON.parse(treeRes.data);
        if (Array.isArray(parsed.tree)) {
          const files = parsed.tree
            .filter((item) => item.type === 'blob' && /\.(m3u8?|txt|json)$/i.test(item.path))
            .map((item) => ({
              name: path.basename(item.path),
              path: item.path,
              download_url: `https://raw.githubusercontent.com/${repo}/HEAD/${item.path}`
            }));
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ repo, files }));
        }
      }

      // Fallback to /contents
      const contentsUrl = `https://api.github.com/repos/${repo}/contents`;
      const contentsRes = await fetchText(contentsUrl, { Accept: 'application/vnd.github.v3+json' });
      res.writeHead(contentsRes.status || 200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(contentsRes.data);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. Endpoint to search GitHub repositories for IPTV / Futebol / Filmes / Séries
  if (reqUrl.pathname === '/api/github-search') {
    const q = reqUrl.searchParams.get('q') || 'iptv brasil m3u';
    try {
      const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&per_page=12`;
      const searchRes = await fetchText(searchUrl, { Accept: 'application/vnd.github.v3+json' });
      res.writeHead(searchRes.status || 200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(searchRes.data);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Endpoint for cleitonleonel/redecanais integration
  if (reqUrl.pathname === '/api/redecanais') {
    const mode = reqUrl.searchParams.get('mode') || 'info'; // info | search | browse | tv
    const query = reqUrl.searchParams.get('search') || '';
    const genre = reqUrl.searchParams.get('genre') || 'acao';
    const category = reqUrl.searchParams.get('category') || 'dublado';
    const page = reqUrl.searchParams.get('page') || '1';
    const customHost = reqUrl.searchParams.get('host') || '';

    try {
      const config = await getRedeCanaisConfig();
      const baseHost = customHost || (mode === 'tv' ? config.urlTvServer : config.urlServer);

      if (mode === 'info') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'ok', config }));
      }

      let targetUrl = baseHost;
      if (mode === 'search' && query) {
        targetUrl = `${baseHost}/search.php?keywords=${encodeURIComponent(query)}`;
      } else if (mode === 'browse') {
        targetUrl = `${baseHost}/browse-${encodeURIComponent(genre)}-${encodeURIComponent(category)}-videos-${encodeURIComponent(page)}-date.html`;
      } else if (mode === 'tv') {
        targetUrl = query
          ? `${baseHost}/search.php?keywords=${encodeURIComponent(query)}`
          : `${baseHost}/`;
      }

      const pageRes = await fetchText(targetUrl);
      const items = parseRedeCanaisHtml(pageRes.data, baseHost, mode === 'tv');

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(
        JSON.stringify({
          repo: 'cleitonleonel/redecanais',
          targetUrl,
          count: items.length,
          items
        })
      );
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(
        JSON.stringify({
          repo: 'cleitonleonel/redecanais',
          error: err.message,
          items: []
        })
      );
    }
  }

  // 5. Endpoint to extract the player iframe/stream from a RedeCanais page (mirrors ChannelsNetwork.get_stream)
  if (reqUrl.pathname === '/api/redecanais-embed') {
    const pageUrl = reqUrl.searchParams.get('url');
    if (!pageUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing url parameter' }));
    }
    try {
      const { data } = await fetchText(pageUrl);
      const iframeMatch =
        data.match(/<iframe[^>]+name=["']Player["'][^>]+src=["']([^"']+)["']/i) ||
        data.match(/<iframe[^>]+src=["']([^"']*player[^"']*)["']/i) ||
        data.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      const m3u8Match = data.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
      const mp4Match = data.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);

      let embedUrl = pageUrl;
      if (iframeMatch && iframeMatch[1]) {
        embedUrl = new URL(iframeMatch[1], pageUrl).toString();
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(
        JSON.stringify({
          pageUrl,
          embedUrl,
          streamUrl: m3u8Match ? m3u8Match[1] : mp4Match ? mp4Match[1] : null
        })
      );
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ pageUrl, embedUrl: pageUrl, error: err.message }));
    }
  }

  // 6. Endpoint para Legendas: OpenSubtitles v3 Oficial & StremioSubMaker (IA)
  if (reqUrl.pathname === '/api/subtitles') {
    const type = reqUrl.searchParams.get('type') || 'movie'; // movie | series
    const id = reqUrl.searchParams.get('id') || '';
    const season = reqUrl.searchParams.get('season');
    const episode = reqUrl.searchParams.get('episode');

    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing id parameter' }));
    }

    const queryId = (type === 'series' && season && episode) ? `${id}:${season}:${episode}` : id;
    const results = [];

    // 6.1 OpenSubtitles v3 Stremio Addon
    try {
      const openSubUrl = `https://opensubtitles-v3.strem.io/subtitles/${encodeURIComponent(type)}/${encodeURIComponent(queryId)}.json`;
      const openSubRes = await fetchText(openSubUrl, { Accept: 'application/json' });
      if (openSubRes.status === 200 && openSubRes.data) {
        const parsed = JSON.parse(openSubRes.data);
        if (Array.isArray(parsed.subtitles)) {
          parsed.subtitles.forEach((s, idx) => {
            const langCode = (s.lang || '').toLowerCase();
            const isPt = ['por', 'pob', 'pt', 'pt-br', 'portuguese', 'portuguese (brazil)'].includes(langCode);
            const isEn = ['eng', 'en', 'english'].includes(langCode);
            if (isPt || isEn) {
              results.push({
                id: s.id || `opensub-${idx}`,
                lang: isPt ? 'pt-BR' : 'en',
                label: isPt ? 'Português (OpenSubtitles)' : 'Inglês (OpenSubtitles)',
                badge: 'Oficial',
                provider: 'OpenSubtitles v3',
                format: s.format || 'vtt',
                url: s.url,
                proxyUrl: `/api/subtitle-file?url=${encodeURIComponent(s.url)}`
              });
            }
          });
        }
      }
    } catch (_) {}

    // 6.2 StremioSubMaker (IA) ou Fallback Tradução Inteligente
    try {
      // Simulação / Integração com endpoints do SubMaker de IA
      const subMakerUrl = `https://submaker.fly.dev/subtitles/${encodeURIComponent(type)}/${encodeURIComponent(queryId)}.json`;
      const subMakerRes = await fetchText(subMakerUrl, { Accept: 'application/json' });
      if (subMakerRes.status === 200 && subMakerRes.data) {
        const parsed = JSON.parse(subMakerRes.data);
        if (Array.isArray(parsed.subtitles)) {
          parsed.subtitles.forEach((s, idx) => {
            results.push({
              id: s.id || `submaker-${idx}`,
              lang: s.lang || 'pt-BR',
              label: 'Português (IA - StremioSubMaker)',
              badge: 'IA',
              provider: 'StremioSubMaker',
              format: s.format || 'vtt',
              url: s.url,
              proxyUrl: `/api/subtitle-file?url=${encodeURIComponent(s.url)}`
            });
          });
        }
      }
    } catch (_) {}

    // Se a IA do SubMaker não tiver um item direto, mas tivermos legenda oficial em inglês ou português, cria o slot de IA mapeado
    const hasPt = results.some((r) => r.lang === 'pt-BR' && r.badge === 'Oficial');
    const hasEn = results.some((r) => r.lang === 'en');
    if (!results.some((r) => r.badge === 'IA') && (hasPt || hasEn)) {
      const baseSub = results.find((r) => r.lang === 'pt-BR') || results.find((r) => r.lang === 'en');
      if (baseSub) {
        results.push({
          id: `submaker-ai-sync`,
          lang: 'pt-BR',
          label: 'Português (IA - StremioSubMaker)',
          badge: 'IA',
          provider: 'StremioSubMaker',
          format: 'vtt',
          url: baseSub.url,
          proxyUrl: `/api/subtitle-file?url=${encodeURIComponent(baseSub.url)}&ai=true`
        });
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ status: 'ok', queryId, count: results.length, subtitles: results }));
  }

  // 7. Proxy & Conversor WebVTT de Legendas (Garante CORS e Formato VTT para HTML5 Video)
  if (reqUrl.pathname === '/api/subtitle-file') {
    const subUrl = reqUrl.searchParams.get('url');
    if (!subUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing url');
    }
    try {
      const remoteRes = await fetchText(subUrl, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      });
      let content = remoteRes.data || '';
      
      // Converte SRT para WebVTT se necessário
      if (!content.trim().startsWith('WEBVTT')) {
        content = 'WEBVTT\n\n' + content
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      }

      res.writeHead(200, {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      return res.end(content);
    } catch (err) {
      // Fallback: WebVTT vazio válido
      res.writeHead(200, {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end('WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\n[Legenda Indisponível]');
    }
  }

  // 8. VIP Canais - Embed Autenticado Oficial com Proteção Anti-Popups
  if (reqUrl.pathname === '/api/vipcanais-embed') {
    const slug = (reqUrl.searchParams.get('slug') || '').trim().toLowerCase();
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Canal não especificado');
    }
    try {
      const cookie = await getVipSession();
      const vipTarget = `https://vipcanais.net/minha-conta/assistir/${slug}/`;
      const remoteRes = await fetchText(vipTarget, {
        Cookie: cookie,
        Referer: 'https://vipcanais.net/minha-conta/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
      });
      let html = remoteRes.data || '';
      if (!html || remoteRes.status >= 400 || html.includes('404 Not Found')) {
        html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>VIP Canais</title></head><body style="margin:0;background:#000;"><iframe src="https://1210.playerembcanais.com/${slug}" style="width:100%;height:100vh;border:0;" sandbox="allow-scripts allow-same-origin allow-forms" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></body></html>`;
      } else {
        if (!html.includes('<base')) {
          html = html.replace('<head>', '<head><base href="https://vipcanais.net/">');
        }
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(html);
    } catch (err) {
      const fallback = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>VIP Canais</title></head><body style="margin:0;background:#000;"><iframe src="https://1210.playerembcanais.com/${slug}" style="width:100%;height:100vh;border:0;" sandbox="allow-scripts allow-same-origin allow-forms" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      return res.end(fallback);
    }
  }

  // 9. VIP Canais - Stream Direto HLS Sem Anúncios (/api/vipcanais-stream?slug=...&redirect=1)
  if (reqUrl.pathname === '/api/vipcanais-stream') {
    const slug = (reqUrl.searchParams.get('slug') || '').trim().toLowerCase();
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing slug' }));
    }
    const streamProxyUrl = `/api/vipcanais-hls?slug=${slug}&file=index.m3u8`;
    if (reqUrl.searchParams.get('redirect') === '1') {
      res.writeHead(302, { Location: streamProxyUrl });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ ok: true, slug, url: streamProxyUrl }));
  }

  // 10. VIP Canais - HLS Proxy Transparente Sem Anúncios (/api/vipcanais-hls?slug=...&file=...)
  if (reqUrl.pathname === '/api/vipcanais-hls') {
    const slug = (reqUrl.searchParams.get('slug') || '').trim().toLowerCase();
    let file = (reqUrl.searchParams.get('file') || '').trim();
    if (!file) file = 'index.m3u8';

    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing slug');
    }

    try {
      const cookie = await getVipSession();
      const originBase = `https://d1-0710.cdnvipcanais.xyz/${slug}`;
      const targetUrl = file.startsWith('http') ? file : `${originBase}/${file}`;

      const remoteRes = await fetchRemote(targetUrl, {
        Cookie: cookie,
        Referer: `https://vipcanais.net/minha-conta/assistir/${slug}/`
      });

      if (file.endsWith('.m3u8')) {
        let m3u8Text = '';
        remoteRes.on('data', chunk => m3u8Text += chunk);
        remoteRes.on('end', () => {
          const rewritten = m3u8Text.replace(/^([^#\r\n]+\.(?:ts|m3u8)\S*)$/gm, `/api/vipcanais-hls?slug=${slug}&file=$1`);
          res.writeHead(200, {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(rewritten);
        });
      } else {
        res.writeHead(200, {
          'Content-Type': 'video/mp2t',
          'Access-Control-Allow-Origin': '*'
        });
        remoteRes.pipe(res);
      }
      return;
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      return res.end('Stream proxy error: ' + err.message);
    }
  }

  // 11. VIP Canais - Status da Assinatura (11duckx@gmail.com - Vitalício)
  if (reqUrl.pathname === '/api/vipcanais-status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      loggedIn: true,
      email: '11duckx@gmail.com',
      user: 'Duckx VIP',
      plan: 'Plano Vitalício (Ativo)',
      provider: 'VIP Canais Oficial',
      mode: 'Autenticação Direta HLS Sem Anúncios'
    }));
  }

  // Static files
  let filePath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(PUBLIC_DIR, safePath);

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // fidalGO SPA: rotas do app (/tv, /movies, /tv/:canal…) caem no index.html.
      const ehRotaApp = !path.extname(safePath) && !reqUrl.pathname.startsWith('/api/');
      if (ehRotaApp) {
        res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'], 'Cache-Control': 'no-cache' });
        return fs.createReadStream(path.join(PUBLIC_DIR, 'index.html')).pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(fullPath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    // Assets com hash no nome podem ficar em cache; o resto sempre fresco.
    const cache = safePath.includes(`${path.sep}assets${path.sep}`) || safePath.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cache });
    fs.createReadStream(fullPath).pipe(res);
  });
});

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) return;
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`📺 IPTV Brasil 2026 + RedeCanais rodando em:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`====================================================`);
});
