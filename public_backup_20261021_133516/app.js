// ============================================================================
// Stremio Web +  tvOS IPTV — Single Page Application (app.js)
// Arquitetura baseada em:
// 1) https://github.com/Stremio/stremio-web.git (Cinemeta v3 API, Discover,
//    Meta Details com Temporadas/Episódios, Addons & Multi-Stream Resolver)
// 2) https://comandoplay.xyz/ (Busca e extração de Filmes e Séries Dublados)
// 3) https://github.com/gabrielsaimo/Saimo-TV.git & SaimoPlayer (catalogo.txt + VOD)
// 4) https://github.com/Ramys/Iptv-Brasil-2026.git & Listas M3U Reais
// ============================================================================

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

// Pre-configured Official Community Addons requested by user from https://stremio-addons.net/:
// 1) FrostView TV — IPTV Ao Vivo (https://stremio-addons.net/addons/frostviews / https://stremio-addons.net/addons/frostview)
// 2) FrostStream — Filmes & Séries (https://stremio-addons.net/addons/froststream)
// 3) Rede Canais — TV Ao Vivo, Filmes & Séries (Reflux & Rede Canais Addon + Repositório RedeCanais)
// 4) BestCine (https://stremio-addons.net/addons/bestcine)
// 5) FenixFlix (https://stremio-addons.net/addons/fenixflix)
// 6) Meu Futebol (https://stremio-addons.net/addons/meu-futebol)
// 7) King VOD (https://stremio-addons.net/addons/king-vod)
// 8) Brazuca Torrents & Brazuca MP4 (https://stremio-addons.net/addons/brazuca-torrents)
const DEFAULT_STREMIO_ADDONS = [
  {
    name: 'FrostView TV (IPTV)',
    directoryPage: 'https://stremio-addons.net/addons/frostviews',
    altDirectoryPage: 'https://stremio-addons.net/addons/frostview',
    manifestUrls: [
      'https://frostview.up.railway.app/manifest.json',
      'https://frostview.cloutteam.com/manifest.json'
    ]
  },
  {
    name: 'FrostStream',
    directoryPage: 'https://stremio-addons.net/addons/froststream',
    manifestUrls: [
      'https://froststream.up.railway.app/manifest.json',
      'https://froststream.cloutteam.com/manifest.json'
    ]
  },
  {
    name: 'BestCine',
    directoryPage: 'https://stremio-addons.net/addons/bestcine',
    manifestUrls: [
      'https://bestcine.dpdns.org/manifest.json',
      'https://bestcine.alwaysdata.net/manifest.json'
    ]
  },
  {
    name: 'FenixFlix',
    directoryPage: 'https://stremio-addons.net/addons/fenixflix',
    manifestUrls: [
      'https://fenixflix.up.railway.app/manifest.json',
      'https://fenixflix.dpdns.org/manifest.json',
      'https://fenixflix.cloutteam.com/manifest.json',
      'https://fenixflix.top/manifest.json'
    ]
  },
  {
    name: 'Torrentio',
    directoryPage: 'https://torrentio.strem.fun',
    manifestUrls: [
      'https://torrentio.strem.fun/manifest.json',
      'https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrentgalaxy,magnetdl,comando,bludv|language=portuguese,brazilian,english/manifest.json'
    ]
  },
  {
    name: 'Meu Futebol',
    directoryPage: 'https://stremio-addons.net/addons/meu-futebol',
    manifestUrls: []
  },
  {
    name: 'King VOD',
    directoryPage: 'https://stremio-addons.net/addons/king-vod',
    manifestUrls: []
  },
  {
    name: 'Brazuca MP4',
    directoryPage: 'https://stremio-addons.net/addons/brazuca-torrents',
    manifestUrls: [
      'https://94c8cb9f702d-brazuca-mp4.baby-beamup.club/manifest.json'
    ]
  },
  {
    name: 'Brazuca Torrents',
    directoryPage: 'https://stremio-addons.net/addons/brazuca-torrents',
    manifestUrls: [
      'https://94c8cb9f702d-brazuca-torrents.baby-beamup.club/manifest.json'
    ]
  },
  {
    name: 'Animes BR',
    directoryPage: 'https://stremio-addons.net/addons/animes-br',
    manifestUrls: []
  }
];

function createLogoSvg(text, bgStart = '#3b0764', bgEnd = '#0f172a') {
  const clean = String(text || 'TV').slice(0, 10).toUpperCase();
  const fontSize = clean.length > 7 ? 14 : clean.length > 5 ? 17 : 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="120" height="80" rx="18" fill="url(#g)"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, Inter, sans-serif" font-weight="800" font-size="${fontSize}" letter-spacing="-0.5">${clean}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ============================================================================
// Filtro Oficial de Esportes: Apenas Combate, Todos Premiere, Todos ESPN e Todos SporTV
// ============================================================================
function isAllowedSportsChannel(name = '') {
  return /\b(combate|premiere|espn|sportv|spor\s*tv|sport\s*tv)\b/i.test(String(name));
}

function isUnwantedOtherGlobo(name = '') {
  const n = String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // Mantém GloboNews (Notícias)
  if (/globo\s*news/i.test(n)) return false;
  // Mantém Globo SP, Globo RJ, Globo Minas e Tribuna Santos
  if (/globo\s*(sp|sao\s*paulo|rj|rio|mg|minas)|tribuna/i.test(n)) return false;
  // Se for outra Tribuna fora de Santos (ex: Tribuna PE / Recife / ES / Vitória), bloqueia
  if (/tribuna\s*(pe|recife|es|vitoria|olinda)/i.test(n)) return true;
  // Bloqueia afiliadas regionais desconhecidas
  if (/\b(eptv|rbs\s*tv|tv\s*vanguarda|tv\s*tem|tv\s*bahia|tv\s*integracao|nsc\s*tv|tv\s*anhanguera|tv\s*verdes\s*mares|inter\s*tv)\b/i.test(n)) {
    return true;
  }
  return false;
}

function normalizeChannelMergeKey(name = '') {
  let s = String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(hd|fhd|sd|4k|uhd|br|pt|h265|hevc|alternativo|backup|ao\s*vivo|canal|rede|tv)\b/g, ' ')
    .replace(/\b(spor\s*tv|sport\s*tv)\b/g, 'sportv')
    .replace(/\bpremiere\s*(1|clubes|fc)\b/g, 'premiereclubes')
    .replace(/\bsportv\s*1\b/g, 'sportv')
    .replace(/\bespn\s*(1|brasil)\b/g, 'espn')
    .replace(/\b(globo\s*tribuna\s*santos|tribuna\s*santos|globo\s*tribuna|tribuna\s*globo|tribuna)\b/g, 'globotribunasantos')
    .replace(/\b(globo\s*sp|globo\s*sao\s*paulo)\b/g, 'globosp')
    .replace(/\b(globo\s*rj|globo\s*rio)\b/g, 'globorj')
    .replace(/[^a-z0-9]/g, '');
  if (s === 'premiere') s = 'premiereclubes';
  if (s === 'globo') s = 'globosp';
  return s;
}

// ============================================================================
// Grade Oficial de TV Aberta (FrostView TV & Brazuca) — Apenas Globo Tribuna Santos
// ============================================================================
function buildCoreOpenTvLineup() {
  const openDefs = [
    {
      name: 'Globo SP',
      slug: 'globosp',
      brazucaId: 'brazuca_globosp',
      badge: 'GLOBO SP',
      c1: '#0284c7',
      c2: '#0f172a',
      desc: 'TV Globo São Paulo — Programação Aberta Ao Vivo via FrostView TV & Brazuca'
    },
    {
      name: 'Globo Tribuna Santos',
      slug: 'tvtribuna',
      altSlug: 'globosp',
      brazucaId: 'brazuca_globotribunasantos',
      badge: 'TRIBUNA',
      c1: '#0284c7',
      c2: '#0f172a',
      desc: 'TV Globo Tribuna Santos (Baixada Santista) — Sinal Aberto Ao Vivo via FrostView TV & Brazuca'
    },
    {
      name: 'Globo RJ',
      slug: 'globorj',
      brazucaId: 'brazuca_globorj',
      badge: 'GLOBO RJ',
      c1: '#0284c7',
      c2: '#0f172a',
      desc: 'TV Globo Rio de Janeiro — Sinal Aberto Ao Vivo via FrostView TV & Brazuca'
    },
    { name: 'SBT', slug: 'sbt', brazucaId: 'brazuca_sbt', badge: 'SBT', c1: '#2563eb', c2: '#1e1b4b', desc: 'SBT — Sistema Brasileiro de Televisão Ao Vivo via FrostView TV & Brazuca' },
    { name: 'Record TV', slug: 'record', brazucaId: 'brazuca_record', badge: 'RECORD', c1: '#1d4ed8', c2: '#0f172a', desc: 'Record TV — Jornalismo, Novelas e Entretenimento Ao Vivo via FrostView TV & Brazuca' },
    { name: 'Band', slug: 'band', brazucaId: 'brazuca_band', badge: 'BAND', c1: '#059669', c2: '#064e3b', desc: 'Bandeirantes — Esportes, Jornalismo e Entretenimento Ao Vivo via FrostView TV & Brazuca' },
    { name: 'RedeTV!', slug: 'redetv', brazucaId: 'brazuca_redetv', badge: 'REDETV!', c1: '#7c3aed', c2: '#2e1065', desc: 'RedeTV! — Sinal Aberto Digital Ao Vivo via FrostView TV & Brazuca' },
    { name: 'TV Cultura', slug: 'tvcultura', brazucaId: 'brazuca_cultura', badge: 'CULTURA', c1: '#0d9488', c2: '#134e4a', desc: 'TV Cultura — Educação, Música, Infantil e Jornalismo Ao Vivo via FrostView TV & Brazuca' },
    { name: 'TV Brasil', slug: 'tvbrasil', brazucaId: 'brazuca_tvbrasil', badge: 'TV BRASIL', c1: '#16a34a', c2: '#14532d', desc: 'TV Brasil — Rede Pública Nacional Ao Vivo via FrostView TV & Brazuca' },
    { name: 'TV Gazeta', slug: 'tvgazeta', brazucaId: 'brazuca_gazeta', badge: 'GAZETA', c1: '#ea580c', c2: '#431407', desc: 'TV Gazeta São Paulo — Esportes e Variedades Ao Vivo via FrostView TV & Brazuca' },
    { name: 'Record News', slug: 'recordnews', brazucaId: 'brazuca_recordnews', badge: 'REC NEWS', c1: '#0369a1', c2: '#0c4a6e', desc: 'Record News — Notícias 24h em Sinal Aberto via FrostView TV & Brazuca' },
    { name: 'Rede Vida', slug: 'redevida', brazucaId: 'brazuca_redevida', badge: 'REDE VIDA', c1: '#ca8a04', c2: '#422006', desc: 'Rede Vida — O Canal da Família Ao Vivo via FrostView TV & Brazuca' },
    { name: 'TV Aparecida', slug: 'tvaparecida', brazucaId: 'brazuca_aparecida', badge: 'APARECIDA', c1: '#0284c7', c2: '#172554', desc: 'TV Aparecida — Programação Ao Vivo via FrostView TV & Brazuca' },
    { name: 'Canal Futura', slug: 'futura', brazucaId: 'brazuca_futura', badge: 'FUTURA', c1: '#9333ea', c2: '#3b0764', desc: 'Canal Futura — Educação e Documentários Ao Vivo via FrostView TV & Brazuca' }
  ];

  return openDefs.map((d) => {
    const sources = d.altSlug
      ? [
          { label: 'FrostView TV (Tribuna Santos)', url: `https://embedcanais.com/${d.slug}/`, origin: 'FrostView TV', isWebEmbed: true },
          { label: 'Brazuca TV (Tribuna Santos)', url: `https://embedcanais.com/${d.altSlug}/`, origin: 'Brazuca TV', isWebEmbed: true },
          { label: 'FrostView Mirror (Santos)', url: `https://nossoplayeronlinehd.blog/tv/${d.slug}`, origin: 'FrostView TV', isWebEmbed: true }
        ]
      : [
          { label: 'FrostView TV', url: `https://embedcanais.com/${d.slug}/`, origin: 'FrostView TV', isWebEmbed: true },
          { label: 'Brazuca TV', url: `https://embedcanais.com/${d.slug}/`, origin: 'Brazuca TV', isWebEmbed: true },
          { label: 'FrostView Mirror', url: `https://nossoplayeronlinehd.blog/tv/${d.slug}`, origin: 'FrostView TV', isWebEmbed: true }
        ];
    return {
      name: d.name,
      group: 'TV Aberta',
      isOpenTvAddon: true,
      logo: createLogoSvg(d.badge, d.c1, d.c2),
      url: sources[0].url,
      isWebEmbed: true,
      sources,
      epg: {
        program: `${d.name} — Sinal Aberto Ao Vivo`,
        category: 'TV Aberta • FrostView TV & Brazuca',
        timeSlot: 'Agora • Ao Vivo',
        synopsis: d.desc,
        progress: 58,
        elapsed: 'Ao Vivo',
        remaining: 'Sinal HD',
        next: 'Programação TV Aberta'
      }
    };
  });
}

