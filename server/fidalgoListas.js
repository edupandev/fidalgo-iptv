'use strict';
/**
 * fidalGO: serve as listas que o frontend (visual fidalGO, base Saimo-TV) lê.
 *   /listas/canais/<arq>  catalogo.txt, canais.txt, guia.txt, restritos.txt, radios.txt
 *   /listas/filmes/<arq>  indice.txt, filmes-A.txt, series-*.txt, imdb/…, novidades.json
 * Os arquivos locais de server/data mandam; o que faltar é buscado na origem
 * pública e guardado em cache em server/data/cache-listas.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CACHE_DIR = path.join(DATA_DIR, 'cache-listas');
const ORIGEM_REMOTA = { canais: 'https://canais-saimo.pages.dev/', filmes: 'https://filmes-saimo.pages.dev/' };
const LOCAIS = {
  canais: { 'catalogo.txt': ['saimo_catalogo.txt'], 'radios.txt': ['saimo_vod/radios.txt', 'vod/radios.txt'] },
  filmes: {}
};
const DIRS_FILMES = ['saimo_vod', 'vod'];
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TIPOS = {
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m3u': 'application/vnd.apple.mpegurl; charset=utf-8',
  '.m3u8': 'application/vnd.apple.mpegurl; charset=utf-8'
};

function nomeSeguro(rel) {
  const limpo = path.posix.normalize('/' + rel).slice(1);
  if (!limpo || limpo.includes('..') || !/^[A-Za-z0-9#_.\-/]+$/.test(limpo)) return null;
  return limpo;
}

function localPara(lista, nome) {
  const candidatos = [...(LOCAIS[lista][nome] || [])];
  if (lista === 'filmes') for (const d of DIRS_FILMES) candidatos.push(`${d}/${nome}`);
  for (const c of candidatos) {
    const p = path.join(DATA_DIR, c);
    try { if (fs.statSync(p).isFile()) return p; } catch (_) { /* próximo */ }
  }
  return null;
}

/** Canais VIP do fidalGO em M3U, tocando pelo proxy HLS autenticado do servidor. */
function canaisVip(origem) {
  const arqs = [path.join(DATA_DIR, 'vipcanais_channels.json'), path.join(__dirname, '..', 'vipcanais_channels.json')];
  const usar = arqs.find((a) => fs.existsSync(a));
  if (!usar) return '';
  try {
    return JSON.parse(fs.readFileSync(usar, 'utf8')).map((c) => {
      const nome = String(c.name || c.slug).replace(/[",]/g, ' ');
      const grupo = String(c.category || 'Variedades').replace(/"/g, "'");
      const url = `${origem}/api/vipcanais-hls?slug=${encodeURIComponent(c.slug)}&file=index.m3u8`;
      return `#EXTINF:-1 tvg-logo="${c.logo || ''}" group-title="${grupo}",${nome} (VIP)\n${url}`;
    }).join('\n');
  } catch (_) {
    return '';
  }
}

async function baixarRemoto(lista, nome) {
  const cacheArq = path.join(CACHE_DIR, lista, nome.replace(/[\\/#]/g, '_'));
  try {
    if (Date.now() - fs.statSync(cacheArq).mtimeMs < CACHE_TTL_MS) return fs.readFileSync(cacheArq);
  } catch (_) { /* sem cache */ }
  try {
    const r = await fetch(ORIGEM_REMOTA[lista] + nome.replace(/#/g, '%23'), { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.mkdirSync(path.dirname(cacheArq), { recursive: true });
    fs.writeFileSync(cacheArq, buf);
    return buf;
  } catch (_) {
    try { return fs.readFileSync(cacheArq); } catch (__) { return null; }
  }
}

async function servirLista(req, res, reqUrl) {
  const m = reqUrl.pathname.match(/^\/listas\/(canais|filmes)\/(.+)$/);
  if (!m) return false;
  const lista = m[1];
  let bruto;
  try { bruto = decodeURIComponent(m[2]); } catch (_) { bruto = ''; }
  const nome = nomeSeguro(bruto);
  const cab = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' };
  if (!nome) {
    res.writeHead(400, cab);
    res.end('nome inválido');
    return true;
  }
  const local = localPara(lista, nome);
  let corpo = local ? fs.readFileSync(local) : await baixarRemoto(lista, nome);

  // canais.txt = extras publicados + canais VIP do fidalGO
  if (lista === 'canais' && nome === 'canais.txt') {
    const origem = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    let base = corpo ? corpo.toString('utf8').replace(/^\uFEFF/, '').trim() : '';
    if (!base.startsWith('#EXTM3U')) base = '#EXTM3U\n' + base;
    const vip = canaisVip(origem);
    corpo = Buffer.from(base + '\n' + (vip ? vip + '\n' : ''), 'utf8');
  }

  if (!corpo) {
    res.writeHead(404, cab);
    res.end('não encontrado');
    return true;
  }
  const tipo = TIPOS[path.extname(nome).toLowerCase()] || 'text/plain; charset=utf-8';
  res.writeHead(200, { ...cab, 'Content-Type': tipo, 'Content-Length': corpo.length });
  res.end(req.method === 'HEAD' ? undefined : corpo);
  return true;
}

module.exports = { servirLista };