function buildCoreSportsLineup() {
  const defs = [
    // Combate
    { name: 'Combate', slug: 'combate', badge: 'COMBATE', c1: '#b91c1c', c2: '#450a0a', desc: 'UFC, Boxe e Artes Marciais Ao Vivo 24h' },
    // Todos os Premiere
    { name: 'Premiere Clubes', slug: 'premiereclubes', badge: 'PREMIERE 1', c1: '#047857', c2: '#064e3b', desc: 'Brasileirão Série A & B e Copa do Brasil Ao Vivo' },
    { name: 'Premiere 2', slug: 'premiere2', badge: 'PREMIERE 2', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 2 Ao Vivo' },
    { name: 'Premiere 3', slug: 'premiere3', badge: 'PREMIERE 3', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 3 Ao Vivo' },
    { name: 'Premiere 4', slug: 'premiere4', badge: 'PREMIERE 4', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 4 Ao Vivo' },
    { name: 'Premiere 5', slug: 'premiere5', badge: 'PREMIERE 5', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 5 Ao Vivo' },
    { name: 'Premiere 6', slug: 'premiere6', badge: 'PREMIERE 6', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 6 Ao Vivo' },
    { name: 'Premiere 7', slug: 'premiere7', badge: 'PREMIERE 7', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 7 Ao Vivo' },
    { name: 'Premiere 8', slug: 'premiere8', badge: 'PREMIERE 8', c1: '#047857', c2: '#064e3b', desc: 'Transmissão Exclusiva Premiere 8 Ao Vivo' },
    // Todos os SporTV
    { name: 'SporTV', slug: 'sportv', badge: 'SPORTV 1', c1: '#1d4ed8', c2: '#1e3a8a', desc: 'Futebol, Seleção Brasileira e Grandes Torneios Ao Vivo' },
    { name: 'SporTV 2', slug: 'sportv2', badge: 'SPORTV 2', c1: '#1d4ed8', c2: '#1e3a8a', desc: 'Superliga, Basquete, Tênis e Futebol Ao Vivo' },
    { name: 'SporTV 3', slug: 'sportv3', badge: 'SPORTV 3', c1: '#1d4ed8', c2: '#1e3a8a', desc: 'Eventos Esportivos e Transmissões Simultâneas Ao Vivo' },
    { name: 'SporTV 4', slug: 'sportv4', badge: 'SPORTV 4', c1: '#1d4ed8', c2: '#1e3a8a', desc: 'Cobertura Especial SporTV 4 Ao Vivo' },
    // Todos os ESPN
    { name: 'ESPN', slug: 'espn', badge: 'ESPN', c1: '#dc2626', c2: '#7f1d1d', desc: 'Libertadores, Premier League, LaLiga, NBA e NFL Ao Vivo' },
    { name: 'ESPN 2', slug: 'espn2', badge: 'ESPN 2', c1: '#dc2626', c2: '#7f1d1d', desc: 'Futebol Europeu, SportsCenter, Tênis e NBA Ao Vivo' },
    { name: 'ESPN 3', slug: 'espn3', badge: 'ESPN 3', c1: '#dc2626', c2: '#7f1d1d', desc: 'Copa Sul-Americana, Futebol Internacional e Ligas Ao Vivo' },
    { name: 'ESPN 4', slug: 'espn4', badge: 'ESPN 4', c1: '#dc2626', c2: '#7f1d1d', desc: 'Campeonato Italiano, Inglês, Espanhol e MotoGP Ao Vivo' },
    { name: 'ESPN 5', slug: 'espn5', badge: 'ESPN 5', c1: '#dc2626', c2: '#7f1d1d', desc: 'Transmissões Ao Vivo e Esportes Americanos ESPN 5' },
    { name: 'ESPN 6', slug: 'espn6', badge: 'ESPN 6', c1: '#dc2626', c2: '#7f1d1d', desc: 'Jogos Exclusivos e Cobertura Multi-Esporte ESPN 6' }
  ];

  return defs.map((d) => {
    const sources = [
      { label: 'FrostView / Embed TV', url: `https://embedcanais.com/${d.slug}/`, origin: 'FrostView TV', isWebEmbed: true },
      { label: 'Meu Futebol HD', url: `https://nossoplayeronlinehd.blog/tv/${d.slug}`, origin: 'Meu Futebol', isWebEmbed: true },
      { label: 'Brazuca TV Esportes', url: `https://embedcanais.com/${d.slug}/`, origin: 'Brazuca TV', isWebEmbed: true }
    ];
    return {
      name: d.name,
      group: 'Esportes',
      logo: createLogoSvg(d.badge, d.c1, d.c2),
      url: sources[0].url,
      isWebEmbed: true,
      sources,
      epg: {
        program: `${d.name} — Ao Vivo`,
        category: 'Esportes • FrostView TV & Rede Canais',
        timeSlot: 'Agora • Ao Vivo',
        synopsis: d.desc,
        progress: 65,
        elapsed: 'Ao Vivo',
        remaining: 'Sinal HD',
        next: 'Transmissão Esportiva Contínua'
      }
    };
  });
}

// ============================================================================
// Estado Global da Aplicação
// ============================================================================
let channels = [];
let filteredChannels = [];

let stremioCatalog = {
  searchResults: [],
  bestCineMovies: [],
  bestCineSeries: [],
  trendingMovies: [],
  topMovies: [],
  trendingSeries: [],
  topSeries: [],
  comandoPlayItems: [],
  animeItems: [],
  sportsChannels: []
};

let discoveredAddonCatalogs = [];

let activeAddonEndpoints = [
  { name: 'FenixFlix', baseUrl: 'https://fenixflix.up.railway.app' },
  { name: 'FenixFlix Mirror', baseUrl: 'https://fenixflix.dpdns.org' },
  { name: 'FrostStream', baseUrl: 'https://froststream.up.railway.app' },
  { name: 'FrostStream Mirror', baseUrl: 'https://froststream.cloutteam.com' },
  { name: 'FrostView TV (IPTV)', baseUrl: 'https://frostview.up.railway.app' },
  { name: 'FrostView TV Mirror', baseUrl: 'https://frostview.cloutteam.com' },
  { name: 'Rede Canais (Reflux)', baseUrl: 'https://rx.postclub.me' },
  { name: 'Rede Canais TV & VOD', baseUrl: 'https://e78422d452bf-rede-canais-addon.baby-beamup.club' },
  { name: 'BestCine', baseUrl: 'https://bestcine.dpdns.org' },
  { name: 'BestCine Mirror', baseUrl: 'https://bestcine.alwaysdata.net' },
  { name: 'Brazuca MP4', baseUrl: 'https://94c8cb9f702d-brazuca-mp4.baby-beamup.club' },
  { name: 'Brazuca Torrents', baseUrl: 'https://94c8cb9f702d-brazuca-torrents.baby-beamup.club' },
  { name: 'Torrentio (Sem Anúncios)', baseUrl: 'https://torrentio.strem.fun' }
];

let installedAddons = JSON.parse(
  localStorage.getItem('stremio_tvos_addons') || '[]'
);

let activeNavTab = 'board'; // 'board' (Hub Inicial Apple TV) | 'live' (Canal Aberto) | 'sports' (Esportes) | 'movies' | 'series'
let activeCategoryChip = 'TV Aberta';
let activeStremioGenre = '';
let searchQuery = '';
let searchDebounceTimer = null;
let isSearchingCatalog = false;
let currentSearchToken = 0;

let heroHubIndex = 0;
let heroHubTimer = null;
let isPlayerVisibleOnHub = false;

let currentChannel = null;
let currentSourceIdx = 0;
let useProxy = true;
let hlsInstance = null;
let mpegtsPlayer = null;
let hasLocalServer = window.location.protocol.startsWith('http');
let favorites = new Set(JSON.parse(localStorage.getItem('stremio_tvos_favorites') || '[]'));

let numericBuffer = '';
let numericTimer = null;

// ============================================================================
// Inicialização
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) lucide.createIcons();
  startLiveClock();
  bindEvents();
  // Inicializa imediatamente:
  // 1) TV Aberta (FrostView TV & Brazuca)
  // 2) Esportes (Combate, todos Premiere, todos ESPN e todos SporTV)
  mergeNewChannels([...buildCoreOpenTvLineup(), ...buildCoreSportsLineup()]);
  renderAll();

  // Carrega em paralelo:
  // 1) Addons do stremio-addons.net (FrostView TV, Brazuca, BestCine, FrostStream, FenixFlix, Meu Futebol, King VOD)
  // 2) Catálogo Oficial Stremio Cinemeta (Filmes & Séries em HD)
  // 3) Catálogos de TV Ao Vivo do FrostView TV & Brazuca
  // 4) Catálogo ComandoPlay.xyz
  await Promise.allSettled([
    loadBestCineAndBrazucaAddons(),
    loadStremioCinemetaCatalogs(),
    loadAllRealLiveChannels(),
    loadComandoPlayCatalog()
  ]);
});

function startLiveClock() {
  const clockEl = document.getElementById('digitalClock');
  const update = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  update();
  setInterval(update, 10000);
}

// ============================================================================
// Helper de Requisições Rápidas com Timeout + Proxy Anti-CORS Local (server.ps1)
// ============================================================================
async function fetchWithTimeout(url, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (r.ok) return await r.text();
  } catch (_) {
  } finally {
    clearTimeout(id);
  }
  return null;
}

async function fetchTextSafe(targetUrl, preferProxy = false, timeoutMs = 2600) {
  const tryLocalProxy = () => {
    if (!hasLocalServer) return Promise.resolve(null);
    return fetchWithTimeout(`/api/proxy?url=${encodeURIComponent(targetUrl)}`, timeoutMs);
  };

  const tryDirect = () => fetchWithTimeout(targetUrl, timeoutMs);

  if (preferProxy) {
    const proxied = await tryLocalProxy();
    if (proxied) return proxied;
    const direct = await tryDirect();
    if (direct) return direct;
  } else {
    const direct = await tryDirect();
    if (direct) return direct;
    const proxied = await tryLocalProxy();
    if (proxied) return proxied;
  }

  const publicProxies = [
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];
  for (const pUrl of publicProxies) {
    const res = await fetchWithTimeout(pUrl, 1800);
    if (res) return res;
  }
  return null;
}

// ============================================================================
// 0. Stremio Addons Loader (FrostView TV IPTV, FrostStream, Rede Canais, BestCine, FenixFlix, Meu Futebol, King VOD, Brazuca)
// ============================================================================
async function extractManifestFromDirectoryPage(pageUrl) {
  const urls = new Set();

  const collectFromText = (rawText) => {
    if (!rawText) return;
    let text = rawText;
    try {
      text += '\n' + decodeURIComponent(rawText);
    } catch (_) {}

    const stremioMatches = text.match(/stremio:\/\/[^\s"'<>\\]+manifest\.json/gi) || [];
    stremioMatches.forEach((m) => urls.add(m.replace(/^stremio:\/\//i, 'https://')));
    const httpsMatches = text.match(/https?:\/\/[^\s"'<>\\]+manifest\.json/gi) || [];
    httpsMatches.forEach((m) => {
      if (!m.includes('stremio-addons.net')) urls.add(m);
    });
  };

  // 1. Consulta a API REST Oficial do stremio-addons.net (/api/v0/addons/{slug} e /api/v0/addons?search={slug})
  const slugMatch = String(pageUrl).match(/\/addons\/([^/?#]+)/i);
  if (slugMatch && slugMatch[1]) {
    const rawSlug = slugMatch[1].toLowerCase();
    const candidateSlugs = [rawSlug];
    if (rawSlug === 'frostviews') candidateSlugs.push('frostview');
    if (rawSlug === 'frostview') candidateSlugs.push('frostviews');

    await Promise.allSettled(
      candidateSlugs.flatMap((slug) => [
        (async () => {
          const apiTxt = await fetchTextSafe(`https://stremio-addons.net/api/v0/addons/${encodeURIComponent(slug)}`, false);
          collectFromText(apiTxt);
        })(),
        (async () => {
          const searchTxt = await fetchTextSafe(`https://stremio-addons.net/api/v0/addons?search=${encodeURIComponent(slug)}`, false);
          collectFromText(searchTxt);
        })()
      ])
    );
  }

  // 2. Fallback: lê também a página HTML do diretório
  if (urls.size === 0) {
    const rawHtml = await fetchTextSafe(pageUrl, true);
    collectFromText(rawHtml);
  }

  return Array.from(urls);
}

async function loadBestCineAndBrazucaAddons() {
  // 1. Descobre dinamicamente os hosts de todos os addons do stremio-addons.net (FrostView TV, FrostStream, Rede Canais, BestCine, FenixFlix, Meu Futebol, King VOD, Brazuca)
  await Promise.allSettled(
    DEFAULT_STREMIO_ADDONS.map(async (addonDef) => {
      const pages = [addonDef.directoryPage, addonDef.altDirectoryPage].filter(Boolean);
      for (const pUrl of pages) {
        const foundManifests = await extractManifestFromDirectoryPage(pUrl);
        foundManifests.forEach((mUrl) => {
          const base = mUrl.replace(/\/manifest\.json$/i, '');
          if (!activeAddonEndpoints.some((e) => e.baseUrl === base)) {
            activeAddonEndpoints.unshift({ name: addonDef.name, baseUrl: base });
          }
        });
      }
    })
  );

  // 2. Carrega os manifestos e catálogos de TODOS os addons ativos
  await Promise.allSettled(
    activeAddonEndpoints.map(async (endpoint) => {
      try {
        const mText = await fetchTextSafe(`${endpoint.baseUrl}/manifest.json`, false);
        if (!mText) return;
        const manifest = JSON.parse(mText);
        const catalogs = Array.isArray(manifest.catalogs) ? [...manifest.catalogs] : [];

        // Se for o FrostView TV (com.frostview.stremio) e o catálogo padrão não estiver explícito, garante frostview-tv-channels
        if (
          (manifest.id === 'com.frostview.stremio' || endpoint.name.includes('FrostView')) &&
          !catalogs.some((c) => c.id === 'frostview-tv-channels')
        ) {
          catalogs.push({ type: 'tv', id: 'frostview-tv-channels', name: 'FrostView TV' });
        }

        catalogs.forEach((cat) => {
          if (!discoveredAddonCatalogs.some((c) => c.baseUrl === endpoint.baseUrl && c.id === cat.id && c.type === cat.type)) {
            discoveredAddonCatalogs.push({
              addonName: endpoint.name,
              baseUrl: endpoint.baseUrl,
              type: cat.type,
              id: cat.id,
              name: cat.name || endpoint.name
            });
          }
        });

        await Promise.allSettled(
          catalogs.slice(0, 14).map(async (cat) => {
            const catUrls = [`${endpoint.baseUrl}/catalog/${encodeURIComponent(cat.type)}/${encodeURIComponent(cat.id)}.json`];

            // Se o catálogo de TV do FrostView ou Brazuca tiver subcategorias/gêneros (ex: TV Aberta, Canais Abertos), busca também!
            const isFrostOrBrazuca = /frostview|brazuca/i.test(endpoint.name);
            if (isFrostOrBrazuca && (cat.type === 'tv' || cat.type === 'channel' || cat.type === 'other')) {
              const genreExtra = Array.isArray(cat.extra) ? cat.extra.find((e) => e.name === 'genre' && Array.isArray(e.options)) : null;
              const genresToPull = genreExtra
                ? genreExtra.options.slice(0, 8)
                : Array.isArray(cat.genres)
                ? cat.genres.slice(0, 8)
                : ['TV Aberta', 'Canais Abertos', 'Abertos'];
              genresToPull.forEach((g) => {
                catUrls.push(`${endpoint.baseUrl}/catalog/${encodeURIComponent(cat.type)}/${encodeURIComponent(cat.id)}/genre=${encodeURIComponent(g)}.json`);
              });
            }

            for (const catUrl of catUrls) {
              const cText = await fetchTextSafe(catUrl, false);
              if (!cText) continue;
              let cData;
              try {
                cData = JSON.parse(cText);
              } catch (_) {
                continue;
              }
              const metas = Array.isArray(cData.metas) ? cData.metas : [];
              if (metas.length === 0) continue;
              const badgeLabel = endpoint.name.toUpperCase();

              const isAnimeCatalog =
                /anime/i.test(endpoint.name) ||
                cat.type === 'anime' ||
                /anime/i.test(`${cat.id} ${cat.name || ''}`);

              if (isAnimeCatalog) {
                const animeMapped = metas.map((m) => ({
                  ...mapCinemetaItem(m, m.type === 'movie' ? 'movie' : 'series'),
                  badge: /frost/i.test(endpoint.name) ? 'FROST ANIME' : 'ANIMES BR',
                  category: 'Animes',
                  subtitle: `${endpoint.name} • ${m.releaseInfo || 'Dublado / Legendado'}`,
                  addonBase: endpoint.baseUrl
                }));
                animeMapped.forEach((a) => {
                  if (!stremioCatalog.animeItems.some((x) => (x.id || x.title) === (a.id || a.title))) {
                    stremioCatalog.animeItems.push(a);
                  }
                });
                continue;
              }

              if (/redecanais|reflux/i.test(endpoint.name)) {
                continue;
              }

              const isTvOrSportsCatalog =
                cat.type === 'tv' ||
                cat.type === 'channel' ||
                cat.type === 'other' ||
                cat.type === 'sports' ||
                endpoint.name.includes('FrostView') ||
                endpoint.name.includes('Futebol');

              if (isTvOrSportsCatalog) {
                const originTag = /brazuca/i.test(endpoint.name)
                  ? 'Brazuca TV'
                  : /frostview/i.test(endpoint.name)
                  ? 'FrostView TV'
                  : endpoint.name;

                const tvChans = metas.map((m) => {
                  const cName = m.name || `Canal ${originTag}`;
                  const rawGenreStr = m.genres?.join(' ') || cat.name || originTag;
                  const groupCat = isAllowedSportsChannel(cName)
                    ? 'Esportes'
                    : isFrostOrBrazuca
                    ? 'TV Aberta'
                    : normalizeGroupCategory(cName, rawGenreStr);
                  const streamEndpoint = `${endpoint.baseUrl}/stream/${encodeURIComponent(m.type || cat.type)}/${encodeURIComponent(m.id)}.json`;

                  // Caso o addon já envie streams diretos dentro do item do catálogo
                  const inlineStreams = Array.isArray(m.streams)
                    ? m.streams.filter((s) => s.url || s.externalUrl).map((s, idx) => ({
                        label: s.name || s.title || `${originTag} ${idx + 1}`,
                        url: s.url || s.externalUrl,
                        origin: originTag
                      }))
                    : [];

                  return {
                    name: cName,
                    group: groupCat,
                    subCategory: normalizeGroupCategory(cName, rawGenreStr),
                    isOpenTvAddon: isFrostOrBrazuca && groupCat !== 'Esportes',
                    logo: m.poster || m.logo || createLogoSvg(cName, '#0284c7', '#0f172a'),
                    url: inlineStreams[0]?.url || streamEndpoint,
                    isStremioTvMeta: inlineStreams.length === 0,
                    stremioId: m.id,
                    stremioType: m.type || cat.type,
                    addonBase: endpoint.baseUrl,
                    epg: {
                      program: m.description || `${cName} — Ao Vivo`,
                      category: `${groupCat} • ${originTag}`,
                      timeSlot: 'Agora • Ao Vivo',
                      synopsis: m.description || `Transmissão ao vivo via ${originTag}.`,
                      progress: 65,
                      elapsed: 'Ao Vivo',
                      remaining: 'Sinal Digital',
                      next: 'Programação Contínua'
                    },
                    sources:
                      inlineStreams.length > 0
                        ? inlineStreams
                        : [
                            {
                              label: originTag,
                              url: streamEndpoint,
                              origin: originTag
                            }
                          ]
                  };
                });
                if (tvChans.length > 0) mergeNewChannels(tvChans);
              } else if (cat.type === 'movie') {
                const mapped = metas.map((m) => ({
                  ...mapCinemetaItem(m, 'movie'),
                  badge: badgeLabel,
                  subtitle: `${endpoint.name} • ${m.releaseInfo || 'Dublado / Legendado'}`,
                  addonBase: endpoint.baseUrl
                }));
                stremioCatalog.bestCineMovies.push(...mapped);
              } else if (cat.type === 'series') {
                const mapped = metas.map((m) => ({
                  ...mapCinemetaItem(m, 'series'),
                  badge: badgeLabel,
                  subtitle: `${endpoint.name} • ${m.releaseInfo || 'Dublado / Legendado'}`,
                  addonBase: endpoint.baseUrl
                }));
                stremioCatalog.bestCineSeries.push(...mapped);
              }
            }
          })
        );
      } catch (_) {}
    })
  );

  renderAll();
}

// ============================================================================
// 1. Motor de Temas & Gêneros (Cinemeta v3 + BestCine + FrostStream + Brazuca)
// ============================================================================
const GENRE_PT_LABELS = {
  Action: 'Ação',
  Adventure: 'Aventura',
  Comedy: 'Comédia',
  Drama: 'Drama',
  'Sci-Fi': 'Ficção Científica',
  Horror: 'Terror',
  Animation: 'Animação',
  Thriller: 'Suspense',
  Romance: 'Romance',
  Crime: 'Policial & Crime',
  Fantasy: 'Fantasia',
  Family: 'Família'
};

const GENRE_SYNONYMS = {
  Action: ['action', 'acao', 'ação', 'luta', 'guerra', 'artes marciais', 'combate', 'explosao'],
  Adventure: ['adventure', 'aventura', 'jornada', 'expedicao'],
  Comedy: ['comedy', 'comedia', 'comédia', 'humor', 'engracado'],
  Drama: ['drama', 'biografia', 'biography', 'historia', 'história'],
  'Sci-Fi': ['sci-fi', 'science fiction', 'ficcao', 'ficção', 'futuro', 'espaco', 'espaço', 'alien', 'cyber'],
  Horror: ['horror', 'terror', 'sobrenatural', 'assombracao', 'medo', 'zumbi', 'macabro'],
  Animation: ['animation', 'animacao', 'animação', 'anime', 'desenho', 'pixar', 'disney'],
  Thriller: ['thriller', 'suspense', 'mystery', 'misterio', 'mistério', 'tensao'],
  Romance: ['romance', 'romantico', 'romântico', 'amor', 'paixao'],
  Crime: ['crime', 'policial', 'investigacao', 'investigação', 'mafia', 'máfia', 'detetive'],
  Fantasy: ['fantasy', 'fantasia', 'magia', 'dragao', 'medieval'],
  Family: ['family', 'familia', 'família', 'infantil', 'kids', 'crianca']
};

function matchesGenreTheme(item, genreKey = '') {
  if (!genreKey) return true;
  const keywords = GENRE_SYNONYMS[genreKey] || [genreKey.toLowerCase()];
  const itemGenres = Array.isArray(item.genres) ? item.genres.join(' ') : '';
  const haystack = `${itemGenres} ${item.category || ''} ${item.subtitle || ''} ${item.description || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return keywords.some((kw) => {
    const cleanKw = kw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return haystack.includes(cleanKw);
  });
}

async function loadStremioCinemetaCatalogs(genre = '') {
  const genreSuffix = genre ? `/genre=${encodeURIComponent(genre)}.json` : '.json';

  const endpoints = [
    { key: 'trendingMovies', url: `${CINEMETA_URL}/catalog/movie/top${genreSuffix}`, type: 'movie' },
    { key: 'topMovies', url: `${CINEMETA_URL}/catalog/movie/imdbRating${genreSuffix}`, type: 'movie' },
    { key: 'trendingSeries', url: `${CINEMETA_URL}/catalog/series/top${genreSuffix}`, type: 'series' },
    { key: 'topSeries', url: `${CINEMETA_URL}/catalog/series/imdbRating${genreSuffix}`, type: 'series' }
  ];

  await Promise.allSettled(
    endpoints.map(async (ep) => {
      try {
        const txt = await fetchTextSafe(ep.url, false, 3200);
        if (txt) {
          const data = JSON.parse(txt);
          if (Array.isArray(data.metas) && data.metas.length > 0) {
            stremioCatalog[ep.key] = data.metas.slice(0, 40).map((m) => {
              const mapped = mapCinemetaItem(m, ep.type);
              if (genre && !mapped.genres.includes(genre)) {
                mapped.genres = [...mapped.genres, genre, GENRE_PT_LABELS[genre] || genre];
              }
              return mapped;
            });
          }
        }
      } catch (_) {}
    })
  );

  // Também consulta os catálogos de filmes/séries dos addons PT-BR (BestCine, FrostStream, FenixFlix, King VOD, Brazuca) para o tema selecionado
  if (genre) {
    const ptLabel = GENRE_PT_LABELS[genre] || genre;
    const vodCatalogs = discoveredAddonCatalogs.filter((c) => c.type === 'movie' || c.type === 'series').slice(0, 10);

    await Promise.allSettled(
      vodCatalogs.flatMap((cat) =>
        [genre, ptLabel].map(async (gName) => {
          const url = `${cat.baseUrl}/catalog/${encodeURIComponent(cat.type)}/${encodeURIComponent(cat.id)}/genre=${encodeURIComponent(gName)}.json`;
          const txt = await fetchTextSafe(url, false, 2200);
          if (!txt) return;
          try {
            const d = JSON.parse(txt);
            const metas = Array.isArray(d.metas) ? d.metas : [];
            const mapped = metas.slice(0, 24).map((m) => {
              const item = mapCinemetaItem(m, cat.type);
              item.badge = cat.addonName.toUpperCase();
              item.subtitle = `${cat.addonName} • ${ptLabel}`;
              item.addonBase = cat.baseUrl;
              item.genres = [...(item.genres || []), genre, ptLabel];
              return item;
            });
            if (cat.type === 'movie') {
              mapped.forEach((item) => {
                if (!stremioCatalog.bestCineMovies.some((x) => (x.imdbId || x.title) === (item.imdbId || item.title))) {
                  stremioCatalog.bestCineMovies.push(item);
                }
              });
            } else {
              mapped.forEach((item) => {
                if (!stremioCatalog.bestCineSeries.some((x) => (x.imdbId || x.title) === (item.imdbId || item.title))) {
                  stremioCatalog.bestCineSeries.push(item);
                }
              });
            }
          } catch (_) {}
        })
      )
    );
  }

  renderAll();
}

function mapCinemetaItem(meta, defaultType = 'movie') {
  return {
    id: meta.id || meta.imdb_id,
    imdbId: meta.imdb_id || meta.id,
    title: meta.name,
    subtitle: `${meta.releaseInfo || ''} ${meta.imdbRating ? `• ★ ${meta.imdbRating}` : ''}`.trim(),
    badge: meta.imdbRating ? `★ ${meta.imdbRating}` : defaultType === 'series' ? 'SÉRIE' : 'FILME',
    category: defaultType === 'series' ? 'Séries' : 'Filmes',
    type: defaultType,
    poster: meta.poster || createLogoSvg(meta.name, '#581c87', '#0f172a'),
    background: meta.background || meta.poster || '',
    description: meta.description || '',
    genres: meta.genres || [],
    isStremioMeta: true
  };
}

// Helper estrito para validar se o título retornado pelo addon realmente bate com a busca
function normalizeSearchText(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesSearchQuery(candidateTitle = '', rawQuery = '') {
  const normTitle = normalizeSearchText(candidateTitle);
  const normQuery = normalizeSearchText(rawQuery);
  if (!normTitle || !normQuery) return false;
  if (normTitle.includes(normQuery)) return true;

  const stopWords = new Set(['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'os', 'as', 'um', 'uma', 'the', 'of', 'and']);
  const tokens = normQuery.split(' ').filter((w) => w.length >= 2 && !stopWords.has(w));
  if (tokens.length === 0) return normTitle.includes(normQuery);
  return tokens.every((tok) => normTitle.includes(tok));
}

const searchMemoryCache = new Map();

async function searchStremioAndComandoPlay(query) {
  const cleanQ = String(query || '').trim();
  if (!cleanQ || cleanQ.length < 2) {
    isSearchingCatalog = false;
    renderAll();
    return;
  }

  const cacheKey = normalizeSearchText(cleanQ);
  if (searchMemoryCache.has(cacheKey)) {
    stremioCatalog.searchResults = searchMemoryCache.get(cacheKey);
    isSearchingCatalog = false;
    renderAll();
    return;
  }

  const myToken = ++currentSearchToken;
  const qEnc = encodeURIComponent(cleanQ);
  const collected = [];

  // Helper que atualiza a tela IMEDIATAMENTE assim que a primeira fonte responde (sem esperar os servidores lentos!)
  const flushSearchProgress = (isFinal = false) => {
    if (myToken !== currentSearchToken) return;
    collected.sort((a, b) => (a.priority || 9) - (b.priority || 9));
    const seen = new Set();
    const deduped = collected.filter((it) => {
      const key = it.imdbId || `${normalizeSearchText(it.title)}-${it.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length > 0 || isFinal) {
      stremioCatalog.searchResults = deduped;
      isSearchingCatalog = false;
      if (deduped.length > 0) {
        searchMemoryCache.set(cacheKey, deduped);
      }
      renderAll();
    }
  };

  // 1. Busca Instantânea (0ms) nos catálogos já carregados em memória
  const localPool = [
    ...stremioCatalog.bestCineMovies,
    ...stremioCatalog.bestCineSeries,
    ...stremioCatalog.comandoPlayItems,
    ...stremioCatalog.trendingMovies,
    ...stremioCatalog.trendingSeries,
    ...stremioCatalog.topMovies,
    ...stremioCatalog.topSeries
  ];
  localPool.forEach((item) => {
    if (matchesSearchQuery(item.title, cleanQ)) {
      collected.push({ ...item, priority: 1 });
    }
  });

  if (collected.length > 0) {
    // Achou na memória local em 0ms -> já mostra na hora enquanto complementa em background!
    flushSearchProgress(false);
  } else {
    isSearchingCatalog = true;
    stremioCatalog.searchResults = [];
    renderAll();
  }

  const firstChar = cacheKey.charAt(0) || 'a';

  // 2. Dispara buscas rápidas em paralelo — cada uma chama flushSearchProgress(false) assim que termina!
  const tasks = [
    // 2a. Cinemeta Filmes (Ultra-rápido ~150ms via CDN global)
    (async () => {
      try {
        const txt = await fetchWithTimeout(`${CINEMETA_URL}/catalog/movie/top/search=${qEnc}.json`, 1800);
        if (!txt) return;
        const d = JSON.parse(txt);
        let added = 0;
        (d.metas || []).slice(0, 20).forEach((m) => {
          if (matchesSearchQuery(m.name || '', cleanQ)) {
            collected.push({
              ...mapCinemetaItem(m, 'movie'),
              badge: 'FROSTSTREAM • BESTCINE • REDE CANAIS',
              subtitle: `Filme • ${m.releaseInfo || 'HD'}`,
              priority: 1
            });
            added++;
          }
        });
        if (added > 0) flushSearchProgress(false);
      } catch (_) {}
    })(),

    // 2b. Cinemeta Séries (Ultra-rápido ~150ms via CDN global)
    (async () => {
      try {
        const txt = await fetchWithTimeout(`${CINEMETA_URL}/catalog/series/top/search=${qEnc}.json`, 1800);
        if (!txt) return;
        const d = JSON.parse(txt);
        let added = 0;
        (d.metas || []).slice(0, 20).forEach((m) => {
          if (matchesSearchQuery(m.name || '', cleanQ)) {
            collected.push({
              ...mapCinemetaItem(m, 'series'),
              badge: 'FROSTSTREAM • BESTCINE • REDE CANAIS',
              subtitle: `Série • ${m.releaseInfo || 'HD'}`,
              priority: 1
            });
            added++;
          }
        });
        if (added > 0) flushSearchProgress(false);
      } catch (_) {}
    })(),

    // 2c. API de Sugestões IMDb (~200ms — encontra títulos em Português e Inglês com ID tt...)
    (async () => {
      try {
        const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/${encodeURIComponent(firstChar)}/${qEnc}.json`;
        const txt = await fetchTextSafe(imdbUrl, true, 1900);
        if (!txt) return;
        const data = JSON.parse(txt);
        const list = Array.isArray(data.d) ? data.d : [];
        let added = 0;
        list.forEach((entry) => {
          if (!entry.id || !String(entry.id).startsWith('tt')) return;
          const qid = String(entry.qid || entry.q || '').toLowerCase();
          const isSeries = qid.includes('series') || qid.includes('tv');
          const type = isSeries ? 'series' : 'movie';
          const posterUrl = entry.i?.imageUrl || createLogoSvg(entry.l, '#581c87', '#0f172a');
          collected.push({
            id: entry.id,
            imdbId: entry.id,
            title: entry.l,
            subtitle: `${entry.y || 'HD'} • ${entry.s || 'FrostStream • BestCine • Rede Canais'}`,
            badge: isSeries ? 'SÉRIE • ADDONS PT-BR' : 'FILME • ADDONS PT-BR',
            category: isSeries ? 'Séries' : 'Filmes',
            type,
            poster: posterUrl,
            background: posterUrl,
            description: `Elenco / Info: ${entry.s || 'Disponível nos addons FrostStream, BestCine, Rede Canais, FenixFlix, King VOD e Brazuca.'}`,
            genres: [entry.q || (isSeries ? 'Série' : 'Filme')],
            isStremioMeta: true,
            priority: matchesSearchQuery(entry.l, cleanQ) ? 1 : 2
          });
          added++;
        });
        if (added > 0) flushSearchProgress(false);
      } catch (_) {}
    })(),

    // 2d. Catálogos principais dos addons ativos (com timeout curto de 1.8s para não travar)
    ...discoveredAddonCatalogs
      .filter((c) => c.type === 'movie' || c.type === 'series')
      .slice(0, 6)
      .map(async (cat) => {
        try {
          const searchUrl = `${cat.baseUrl}/catalog/${encodeURIComponent(cat.type)}/${encodeURIComponent(cat.id)}/search=${qEnc}.json`;
          const txt = await fetchTextSafe(searchUrl, false, 1800);
          if (!txt) return;
          const d = JSON.parse(txt);
          if (Array.isArray(d.metas) && d.metas.length > 0) {
            let added = 0;
            d.metas.forEach((m) => {
              if (matchesSearchQuery(m.name || '', cleanQ)) {
                collected.push({
                  ...mapCinemetaItem(m, cat.type === 'series' ? 'series' : 'movie'),
                  badge: cat.addonName.toUpperCase(),
                  subtitle: `${cat.addonName} • ${m.releaseInfo || 'Dublado / Legendado'}`,
                  addonBase: cat.baseUrl,
                  priority: 1
                });
                added++;
              }
            });
            if (added > 0) flushSearchProgress(false);
          }
        } catch (_) {}
      }),

    // 2e. ComandoPlay.xyz
    (async () => {
      try {
        const found = await searchOnComandoPlay(cleanQ);
        let added = 0;
        (found || []).forEach((item) => {
          if (matchesSearchQuery(item.title, cleanQ)) {
            collected.push({ ...item, priority: 1 });
            added++;
          }
        });
        if (added > 0) flushSearchProgress(false);
      } catch (_) {}
    })()
  ];

  await Promise.allSettled(tasks);
  flushSearchProgress(true);
}

// ============================================================================
// Reprodução Direta de Filmes e Séries (1-Clique, Foco Total no Player)
// ============================================================================
function syncNavButtons(tab) {
  document.querySelectorAll('[data-nav-tab]').forEach((b) => {
    const isAct = b.dataset.navTab === tab;
    b.classList.toggle('active', isAct);
    b.classList.toggle('text-white/70', !isAct);
  });
  document.querySelectorAll('[data-rail-btn]').forEach((r) => {
    r.classList.toggle('active', r.dataset.railBtn === tab);
  });
}

function playMovieDirect(item) {
  document.getElementById('stremioMetaModal')?.classList.add('hidden');
  activeNavTab = 'movies';
  syncNavButtons('movies');
  isPlayerVisibleOnHub = true;
  updateLayoutSectionsVisibility();

  // Limpa carrosséis recomendados embaixo para foco 100% no filme
  const carouselsEl = document.getElementById('carouselsContainer');
  if (carouselsEl) carouselsEl.innerHTML = '';
  document.getElementById('stremioGenreBar')?.classList.add('hidden');

  const stage = document.getElementById('liveStageSection');
  if (stage) stage.classList.remove('hidden');
  document.getElementById('appleTvHeroHub')?.classList.add('hidden');
  document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });

  showPlayerToast(`Carregando filme ${item.title}...`);
  renderStremioStreamsForMeta(item, null, null, '', true);
}

function playSeriesDirect(item, season = 1, episode = 1) {
  document.getElementById('stremioMetaModal')?.classList.add('hidden');
  activeNavTab = 'series';
  syncNavButtons('series');
  isPlayerVisibleOnHub = true;
  updateLayoutSectionsVisibility();

  // "Tire a parte de recomendados e deixe só a série"
  const carouselsEl = document.getElementById('carouselsContainer');
  if (carouselsEl) carouselsEl.innerHTML = '';
  document.getElementById('stremioGenreBar')?.classList.add('hidden');

  const stage = document.getElementById('liveStageSection');
  if (stage) stage.classList.remove('hidden');
  document.getElementById('appleTvHeroHub')?.classList.add('hidden');
  document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });

  showPlayerToast(`Carregando ${item.title} (Temporada ${season}, Episódio ${episode})...`);
  renderStremioStreamsForMeta(item, season, episode, `Episódio ${episode}`, true);
}

// ============================================================================
// Stremio Meta Details View (Fanart HD, IMDb, Temporadas/Episódios & Streams!)
// ============================================================================
async function openStremioMetaModal(item) {
  const modal = document.getElementById('stremioMetaModal');
  modal.classList.remove('hidden');

  // Preenche dados iniciais imediatos
  document.getElementById('metaModalTitle').textContent = item.title;
  document.getElementById('metaModalPoster').src = item.poster;
  document.getElementById('metaModalFanart').style.backgroundImage = `url('${item.background || item.poster}')`;
  document.getElementById('metaModalTypeBadge').textContent =
    item.type === 'series' || item.type === 'anime' ? (item.type === 'anime' ? 'ANIME' : 'SÉRIE') : 'FILME';
  document.getElementById('metaModalYear').textContent = item.subtitle || '';
  document.getElementById('metaModalImdb').textContent = item.badge || 'HD';
  document.getElementById('metaModalRuntime').textContent = '';
  document.getElementById('metaModalGenres').textContent = (item.genres || []).join(' • ');
  document.getElementById('metaModalPlot').textContent = item.description || 'Carregando sinopse detalhada e episódios via Stremio Cinemeta...';
  document.getElementById('metaModalCast').textContent = '';

  const seriesSection = document.getElementById('metaSeriesSection');
  seriesSection.classList.add('hidden');

  // Conecta botão "Assistir Agora" direto da modal
  const btnDirect = document.getElementById('btnModalDirectWatch');
  if (btnDirect) {
    btnDirect.onclick = () => {
      if (item.type === 'series' || item.type === 'anime') {
        const firstEp = item._episodes?.[0] || { season: 1, episode: 1, name: 'Episódio 1' };
        playSeriesDirect(item, firstEp.season, firstEp.episode);
      } else {
        playMovieDirect(item);
      }
    };
  }

  // Se for item direto do ComandoPlay sem IMDb ID, já monta os streams do ComandoPlay
  if (!item.imdbId || !String(item.imdbId).startsWith('tt')) {
    renderStremioStreamsForMeta(item, null, null);
    return;
  }

  // Busca metadados completos na API oficial do Stremio Cinemeta
  try {
    const res = await fetch(`${CINEMETA_URL}/meta/${item.type}/${item.imdbId}.json`);
    if (res.ok) {
      const data = await res.json();
      const meta = data.meta;
      if (meta) {
        if (meta.background) {
          document.getElementById('metaModalFanart').style.backgroundImage = `url('${meta.background}')`;
        }
        document.getElementById('metaModalYear').textContent = meta.releaseInfo || meta.year || '';
        document.getElementById('metaModalImdb').textContent = meta.imdbRating ? `★ ${meta.imdbRating} IMDb` : 'HD';
        document.getElementById('metaModalRuntime').textContent = meta.runtime || '';
        document.getElementById('metaModalGenres').textContent = (meta.genres || meta.genre || []).join(' • ');
        document.getElementById('metaModalPlot').textContent = meta.description || 'Sinopse disponível no catálogo Stremio.';
        if (Array.isArray(meta.cast) && meta.cast.length > 0) {
          document.getElementById('metaModalCast').textContent = `Elenco: ${meta.cast.slice(0, 6).join(', ')}`;
        }

        // Se for Série ou Anime e tiver lista de vídeos (Temporadas e Episódios)
        if ((item.type === 'series' || item.type === 'anime') && Array.isArray(meta.videos) && meta.videos.length > 0) {
          setupSeriesSeasonsAndEpisodes(item, meta.videos);
          return;
        }
      }
    }
  } catch (_) {}

  renderStremioStreamsForMeta(item, null, null);
}

function parseSeriesVideos(item, videos) {
  const seasonsMap = new Map();
  (videos || []).forEach((v) => {
    const sNum = v.season ?? 1;
    if (sNum === 0) return; // Ignora especiais se houver temporadas normais
    if (!seasonsMap.has(sNum)) seasonsMap.set(sNum, []);
    seasonsMap.get(sNum).push(v);
  });

  item._rawVideos = videos;
  item._seasonsMap = seasonsMap;
  item._episodes = Array.from(seasonsMap.keys())
    .sort((a, b) => a - b)
    .flatMap((s) =>
      seasonsMap
        .get(s)
        .slice()
        .sort((a, b) => (a.episode || 0) - (b.episode || 0))
        .map((v, i) => ({ season: Number(s), episode: v.episode || i + 1, name: v.name || v.title || '' }))
    );

  return seasonsMap;
}

function setupSeriesSeasonsAndEpisodes(item, videos) {
  const seriesSection = document.getElementById('metaSeriesSection');
  const seasonSelect = document.getElementById('metaSeasonSelect');
  const episodesList = document.getElementById('metaEpisodesList');

  const seasonsMap = parseSeriesVideos(item, videos);

  if (seasonsMap.size === 0) {
    renderStremioStreamsForMeta(item, 1, 1);
    return;
  }

  if (seriesSection) seriesSection.classList.remove('hidden');
  if (seasonSelect) seasonSelect.innerHTML = '';
  const sortedSeasons = Array.from(seasonsMap.keys()).sort((a, b) => a - b);

  sortedSeasons.forEach((sNum) => {
    const opt = document.createElement('option');
    opt.value = sNum;
    opt.textContent = `Temporada ${sNum} (${seasonsMap.get(sNum).length} ep.)`;
    seasonSelect.appendChild(opt);
  });

  const renderSeasonEpisodes = (sNum) => {
    episodesList.innerHTML = '';
    const eps = (seasonsMap.get(Number(sNum)) || []).sort((a, b) => (a.episode || 0) - (b.episode || 0));

    eps.forEach((ep, idx) => {
      const epNum = ep.episode || idx + 1;
      const card = document.createElement('div');
      card.className =
        'tvos-glass hover:bg-blue-600/20 p-2.5 sm:p-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 border border-white/10 hover:border-blue-400/30 transition-all group';
      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-14 sm:w-16 aspect-video rounded-xl bg-black/60 overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-mono text-sky-300 font-bold">
            ${ep.thumbnail ? `<img src="${ep.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onerror="this.style.display='none'"/>` : `E${epNum}`}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 truncate">${epNum}. ${escapeHtml(ep.name || ep.title || `Episódio ${epNum}`)}</div>
            <div class="text-[10px] text-white/50 truncate mt-0.5">Temporada ${sNum} • Episódio ${epNum} • Clique para reproduzir</div>
          </div>
        </div>
        <button class="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all">
          <i data-lucide="play" class="w-3.5 h-3.5 fill-white"></i>
          <span>Assistir</span>
        </button>
      `;
      card.addEventListener('click', () => {
        const modal = document.getElementById('stremioMetaModal');
        if (modal) modal.classList.add('hidden');
        showPlayerToast(`Iniciando T${sNum}:E${epNum} • ${ep.name || `Episódio ${epNum}`}...`);
        renderStremioStreamsForMeta(item, Number(sNum), epNum, ep.name || `Episódio ${epNum}`, true);
      });
      episodesList.appendChild(card);
    });

    if (window.lucide) {
      try { window.lucide.createIcons(); } catch (_) {}
    }

    if (eps.length > 0) {
      const firstEp = eps[0].episode || 1;
      renderStremioStreamsForMeta(item, sNum, firstEp, eps[0].name || `Episódio ${firstEp}`, false);
    }
  };

  seasonSelect.onchange = (e) => renderSeasonEpisodes(e.target.value);
  renderSeasonEpisodes(sortedSeasons[0]);
}

// ============================================================================
// Áudio: Dublado / Legendado + Próximo Episódio
// ============================================================================
let audioPreference = localStorage.getItem('fidalgo_audio_pref') || 'all'; // 'all' | 'dub' | 'leg'

function detectStreamAudio(text = '') {
  const t = String(text).toLowerCase();
  const isDual = /dual|multi[\s-]*(audio|áudio)|dub\s*\+\s*leg|dublado\s*(e|&|\/)\s*legendado/.test(t);
  const isDub = /dublad|dub\b|pt-?br|portugu[eê]s|nacional|🇧🇷/.test(t);
  const isLeg = /legendad|\bleg\b|subtitle|\bsub\b|legenda/.test(t);
  if (isDual || (isDub && isLeg)) return 'both';
  if (isDub) return 'dub';
  if (isLeg) return 'leg';
  return 'unknown';
}

function matchesAudioPref(opt, pref = audioPreference) {
  if (pref === 'all') return true;
  const a = opt.audio || 'unknown';
  return a === 'both' || a === pref || a === 'unknown';
}

function getNextEpisodeInfo(item, season, episode) {
  const list = item?._episodes || [];
  const idx = list.findIndex((e) => e.season === Number(season) && e.episode === Number(episode));
  if (idx >= 0 && idx + 1 < list.length) return list[idx + 1];
  if (idx === -1 && list.length === 0) return { season: Number(season), episode: Number(episode) + 1, name: '' };
  return null;
}

async function playNextEpisode() {
  const nav = currentChannel?.seriesNav;
  if (!nav) return;
  const next = getNextEpisodeInfo(nav.item, nav.season, nav.episode);
  if (!next) {
    showPlayerToast('Você chegou ao último episódio disponível.');
    return;
  }
  showPlayerToast(`Carregando T${next.season}:E${next.episode}${next.name ? ` • ${next.name}` : ''}...`);
  await renderStremioStreamsForMeta(nav.item, next.season, next.episode, next.name || `Episódio ${next.episode}`, true);
}

let currentStageSelectedSeason = null;
let lastRenderedStageEpisodeKey = null;

function updateStageAudioButtons() {
  document.querySelectorAll('#stageAudioSelector [data-stage-audio]').forEach((btn) => {
    const isAct = btn.dataset.stageAudio === audioPreference;
    if (isAct) {
      btn.className = 'stage-audio-btn px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/50 cursor-pointer select-none';
    } else {
      btn.className = 'stage-audio-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-white/70 hover:text-white hover:bg-white/10 border border-transparent cursor-pointer select-none';
    }
  });
}

function setAudioPreference(pref, reloadCurrent = true) {
  audioPreference = pref;
  localStorage.setItem('fidalgo_audio_pref', pref);
  updateStageAudioButtons();

  document.querySelectorAll('#stremioMetaModal [data-audio-pref]').forEach((b) => {
    const on = b.dataset.audioPref === audioPreference;
    b.className = `px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
      on ? 'bg-white text-black border-white' : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
    }`;
  });

  const label = pref === 'dub' ? '🇧🇷 Dublado' : pref === 'leg' ? '💬 Original / Legendado' : '🌐 Todos os Áudios';
  showPlayerToast(`Áudio preferido: ${label}`);

  if (reloadCurrent && currentChannel?.seriesNav?.item) {
    const nav = currentChannel.seriesNav;
    const currentEpNum = Number(nav.episode) || 1;
    const currentSeasonNum = Number(nav.season) || 1;
    const epObj = (nav.item._seasonsMap?.get(currentSeasonNum) || []).find((e) => (e.episode || 1) === currentEpNum);
    const epName = epObj?.name || epObj?.title || `Episódio ${currentEpNum}`;
    renderStremioStreamsForMeta(nav.item, currentSeasonNum, currentEpNum, epName, true);
  }
}

function initStageAudioSelector() {
  const container = document.getElementById('stageAudioSelector');
  if (!container) return;
  container.querySelectorAll('[data-stage-audio]').forEach((btn) => {
    btn.onclick = () => {
      setAudioPreference(btn.dataset.stageAudio, true);
    };
  });
  updateStageAudioButtons();
}

async function renderStageSeriesSection(ch) {
  const stageSection = document.getElementById('stageSeriesSection');
  const stageSeasonList = document.getElementById('stageSeasonList');
  const stageEpisodesList = document.getElementById('stageEpisodesList');
  const stageEpisodesHeader = document.getElementById('stageEpisodesHeader');
  const stageSeasonTotalBadge = document.getElementById('stageSeasonTotalBadge');
  const nextStageBtn = document.getElementById('btnNextEpisodeStage');
  const nextTopBtn = document.getElementById('btnNextEpisode');
  const nextOverlayBtn = document.getElementById('btnNextEpisodeOverlay');

  if (!stageSection || !stageSeasonList || !stageEpisodesList) return;

  const nav = ch?.seriesNav;
  if (!nav || !nav.item) {
    stageSection.classList.add('hidden');
    nextStageBtn?.classList.add('hidden');
    nextTopBtn?.classList.add('hidden');
    nextOverlayBtn?.classList.add('hidden');
    lastRenderedStageEpisodeKey = null;
    return;
  }

  const item = nav.item;
  const currentSeason = Number(nav.season) || 1;
  const currentEpisode = Number(nav.episode) || 1;
  const currentEpKey = `${item.imdbId || item.title}_S${currentSeason}E${currentEpisode}`;

  // Se mudou de episódio ou de série, sincroniza a seleção com a temporada do episódio que começou
  if (lastRenderedStageEpisodeKey !== currentEpKey) {
    currentStageSelectedSeason = currentSeason;
    lastRenderedStageEpisodeKey = currentEpKey;
  }

  // Se ainda não tiver os vídeos/episódios carregados, busca no Cinemeta
  if (!item._seasonsMap || item._seasonsMap.size === 0) {
    const metaId = item.imdbId || item.id;
    if (metaId) {
      try {
        const res = await fetch(`${CINEMETA_URL}/meta/${item.type || 'series'}/${metaId}.json`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.meta?.videos)) {
            parseSeriesVideos(item, data.meta.videos);
          }
        }
      } catch (_) {}
    }
  }

  const seasonsMap = item._seasonsMap;
  if (!seasonsMap || seasonsMap.size === 0) {
    stageSection.classList.add('hidden');
    return;
  }

  stageSection.classList.remove('hidden');

  // Atualiza título e subtítulo
  const titleEl = document.getElementById('stageSeriesTitle');
  const subEl = document.getElementById('stageSeriesSubtitle');
  if (titleEl) titleEl.textContent = item.title || 'Série';
  if (subEl) {
    const activeEpObj = (seasonsMap.get(currentSeason) || []).find((e) => (e.episode || 1) === currentEpisode);
    const epName = activeEpObj?.name || activeEpObj?.title || '';
    subEl.textContent = `Reproduzindo: Temporada ${currentSeason}, Episódio ${currentEpisode}${epName ? ` • ${epName}` : ''}`;
  }

  // Sincroniza botões de áudio do painel
  updateStageAudioButtons();

  // Botões de próximo episódio (cabeçalho da seção, overlay do player e barra EPG)
  const nextInfo = getNextEpisodeInfo(item, currentSeason, currentEpisode);
  const updateNextBtn = (btn) => {
    if (!btn) return;
    if (nextInfo) {
      btn.classList.remove('hidden');
      btn.title = `Próximo: T${nextInfo.season}:E${nextInfo.episode}${nextInfo.name ? ` • ${nextInfo.name}` : ''}`;
      const span = btn.querySelector('span');
      if (span) span.textContent = `Próximo Ep: T${nextInfo.season}:E${nextInfo.episode}`;
    } else {
      btn.classList.add('hidden');
    }
  };
  updateNextBtn(nextTopBtn);
  updateNextBtn(nextStageBtn);
  updateNextBtn(nextOverlayBtn);

  // Garante temporada selecionada válida
  const sortedSeasons = Array.from(seasonsMap.keys()).sort((a, b) => a - b);
  if (stageSeasonTotalBadge) {
    stageSeasonTotalBadge.textContent = `${sortedSeasons.length} ${sortedSeasons.length === 1 ? 'temporada' : 'temporadas'}`;
  }

  let activeSeason = currentStageSelectedSeason;
  if (!activeSeason || !seasonsMap.has(Number(activeSeason))) {
    activeSeason = currentSeason;
  }
  if (!seasonsMap.has(Number(activeSeason))) {
    activeSeason = sortedSeasons[0];
  }
  currentStageSelectedSeason = Number(activeSeason);

  // Renderiza a LISTA VERTICAL de Temporadas (estruturada, sem espalhar na tela)
  stageSeasonList.innerHTML = '';
  sortedSeasons.forEach((sNum) => {
    const isAct = Number(sNum) === Number(activeSeason);
    const epCount = (seasonsMap.get(sNum) || []).length;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all shrink-0 cursor-pointer select-none ${
      isAct
        ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/30 border-blue-400 font-bold scale-[1.01]'
        : 'tvos-glass hover:bg-white/10 text-white/80 hover:text-white border-white/10'
    }`;
    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <i data-lucide="${isAct ? 'folder-open' : 'folder'}" class="w-4 h-4 shrink-0 ${isAct ? 'text-white' : 'text-sky-300'}"></i>
        <span class="truncate text-xs sm:text-sm font-semibold">Temporada ${sNum}</span>
      </div>
      <span class="text-[11px] px-2 py-0.5 rounded-full ${isAct ? 'bg-black/30 text-white font-bold' : 'bg-white/10 text-white/60'} shrink-0">${epCount} ep.</span>
    `;
    row.onclick = () => {
      currentStageSelectedSeason = Number(sNum);
      renderStageSeriesSection(currentChannel);
    };
    stageSeasonList.appendChild(row);
  });

  // Renderiza a lista vertical de episódios da temporada ativa
  stageEpisodesList.innerHTML = '';
  const eps = (seasonsMap.get(Number(activeSeason)) || []).slice().sort((a, b) => (a.episode || 0) - (b.episode || 0));

  if (stageEpisodesHeader) {
    stageEpisodesHeader.innerHTML = `
      <i data-lucide="list-video" class="w-3.5 h-3.5 text-emerald-400"></i>
      <span>Episódios — Temporada ${activeSeason} (${eps.length} disponíveis)</span>
    `;
  }

  eps.forEach((ep, idx) => {
    const epNum = ep.episode || idx + 1;
    const isCurrentPlaying = Number(activeSeason) === currentSeason && epNum === currentEpisode;
    const epName = ep.name || ep.title || `Episódio ${epNum}`;

    const card = document.createElement('div');
    if (isCurrentPlaying) card.setAttribute('data-is-active', 'true');
    card.className = `group w-full rounded-2xl p-3 sm:p-4 transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 border select-none ${
      isCurrentPlaying
        ? 'bg-emerald-500/15 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/50'
        : 'tvos-glass hover:bg-white/10 border-white/10 hover:border-blue-400/30'
    }`;

    card.innerHTML = `
      <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div class="relative w-16 sm:w-24 aspect-video rounded-xl bg-black/60 overflow-hidden shrink-0 flex items-center justify-center">
          ${
            ep.thumbnail
              ? `<img src="${ep.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onerror="this.style.display='none'"/>`
              : `<div class="text-xs font-mono font-bold text-sky-300">E${epNum}</div>`
          }
          <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-white text-[10px] font-bold">E${epNum}</span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs sm:text-sm font-bold ${isCurrentPlaying ? 'text-emerald-300' : 'text-white group-hover:text-sky-300'} truncate" title="${escapeHtml(epName)}">
              ${epNum}. ${escapeHtml(epName)}
            </span>
            ${
              isCurrentPlaying
                ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>REPRODUZINDO</span>'
                : ''
            }
          </div>
          <p class="text-[11px] text-white/50 truncate mt-0.5">${ep.description || ep.overview || `Temporada ${activeSeason} • Episódio ${epNum}`}</p>
        </div>
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <button class="px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
          isCurrentPlaying
            ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/30'
            : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-blue-600/30 group-hover:scale-105'
        }">
          <i data-lucide="${isCurrentPlaying ? 'volume-2' : 'play'}" class="w-3.5 h-3.5 ${isCurrentPlaying ? 'fill-black' : 'fill-white'}"></i>
          <span>${isCurrentPlaying ? 'No Ar' : 'Assistir'}</span>
        </button>
      </div>
    `;

    card.onclick = () => {
      showPlayerToast(`Carregando T${activeSeason}:E${epNum} • ${epName}...`);
      renderStremioStreamsForMeta(item, Number(activeSeason), epNum, epName, true);
    };

    stageEpisodesList.appendChild(card);
  });

  // Re-inicializa os ícones do Lucide nos elementos recém-injetados
  if (window.lucide) {
    try { window.lucide.createIcons(); } catch (_) {}
  }

  // Rola até o episódio ativo se estiver visível na temporada
  const activeCard = stageEpisodesList.querySelector('[data-is-active="true"]');
  if (activeCard) {
    try {
      activeCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    } catch (_) {}
  }
}

// ============================================================================
// Teste Rápido de Provedores em Tempo Real (Fast Ping / Probe de Streams)
// ============================================================================
async function findFastestWorkingStream(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const usable = candidates.filter((s) => !s.isTorrent && !s.isComandoPlaySearch && !s.isComandoPlayDirect);
  if (usable.length === 0) return candidates[0] || null;
  if (usable.length === 1) return usable[0];

  showPlayerToast('Testando servidores em tempo real...');

  const topCandidates = usable.slice(0, 5);

  const probe = async (opt) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const isEmbed = Boolean(opt.isWebEmbed) || isEmbedWebUrl(opt.url);
      const method = isEmbed ? 'GET' : 'HEAD';

      await fetch(opt.url, {
        method,
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timer);
      return opt;
    } catch (_) {
      try {
        const controller2 = new AbortController();
        const timer2 = setTimeout(() => controller2.abort(), 1200);
        await fetch(opt.url, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller2.signal,
          cache: 'no-store'
        });
        clearTimeout(timer2);
        return opt;
      } catch (_) {
        return null;
      }
    }
  };

  const results = await Promise.allSettled(topCandidates.map(probe));
  const working = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean);

  if (working.length > 0) {
    showPlayerToast(`✓ Conectando via ${working[0].addon} (${working[0].quality})...`);
    return working[0];
  }

  return topCandidates[0];
}

// Monta a lista de Streams do Stremio (BestCine + Brazuca Torrents + Brazuca MP4 + Multi-Servidor PT-BR)
async function renderStremioStreamsForMeta(item, season = null, episode = null, epTitle = '', autoPlay = false) {
  const container = document.getElementById('metaStreamsList');
  const indicator = document.getElementById('metaEpisodeIndicator');

  const isSeries = (item.type === 'series' || item.type === 'anime') && season && episode;
  indicator.textContent = isSeries ? `T${season}:E${episode} ${epTitle ? `• ${epTitle}` : ''}` : 'Filme Completo';

  container.innerHTML = `
    <div class="tvos-glass p-4 rounded-2xl text-xs text-white/70 flex items-center gap-3">
      <span class="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shrink-0"></span>
      <span>Consultando <strong>BestCine, FrostStream, FenixFlix, King VOD</strong> e <strong>Brazuca</strong>...</span>
    </div>
  `;

  const imdbId = item.imdbId || item.id || '';
  const stremioStreamId = isSeries ? `${imdbId}:${season}:${episode}` : imdbId;
  const streamOptions = [];

  // 1. Consulta os Addons Oficiais Pré-Configurados (BestCine, Brazuca MP4, Brazuca Torrents) + Addons do Usuário
  const allAddonsToQuery = [
    ...activeAddonEndpoints,
    ...installedAddons.map((u) => ({ name: 'Custom Addon', baseUrl: u.replace(/\/manifest\.json$/i, '') }))
  ];

  await Promise.allSettled(
    allAddonsToQuery.map(async (addon) => {
      try {
        const streamUrl = `${addon.baseUrl}/stream/${encodeURIComponent(item.type)}/${encodeURIComponent(stremioStreamId)}.json`;
        const txt = await fetchTextSafe(streamUrl, false);
        if (!txt) return;
        const data = JSON.parse(txt);
        if (!Array.isArray(data.streams)) return;

        data.streams.forEach((st) => {
          // FILTRO ANTI-ANÚNCIOS DO TORRENTIO / DEBRID / SPONSOR
          // Remove qualquer anúncio, link de patrocinador, venda de RealDebrid ou stream falso
          const textToCheck = `${st.name || ''} ${st.title || ''} ${st.description || ''} ${st.url || ''}`;
          const isTorrentioAd =
            /sponsor|advertisement|\bpromo\b|an[uú]ncio|upgrade to|real-debrid\.com|debrid-link\.com|all-debrid\.com|patreon|buy debrid|torrentio\.strem\.fun\/configure|torrentio\s*\[rd\]/i.test(textToCheck) &&
            !st.infoHash &&
            !/\.(mp4|mkv|m3u8|webm)(\?|$)/i.test(st.url || '');
          if (isTorrentioAd) return; // Descarta anúncio do Torrentio imediatamente!

          const rawTitle = (st.title || st.description || st.name || item.title)
            .replace(/\r?\n/g, ' • ')
            .replace(/torrentio\s*sponsor|install\s*rd|\b\[ad\]\b/gi, '')
            .trim();
          const addonLabel = st.name ? `${addon.name} (${st.name.replace(/\r?\n/g, ' ')})` : addon.name;

          const isFenix = /fenixflix/i.test(addon.name) || /fenixflix/i.test(st.name || '');
          const isTorrentio = /torrentio/i.test(addon.name) || /torrentio/i.test(st.name || '');

          // Prioridades: nas SÉRIES, FenixFlix tem prioridade MÁXIMA (#0)!
          let priority = 3;
          if (isSeries) {
            if (isFenix) priority = 0; // FENIXFLIX PRIORIDADE #1 EM SÉRIES!
            else if (addon.name.includes('BestCine') || addon.name.includes('FrostStream')) priority = 1;
            else if (addon.name.includes('Brazuca MP4')) priority = 2;
            else if (isTorrentio) priority = 4;
            else priority = 3;
          } else {
            if (isFenix) priority = 1;
            else if (addon.name.includes('BestCine')) priority = 1;
            else if (addon.name.includes('Brazuca MP4')) priority = 2;
            else if (isTorrentio) priority = 4;
            else priority = 3;
          }

          if (st.url) {
            // Stream HTTP Direto (Ex: FenixFlix, BestCine, Brazuca MP4) -> Toca direto no <video> HTML5!
            streamOptions.push({
              addon: addonLabel,
              title: rawTitle,
              quality: isFenix ? 'FENIXFLIX HD PT-BR' : 'HTTP DIRETO PT-BR',
              url: st.url,
              isWebEmbed: !/\.(m3u8|mp4|mkv|webm|ts)(\?|$)/i.test(st.url) && /embed|player|\.php|\.html/i.test(st.url),
              priority
            });
          } else if (st.infoHash) {
            // Stream Torrent P2P (Ex: Torrentio, Brazuca Torrents)
            const magnet = `magnet:?xt=urn:btih:${st.infoHash}&dn=${encodeURIComponent(item.title)}`;
            streamOptions.push({
              addon: addonLabel,
              title: rawTitle,
              quality: isTorrentio ? 'TORRENTIO P2P' : 'TORRENT P2P',
              url: magnet,
              infoHash: st.infoHash,
              isTorrent: true,
              priority
            });
          } else if (st.externalUrl) {
            streamOptions.push({
              addon: addonLabel,
              title: rawTitle,
              quality: 'EXTERNO',
              url: st.externalUrl,
              isWebEmbed: true,
              priority
            });
          }
        });
      } catch (_) {}
    })
  );

  // 2. Servidores Web Embed PT-BR (WarezCDN Dublado/Legendado, SuperEmbed, VidSrc, AutoEmbed) para reprodução imediata no navegador
  if (imdbId && String(imdbId).startsWith('tt')) {
    if (isSeries) {
      streamOptions.push(
        {
          addon: 'BestCine / Warez PT-BR',
          title: `Dublado & Legendado PT-BR • T${season}:E${episode}`,
          quality: '1080p FHD',
          url: `https://embed.warezcdn.link/serie/${imdbId}/${season}/${episode}`,
          isWebEmbed: true,
          priority: 2
        },
        {
          addon: 'SuperEmbed Multi-Áudio',
          title: `Player Multi-Servidor PT/EN • T${season}:E${episode}`,
          quality: '1080p',
          url: `https://multiembed.mov/?video_id=${imdbId}&s=${season}&e=${episode}`,
          isWebEmbed: true,
          priority: 3
        },
        {
          addon: 'VidSrc Pro 4K',
          title: `Stream Direto Global + Legendas • T${season}:E${episode}`,
          quality: '4K / 1080p',
          url: `https://vidsrc.xyz/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`,
          isWebEmbed: true,
          priority: 3
        },
        {
          addon: 'AutoEmbed HD',
          title: `Servidor Rápido • T${season}:E${episode}`,
          quality: 'FHD',
          url: `https://player.autoembed.cc/embed/tv/${imdbId}/${season}/${episode}`,
          isWebEmbed: true,
          priority: 3
        }
      );
    } else {
      streamOptions.push(
        {
          addon: 'BestCine / Warez PT-BR',
          title: 'Dublado & Legendado PT-BR (Player Direto)',
          quality: '1080p FHD',
          url: `https://embed.warezcdn.link/filme/${imdbId}`,
          isWebEmbed: true,
          priority: 2
        },
        {
          addon: 'SuperEmbed Multi-Áudio',
          title: 'Player Multi-Servidor (Dublado / Legendado)',
          quality: '1080p',
          url: `https://multiembed.mov/?video_id=${imdbId}`,
          isWebEmbed: true,
          priority: 3
        },
        {
          addon: 'VidSrc Pro 4K',
          title: 'Stream Direto Global + Legendas PT-BR',
          quality: '4K / 1080p',
          url: `https://vidsrc.xyz/embed/movie?imdb=${imdbId}`,
          isWebEmbed: true,
          priority: 3
        },
        {
          addon: 'AutoEmbed HD',
          title: 'Servidor de Alta Velocidade',
          quality: 'FHD',
          url: `https://player.autoembed.cc/embed/movie/${imdbId}`,
          isWebEmbed: true,
          priority: 3
        }
      );
    }
  }

  // 3. Opção ComandoPlay.xyz
  if (item.isComandoPlayPage && item.url) {
    streamOptions.unshift({
      addon: 'ComandoPlay.xyz',
      title: 'Player Oficial ComandoPlay (Dublado / Legendado)',
      quality: 'HD PT-BR',
      url: item.url,
      isComandoPlayDirect: true,
      priority: 1
    });
  } else {
    streamOptions.push({
      addon: 'ComandoPlay.xyz',
      title: `Buscar "${item.title}" em comandoplay.xyz`,
      quality: 'PT-BR',
      url: `https://comandoplay.xyz/?s=${encodeURIComponent(item.title)}`,
      isComandoPlaySearch: true,
      priority: 5
    });
  }

  // Ordena: nas Séries, FenixFlix fica em 1º lugar absoluto. Em seguida, prioridades configuradas e áudio Dublado
  streamOptions.forEach((o) => {
    if (!o.audio) o.audio = detectStreamAudio(`${o.title} ${o.addon} ${o.quality}`);
  });
  streamOptions.sort((a, b) => {
    if (isSeries) {
      const aFenix = /fenixflix/i.test(a.addon);
      const bFenix = /fenixflix/i.test(b.addon);
      if (aFenix && !bFenix) return -1;
      if (!aFenix && bFenix) return 1;
    }
    if ((a.priority || 9) !== (b.priority || 9)) {
      return (a.priority || 9) - (b.priority || 9);
    }
    const aDub = a.audio === 'dub' || /dublado|pt-br|nacional/i.test(a.title);
    const bDub = b.audio === 'dub' || /dublado|pt-br|nacional/i.test(b.title);
    if (aDub && !bDub) return -1;
    if (!aDub && bDub) return 1;
    return 0;
  });

  container.innerHTML = '';

  // Seletor de Áudio: Todos | Dublado | Legendado
  const audioBar = document.createElement('div');
  audioBar.className = 'flex items-center gap-2 mb-1 flex-wrap';
  audioBar.innerHTML = `
    <span class="text-[11px] font-bold uppercase tracking-wider text-white/60 mr-1">Áudio:</span>
    ${[
      ['all', 'Todos'],
      ['dub', '🇧🇷 Dublado'],
      ['leg', '💬 Legendado']
    ]
      .map(
        ([k, label]) =>
          `<button data-audio-pref="${k}" class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            audioPreference === k ? 'bg-white text-black border-white' : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
          }">${label}</button>`
      )
      .join('')}
  `;
  container.appendChild(audioBar);

  const listWrap = document.createElement('div');
  listWrap.className = 'flex flex-col gap-2.5';
  container.appendChild(listWrap);

  const playOption = (opt) => {
      document.getElementById('stremioMetaModal').classList.add('hidden');

      if (opt.isComandoPlayDirect) {
        playComandoPlayItem(item);
        return;
      }
      if (opt.isComandoPlaySearch) {
        searchOnComandoPlay(item.title);
        return;
      }
      if (opt.isTorrent) {
        // Se clicou em um stream P2P do Brazuca Torrents, tenta tocar o primeiro stream HTTP direto disponível E oferece o link Magnet
        const firstHttp = streamOptions.find((s) => !s.isTorrent && !s.isComandoPlaySearch);
        if (firstHttp) {
          showPlayerToast(`Iniciando stream compatível com navegador (${firstHttp.addon})...`);
          playChannel(
            {
              number: isSeries ? `T${season}E${episode}` : 'FILME',
              name: `${item.title} (${opt.addon})`,
              group: 'Brazuca / BestCine',
              logo: item.poster,
              url: firstHttp.url,
              isWebEmbed: firstHttp.isWebEmbed,
              seriesNav: isSeries ? { item, season: Number(season), episode: Number(episode) } : null,
              sources: streamOptions
                .filter((s) => !s.isTorrent && !s.isComandoPlaySearch)
                .map((s, i) => ({ label: s.addon.split(' ')[0] || `Fonte ${i + 1}`, url: s.url, origin: s.addon }))
            },
            0
          );
          return;
        }
        window.location.href = opt.url;
        return;
      }

      // Monta um canal/título reproduzível com as opções de servidores do áudio escolhido como Fontes 1, 2, 3, 4!
      const embedSources = streamOptions
        .filter((s) => !s.isComandoPlaySearch && !s.isTorrent && matchesAudioPref(s))
        .map((s, sIdx) => ({
          label: s.addon.split(' ')[0] || `Server ${sIdx + 1}`,
          url: s.url,
          origin: `${s.addon} (${s.quality})`,
          isWebEmbed: Boolean(s.isWebEmbed)
        }));

      const targetIdx = Math.max(0, embedSources.findIndex((s) => s.url === opt.url));
      const nextEp = isSeries ? getNextEpisodeInfo(item, season, episode) : null;
      const audioLabel = audioPreference === 'dub' ? 'Dublado' : audioPreference === 'leg' ? 'Legendado' : '';

      const playable = {
        number: isSeries ? `T${season}E${episode}` : 'FILME',
        name: isSeries ? `${item.title} — T${season}:E${episode}` : item.title,
        group: item.category || 'Stremio VOD',
        logo: item.poster,
        url: opt.url,
        isWebEmbed: opt.isWebEmbed,
        sources: embedSources,
        seriesNav: isSeries ? { item, season: Number(season), episode: Number(episode) } : null,
        epg: {
          program: isSeries ? `${item.title} (Temporada ${season}, Episódio ${episode})` : item.title,
          category: `${opt.addon} • ${opt.quality}${audioLabel ? ` • ${audioLabel}` : ''}`,
          timeSlot: isSeries ? `T${season}:E${episode}` : 'Filme Completo',
          synopsis: item.description || `Reproduzindo via ${opt.addon}.`,
          progress: 100,
          elapsed: 'Stremio Stream',
          remaining: opt.quality,
          next: isSeries ? (nextEp ? `T${nextEp.season}:E${nextEp.episode}${nextEp.name ? ` • ${nextEp.name}` : ''}` : 'Último episódio') : 'Recomendados'
        }
      };

      playChannel(playable, targetIdx);
      document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderList = () => {
    listWrap.innerHTML = '';
    const visible = streamOptions.filter((o) => matchesAudioPref(o));
    if (visible.length === 0) {
      listWrap.innerHTML = `<div class="tvos-glass p-4 rounded-2xl text-xs text-white/60">Nenhuma fonte ${
        audioPreference === 'dub' ? 'dublada' : 'legendada'
      } encontrada. Selecione "Todos".</div>`;
      return;
    }
    visible.forEach((opt) => {
      const audioTag =
        opt.audio === 'dub'
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">DUBLADO</span>'
          : opt.audio === 'leg'
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">LEGENDADO</span>'
          : opt.audio === 'both'
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">DUB + LEG</span>'
          : '';
      const card = document.createElement('div');
      card.className = 'stremio-stream-card p-3.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3';
      card.innerHTML = `
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-400/30">${escapeHtml(opt.addon)}</span>
            <span class="text-[11px] font-mono text-emerald-400 font-semibold">${escapeHtml(opt.quality)}</span>
            ${audioTag}
          </div>
          <div class="text-xs font-medium text-white/85 truncate mt-1.5">${escapeHtml(opt.title)}</div>
        </div>
        <div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow">▶</div>
      `;
      card.addEventListener('click', () => playOption(opt));
      listWrap.appendChild(card);
    });
  };

  audioBar.querySelectorAll('[data-audio-pref]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audioPreference = btn.dataset.audioPref;
      localStorage.setItem('fidalgo_audio_pref', audioPreference);
      audioBar.querySelectorAll('[data-audio-pref]').forEach((b) => {
        const on = b.dataset.audioPref === audioPreference;
        b.className = `px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          on ? 'bg-white text-black border-white' : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
        }`;
      });
      renderList();
    });
  });

  renderList();

  // AutoPlay inteligente: testa rápido os provedores em paralelo e vai direto para o que estiver funcionando!
  if (autoPlay) {
    const candidates = streamOptions.filter((s) => !s.isTorrent && !s.isComandoPlaySearch && !s.isComandoPlayDirect && matchesAudioPref(s));
    const fallback = streamOptions.filter((s) => !s.isTorrent && !s.isComandoPlaySearch && !s.isComandoPlayDirect);
    const toTest = candidates.length > 0 ? candidates : fallback;
    const best = await findFastestWorkingStream(toTest);
    if (best) playOption(best);
    else showPlayerToast('Nenhum provedor disponível no momento.');
  }
}

// ============================================================================
// 2. Carregamento de Canais Ao Vivo (TV Aberta via FrostView TV & Brazuca)
// ============================================================================
async function loadAllRealLiveChannels() {
  const statusEl = document.getElementById('syncStatusText');

  // Busca diretamente os catálogos de TV Ao Vivo dos addons FrostView TV e Brazuca!
  const frostAndBrazucaEndpoints = activeAddonEndpoints.filter((e) => /frostview|brazuca/i.test(e.name));
  const candidateTvPaths = [
    '/catalog/tv/frostview-tv-channels.json',
    '/catalog/tv/frostview-tv-channels/genre=TV%20Aberta.json',
    '/catalog/tv/frostview-tv-channels/genre=Abertos.json',
    '/catalog/tv/brazuca_tv.json',
    '/catalog/tv/brazuca_tv/genre=TV%20Aberta.json',
    '/catalog/tv/brazuca_tv/genre=Canais%20Abertos.json',
    '/catalog/tv/brazuca_tv/genre=Abertos.json',
    '/catalog/tv/brazuca_tv/genre=Variedades.json',
    '/catalog/tv/brazuca_tv/genre=Noticias.json',
    '/catalog/tv/brazuca.json',
    '/catalog/tv/canais.json',
    '/catalog/tv/tv.json'
  ];

  const discoveredTvChannels = [];

  await Promise.allSettled(
    frostAndBrazucaEndpoints.flatMap((ep) =>
      candidateTvPaths.map(async (pathSuffix) => {
        const isBrazucaPath = pathSuffix.includes('brazuca');
        const isFrostPath = pathSuffix.includes('frostview');
        if (isBrazucaPath && !/brazuca/i.test(ep.name)) return;
        if (isFrostPath && !/frostview/i.test(ep.name)) return;

        const txt = await fetchTextSafe(`${ep.baseUrl}${pathSuffix}`, false, 2400);
        if (!txt) return;
        try {
          const data = JSON.parse(txt);
          const metas = Array.isArray(data.metas) ? data.metas : [];
          const originTag = /brazuca/i.test(ep.name) ? 'Brazuca TV' : 'FrostView TV';

          metas.forEach((m) => {
            const cName = m.name || `Canal ${originTag}`;
            const rawGenreStr = m.genres?.join(' ') || '';
            const groupCat = isAllowedSportsChannel(cName) ? 'Esportes' : 'TV Aberta';
            const streamEndpoint = `${ep.baseUrl}/stream/${encodeURIComponent(m.type || 'tv')}/${encodeURIComponent(m.id)}.json`;
            const inlineStreams = Array.isArray(m.streams)
              ? m.streams.filter((s) => s.url || s.externalUrl).map((s, idx) => ({
                  label: s.name || s.title || `${originTag} ${idx + 1}`,
                  url: s.url || s.externalUrl,
                  origin: originTag
                }))
              : [];

            discoveredTvChannels.push({
              name: cName,
              group: groupCat,
              subCategory: normalizeGroupCategory(cName, rawGenreStr),
              isOpenTvAddon: groupCat !== 'Esportes',
              logo: m.poster || m.logo || createLogoSvg(cName, '#0284c7', '#0f172a'),
              url: inlineStreams[0]?.url || streamEndpoint,
              isStremioTvMeta: inlineStreams.length === 0,
              stremioId: m.id,
              stremioType: m.type || 'tv',
              addonBase: ep.baseUrl,
              epg: {
                program: m.description || `${cName} — Ao Vivo`,
                category: `${groupCat} • ${originTag}`,
                timeSlot: 'Agora • Ao Vivo',
                synopsis: m.description || `Transmissão ao vivo via ${originTag}.`,
                progress: 65,
                elapsed: 'Ao Vivo',
                remaining: 'Sinal Digital',
                next: 'Programação Contínua'
              },
              sources:
                inlineStreams.length > 0
                  ? inlineStreams
                  : [
                      {
                        label: originTag,
                        url: streamEndpoint,
                        origin: originTag
                      }
                    ]
            });
          });
        } catch (_) {}
      })
    )
  );

  if (discoveredTvChannels.length > 0) {
    mergeNewChannels(discoveredTvChannels);
  }

  stremioCatalog.sportsChannels = channels
    .filter((c) => c.group === 'Esportes' && isAllowedSportsChannel(c.name))
    .map((c) => ({
      id: `sp-${c.number}`,
      title: c.name,
      subtitle: `${c.sources.length} fonte(s) • Canal ${c.number}`,
      badge: 'AO VIVO',
      category: 'Esportes',
      channelNumber: c.number,
      poster: c.logo,
      isLogoPoster: true,
      url: c.url,
      channelRef: c
    }));

  if (statusEl) {
    statusEl.textContent = `${channels.length} canais • FrostView TV • Brazuca TV • FrostStream • BestCine`;
  }
  renderAll();

  // Só inicia reprodução automática se o usuário já estiver na aba Canal Aberto ou Esportes
  if (channels.length > 0 && !currentChannel && (activeNavTab === 'live' || activeNavTab === 'sports')) {
    const initialList = activeNavTab === 'sports' ? channels.filter((c) => c.group === 'Esportes') : channels.filter((c) => c.group === 'TV Aberta');
    playChannel(initialList[0] || channels[0], 0);
  }
}

// ============================================================================
// 3. Integração com https://comandoplay.xyz/ (Filmes e Séries Dublados)
// ============================================================================
async function loadComandoPlayCatalog() {
  const comandoUrls = [
    { url: 'https://comandoplay.xyz/', defaultType: 'movie' },
    { url: 'https://comandoplay.xyz/filmes/', defaultType: 'movie' },
    { url: 'https://comandoplay.xyz/series/', defaultType: 'series' }
  ];

  const found = [];
  await Promise.allSettled(
    comandoUrls.map(async (entry) => {
      const html = await fetchTextSafe(entry.url, true);
      if (html) {
        found.push(...parseComandoPlayHtml(html, entry.url, entry.defaultType));
      }
    })
  );

  if (found.length > 0) {
    const seen = new Set();
    stremioCatalog.comandoPlayItems = found.filter((it) => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });
    renderRightContentArea();
    if (window.lucide) lucide.createIcons();
  }
}

function parseComandoPlayHtml(html, baseUrl = 'https://comandoplay.xyz/', defaultType = 'movie') {
  const results = [];
  const seenUrls = new Set();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const nodes = doc.querySelectorAll('article, .item, .TPost, .post, .movie-card, .result-item, a[href*="comandoplay"]');
  nodes.forEach((node) => {
    const linkEl = node.tagName === 'A' ? node : node.querySelector('a[href]');
    if (!linkEl) return;

    const href = linkEl.getAttribute('href') || '';
    if (!href || href === '#' || href.includes('/wp-login') || href.includes('/contato')) return;

    let fullUrl;
    try {
      fullUrl = new URL(href, baseUrl).toString();
    } catch (_) {
      return;
    }

    if (
      fullUrl === 'https://comandoplay.xyz/' ||
      fullUrl === 'https://comandoplay.xyz/filmes/' ||
      fullUrl === 'https://comandoplay.xyz/series/' ||
      seenUrls.has(fullUrl)
    ) {
      return;
    }

    const imgEl = node.querySelector('img');
    let poster = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.getAttribute('src') || '';
    if (poster && !poster.startsWith('http') && !poster.startsWith('data:')) {
      try {
        poster = new URL(poster, baseUrl).toString();
      } catch (_) {}
    }

    const titleEl = node.querySelector('h2, h3, h4, .title, .Title, .entry-title');
    let title = (titleEl?.textContent || imgEl?.getAttribute('alt') || linkEl.getAttribute('title') || linkEl.textContent || '').trim();
    title = title.replace(/\s+/g, ' ').trim();
    if (!title || title.length < 2 || /^(in[ií]cio|filmes|s[eé]ries|g[eê]neros|ano)$/i.test(title)) return;

    seenUrls.add(fullUrl);
    const isSeries = /\/series?\/|temporada|epis[oó]dio/i.test(fullUrl + ' ' + title) || defaultType === 'series';

    results.push({
      id: `cp-${results.length}-${Date.now()}`,
      title,
      subtitle: 'ComandoPlay.xyz • Dublado / Legendado',
      badge: 'COMANDOPLAY',
      category: isSeries ? 'Séries' : 'Filmes',
      type: isSeries ? 'series' : 'movie',
      poster: poster || createLogoSvg(title.slice(0, 4), '#581c87', '#0f172a'),
      url: fullUrl,
      isComandoPlayPage: true
    });
  });

  return results;
}

async function searchOnComandoPlay(query) {
  const searchUrl = `https://comandoplay.xyz/?s=${encodeURIComponent(query)}`;
  const html = await fetchTextSafe(searchUrl, true);
  if (!html) return [];
  const found = parseComandoPlayHtml(html, 'https://comandoplay.xyz/', 'movie');
  if (found.length > 0) {
    stremioCatalog.comandoPlayItems = [...found, ...stremioCatalog.comandoPlayItems];
  }
  return found;
}

async function playComandoPlayItem(item) {
  showPlayerToast(`Extraindo player de "${item.title}" em comandoplay.xyz...`);
  const html = await fetchTextSafe(item.url, true);
  const embedTargets = [];

  if (html) {
    const m3u8Match = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    const mp4Match = html.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);
    if (m3u8Match || mp4Match) {
      const directUrl = m3u8Match ? m3u8Match[1] : mp4Match[1];
      playChannel(
        {
          number: 'VOD',
          name: item.title,
          group: 'ComandoPlay',
          logo: item.poster,
          url: directUrl,
          sources: [{ label: 'Stream Direto', url: directUrl, origin: 'ComandoPlay.xyz' }]
        },
        0
      );
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('iframe').forEach((ifr) => {
      const src = ifr.getAttribute('data-litespeed-src') || ifr.getAttribute('data-src') || ifr.getAttribute('src') || '';
      if (src && !src.includes('googletagmanager') && !src.includes('facebook')) {
        try {
          embedTargets.push(new URL(src, item.url).toString());
        } catch (_) {}
      }
    });
  }

  embedTargets.push(item.url);

  playChannel(
    {
      number: 'VOD',
      name: item.title,
      group: item.category || 'ComandoPlay.xyz',
      logo: item.poster,
      url: embedTargets[0],
      isWebEmbed: true,
      sources: embedTargets.map((u, i) => ({
        label: `Player ${i + 1}`,
        url: u,
        origin: 'ComandoPlay.xyz'
      }))
    },
    0
  );
}

// ============================================================================
// Eventos & Interatividade (Stremio Rail, Top Tabs, Genre Filter, D-Pad, Modais)
// ============================================================================
function bindEvents() {
  // Switch Navigation Tab helper
  const activateTab = (tabName) => {
    activeNavTab = tabName;

    // Se o usuário clicou em uma aba no topo, limpa qualquer busca em andamento para exibir a aba limpa
    if (searchQuery) {
      searchQuery = '';
      isSearchingCatalog = false;
      stremioCatalog.searchResults = [];
      const sInput = document.getElementById('globalSearchInput');
      if (sInput) sInput.value = '';
      document.getElementById('btnClearSearch')?.classList.add('hidden');
    }

    // Sync top pills
    document.querySelectorAll('[data-nav-tab]').forEach((b) => {
      const isAct = b.dataset.navTab === tabName;
      b.classList.toggle('active', isAct);
      b.classList.toggle('text-white/70', !isAct);
    });

    // Sync left Stremio rail
    document.querySelectorAll('[data-rail-btn]').forEach((r) => {
      const isAct = r.dataset.railBtn === tabName;
      r.classList.toggle('active', isAct);
    });

    // Show/hide Stremio Genre bar when on Filmes or Séries
    const genreBar = document.getElementById('stremioGenreBar');
    genreBar.classList.toggle('hidden', tabName !== 'movies' && tabName !== 'series');

    if (tabName === 'board') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      setCategoryChip('TV Aberta', false);
      renderAll();
      return;
    } else if (tabName === 'live') {
      setCategoryChip('TV Aberta', false);
      renderAll();
      if ((!currentChannel || currentChannel.group === 'Esportes' || currentChannel.number === 'FILME' || String(currentChannel.number || '').startsWith('T')) && channels.length > 0) {
        const openTv = channels.find((c) => c.group === 'TV Aberta') || channels[0];
        playChannel(openTv, 0);
      }
      return;
    } else if (tabName === 'sports') {
      setCategoryChip('Esportes', false);
      renderAll();
      if ((!currentChannel || currentChannel.group !== 'Esportes') && channels.length > 0) {
        const sportCh = channels.find((c) => c.group === 'Esportes');
        if (sportCh) playChannel(sportCh, 0);
      }
      return;
    } else if (tabName === 'movies') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      setCategoryChip('Filmes', false);
    } else if (tabName === 'anime') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      genreBar.classList.add('hidden');
    } else if (tabName === 'series') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      setCategoryChip('Séries', false);
    }

    renderAll();
  };

  document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.navTab));
  });

  document.querySelectorAll('[data-rail-btn]').forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.railBtn));
  });

  document.getElementById('brandHomeBtn').addEventListener('click', () => activateTab('board'));

  // Disparo direto e confiável para download do APK
  document.getElementById('btnDownloadApk')?.addEventListener('click', (e) => {
    try {
      window.location.assign('/app.apk');
    } catch (_) {
      window.open('/app.apk', '_blank');
    }
  });

  // Botões de ação rápida dentro do Hero Banner do Hub Inicial Apple TV+
  document.getElementById('btnHeroOpenLiveTv')?.addEventListener('click', () => activateTab('live'));
  document.getElementById('btnHeroOpenSports')?.addEventListener('click', () => activateTab('sports'));

  document.getElementById('btnClosePlayerStage')?.addEventListener('click', () => {
    isPlayerVisibleOnHub = false;
    currentChannel = null;
    destroyPlayers();
    renderAll();
  });

  document.getElementById('btnRailFavorites').addEventListener('click', () => {
    activateTab('live');
    setCategoryChip('Favoritos', true);
  });

  document.getElementById('btnRailAddons').addEventListener('click', () => {
    document.getElementById('sourcesModal').classList.remove('hidden');
  });

  // Inicializa o seletor de áudio (Dublado / Legendado / Todos) do painel de séries
  initStageAudioSelector();

  // Temas / Gêneros nas abas Filmes e Séries (Ação, Aventura, Comédia, Terror, Ficção Científica, etc.)
  document.querySelectorAll('[data-genre]').forEach((pill) => {
    pill.addEventListener('click', async () => {
      document.querySelectorAll('[data-genre]').forEach((p) => {
        p.classList.remove('active');
        p.classList.add('text-white/75');
      });
      pill.classList.add('active');
      pill.classList.remove('text-white/75');
      pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      activeStremioGenre = pill.dataset.genre;
      renderAll();
      showPlayerToast(activeStremioGenre ? `Tema selecionado: ${pill.textContent.trim()}` : 'Mostrando todos os temas');
      await loadStremioCinemetaCatalogs(activeStremioGenre);
    });
  });

  const genrePillsBar = document.getElementById('stremioGenrePills');
  document.getElementById('btnGenreScrollLeft')?.addEventListener('click', () => {
    if (!genrePillsBar) return;
    if (genrePillsBar.scrollLeft <= 4) {
      genrePillsBar.scrollTo({ left: genrePillsBar.scrollWidth, behavior: 'smooth' });
    } else {
      genrePillsBar.scrollBy({ left: -180, behavior: 'smooth' });
    }
  });
  document.getElementById('btnGenreScrollRight')?.addEventListener('click', () => {
    if (!genrePillsBar) return;
    const maxScroll = genrePillsBar.scrollWidth - genrePillsBar.clientWidth;
    if (genrePillsBar.scrollLeft >= maxScroll - 4) {
      genrePillsBar.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      genrePillsBar.scrollBy({ left: 180, behavior: 'smooth' });
    }
  });
  genrePillsBar?.addEventListener(
    'wheel',
    (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        e.preventDefault();
        genrePillsBar.scrollLeft += delta;
      }
    },
    { passive: false }
  );

  // Sidebar Category Chips + Botões de Rolagem Horizontal (‹ / ›) + Arrastar / Roda do Mouse
  document.querySelectorAll('[data-cat-pill]').forEach((chip) => {
    chip.addEventListener('click', () => {
      setCategoryChip(chip.dataset.catPill, true);
    });
  });

  const catPillsBar = document.getElementById('categoryFilterPills');
  const btnCatLeft = document.getElementById('btnCatScrollLeft');
  const btnCatRight = document.getElementById('btnCatScrollRight');

  if (catPillsBar) {
    btnCatLeft?.addEventListener('click', () => {
      if (catPillsBar.scrollLeft <= 4) {
        catPillsBar.scrollTo({ left: catPillsBar.scrollWidth, behavior: 'smooth' });
      } else {
        catPillsBar.scrollBy({ left: -150, behavior: 'smooth' });
      }
    });

    btnCatRight?.addEventListener('click', () => {
      const maxScroll = catPillsBar.scrollWidth - catPillsBar.clientWidth;
      if (catPillsBar.scrollLeft >= maxScroll - 4) {
        catPillsBar.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        catPillsBar.scrollBy({ left: 150, behavior: 'smooth' });
      }
    });

    // Roda do mouse rola as categorias horizontalmente
    catPillsBar.addEventListener(
      'wheel',
      (e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta !== 0) {
          e.preventDefault();
          catPillsBar.scrollLeft += delta;
        }
      },
      { passive: false }
    );

    // Arrastar com o mouse na barra de categorias
    let isCatDrag = false;
    let catStartX = 0;
    let catScrollStart = 0;
    catPillsBar.addEventListener('mousedown', (e) => {
      isCatDrag = true;
      catStartX = e.pageX - catPillsBar.offsetLeft;
      catScrollStart = catPillsBar.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      isCatDrag = false;
    });
    catPillsBar.addEventListener('mousemove', (e) => {
      if (!isCatDrag) return;
      e.preventDefault();
      const x = e.pageX - catPillsBar.offsetLeft;
      catPillsBar.scrollLeft = catScrollStart - (x - catStartX) * 1.4;
    });
  }

  // Botões de Rolagem Vertical (▲ Subir / ▼ Descer) da Lista de Canais
  const chListContainer = document.getElementById('channelListContainer');
  document.getElementById('btnChannelListUp')?.addEventListener('click', () => {
    chListContainer?.scrollBy({ top: -260, behavior: 'smooth' });
  });
  document.getElementById('btnChannelListDown')?.addEventListener('click', () => {
    chListContainer?.scrollBy({ top: 260, behavior: 'smooth' });
  });

  // Global Search Bar
  const searchInput = document.getElementById('globalSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    searchQuery = val.toLowerCase();
    btnClearSearch.classList.toggle('hidden', !searchQuery);

    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    if (!searchQuery) {
      isSearchingCatalog = false;
      stremioCatalog.searchResults = [];
      renderAll();
      return;
    }

    // Oculta imediatamente o restante da interface e mostra apenas "Buscando..." até achar o filme
    isSearchingCatalog = true;
    stremioCatalog.searchResults = [];
    renderAll();

    if (searchQuery.length >= 2) {
      searchDebounceTimer = setTimeout(() => {
        searchStremioAndComandoPlay(val);
      }, 160);
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchStremioAndComandoPlay(searchInput.value.trim());
    }
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    isSearchingCatalog = false;
    stremioCatalog.searchResults = [];
    btnClearSearch.classList.add('hidden');
    renderAll();
  });

  // Numeric Channel Input (CH 001)
  const chInput = document.getElementById('channelNumberInput');
  chInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
    if (e.target.value.length === 3) {
      tuneByChannelNumber(e.target.value);
      setTimeout(() => (e.target.value = ''), 600);
    }
  });

  chInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chInput.value.trim()) {
      tuneByChannelNumber(chInput.value.trim());
      chInput.value = '';
      chInput.blur();
    }
  });

  // Smart TV Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('stremioMetaModal').classList.add('hidden');
      document.getElementById('sourcesModal').classList.add('hidden');
      return;
    }

    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleGlobalNumberKey(e.key);
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredChannels.length === 0) return;
      const curIdx = filteredChannels.findIndex((c) => c.number === currentChannel?.number);
      let nextIdx = 0;
      if (e.key === 'ArrowDown') {
        nextIdx = curIdx + 1 < filteredChannels.length ? curIdx + 1 : 0;
      } else {
        nextIdx = curIdx - 1 >= 0 ? curIdx - 1 : filteredChannels.length - 1;
      }
      playChannel(filteredChannels[nextIdx], 0);
      scrollActiveChannelIntoView();
    }
  });

  // Player Action Buttons
  document.getElementById('btnNextEpisode')?.addEventListener('click', () => playNextEpisode());
  document.getElementById('btnNextEpisodeStage')?.addEventListener('click', () => playNextEpisode());
  document.getElementById('btnNextEpisodeOverlay')?.addEventListener('click', () => playNextEpisode());
  document.getElementById('btnNextSource').addEventListener('click', () => {
    if (!currentChannel) return;
    const total = currentChannel.sources?.length || 1;
    if (total > 1) {
      const nextIdx = (currentSourceIdx + 1) % total;
      showPlayerToast(`Alternando para Fonte ${nextIdx + 1} de ${total}...`);
      playChannel(currentChannel, nextIdx);
    } else {
      playChannel(currentChannel, 0);
    }
  });

  document.getElementById('btnToggleProxy').addEventListener('click', (e) => {
    useProxy = !useProxy;
    e.currentTarget.querySelector('span').textContent = useProxy ? 'Proxy Ativo' : 'Direto';
    showPlayerToast(useProxy ? 'Proxy Anti-CORS ativado' : 'Conexão direta ativada');
    if (currentChannel) playChannel(currentChannel, currentSourceIdx);
  });

  document.getElementById('btnOpenVlc').addEventListener('click', () => {
    if (!currentChannel) return;
    const url = currentChannel.sources?.[currentSourceIdx]?.url || currentChannel.url;
    window.location.href = `vlc://${url}`;
  });

  // Meta Modal Close
  document.getElementById('btnCloseMetaModal').addEventListener('click', () => {
    document.getElementById('stremioMetaModal').classList.add('hidden');
  });

  // Sources & Addons Modal
  const sourcesModal = document.getElementById('sourcesModal');
  const openSources = () => sourcesModal.classList.remove('hidden');
  document.getElementById('btnOpenSourcesModal')?.addEventListener('click', openSources);
  document.getElementById('btnMobileSources')?.addEventListener('click', openSources);
  document.getElementById('btnCloseSourcesModal').addEventListener('click', () => {
    sourcesModal.classList.add('hidden');
  });

  document.getElementById('btnAddStremioAddon').addEventListener('click', async () => {
    const addonUrl = document.getElementById('stremioAddonUrlInput').value.trim();
    if (!addonUrl) return;
    sourcesModal.classList.add('hidden');

    if (addonUrl.includes('stremio-addons.net/addons/')) {
      showPlayerToast('Extraindo manifesto de stremio-addons.net...');
      const extracted = await extractManifestFromDirectoryPage(addonUrl);
      extracted.forEach((mUrl) => {
        const base = mUrl.replace(/\/manifest\.json$/i, '');
        if (!activeAddonEndpoints.some((e) => e.baseUrl === base)) {
          activeAddonEndpoints.unshift({ name: 'Addon PT-BR', baseUrl: base });
        }
      });
      await loadBestCineAndBrazucaAddons();
      showPlayerToast('Addon do stremio-addons.net ativado com sucesso!');
      return;
    }

    const normalizedManifest = addonUrl.replace(/^stremio:\/\//i, 'https://');
    if (!installedAddons.includes(normalizedManifest)) {
      installedAddons.push(normalizedManifest);
      localStorage.setItem('stremio_tvos_addons', JSON.stringify(installedAddons));
    }
    const base = normalizedManifest.replace(/\/manifest\.json$/i, '');
    if (!activeAddonEndpoints.some((e) => e.baseUrl === base)) {
      activeAddonEndpoints.unshift({ name: 'Custom Addon', baseUrl: base });
      await loadBestCineAndBrazucaAddons();
    }
    showPlayerToast('Addon Stremio instalado com sucesso!');
  });

  document.getElementById('btnSearchComandoPlay').addEventListener('click', async () => {
    const q = document.getElementById('comandoPlayQueryInput').value.trim();
    if (!q) return;
    sourcesModal.classList.add('hidden');
    await searchStremioAndComandoPlay(q);
  });

  document.querySelectorAll('[data-repo-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      sourcesModal.classList.add('hidden');
      const action = btn.dataset.repoAction;
      if (action === 'super-all') {
        await loadBestCineAndBrazucaAddons();
        await loadAllRealLiveChannels();
        await loadComandoPlayCatalog();
      }
      if (action === 'frostview') {
        showPlayerToast('Sincronizando canais IPTV do FrostView TV...');
        await loadBestCineAndBrazucaAddons();
      }
      if (action === 'redecanais') {
        showPlayerToast('Sincronizando canais e catálogo Rede Canais...');
        await loadGithubRepoCatalog('Ramys/Iptv-Brasil-2026', 'Rede Canais');
      }
      if (action === 'froststream') {
        showPlayerToast('Sincronizando catálogo FrostStream...');
        await loadBestCineAndBrazucaAddons();
      }
    });
  });

  document.getElementById('btnScanCustomGh').addEventListener('click', async () => {
    const repo = document.getElementById('customGhRepoInput').value.trim();
    if (!repo) return;
    sourcesModal.classList.add('hidden');
    await loadGithubRepoCatalog(repo, repo);
  });

  document.getElementById('btnLoadCustomM3u').addEventListener('click', async () => {
    const url = document.getElementById('customM3uUrlInput').value.trim();
    if (!url) return;
    sourcesModal.classList.add('hidden');
    await loadM3uPlaylistUrl(url, 'Lista M3U');
  });

  document.getElementById('customM3uFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const added = parseCatalogTextToChannels(ev.target.result, file.name);
      mergeNewChannels(added, `Arquivo ${file.name} importado`);
      sourcesModal.classList.add('hidden');
    };
    reader.readAsText(file);
  });
}

function setCategoryChip(cat, triggerRender = true) {
  activeCategoryChip = cat;
  document.querySelectorAll('[data-cat-pill]').forEach((c) => {
    const isActive = c.dataset.catPill === cat;
    c.classList.toggle('active', isActive);
    c.classList.toggle('text-white/65', !isActive);
    if (isActive) {
      c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
  if (triggerRender) renderAll();
}

// ============================================================================
// Sintonia Direta por Número (Ex: 001, 015)
// ============================================================================
function handleGlobalNumberKey(digit) {
  numericBuffer = (numericBuffer + digit).slice(0, 3);
  const osd = document.getElementById('numericOsd');
  const osdDigits = document.getElementById('numericOsdDigits');
  osd.classList.remove('hidden');
  osdDigits.textContent = numericBuffer.padStart(3, '0');

  if (numericTimer) clearTimeout(numericTimer);
  numericTimer = setTimeout(() => {
    tuneByChannelNumber(numericBuffer);
    numericBuffer = '';
    setTimeout(() => osd.classList.add('hidden'), 700);
  }, 900);
}

function tuneByChannelNumber(rawInput) {
  const numInt = parseInt(rawInput, 10);
  if (isNaN(numInt)) return;
  const formatted = String(numInt).padStart(3, '0');
  const target = channels.find((c) => c.number === formatted || parseInt(c.number, 10) === numInt);

  if (target) {
    playChannel(target, 0);
    scrollActiveChannelIntoView();
    showPlayerToast(`Canal ${target.number} — ${target.name}`);
  } else {
    showPlayerToast(`Canal ${formatted} não encontrado`);
  }
}

function scrollActiveChannelIntoView() {
  setTimeout(() => {
    const activeEl = document.querySelector('.channel-card.active');
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 60);
}

// ============================================================================
// Renderização da Interface (Hub Inicial Apple TV + Canal Aberto + Esportes + Busca Limpa)
// ============================================================================
function renderAll() {
  filterChannelList();
  updateLayoutSectionsVisibility();
  renderAppleTvHeroHub();
  renderChannelSidebar();
  renderRightContentArea();
  if (window.lucide) lucide.createIcons();
}

function updateLayoutSectionsVisibility() {
  const sidebar = document.getElementById('channelSidebar');
  const heroHub = document.getElementById('appleTvHeroHub');
  const liveStage = document.getElementById('liveStageSection');
  const genreBar = document.getElementById('stremioGenreBar');

  // 1. MODO BUSCA ATIVA: Oculta TUDO (Hero, Player, Barra Lateral, Filtros) para focar 100% na busca
  if (searchQuery) {
    sidebar?.classList.add('hidden');
    heroHub?.classList.add('hidden');
    liveStage?.classList.add('hidden');
    genreBar?.classList.add('hidden');
    return;
  }

  // 2. MODO NAVEGAÇÃO POR ABAS (Hub Inicial Apple TV | Canal Aberto | Esportes | Filmes | Séries)
  const isLiveOrSportsTab = activeNavTab === 'live' || activeNavTab === 'sports';

  // Barra lateral de canais aparece nas abas "Canal Aberto" e "Esportes"
  sidebar?.classList.toggle('hidden', !isLiveOrSportsTab);

  // Hero Banner Apple TV+ aparece no "Hub Inicial" (board)
  heroHub?.classList.toggle('hidden', activeNavTab !== 'board');

  // No Hub Inicial (board), NUNCA exibe nem reproduz nenhum vídeo!
  if (activeNavTab === 'board') {
    liveStage?.classList.add('hidden');
  } else {
    const showPlayer = isLiveOrSportsTab || isPlayerVisibleOnHub;
    liveStage?.classList.toggle('hidden', !showPlayer);
  }

  // Barra de Gêneros aparece nas abas Filmes e Séries
  genreBar?.classList.toggle('hidden', activeNavTab !== 'movies' && activeNavTab !== 'series');

  // No mobile, quando reproduzindo canal ao vivo, acopla o player no topo
  const rightSection = document.getElementById('rightScrollSection');
  if (rightSection) {
    const isPlayerOpen = !liveStage?.classList.contains('hidden');
    rightSection.classList.toggle('mobile-player-top', isLiveOrSportsTab && isPlayerOpen);
  }
}

function getHeroFeaturedItems() {
  const pool = [
    ...stremioCatalog.bestCineMovies.slice(0, 4),
    ...stremioCatalog.trendingMovies.slice(0, 6),
    ...stremioCatalog.bestCineSeries.slice(0, 3),
    ...stremioCatalog.trendingSeries.slice(0, 4)
  ];
  const seen = new Set();
  const unique = [];
  for (const item of pool) {
    const k = item.imdbId || item.title;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    unique.push(item);
    if (unique.length >= 6) break;
  }
  return unique;
}

function renderAppleTvHeroHub() {
  const heroHub = document.getElementById('appleTvHeroHub');
  if (!heroHub || searchQuery || activeNavTab !== 'board') return;

  const featured = getHeroFeaturedItems();
  if (featured.length === 0) return;

  if (heroHubIndex >= featured.length) heroHubIndex = 0;
  const current = featured[heroHubIndex];

  const backdropEl = document.getElementById('heroHubBackdrop');
  const bgUrl = current.background || current.poster;
  if (backdropEl && bgUrl) {
    backdropEl.style.backgroundImage = `url('${bgUrl}')`;
  }

  const heroCatBadge = document.getElementById('heroHubCategoryBadge');
  if (heroCatBadge) {
    heroCatBadge.textContent = current.type === 'series' ? 'Série' : 'Filme';
  }
  const heroAddonBadge = document.getElementById('heroHubAddonBadge');
  if (heroAddonBadge) {
    const addonName = current.addon || current.source || 'FrostStream • 1080p';
    heroAddonBadge.textContent = `Addon: ${addonName}`;
    heroAddonBadge.classList.remove('hidden');
  }
  const heroLiveBadge = document.getElementById('heroLiveBadge');
  if (heroLiveBadge) {
    heroLiveBadge.classList.toggle('hidden', !current.isLive);
  }
  const heroRatingEl = document.getElementById('heroHubRating');
  if (heroRatingEl) {
    heroRatingEl.textContent = current.badge?.startsWith('★') ? `${current.badge}` : '★ 8.7 IMDb';
  }
  const heroYearEl = document.getElementById('heroHubYear');
  if (heroYearEl) {
    const rawYear = String(current.subtitle || '2026').replace(/[^0-9]/g, '').slice(0, 4) || '2026';
    heroYearEl.textContent = rawYear;
  }
  const heroGenresEl = document.getElementById('heroHubGenres');
  if (heroGenresEl) {
    heroGenresEl.textContent = Array.isArray(current.genres) && current.genres.length > 0
      ? current.genres.slice(0, 2).join(' • ')
      : current.type === 'series' ? 'Série' : 'Filme';
  }
  document.getElementById('heroHubTitle').textContent = current.title;
  document.getElementById('heroHubDescription').textContent =
    current.description ||
    `Assista agora a "${current.title}" em alta definição com opções dubladas e legendadas via BestCine, FrostStream, FenixFlix, King VOD e Brazuca Torrents.`;

  const watchBtn = document.getElementById('btnHeroWatchNow');
  if (watchBtn) {
    watchBtn.onclick = () => {
      if (current.type === 'series' || current.type === 'anime') {
        playSeriesDirect(current, 1, 1);
      } else {
        playMovieDirect(current);
      }
    };
  }

  const saveBtn = document.getElementById('btnHeroSave');
  if (saveBtn) {
    saveBtn.onclick = () => {
      showPlayerToast(`Salvo em Favoritos: ${current.title}`);
    };
  }

  const prevBtn = document.getElementById('btnHeroPrev');
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      heroHubIndex = (heroHubIndex - 1 + featured.length) % featured.length;
      renderAppleTvHeroHub();
      if (window.lucide) lucide.createIcons();
    };
  }

  const nextBtn = document.getElementById('btnHeroNext');
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      heroHubIndex = (heroHubIndex + 1) % featured.length;
      renderAppleTvHeroHub();
      if (window.lucide) lucide.createIcons();
    };
  }

  // Miniaturas seletoras no canto inferior direito do Hero Apple TV+
  const indContainer = document.getElementById('heroHubIndicators');
  if (indContainer) {
    indContainer.innerHTML = '';
    featured.forEach((it, idx) => {
      const btn = document.createElement('button');
      const isAct = idx === heroHubIndex;
      btn.className = `relative rounded-xl overflow-hidden transition-all duration-300 border ${
        isAct ? 'w-16 h-10 border-white scale-105 shadow-lg' : 'w-11 h-10 border-white/20 opacity-55 hover:opacity-90'
      }`;
      btn.title = it.title;
      btn.innerHTML = `<img src="${it.poster}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'" />`;
      btn.addEventListener('click', () => {
        heroHubIndex = idx;
        renderAppleTvHeroHub();
        if (window.lucide) lucide.createIcons();
      });
      indContainer.appendChild(btn);
    });
  }

  if (!heroHubTimer) {
    heroHubTimer = setInterval(() => {
      if (activeNavTab === 'board' && !searchQuery) {
        const list = getHeroFeaturedItems();
        if (list.length > 1) {
          heroHubIndex = (heroHubIndex + 1) % list.length;
          renderAppleTvHeroHub();
          if (window.lucide) lucide.createIcons();
        }
      }
    }, 8500);
  }
}

function filterChannelList() {
  filteredChannels = channels.filter((ch) => {
    if (searchQuery) {
      return matchesSearchQuery(`${ch.number} ${ch.name} ${ch.group}`, searchQuery);
    }
    if (activeCategoryChip === 'Favoritos' && !favorites.has(ch.number)) return false;
    if (activeCategoryChip.toLowerCase() === 'esportes' || activeNavTab === 'sports') {
      return ch.group === 'Esportes' && isAllowedSportsChannel(ch.name);
    }
    if (activeCategoryChip === 'FrostView') {
      return ch.group !== 'Esportes' && (ch.sources || []).some((s) => /frostview/i.test(s.origin || s.label || ''));
    }
    if (activeCategoryChip === 'Brazuca') {
      return ch.group !== 'Esportes' && (ch.sources || []).some((s) => /brazuca/i.test(s.origin || s.label || ''));
    }
    if (activeCategoryChip === 'TV Aberta') {
      return ch.group === 'TV Aberta' || Boolean(ch.isOpenTvAddon);
    }
    if (activeCategoryChip !== 'ALL' && activeCategoryChip !== 'Favoritos') {
      const targetCat = activeCategoryChip.toLowerCase();
      if (ch.group.toLowerCase() !== targetCat && (ch.subCategory || '').toLowerCase() !== targetCat) return false;
    }
    return true;
  });

  document.getElementById('channelTotalBadge').textContent = `${filteredChannels.length}`;
}

function renderChannelSidebar() {
  const container = document.getElementById('channelListContainer');
  container.innerHTML = '';

  if (filteredChannels.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 text-white/45 text-xs">
        ${
          channels.length === 0
            ? 'Sincronizando canais ao vivo...'
            : 'Nenhum canal encontrado nesta categoria.'
        }
      </div>
    `;
    return;
  }

  const frag = document.createDocumentFragment();

  filteredChannels.slice(0, 350).forEach((ch) => {
    const isPlaying = currentChannel && currentChannel.number === ch.number;
    const isFav = favorites.has(ch.number);
    const progress = ch.epg?.progress || 55;
    const sourceCount = ch.sources?.length || 1;

    const card = document.createElement('div');
    card.className = `channel-card rounded-2xl p-3 cursor-pointer flex flex-col gap-2 ${isPlaying ? 'active' : ''}`;
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="font-mono text-xs font-bold ${isPlaying ? 'text-purple-300' : 'text-white/40'} w-7 shrink-0">${ch.number}</span>

        <div class="w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
          <img src="${ch.logo}" alt="${escapeHtml(ch.name)}" loading="lazy" class="max-w-full max-h-full object-contain rounded" onerror="this.style.display='none'" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <h4 class="text-sm font-semibold text-white truncate">${escapeHtml(ch.name)}</h4>
            ${isPlaying ? '<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>' : ''}
            ${sourceCount > 1 ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold">${sourceCount}x</span>` : ''}
          </div>
          <p class="text-xs text-white/55 truncate mt-0.5">${escapeHtml(ch.group)} • ${escapeHtml(ch.sources?.[0]?.origin || 'Ao Vivo')}</p>
        </div>

        <button class="fav-toggle text-sm px-1 ${isFav ? 'text-amber-400' : 'text-white/20 hover:text-white/60'}" title="Favoritar">★</button>
      </div>

      <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div class="h-full ${isPlaying ? 'bg-purple-400' : 'bg-white/30'} rounded-full" style="width: ${progress}%"></div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-toggle')) {
        e.stopPropagation();
        toggleFavoriteChannel(ch.number);
        return;
      }
      playChannel(ch, 0);
    });

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

let activeRoletaIntervals = [];

function clearRoletaIntervals() {
  activeRoletaIntervals.forEach((id) => clearInterval(id));
  activeRoletaIntervals = [];
}

// ============================================================================
// Renderização da Área Principal (Busca Limpa | Hub Inicial Apple TV | Canal Aberto | Esportes | Filmes | Séries)
// ============================================================================
function renderRightContentArea() {
  clearRoletaIntervals();
  const carouselsEl = document.getElementById('carouselsContainer');
  carouselsEl.innerHTML = '';

  // --------------------------------------------------------------------------
  // 1. MODO BUSCA EXCLUSIVA: Não mostra NADA até achar o filme!
  // --------------------------------------------------------------------------
  if (searchQuery) {
    if (isSearchingCatalog || searchQuery.length < 2) {
      const loadingBox = document.createElement('div');
      loadingBox.className = 'tvos-glass rounded-3xl p-14 my-8 flex flex-col items-center justify-center text-center gap-4 border border-white/10 shadow-2xl';
      loadingBox.innerHTML = `
        <div class="w-12 h-12 rounded-full border-2 border-purple-400 border-t-transparent animate-spin"></div>
        <div class="space-y-1">
          <h3 class="text-base sm:text-lg font-bold text-white">Buscando "${escapeHtml(searchQuery)}" no catálogo...</h3>
          <p class="text-xs text-white/50">Consultando BestCine, FrostStream, FenixFlix, King VOD, Brazuca Torrents e ComandoPlay</p>
        </div>
      `;
      carouselsEl.appendChild(loadingBox);
      return;
    }

    const foundMoviesAndSeries = stremioCatalog.searchResults;
    const foundChannelCards = filteredChannels.slice(0, 12).map((c) => ({
      id: `ch-search-${c.number}`,
      title: c.name,
      subtitle: `${c.group} • Canal ${c.number}`,
      badge: 'CANAL AO VIVO',
      category: c.group,
      poster: c.logo,
      isLogoPoster: true,
      url: c.url,
      channelRef: c
    }));

    if (foundMoviesAndSeries.length === 0 && foundChannelCards.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'tvos-glass rounded-3xl p-14 my-8 flex flex-col items-center justify-center text-center gap-3 border border-white/10';
      emptyBox.innerHTML = `
        <i data-lucide="search-x" class="w-10 h-10 text-white/35"></i>
        <h3 class="text-base font-bold text-white">Nenhum título encontrado para "${escapeHtml(searchQuery)}"</h3>
        <p class="text-xs text-white/50 max-w-md">Verifique a grafia do nome do filme ou série (em português ou inglês) e tente novamente.</p>
      `;
      carouselsEl.appendChild(emptyBox);
      return;
    }

    if (foundMoviesAndSeries.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow(
          `Filmes & Séries Encontrados para "${searchQuery}"`,
          'search',
          foundMoviesAndSeries,
          false,
          true
        )
      );
    }

    if (foundChannelCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow(
          `Canais Ao Vivo Encontrados para "${searchQuery}"`,
          'tv',
          foundChannelCards,
          true,
          false
        )
      );
    }
    return;
  }

  // --------------------------------------------------------------------------
  // 2. PREPARAÇÃO DOS CATÁLOGOS PARA AS ABAS (Sem busca ativa)
  // --------------------------------------------------------------------------
  const bestCineMovies = stremioCatalog.bestCineMovies;
  const bestCineSeries = stremioCatalog.bestCineSeries;
  const trendingMovies = stremioCatalog.trendingMovies;
  const topMovies = stremioCatalog.topMovies;
  const trendingSeries = stremioCatalog.trendingSeries;
  const topSeries = stremioCatalog.topSeries;
  const comandoItems = stremioCatalog.comandoPlayItems;

  const openTvChannelCards = channels
    .filter((c) => c.group === 'TV Aberta')
    .slice(0, 24)
    .map((c) => ({
      id: `opentv-${c.number}`,
      title: c.name,
      subtitle: `Canal ${c.number} • ${c.sources.length} fonte(s)`,
      badge: 'CANAL ABERTO',
      category: 'TV Aberta',
      poster: c.logo,
      isLogoPoster: true,
      url: c.url,
      channelRef: c
    }));

  const sportsItems = channels
    .filter((c) => c.group === 'Esportes' && isAllowedSportsChannel(c.name))
    .map((c) => ({
      id: `sp-${c.number}`,
      title: c.name,
      subtitle: `Canal ${c.number} • ${c.sources.length} fonte(s)`,
      badge: 'ESPORTE AO VIVO',
      category: 'Esportes',
      poster: c.logo,
      isLogoPoster: true,
      url: c.url,
      channelRef: c
    }));

  // --------------------------------------------------------------------------
  // ABA 1: HUB INICIAL APPLE TV+ (Filmes e Séries Novas + Destaques)
  // --------------------------------------------------------------------------
  if (activeNavTab === 'board') {
    const newMovies = [...bestCineMovies, ...comandoItems.filter((i) => i.type === 'movie'), ...trendingMovies];
    const newSeries = [...bestCineSeries, ...comandoItems.filter((i) => i.type === 'series'), ...trendingSeries];

    carouselsEl.appendChild(
      buildCarouselRow('Novos Filmes Dublados & Lançamentos — Apple TV+ Hub', 'sparkles', newMovies.slice(0, 28), false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Séries Novas & Episódios em Alta', 'clapperboard', newSeries.slice(0, 28), false, false)
    );
    if (openTvChannelCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Canais Abertos do Brasil — Ao Vivo Agora', 'tv', openTvChannelCards, true, false)
      );
    }
    if (sportsItems.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Esportes & Meu Futebol — Ao Vivo Agora', 'trophy', sportsItems.slice(0, 20), true, false)
      );
    }
    carouselsEl.appendChild(
      buildCarouselRow('Filmes Aclamados pela Crítica (4K / FHD)', 'award', topMovies, false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Séries Mais Assistidas no Mundo', 'flame', topSeries, false, false)
    );
    return;
  }

  // --------------------------------------------------------------------------
  // ABA 2: CANAIS (TV Aberta & Todos os Canais Ao Vivo)
  // --------------------------------------------------------------------------
  if (activeNavTab === 'live') {
    if (openTvChannelCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Canais de TV Aberta — FrostView TV & Brazuca Ao Vivo', 'tv', openTvChannelCards, true, false)
      );
    }

    const newsAndMoviesTv = channels
      .filter((c) => c.group === 'Notícias' || c.group === 'Filmes' || c.group === 'Séries')
      .slice(0, 30)
      .map((c) => ({
        id: `tvextra-${c.number}`,
        title: c.name,
        subtitle: `${c.group} • Canal ${c.number}`,
        badge: c.group.toUpperCase(),
        category: c.group,
        poster: c.logo,
        isLogoPoster: true,
        url: c.url,
        channelRef: c
      }));

    if (newsAndMoviesTv.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Canais de Notícias, Variedades & Filmes TV Ao Vivo', 'radio', newsAndMoviesTv, true, false)
      );
    }

    const allLiveCards = channels
      .filter((c) => c.group !== 'Esportes')
      .slice(0, 50)
      .map((c) => ({
        id: `alltv-${c.number}`,
        title: c.name,
        subtitle: `${c.group} • Canal ${c.number}`,
        badge: 'AO VIVO',
        category: c.group,
        poster: c.logo,
        isLogoPoster: true,
        url: c.url,
        channelRef: c
      }));

    if (allLiveCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Grade Completa — Canais Ao Vivo (FrostView TV & Brazuca)', 'tv', allLiveCards, true, false)
      );
    }
    return;
  }

  // --------------------------------------------------------------------------
  // ABA 3: ESPORTES (Combate, Premiere, SporTV & ESPN)
  // --------------------------------------------------------------------------
  if (activeNavTab === 'sports') {
    if (sportsItems.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Esportes & Meu Futebol — Ao Vivo Agora', 'trophy', sportsItems, true, false)
      );
    }

    const premiereCards = channels
      .filter((c) => /premiere/i.test(c.name))
      .map((c) => ({
        id: `prem-${c.number}`,
        title: c.name,
        subtitle: `Canal ${c.number} • Premiere HD`,
        badge: 'PREMIERE',
        category: 'Esportes',
        poster: c.logo,
        isLogoPoster: true,
        url: c.url,
        channelRef: c
      }));

    if (premiereCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Premiere Clubes — Brasileirão & Copa do Brasil Ao Vivo', 'trophy', premiereCards, true, false)
      );
    }

    const espnSportvCards = channels
      .filter((c) => /espn|sportv|combate/i.test(c.name))
      .map((c) => ({
        id: `espnsportv-${c.number}`,
        title: c.name,
        subtitle: `Canal ${c.number} • Ao Vivo`,
        badge: 'ESPORTE',
        category: 'Esportes',
        poster: c.logo,
        isLogoPoster: true,
        url: c.url,
        channelRef: c
      }));

    if (espnSportvCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Canais ESPN & SporTV — Cobertura Esportiva Ao Vivo', 'trophy', espnSportvCards, true, false)
      );
    }
    return;
  }

  // --------------------------------------------------------------------------
  // ABA ANIMES (Animes BR + FrostStream)
  // --------------------------------------------------------------------------
  if (activeNavTab === 'anime') {
    const isAnimeLike = (i) => /anime|animation|anima/i.test(`${(i.genres || []).join(' ')} ${i.category || ''} ${i.subtitle || ''}`);
    const frostAnimes = [...bestCineSeries, ...bestCineMovies].filter(
      (i) => /frost/i.test(`${i.badge || ''} ${i.subtitle || ''}`) && isAnimeLike(i)
    );
    const animesBr = stremioCatalog.animeItems.filter((i) => !/frost/i.test(i.badge || ''));
    const frostFromAnimeCat = stremioCatalog.animeItems.filter((i) => /frost/i.test(i.badge || ''));
    const frostAll = [...frostFromAnimeCat, ...frostAnimes];
    const cinemetaAnimes = [...trendingSeries, ...topSeries].filter(isAnimeLike);
    const allAnimes = [...animesBr, ...frostAll, ...cinemetaAnimes];

    if (allAnimes.length === 0) {
      const box = document.createElement('div');
      box.className = 'tvos-glass rounded-3xl p-12 flex flex-col items-center gap-3 text-center border border-white/10';
      box.innerHTML = `
        <div class="w-10 h-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></div>
        <p class="text-sm text-white/70">Carregando animes do Animes BR e FrostStream...</p>`;
      carouselsEl.appendChild(box);
      return;
    }
    if (animesBr.length > 0) {
      carouselsEl.appendChild(buildCarouselRow('Roleta — Animes BR (Dublados & Legendados)', 'sparkles', animesBr, false, false));
    }
    if (frostAll.length > 0) {
      carouselsEl.appendChild(buildCarouselRow('Roleta — Animes FrostStream', 'flame', frostAll, false, false));
    }
    if (cinemetaAnimes.length > 0) {
      carouselsEl.appendChild(buildCarouselRow('Roleta — Animes em Alta', 'award', cinemetaAnimes, false, false));
    }
    carouselsEl.appendChild(buildCarouselRow('Catálogo Completo de Animes', 'tv', allAnimes, false, true));
    return;
  }

  // --------------------------------------------------------------------------
  // ABA 4: FILMES (Foco 100% no Player sem recomendados por baixo ao assistir)
  // --------------------------------------------------------------------------
  if (activeNavTab === 'movies') {
    if (isPlayerVisibleOnHub || currentChannel?.number === 'FILME') {
      carouselsEl.innerHTML = '';
      document.getElementById('stremioGenreBar')?.classList.add('hidden');
      return;
    }

    const allPtBrMovies = [...bestCineMovies, ...comandoItems.filter((i) => i.type === 'movie')];
    const ptBrMovies = activeStremioGenre
      ? allPtBrMovies.filter((i) => matchesGenreTheme(i, activeStremioGenre))
      : allPtBrMovies;
    const genreLabel = activeStremioGenre ? GENRE_PT_LABELS[activeStremioGenre] || activeStremioGenre : '';
    const combinedMovies = [...ptBrMovies, ...trendingMovies, ...topMovies];

    if (activeStremioGenre) {
      const topRowMovies = [...ptBrMovies, ...trendingMovies];
      carouselsEl.appendChild(
        buildCarouselRow(`Roleta — Filmes de ${genreLabel} em Destaque`, 'sparkles', topRowMovies, false, false)
      );
      carouselsEl.appendChild(
        buildCarouselRow(`Roleta — Filmes de ${genreLabel} Mais Bem Avaliados (IMDb Top)`, 'award', topMovies, false, false)
      );
      carouselsEl.appendChild(
        buildCarouselRow(`Catálogo Completo — Filmes de ${genreLabel}`, 'film', combinedMovies, false, true)
      );
      return;
    }

    if (ptBrMovies.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Roleta — Filmes Dublados PT-BR (BestCine • FrostStream • FenixFlix • King VOD)', 'sparkles', ptBrMovies, false, false)
      );
    }
    carouselsEl.appendChild(
      buildCarouselRow('Roleta — Filmes em Alta na Semana (Brazuca & Cinemeta)', 'flame', trendingMovies, false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Roleta — Filmes Mais Bem Avaliados (IMDb Top)', 'award', topMovies, false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Catálogo Completo de Filmes', 'film', combinedMovies, false, true)
    );
    return;
  }

  // --------------------------------------------------------------------------
  // ABA 5: SÉRIES ("Tire a parte de recomendados e deixe só a série")
  // --------------------------------------------------------------------------
  if (activeNavTab === 'series') {
    if (isPlayerVisibleOnHub || currentChannel?.seriesNav) {
      carouselsEl.innerHTML = '';
      document.getElementById('stremioGenreBar')?.classList.add('hidden');
      return;
    }

    const allPtBrSeries = [...bestCineSeries, ...comandoItems.filter((i) => i.type === 'series')];
    const ptBrSeries = activeStremioGenre
      ? allPtBrSeries.filter((i) => matchesGenreTheme(i, activeStremioGenre))
      : allPtBrSeries;
    const genreLabel = activeStremioGenre ? GENRE_PT_LABELS[activeStremioGenre] || activeStremioGenre : '';
    const combinedSeries = [...ptBrSeries, ...trendingSeries, ...topSeries];

    if (activeStremioGenre) {
      const topRowSeries = [...ptBrSeries, ...trendingSeries];
      carouselsEl.appendChild(
        buildCarouselRow(`Roleta — Séries de ${genreLabel} em Destaque`, 'sparkles', topRowSeries, false, false)
      );
      carouselsEl.appendChild(
        buildCarouselRow(`Roleta — Séries de ${genreLabel} Aclamadas pela Crítica (IMDb Top)`, 'award', topSeries, false, false)
      );
      carouselsEl.appendChild(
        buildCarouselRow(`Catálogo Completo — Séries de ${genreLabel}`, 'tv', combinedSeries, false, true)
      );
      return;
    }

    if (ptBrSeries.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Roleta — Séries Dubladas, Doramas & Animes (BestCine • FrostStream • FenixFlix)', 'sparkles', ptBrSeries, false, false)
      );
    }
    carouselsEl.appendChild(
      buildCarouselRow('Roleta — Séries Populares em Alta', 'clapperboard', trendingSeries, false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Roleta — Séries Aclamadas pela Crítica (IMDb Top)', 'award', topSeries, false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Catálogo Completo de Séries', 'tv', combinedSeries, false, true)
    );
  }
}

function buildCarouselRow(title, iconName, items, isLandscape = false, isExpandedGrid = false) {
  const section = document.createElement('div');
  section.className = 'flex flex-col gap-3 relative group/roleta';

  // Cabeçalho com título + Botões da Roleta (Sortear 🎲, Anterior ‹, Próximo ›)
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between gap-2 px-1 flex-wrap';
  header.innerHTML = `
    <div class="flex items-center gap-2 min-w-0">
      <i data-lucide="${iconName}" class="w-4 h-4 text-purple-400 shrink-0"></i>
      <h3 class="text-sm sm:text-base font-bold tracking-tight text-white truncate">${title}</h3>
      <span class="text-xs text-white/40 font-mono shrink-0">(${items.length})</span>
    </div>
    ${
      !isExpandedGrid && items.length > 0
        ? `
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="btn-roleta-spin tvos-glass hover:bg-purple-500/30 hover:border-purple-400/50 text-purple-200 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all" title="Girar a roleta e sortear um título">
          <i data-lucide="dices" class="w-3.5 h-3.5 text-purple-300"></i>
          <span>Girar Roleta</span>
        </button>
        <button class="btn-roleta-prev tvos-glass hover:bg-white hover:text-black text-white w-7 h-7 rounded-full flex items-center justify-center transition-all" title="Passar para a esquerda">
          <i data-lucide="chevron-left" class="w-4 h-4"></i>
        </button>
        <button class="btn-roleta-next tvos-glass hover:bg-white hover:text-black text-white w-7 h-7 rounded-full flex items-center justify-center transition-all" title="Passar para a direita">
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    `
        : `<span class="text-xs text-white/45">${items.length} títulos</span>`
    }
  `;
  section.appendChild(header);

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tvos-glass rounded-2xl p-6 text-center text-xs text-white/50';
    empty.textContent = 'Sincronizando títulos...';
    section.appendChild(empty);
    return section;
  }

  // Wrapper relativo para posicionar as setas flutuantes laterais da roleta
  const trackWrapper = document.createElement('div');
  trackWrapper.className = 'relative w-full';

  const row = document.createElement('div');
  row.className = isExpandedGrid
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4'
    : 'roleta-track flex items-center gap-4 overflow-x-auto pb-3 pt-1.5 px-1';

  let isDragging = false;
  let dragMoved = false;

  items.slice(0, 60).forEach((item) => {
    const card = document.createElement('div');
    const widthClass = isExpandedGrid ? 'w-full' : isLandscape ? 'w-52 sm:w-64 shrink-0' : 'w-32 sm:w-44 shrink-0';
    const aspectClass = isLandscape ? 'aspect-video' : 'aspect-[2/3]';

    card.className = `vod-card ${widthClass} rounded-2xl overflow-hidden cursor-pointer group relative flex flex-col select-none`;
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="relative w-full ${aspectClass} bg-black/60 overflow-hidden flex items-center justify-center">
        <img src="${item.poster}" alt="${escapeHtml(item.title)}" draggable="false" loading="lazy" class="w-full h-full ${item.isLogoPoster ? 'object-contain p-6' : 'object-cover'} group-hover:scale-105 transition-transform duration-500 pointer-events-none" onerror="this.style.display='none'" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none"></div>
        <span class="absolute top-2 left-2 text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full ${item.badge?.startsWith('★') ? 'badge-imdb-apple' : 'badge-addon-origin'} backdrop-blur-md pointer-events-none">
          ${escapeHtml(item.badge || item.addon || 'HD')}
        </span>
        <div class="absolute bottom-2.5 left-3 right-3 pointer-events-none">
          <h4 class="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">${escapeHtml(item.title)}</h4>
          <p class="text-[11px] text-white/65 truncate mt-0.5">${escapeHtml(item.subtitle)}</p>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (item.channelRef) {
        playChannel(item.channelRef, 0);
      } else if (item.type === 'series' || item.type === 'anime') {
        playSeriesDirect(item, 1, 1);
      } else {
        playMovieDirect(item);
      }
    });

    row.appendChild(card);
  });

  trackWrapper.appendChild(row);

  // Se for fileira horizontal (Roleta), adiciona setas flutuantes laterais, giro por roda do mouse, arraste com mouse e rotação contínua!
  if (!isExpandedGrid) {
    const floatPrev = document.createElement('button');
    floatPrev.className =
      'roleta-arrow-btn absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full text-white flex items-center justify-center opacity-90 hover:opacity-100';
    floatPrev.title = 'Anterior';
    floatPrev.innerHTML = `<i data-lucide="chevron-left" class="w-5 h-5"></i>`;

    const floatNext = document.createElement('button');
    floatNext.className =
      'roleta-arrow-btn absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full text-white flex items-center justify-center opacity-90 hover:opacity-100';
    floatNext.title = 'Próximo';
    floatNext.innerHTML = `<i data-lucide="chevron-right" class="w-5 h-5"></i>`;

    trackWrapper.appendChild(floatPrev);
    trackWrapper.appendChild(floatNext);

    const stepSize = () => Math.max(360, Math.floor(row.clientWidth * 0.72));

    const slideNext = () => {
      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 0) return;
      if (row.scrollLeft >= maxScroll - 20) {
        row.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        row.scrollBy({ left: stepSize(), behavior: 'smooth' });
      }
    };

    const slidePrev = () => {
      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 0) return;
      if (row.scrollLeft <= 20) {
        row.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        row.scrollBy({ left: -stepSize(), behavior: 'smooth' });
      }
    };

    const spinRouletteRandom = () => {
      const cards = Array.from(row.querySelectorAll('.vod-card'));
      if (cards.length === 0) return;
      const randomIdx = Math.floor(Math.random() * cards.length);
      const targetCard = cards[randomIdx];
      cards.forEach((c) => c.classList.remove('ring-2', 'ring-purple-400', 'scale-105'));

      const targetLeft = Math.max(0, targetCard.offsetLeft - row.clientWidth / 2 + targetCard.clientWidth / 2);
      row.scrollTo({ left: targetLeft, behavior: 'smooth' });

      targetCard.classList.add('ring-2', 'ring-purple-400', 'scale-105');
      setTimeout(() => {
        targetCard.classList.remove('ring-2', 'ring-purple-400', 'scale-105');
      }, 2800);
    };

    floatPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      slidePrev();
    });
    floatNext.addEventListener('click', (e) => {
      e.stopPropagation();
      slideNext();
    });

    header.querySelector('.btn-roleta-prev')?.addEventListener('click', slidePrev);
    header.querySelector('.btn-roleta-next')?.addEventListener('click', slideNext);
    header.querySelector('.btn-roleta-spin')?.addEventListener('click', spinRouletteRandom);

    // Arrastar com o mouse (Click & Drag) para girar a roleta livremente
    let startX = 0;
    let startScrollLeft = 0;

    row.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      dragMoved = false;
      row.classList.add('roleta-dragging');
      startX = e.pageX - row.offsetLeft;
      startScrollLeft = row.scrollLeft;
    });

    row.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const x = e.pageX - row.offsetLeft;
      const walk = (x - startX) * 1.6;
      if (Math.abs(walk) > 8) {
        dragMoved = true;
        e.preventDefault();
        row.scrollLeft = startScrollLeft - walk;
      }
    });

    const stopDragging = () => {
      if (!isDragging) return;
      isDragging = false;
      row.classList.remove('roleta-dragging');
      setTimeout(() => {
        dragMoved = false;
      }, 60);
    };

    row.addEventListener('mouseup', stopDragging);
    row.addEventListener('mouseleave', stopDragging);

    // Roda do mouse gira a roleta horizontalmente quando o cursor está sobre os cartões
    row.addEventListener(
      'wheel',
      (e) => {
        const maxScroll = row.scrollWidth - row.clientWidth;
        if (maxScroll <= 0) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const atStart = row.scrollLeft <= 2 && delta < 0;
        const atEnd = row.scrollLeft >= maxScroll - 2 && delta > 0;
        if (!atStart && !atEnd) {
          e.preventDefault();
          row.scrollLeft += delta * 1.35;
        }
      },
      { passive: false }
    );

    // Roleta Automática Suave (gira sozinha periodicamente e pausa quando o mouse está em cima)
    let isHovered = false;
    section.addEventListener('mouseenter', () => {
      isHovered = true;
    });
    section.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    const autoInterval = setInterval(() => {
      if (!isHovered && !isDragging && !searchQuery && document.visibilityState === 'visible') {
        const maxScroll = row.scrollWidth - row.clientWidth;
        if (maxScroll > 40) {
          if (row.scrollLeft >= maxScroll - 20) {
            row.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            row.scrollBy({ left: isLandscape ? 270 : 192, behavior: 'smooth' });
          }
        }
      }
    }, 5500 + (activeRoletaIntervals.length * 900));

    activeRoletaIntervals.push(autoInterval);
  }

  section.appendChild(trackWrapper);
  return section;
}

// ============================================================================
// Motor de Reprodução de Vídeo (HLS.js + mpegts.js + Stremio Embed Player)
// ============================================================================
let playerWatchdogTimer = null;

function clearPlayerWatchdog() {
  if (playerWatchdogTimer) {
    clearTimeout(playerWatchdogTimer);
    playerWatchdogTimer = null;
  }
}

function advanceToNextSource(reason = 'Falha no sinal') {
  clearPlayerWatchdog();
  if (!currentChannel) return;
  const total = currentChannel.sources?.length || 1;
  const nextIdx = currentSourceIdx + 1;
  if (nextIdx < total) {
    const nextSrc = currentChannel.sources[nextIdx];
    showPlayerToast(`${reason} — Alternando automaticamente para ${nextSrc?.origin || `Fonte ${nextIdx + 1}`}...`);
    setTimeout(() => {
      if (currentChannel) {
        playChannel(currentChannel, nextIdx);
      }
    }, 350);
  } else {
    showPlayerToast('Todas as fontes foram testadas. Experimente "Trocar Fonte" ou reproduzir via VLC.');
  }
}

function destroyPlayers() {
  clearPlayerWatchdog();
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
  if (mpegtsPlayer) {
    mpegtsPlayer.destroy();
    mpegtsPlayer = null;
  }
  const video = document.getElementById('videoPlayer');
  const embed = document.getElementById('embedPlayer');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.onerror = null;
    video.onplaying = null;
    video.classList.remove('hidden');
  }
  if (embed) {
    embed.src = 'about:blank';
    embed.onerror = null;
    embed.onload = null;
    embed.classList.add('hidden');
  }

  document.getElementById('stageSeriesSection')?.classList.add('hidden');
  document.getElementById('btnNextEpisode')?.classList.add('hidden');
  document.getElementById('btnNextEpisodeStage')?.classList.add('hidden');
  document.getElementById('btnNextEpisodeOverlay')?.classList.add('hidden');
}

function isEmbedWebUrl(url = '') {
  if (/\.(m3u8|mp4|mkv|webm|ts)(\?|$)/i.test(url)) return false;
  if (
    /\/(embed|player|watch|assistir|filmes|series|filme|serie|ch\.php)\b/i.test(url) ||
    /warezcdn|multiembed|vidsrc|autoembed|comandoplay|embedcanais|redecanais|nossoplayer|player3/i.test(url) ||
    /\.(php|html)(\?|$)/i.test(url)
  ) {
    return true;
  }
  return false;
}

async function playChannel(ch, sourceIdx = 0) {
  currentChannel = ch;
  currentSourceIdx = sourceIdx;
  isPlayerVisibleOnHub = true;

  // No Hub Inicial (board) não deve passar nenhum vídeo: se o usuário iniciar um vídeo a partir do Hub,
  // alterna automaticamente para a aba correspondente (Esportes, Filmes, Séries ou Canal Aberto)
  const grp = String(ch.group || '').toLowerCase();
  const isSeries = Boolean(ch.seriesNav || String(ch.number || '').startsWith('T') || grp.includes('série') || grp.includes('serie'));
  const isMovie = Boolean(ch.number === 'FILME' || grp === 'filmes');

  if (activeNavTab === 'board') {
    if (grp.includes('esporte')) activeNavTab = 'sports';
    else if (isMovie) activeNavTab = 'movies';
    else if (isSeries) activeNavTab = 'series';
    else activeNavTab = 'live';

    syncNavButtons(activeNavTab);
    updateLayoutSectionsVisibility();
    renderRightContentArea();
  } else if (isSeries || isMovie) {
    renderRightContentArea();
  }

  // Garante que o palco de vídeo esteja visível fora do Hub
  if (activeNavTab !== 'board') {
    document.getElementById('liveStageSection')?.classList.remove('hidden');
    document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Se a fonte selecionada for um endpoint JSON de stream do Stremio (FrostView TV / Rede Canais / Meu Futebol), resolve antes de tocar
  const selectedSourceUrl = ch.sources?.[sourceIdx]?.url || ch.url;
  if ((ch.isStremioTvMeta || selectedSourceUrl.endsWith('.json')) && selectedSourceUrl.endsWith('.json')) {
    showPlayerToast(`Conectando ao canal ${ch.name} (${ch.sources?.[sourceIdx]?.origin || 'FrostView TV'})...`);
    const candidateUrls = [selectedSourceUrl];
    if (ch.addonBase && ch.stremioId) {
      const idEnc = encodeURIComponent(ch.stremioId);
      candidateUrls.push(
        `${ch.addonBase}/stream/tv/${idEnc}.json`,
        `${ch.addonBase}/stream/other/${idEnc}.json`,
        `${ch.addonBase}/stream/channel/${idEnc}.json`,
        `${ch.addonBase}/meta/${encodeURIComponent(ch.stremioType || 'tv')}/${idEnc}.json`
      );
    }

    for (const cUrl of candidateUrls) {
      try {
        const txt = await fetchTextSafe(cUrl, false);
        if (!txt) continue;
        const d = JSON.parse(txt);
        const rawStreams = Array.isArray(d.streams)
          ? d.streams
          : Array.isArray(d.meta?.streams)
          ? d.meta.streams
          : Array.isArray(d.meta?.videos?.[0]?.streams)
          ? d.meta.videos[0].streams
          : [];

        const resolved = rawStreams
          .map((s, i) => {
            const direct = s.url || s.externalUrl || (s.ytId ? `https://www.youtube.com/embed/${s.ytId}?autoplay=1` : '');
            if (!direct) return null;
            return {
              label: s.name || s.title || `Sinal ${i + 1}`,
              url: direct,
              origin: ch.sources?.[sourceIdx]?.origin || 'FrostView TV',
              isWebEmbed: isEmbedWebUrl(direct)
            };
          })
          .filter(Boolean);

        if (resolved.length > 0) {
          const otherSources = (ch.sources || []).filter((_, idx) => idx !== sourceIdx);
          ch.sources = [...resolved, ...otherSources];
          ch.url = ch.sources[0].url;
          ch.isStremioTvMeta = false;
          sourceIdx = 0;
          currentSourceIdx = 0;
          break;
        }
      } catch (_) {}
    }
  }

  renderChannelSidebar();
  updateEpgPanel(ch, sourceIdx);
  renderMultiSourcePills(ch, sourceIdx);

  // Botões "Próximo Episódio" só aparecem em séries/animes
  const nextInfo = ch.seriesNav ? getNextEpisodeInfo(ch.seriesNav.item, ch.seriesNav.season, ch.seriesNav.episode) : null;
  const updateNextBtns = (btn) => {
    if (!btn) return;
    btn.classList.toggle('hidden', !nextInfo);
    if (nextInfo) btn.title = `Próximo: T${nextInfo.season}:E${nextInfo.episode}${nextInfo.name ? ` • ${nextInfo.name}` : ''}`;
  };
  updateNextBtns(document.getElementById('btnNextEpisode'));
  updateNextBtns(document.getElementById('btnNextEpisodeStage'));
  updateNextBtns(document.getElementById('btnNextEpisodeOverlay'));

  const activeSource = ch.sources?.[sourceIdx];
  const activeUrl = activeSource?.url || ch.url;
  const isSourceEmbed = Boolean(activeSource ? activeSource.isWebEmbed : ch.isWebEmbed) || isEmbedWebUrl(activeUrl);

  const extBtn = document.getElementById('btnOpenExternalPage');
  extBtn.classList.toggle('hidden', !isSourceEmbed);
  extBtn.onclick = () => window.open(activeUrl, '_blank');

  destroyPlayers();
  document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });

  renderStageSeriesSection(ch);

  if (isSourceEmbed) {
    const video = document.getElementById('videoPlayer');
    const embed = document.getElementById('embedPlayer');
    video.classList.add('hidden');
    embed.classList.remove('hidden');
    embed.src = activeUrl;
    showPlayerToast(`Conectando: ${activeSource?.origin || ch.name}...`);

    clearPlayerWatchdog();
    // Watchdog de 6s caso o embed não carregue ou fique em tela preta
    playerWatchdogTimer = setTimeout(() => {
      advanceToNextSource('Servidor demorou a responder');
    }, 6000);

    embed.onload = () => {
      clearPlayerWatchdog();
      showPlayerToast(`✓ Reproduzindo: ${ch.name}`);
    };
    embed.onerror = () => {
      advanceToNextSource('Falha ao carregar servidor');
    };
    return;
  }

  startHlsOrDirectStream(activeUrl, ch, sourceIdx);
}

function updateEpgPanel(ch, sourceIdx) {
  document.getElementById('playerBadgeNumber').textContent = ch.number || 'AO VIVO';
  document.getElementById('playerBadgeName').textContent = ch.name;

  const logoImg = document.getElementById('epgChannelLogo');
  logoImg.src = ch.logo || createLogoSvg(ch.name, '#3b0764', '#0f172a');

  const srcOrigin = ch.sources?.[sourceIdx]?.origin || 'Sinal Oficial';
  const totalSources = ch.sources?.length || 1;

  document.getElementById('epgProgramCategory').textContent = ch.group || 'Ao Vivo';
  document.getElementById('epgTimeSlot').textContent = `Fonte ${sourceIdx + 1} de ${totalSources}`;
  document.getElementById('epgSourceLabel').textContent = srcOrigin;
  document.getElementById('epgProgramTitle').textContent = ch.epg?.program || `${ch.name}`;
  document.getElementById('epgProgramSynopsis').textContent =
    ch.epg?.synopsis ||
    `Sinal recebido de ${srcOrigin}. Se desejar alternar de servidor ou rota, clique nas pílulas de fonte ou em "Trocar Fonte".`;
  document.getElementById('epgNextProgram').textContent = ch.epg?.next || 'Programação Contínua';
  document.getElementById('epgElapsedLabel').textContent = ch.epg?.elapsed || 'No Ar';
  document.getElementById('epgRemainingLabel').textContent = `${totalSources} fonte(s)`;
}

function renderMultiSourcePills(ch, activeIdx) {
  const container = document.getElementById('multiSourcePills');
  const sources = ch.sources || [];
  if (sources.length <= 1) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = '';
  sources.slice(0, 6).forEach((src, idx) => {
    const btn = document.createElement('button');
    btn.className = `px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
      idx === activeIdx ? 'bg-white text-black' : 'text-white/70 hover:text-white'
    }`;
    btn.textContent = src.label || `Fonte ${idx + 1}`;
    btn.title = `${src.origin || 'Sinal'}: ${src.url}`;
    btn.addEventListener('click', () => playChannel(ch, idx));
    container.appendChild(btn);
  });
}

function startHlsOrDirectStream(rawUrl, ch, sourceIdx) {
  const video = document.getElementById('videoPlayer');
  showPlayerToast(`Conectando a ${ch.name} (Fonte ${sourceIdx + 1})...`);

  clearPlayerWatchdog();
  playerWatchdogTimer = setTimeout(() => {
    if (video.paused && video.readyState < 2 && !video.ended) {
      advanceToNextSource('Transmissão demorou a iniciar');
    }
  }, 6000);

  video.onplaying = () => {
    clearPlayerWatchdog();
    showPlayerToast(`✓ No Ar: ${ch.name}`);
  };

  video.onerror = () => {
    advanceToNextSource('Erro no sinal de vídeo');
  };

  if (/\.(mp4|mkv|webm)(\?|$)/i.test(rawUrl)) {
    video.src = rawUrl;
    video.play().catch(() => {});
    return;
  }

  const isMpegTs = /\.ts(\?|$)/i.test(rawUrl) && !/\.m3u8/i.test(rawUrl);
  if (isMpegTs && window.mpegts && mpegts.getFeatureList().mseLivePlayback) {
    mpegtsPlayer = mpegts.createPlayer({
      type: 'mse',
      isLive: true,
      url: rawUrl
    });
    mpegtsPlayer.attachMediaElement(video);
    mpegtsPlayer.load();
    mpegtsPlayer.play().catch(() => {});
    return;
  }

  if (window.Hls && Hls.isSupported()) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      manifestLoadingTimeOut: 12000
    });

    hlsInstance.loadSource(rawUrl);
    hlsInstance.attachMedia(video);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      clearPlayerWatchdog();
      showPlayerToast(`✓ No Ar: ${ch.name}`);
      video.play().catch(() => {});
    });

    let triedProxy = false;
    hlsInstance.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        if (!triedProxy && useProxy && hasLocalServer) {
          triedProxy = true;
          showPlayerToast(`Ativando Proxy Anti-CORS na Fonte ${sourceIdx + 1}...`);
          hlsInstance.loadSource(`/api/proxy?url=${encodeURIComponent(rawUrl)}`);
        } else {
          advanceToNextSource(`Fonte ${sourceIdx + 1} falhou`);
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = rawUrl;
    video.play().catch(() => {});
  }
}

function showPlayerToast(message) {
  const toast = document.getElementById('playerStatusToast');
  const text = document.getElementById('playerStatusToastText');
  text.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function toggleFavoriteChannel(number) {
  if (favorites.has(number)) favorites.delete(number);
  else favorites.add(number);
  localStorage.setItem('stremio_tvos_favorites', JSON.stringify(Array.from(favorites)));
  renderAll();
}

// ============================================================================
// Parsers de Listas M3U / Saimo catalogo.txt
// ============================================================================
function parseCatalogTextToChannels(content, originLabel = 'IPTV') {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const result = [];
  let meta = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo=["']([^"']+)["']/i);
      const groupMatch = line.match(/group-title=["']([^"']+)["']/i);
      const comma = line.lastIndexOf(',');
      const name = comma !== -1 ? line.slice(comma + 1).trim() : 'Canal Ao Vivo';
      meta = {
        name,
        logo: logoMatch ? logoMatch[1] : '',
        rawGroup: groupMatch ? groupMatch[1] : ''
      };
    } else if (!line.startsWith('#')) {
      if (line.includes('|') && /https?:\/\//i.test(line)) {
        const parts = line.split('|').map((p) => p.trim());
        const urls = parts.filter((p) => /^https?:\/\//i.test(p) && !/\.(png|jpg|jpeg|webp|svg)$/i.test(p));
        const logoPart = parts.find((p) => /^https?:\/\/.*\.(png|jpg|jpeg|webp|svg)/i.test(p)) || '';
        const textParts = parts.filter((p) => p && !/^https?:\/\//i.test(p));
        if (urls.length > 0) {
          const name = textParts[0] || `Canal ${result.length + 1}`;
          const group = normalizeGroupCategory(name, textParts[1] || '');
          result.push({
            name,
            group,
            logo: logoPart || createLogoSvg(name, '#3b0764', '#0f172a'),
            url: urls[0],
            sources: urls.map((u, idx) => ({ label: `Fonte ${idx + 1}`, url: u, origin: originLabel }))
          });
          continue;
        }
      }

      if (/^https?:\/\//i.test(line)) {
        const name = meta?.name || `Canal ${result.length + 1}`;
        const normCategory = normalizeGroupCategory(name, meta?.rawGroup || '');
        result.push({
          name,
          group: normCategory,
          logo: meta?.logo || createLogoSvg(name, '#3b0764', '#0f172a'),
          url: line,
          sources: [{ label: 'Fonte 1', url: line, origin: originLabel }],
          epg: {
            program: `${name} — Ao Vivo`,
            category: `${normCategory} • ${originLabel}`,
            timeSlot: 'Agora • Ao Vivo',
            synopsis: `Transmissão ao vivo de ${name} integrada via ${originLabel}.`,
            progress: 40 + ((result.length * 11) % 50),
            elapsed: 'Ao Vivo',
            remaining: 'Sinal Direto',
            next: 'Programação a Seguir'
          }
        });
      }
      meta = null;
    }
  }
  return result;
}

function normalizeGroupCategory(name = '', rawGroup = '') {
  // Na categoria Esportes, mantém EXCLUSIVAMENTE Combate, todos os Premiere, todos os ESPN e todos os SporTV
  if (isAllowedSportsChannel(name)) {
    return 'Esportes';
  }
  const txt = `${name} ${rawGroup}`.toLowerCase();
  if (/filme|movie|cinema|telecine|hbo|megapix|cinemax|paramount|space|studiouniversal|pluto\s*tv\s*cine/i.test(txt)) {
    return 'Filmes';
  }
  if (/s[eé]rie|series|warner|sony|axn|universal|star\s*channel|anime|dorama|comedy\s*central|mtv/i.test(txt)) {
    return 'Séries';
  }
  if (/news|not[ií]cia|jornal|cnn|bandnews|globonews|record\s*news|jovem\s*pan/i.test(txt)) {
    return 'Notícias';
  }
  return 'TV Aberta';
}

function mergeNewChannels(newItems, toastMsg = null) {
  const byName = new Map();
  channels.forEach((ch) => {
    const key = normalizeChannelMergeKey(ch.name);
    byName.set(key || ch.url, ch);
  });

  newItems.forEach((item) => {
    // Ignora outros canais Globo regionais (Globo SP, Globo RJ, Globo MG, etc.), mantendo apenas Globo Tribuna nos canais abertos
    if (isUnwantedOtherGlobo(item.name)) {
      return;
    }

    // Se algum item veio marcado como Esportes mas não é Combate/Premiere/ESPN/SporTV, reclassifica para TV Aberta
    if (item.group === 'Esportes' && !isAllowedSportsChannel(item.name)) {
      item.group = 'TV Aberta';
    } else if (isAllowedSportsChannel(item.name)) {
      item.group = 'Esportes';
    }

    const key = normalizeChannelMergeKey(item.name);
    if (key.length >= 3 && byName.has(key)) {
      const existing = byName.get(key);
      const incomingSources = item.sources || [{ label: 'Fonte', url: item.url, origin: 'IPTV' }];
      incomingSources.forEach((inc) => {
        if (!existing.sources.some((s) => s.url === inc.url)) {
          const isDirectStream = /\.m3u8?(\?|$)|\/stream\//i.test(inc.url) && !inc.isWebEmbed;
          const newSrc = {
            label: inc.label || `Fonte ${existing.sources.length + 1}`,
            url: inc.url,
            origin: inc.origin || 'IPTV',
            isWebEmbed: Boolean(inc.isWebEmbed)
          };
          if (isDirectStream) {
            existing.sources.unshift(newSrc);
            existing.url = newSrc.url;
            existing.isWebEmbed = false;
          } else {
            existing.sources.push(newSrc);
          }
        }
      });
      if (existing.logo.startsWith('data:image/svg') && item.logo && !item.logo.startsWith('data:image/svg')) {
        existing.logo = item.logo;
      }
    } else {
      const nextNum = String(channels.length + 1).padStart(3, '0');
      const entry = { ...item, number: nextNum };
      channels.push(entry);
      byName.set(key || item.url, entry);
    }
  });

  renderAll();
  if (toastMsg) showPlayerToast(toastMsg);
}

async function loadGithubRepoCatalog(repoInput, label) {
  const repo = repoInput.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
  showPlayerToast(`Escaneando ${repo}...`);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`);
    if (res.ok) {
      const data = await res.json();
      const files = (data.tree || []).filter(
        (f) => f.type === 'blob' && (/\.(m3u8?|txt)$/i.test(f.path) || /^vod\/.*\.json$/i.test(f.path))
      );
      const found = [];
      await Promise.allSettled(
        files.slice(0, 10).map(async (f) => {
          const txt = await fetchTextSafe(`https://raw.githubusercontent.com/${repo}/HEAD/${f.path}`, false);
          if (txt) found.push(...parseCatalogTextToChannels(txt, label));
        })
      );
      if (found.length > 0) {
        mergeNewChannels(found, `${found.length} canais sincronizados de ${repo}`);
        return;
      }
    }
  } catch (_) {}
  showPlayerToast(`Repositório ${repo} verificado`);
}

async function loadM3uPlaylistUrl(url, label) {
  showPlayerToast(`Baixando ${label}...`);
  const txt = await fetchTextSafe(url, false);
  if (txt) {
    const parsed = parseCatalogTextToChannels(txt, label);
    mergeNewChannels(parsed, `${parsed.length} canais adicionados de ${label}`);
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
