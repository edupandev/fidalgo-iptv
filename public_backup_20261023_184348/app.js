// ============================================================================
// Nuvio Media Engine +  tvOS IPTV — Single Page Application (app.js)
// Arquitetura baseada em:
// 1) https://github.com/NuvioMedia/NuvioMobile.git (Nuvio Media Data Models,
//    AMOLED UI System, Stremio/Nuvio Addon Protocol & Multi-Source Resolvers)
// 2) https://comandoplay.xyz/ (Busca e extração de Filmes e Séries Dublados)
// 3) https://github.com/gabrielsaimo/Saimo-TV.git (Canais & EPG Oficial)
// ============================================================================

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

// ============================================================================
// Addons Oficiais Nuvio Media (Exclusivamente FrostView TV, FrostStream e FenixFlix)
// ============================================================================
const DEFAULT_NUVIO_ADDONS = [
  {
    name: 'MagnetFlix (Filmes e Séries PT-BR)',
    id: 'magnetflix-br',
    directoryPage: 'https://magnetflix.flixbr.online/manifest.json',
    manifestUrls: [
      'https://magnetflix.flixbr.online/qualities%3D4k%2C1080p%2C720p%2Csd%7Caudio%3Ddublado%2Clegendado%7Ccatalogs%3Dpopulares_movie%2Cpopulares_series%2Crecentes_servidor_movie%2Crecentes_servidor_series%2Cemalta_movie%2Cemalta_series/manifest.json'
    ]
  },
  {
    name: 'Catálogo IPTV',
    id: 'catalogo-iptv',
    directoryPage: 'https://catalogo-iptv-production.up.railway.app/manifest.json',
    manifestUrls: [
      'https://catalogo-iptv-production.up.railway.app/manifest.json'
    ]
  },
  {
    name: 'Fenix TV',
    id: 'fenixtv',
    directoryPage: 'https://fenixtv.fenixhub.online/manifest.json',
    manifestUrls: [
      'https://fenixtv.fenixhub.online/manifest.json'
    ]
  },
  {
    name: 'Minha TV (Brazuca IPTV)',
    id: 'minhatv',
    directoryPage: 'https://da5f663b4690-minhatv.baby-beamup.club/manifest.json',
    manifestUrls: [
      'https://da5f663b4690-minhatv.baby-beamup.club/manifest.json'
    ]
  },
  {
    name: 'Brazuca MP4 (HTTP Direto)',
    id: 'brazuca-mp4',
    directoryPage: 'https://stremio-addons.net/addons/brazuca-torrents',
    manifestUrls: [
      'https://94c8cb9f702d-brazuca-mp4.baby-beamup.club/manifest.json'
    ]
  },
  {
    name: 'Brazuca Torrents',
    id: 'brazuca-torrents',
    directoryPage: 'https://stremio-addons.net/addons/brazuca-torrents',
    manifestUrls: [
      'https://94c8cb9f702d-brazuca-torrents.baby-beamup.club/manifest.json',
      'https://torrentio.strem.fun/brazuca/manifest.json'
    ]
  },
  {
    name: 'FrostStream',
    id: 'froststream',
    directoryPage: 'https://stremio-addons.net/addons/froststream',
    manifestUrls: [
      'https://froststream.up.railway.app/manifest.json',
      'https://froststream.cloutteam.com/manifest.json'
    ]
  },
  {
    name: 'FenixFlix',
    id: 'fenixflix',
    directoryPage: 'https://stremio-addons.net/addons/fenixflix',
    manifestUrls: [
      'https://fenixflix.fenixhub.online/manifest.json',
      'https://fenixflix.dpdns.org/manifest.json',
      'https://fenixflix.top/manifest.json'
    ]
  },
  {
    name: 'TVPlay IPFS',
    id: 'tvplay-ipfs',
    manifestUrls: [
      'https://tvplay.megaembed-frost.workers.dev/manifest.json'
    ]
  },
  {
    name: 'Tvvio',
    id: 'tvvio',
    manifestUrls: [
      'https://tvvio.megaembed-frost.workers.dev/manifest.json'
    ]
  },
  {
    name: 'FrostView TV',
    id: 'frostview-tv',
    directoryPage: 'https://stremio-addons.net/addons/frostviews',
    manifestUrls: [
      'https://frostview.up.railway.app/manifest.json',
      'https://frostview.cloutteam.com/manifest.json'
    ]
  }
];
const DEFAULT_STREMIO_ADDONS = DEFAULT_NUVIO_ADDONS;

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
// Filtro Oficial de Esportes: Combate, Premiere, ESPN, SporTV, CazéTV e Eventos Ao Vivo
// ============================================================================
function isAllowedSportsChannel(name = '') {
  return /\b(combate|premiere|espn|sportv|spor\s*tv|sport\s*tv|caz[eé]|bandsports|band\s*sports|tnt\s*sports|fox\s*sports|dazn|nfl|nba|ufc|futebol|esporte|sports|eventos?|f1|formula\s*1)\b/i.test(String(name)) || /⚽|🏀|🎾|🏎️|🥊/u.test(String(name));
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

function normalizeChannelSlug(id = '') {
  return String(id || '')
    .toLowerCase()
    .replace(/^(ec:|ecipfs-|tvvio-|tvplay-)/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// ============================================================================
// Grade Oficial de TV Aberta (TVPlay IPFS & Tvvio)
// ============================================================================
function buildCoreOpenTvLineup() {
  const openDefs = [
    { name: 'Globo São Paulo', slug: 'globosp', id: 'ec:globosp', badge: 'GLOBO SP', c1: '#0284c7', c2: '#0f172a' },
    { name: 'Globo Rio', slug: 'globorj', id: 'ec:globorj', badge: 'GLOBO RJ', c1: '#0284c7', c2: '#0f172a' },
    { name: 'Globo Minas', slug: 'globomg', id: 'ec:globomg', badge: 'GLOBO MG', c1: '#0284c7', c2: '#0f172a' },
    { name: 'Globo DF', slug: 'globodf', id: 'ec:globodf', badge: 'GLOBO DF', c1: '#0284c7', c2: '#0f172a' },
    { name: 'Globo Porto Alegre', slug: 'globors', id: 'ec:globors', badge: 'GLOBO RS', c1: '#0284c7', c2: '#0f172a' },
    { name: 'Globo Espírito Santo', slug: 'globoes', id: 'ec:globoes', badge: 'GLOBO ES', c1: '#0284c7', c2: '#0f172a' },
    { name: 'SBT São Paulo', slug: 'sbtsp', id: 'ec:sbtsp', badge: 'SBT SP', c1: '#2563eb', c2: '#1e1b4b' },
    { name: 'SBT Rio', slug: 'sbtrj', id: 'ec:sbtrj', badge: 'SBT RJ', c1: '#2563eb', c2: '#1e1b4b' },
    { name: 'Band SP', slug: 'bandsp', id: 'ec:bandsp', badge: 'BAND SP', c1: '#059669', c2: '#064e3b' },
    { name: 'Record São Paulo', slug: 'recordsp', id: 'ec:recordsp', badge: 'RECORD SP', c1: '#1d4ed8', c2: '#0f172a' },
    { name: 'Record Rio', slug: 'recordrj', id: 'ec:recordrj', badge: 'RECORD RJ', c1: '#1d4ed8', c2: '#0f172a' },
    { name: 'Record Minas', slug: 'recordmg', id: 'ec:recordmg', badge: 'RECORD MG', c1: '#1d4ed8', c2: '#0f172a' },
    { name: 'Record DF', slug: 'recorddf', id: 'ec:recorddf', badge: 'RECORD DF', c1: '#1d4ed8', c2: '#0f172a' },
    { name: 'Record Espírito Santo', slug: 'recordes', id: 'ec:recordes', badge: 'RECORD ES', c1: '#1d4ed8', c2: '#0f172a' },
    { name: 'RedeTV!', slug: 'redetv', id: 'ec:redetv', badge: 'REDETV!', c1: '#7c3aed', c2: '#2e1065' },
    { name: 'TV Cultura', slug: 'tvcultura', id: 'ec:tvcultura', badge: 'CULTURA', c1: '#0d9488', c2: '#134e4a' }
  ];

  return openDefs.map((d, idx) => {
    const liveEmbedUrl = `https://1210.playerembcanais.com/${d.slug}`;
    const vipEmbedUrl = `/api/vipcanais-embed?slug=${d.slug}`;
    const vipStreamUrl = `/api/vipcanais-stream?slug=${d.slug}&redirect=1`;
    const vipDirectWeb = `https://vipcanais.net/minha-conta/assistir/${d.slug}/`;
    const streamJson = `https://tvvio.megaembed-frost.workers.dev/stream/tv/${d.id}.json`;
    const tvplayJson = `https://tvplay.megaembed-frost.workers.dev/stream/tv/ecipfs-${d.slug}.json`;

    const sources = [
      { label: 'VIP Canais HLS (Sem Anúncios)', url: vipStreamUrl, origin: 'VIP Canais Oficial (HLS)', isHls: true },
      { label: 'VIP Canais (Web Player)', url: vipEmbedUrl, origin: 'VIP Canais (Vitalício)', isWebEmbed: true, directFallback: vipDirectWeb },
      { label: 'Player Web HD (Livre)', url: liveEmbedUrl, origin: 'TVPlay / Tvvio Web', isWebEmbed: true }
    ];
    if (d.slug === 'tvcultura') {
      sources.push({ label: 'Cultura Direto HLS', url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8', origin: 'TV Cultura HLS', isHls: true });
    }
    sources.push(
      { label: 'TVPlay IPFS', url: tvplayJson, origin: 'TVPlay IPFS', isStremioStream: true },
      { label: 'Tvvio Direto', url: streamJson, origin: 'Tvvio', isStremioStream: true }
    );

    return {
      name: d.name,
      number: String(idx + 1).padStart(3, '0'),
      group: 'Canais Abertos',
      genres: ['Canais Abertos'],
      subCategory: 'Canais Abertos',
      isOpenTvAddon: true,
      isTvvio: true,
      slug: d.slug,
      stremioId: d.id,
      stremioType: 'tv',
      isStremioTvMeta: false,
      logo: createLogoSvg(d.badge, d.c1, d.c2),
      url: vipStreamUrl,
      isWebEmbed: false,
      addonBase: 'https://tvplay.megaembed-frost.workers.dev',
      sources: sources,
      epg: {
        program: `${d.name} — Sinal Digital Tvvio`,
        category: 'Canais Abertos • Tvvio HD',
        timeSlot: 'Agora • Ao Vivo',
        synopsis: `Transmissão ao vivo de ${d.name} via Tvvio.`,
        progress: 60,
        elapsed: 'Ao Vivo',
        remaining: 'Sinal HD',
        next: 'Programação Contínua'
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
    const liveEmbedUrl = `https://1210.playerembcanais.com/${d.slug}`;
    const vipEmbedUrl = `/api/vipcanais-embed?slug=${d.slug}`;
    const vipStreamUrl = `/api/vipcanais-stream?slug=${d.slug}&redirect=1`;
    const vipDirectWeb = `https://vipcanais.net/minha-conta/assistir/${d.slug}/`;
    const sources = [
      { label: 'VIP Canais HLS (Sem Anúncios)', url: vipStreamUrl, origin: 'VIP Canais Oficial (HLS)', isHls: true },
      { label: 'VIP Canais (Web Player)', url: vipEmbedUrl, origin: 'VIP Canais (Vitalício)', isWebEmbed: true, directFallback: vipDirectWeb },
      { label: 'Player Web HD (Livre)', url: liveEmbedUrl, origin: 'TVPlay / Tvvio Esportes', isWebEmbed: true },
      { label: 'TVPlay IPFS', url: `https://tvplay.megaembed-frost.workers.dev/stream/tv/ecipfs-${d.slug}.json`, origin: 'TVPlay IPFS', isStremioStream: true },
      { label: 'Tvvio Direto', url: `https://tvvio.megaembed-frost.workers.dev/stream/tv/ec:${d.slug}.json`, origin: 'Tvvio', isStremioStream: true }
    ];
    return {
      name: d.name,
      group: 'Esportes',
      logo: createLogoSvg(d.badge, d.c1, d.c2),
      url: vipStreamUrl,
      isWebEmbed: false,
      sources,
      epg: {
        program: `${d.name} — Ao Vivo`,
        category: 'Esportes • Nuvio + TVPlay',
        timeSlot: 'Agora • Ao Vivo',
        synopsis: d.desc,
        progress: 65,
        elapsed: 'Ao Vivo',
        remaining: 'Sinal HD',
        next: 'Grade Esportiva'
      }
    };
  });
}

async function loadVipCanaisCatalog() {
  try {
    const res = await fetch('vipcanais_channels.json');
    if (!res.ok) return;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return;
    const mapped = items.map((c, idx) => {
      const slug = c.slug;
      const vipEmbedUrl = `/api/vipcanais-embed?slug=${slug}`;
      const vipStreamUrl = `/api/vipcanais-stream?slug=${slug}&redirect=1`;
      const vipDirectWeb = c.href || `https://vipcanais.net/minha-conta/assistir/${slug}/`;
      const liveEmbedUrl = `https://1210.playerembcanais.com/${slug}`;

      const sources = [
        { label: 'VIP Canais HLS (Sem Anúncios)', url: vipStreamUrl, origin: 'VIP Canais Oficial (HLS)', isHls: true },
        { label: 'VIP Canais (Web Player)', url: vipEmbedUrl, origin: 'VIP Canais (Vitalício)', isWebEmbed: true, directFallback: vipDirectWeb },
        { label: 'Player Web HD (Livre)', url: liveEmbedUrl, origin: 'TVPlay / Tvvio Web', isWebEmbed: true },
        { label: 'TVPlay IPFS', url: `https://tvplay.megaembed-frost.workers.dev/stream/tv/ecipfs-${slug}.json`, origin: 'TVPlay IPFS', isStremioStream: true }
      ];

      const cat = normalizeGroupCategory(c.name, c.category || '');
      return {
        name: c.name,
        number: String(idx + 1).padStart(3, '0'),
        group: cat,
        genres: [cat],
        subCategory: cat,
        isOpenTvAddon: cat === 'Canais Abertos',
        isTvvio: true,
        isVipCanais: true,
        slug: slug,
        stremioId: `ec:${slug}`,
        stremioType: 'tv',
        isStremioTvMeta: false,
        logo: c.logo || createLogoSvg(c.name.slice(0, 4), '#0284c7', '#0f172a'),
        url: vipStreamUrl,
        isWebEmbed: false,
        sources: sources,
        epg: {
          program: `${c.name} — Ao Vivo`,
          category: `${cat} • VIP Canais HD`,
          timeSlot: 'Agora • Ao Vivo',
          synopsis: `Transmissão oficial VIP Canais de ${c.name}.`,
          progress: 50,
          elapsed: 'Ao Vivo',
          remaining: 'Sinal HD',
          next: 'Programação Contínua'
        }
      };
    });
    mergeNewChannels(mapped);
    renderAll();
  } catch (e) {
    console.warn('VIP Canais catalog load:', e);
  }
}

// ============================================================================
// Nuvio Mobile Models & Data Architecture (https://github.com/NuvioMedia/NuvioMobile.git)
// ============================================================================
class NuvioMediaItem {
  constructor(data = {}) {
    this.id = data.id || data.imdbId || data.imdb_id || `nuvio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    this.title = data.title || data.name || 'Sem Título';
    this.type = data.type || (data.seriesNav ? 'series' : 'movie');
    this.poster = data.poster || data.logo || '';
    this.banner = data.banner || data.backdrop || data.fanart || data.poster || '';
    this.backdrop = data.backdrop || data.fanart || data.banner || '';
    this.releaseInfo = data.releaseInfo || data.year || '';
    this.year = data.year || '';
    this.imdbRating = data.imdbRating || data.rating || '8.5';
    this.genres = Array.isArray(data.genres) ? data.genres : [];
    this.description = data.description || data.plot || data.overview || '';
    this.cast = Array.isArray(data.cast) ? data.cast : [];
    this.seasons = Array.isArray(data.seasons) ? data.seasons : [];
    this.episodes = Array.isArray(data.episodes) ? data.episodes : [];
    this.sources = Array.isArray(data.sources) ? data.sources : [];
    this.addonOrigin = data.addonOrigin || data.badge || 'Nuvio Media';
    this.badge = data.badge || (this.imdbRating ? `★ ${this.imdbRating} IMDb` : 'NUVIO');
    this.channelRef = data.channelRef || null;
    this.isLogoPoster = Boolean(data.isLogoPoster);
  }
}

class NuvioStreamItem {
  constructor(data = {}) {
    this.name = data.name || data.label || 'Nuvio Stream';
    this.title = data.title || data.description || '';
    this.url = data.url || '';
    this.externalUrl = data.externalUrl || '';
    this.origin = data.origin || 'Nuvio';
    this.quality = data.quality || (data.name?.includes('1080') ? '1080p FHD' : data.name?.includes('4K') ? '4K UHD' : 'HD');
    this.isWebEmbed = Boolean(data.isWebEmbed);
  }
}

// ============================================================================
// Motor de Deduplicação Unificado (Mostra apenas 1 card por item)
// ============================================================================
function deduplicateMediaItems(items = []) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];

  for (const item of items) {
    if (!item) continue;
    const textCheck = `${item.title || ''} ${item.subtitle || ''} ${item.name || ''} ${item.poster || ''}`.toLowerCase();
    if (textCheck.includes('fora do ar') || textCheck.includes('indisponivel') || textCheck.includes('fora_do_ar')) continue;
    let key = '';
    if (item.channelRef) {
      const c = item.channelRef;
      const s = normalizeChannelSlug(c.slug || c.stremioId || c.number);
      const k = normalizeChannelMergeKey(c.name);
      key = `ch:${s || k}`;
    } else if (item.imdbId || String(item.id || '').startsWith('tt')) {
      key = `imdb:${String(item.imdbId || item.id).toLowerCase()}`;
    } else {
      const cleanTitle = String(item.title || item.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      const yr = String(item.year || item.releaseInfo || '').slice(0, 4);
      key = `${item.type || 'vod'}:${cleanTitle}:${yr}`;
    }

    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

let channels = [];
let filteredChannels = [];
window.channels = channels;
window.filteredChannels = filteredChannels;

let nuvioCatalog = {
  searchResults: [],
  magnetFlixMovies: [],
  magnetFlixSeries: [],
  frostStreamMovies: [],
  frostStreamSeries: [],
  fenixMovies: [],
  fenixSeries: [],
  bestCineMovies: [], // backward compatible alias
  bestCineSeries: [], // backward compatible alias
  trendingMovies: [],
  topMovies: [],
  trendingSeries: [],
  topSeries: [],
  comandoPlayItems: [],
  animeItems: [],
  sportsChannels: [],
  library: []
};
let stremioCatalog = nuvioCatalog;

let discoveredAddonCatalogs = [];

let activeAddonEndpoints = [
  { name: 'MagnetFlix', baseUrl: 'https://magnetflix.flixbr.online/qualities%3D4k%2C1080p%2C720p%2Csd%7Caudio%3Ddublado%2Clegendado%7Ccatalogs%3Dpopulares_movie%2Cpopulares_series%2Crecentes_servidor_movie%2Crecentes_servidor_series%2Cemalta_movie%2Cemalta_series' },
  { name: 'Catálogo IPTV', baseUrl: 'https://catalogo-iptv-production.up.railway.app' },
  { name: 'FenixFlix', baseUrl: 'https://fenixflix.fenixhub.online' },
  { name: 'Fenix TV', baseUrl: 'https://fenixtv.fenixhub.online' },
  { name: 'TVPlay IPFS', baseUrl: 'https://tvplay.megaembed-frost.workers.dev' },
  { name: 'Tvvio', baseUrl: 'https://tvvio.megaembed-frost.workers.dev' },
  { name: 'Torrentio Brazuca', baseUrl: 'https://torrentio.strem.fun/brazuca' }
];

let installedAddons = JSON.parse(
  localStorage.getItem('nuvio_addons') || localStorage.getItem('stremio_tvos_addons') || '[]'
);

let activeNavTab = 'board'; // 'board' (Hub Inicial Apple TV) | 'live' (Canal Aberto) | 'sports' (Esportes) | 'movies' | 'series'
let activeCategoryChip = 'Canais Abertos';
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

function formatSecondsToTime(totalSecs = 0) {
  const s = Math.floor(Math.max(0, totalSecs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ============================================================================
// Nuvio Account Manager (https://github.com/techuhak/Nuvio-Account-Manager.git)
// Multi-Account, Profiles, Watch History (Onde Parei), Favoritos e Sincronização
// ============================================================================
const NuvioAccountManager = {
  storageKeys: {
    accounts: 'nuvio_accounts',
    activeId: 'nuvio_active_account_id',
    historyPrefix: 'nuvio_history_',
    favoritesPrefix: 'nuvio_favorites_'
  },

  init() {
    this.ensureDefaultAccount();
    this.syncLegacyFavorites();
    this.updateHeaderProfileBadge();
  },

  getAccounts() {
    try {
      const raw = localStorage.getItem(this.storageKeys.accounts);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) && list.length > 0 ? list : [];
    } catch (_) {
      return [];
    }
  },

  getActiveAccount() {
    const list = this.getAccounts();
    const activeId = localStorage.getItem(this.storageKeys.activeId);
    const found = list.find((a) => a.id === activeId);
    return found || list[0] || this.createDefaultAccount();
  },

  createDefaultAccount() {
    const def = {
      id: 'nuvio-profile-vipcanais',
      name: 'Duckx VIP',
      email: '11duckx@gmail.com',
      avatar: 'D',
      color: '#10B981',
      isGuest: false,
      isVip: true,
      plan: 'Vitalício',
      token: 'MzQzMzR8MTc5NTI2ODM2OXwyM2VkMzY5ODQ0N2JiNzZiYmI3ZDUyM2U2MjUzYjNhNDM2ZDI1NTZlZDlhNWE3NTRhMjQ1ZTcxZTdmYzAwYzNj.7f0ff38c5c7a34f4ad53a2e5addfc3c8db6fc40affd0c06fda60acfd0d04c85f',
      createdAt: Date.now()
    };
    localStorage.setItem(this.storageKeys.accounts, JSON.stringify([def]));
    localStorage.setItem(this.storageKeys.activeId, def.id);
    return def;
  },

  ensureDefaultAccount() {
    let accounts = this.getAccounts();
    const hasDuckx = accounts.some((a) => (a.email || '').toLowerCase() === '11duckx@gmail.com');
    if (accounts.length === 0 || !hasDuckx) {
      const def = this.createDefaultAccount();
      accounts = [def];
    } else {
      const duckx = accounts.find((a) => (a.email || '').toLowerCase() === '11duckx@gmail.com');
      if (duckx) {
        duckx.name = duckx.name || 'Duckx VIP';
        duckx.avatar = 'D';
        duckx.color = '#10B981';
        duckx.isGuest = false;
        duckx.isVip = true;
        duckx.plan = 'Vitalício';
        duckx.token = duckx.token || 'MzQzMzR8MTc5NTI2ODM2OXwyM2VkMzY5ODQ0N2JiNzZiYmI3ZDUyM2U2MjUzYjNhNDM2ZDI1NTZlZDlhNWE3NTRhMjQ1ZTcxZTdmYzAwYzNj.7f0ff38c5c7a34f4ad53a2e5addfc3c8db6fc40affd0c06fda60acfd0d04c85f';
        localStorage.setItem(this.storageKeys.activeId, duckx.id);
        localStorage.setItem(this.storageKeys.accounts, JSON.stringify(accounts));
      }
    }
  },

  async loginNuvioAccount(email, password) {
    if (!email || !password) throw new Error('E-mail e senha são obrigatórios.');
    let token = null;
    let userName = email.split('@')[0] || 'Nuvio User';

    // Tenta autenticar na API Oficial Nuvio (api.nuvio.tv)
    try {
      const res = await fetch('https://api.nuvio.tv/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.nuvio-anon-key'
        },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const json = await res.json();
        token = json.access_token || json.token || 'nuvio-token-valid';
        if (json.user?.user_metadata?.name) userName = json.user.user_metadata.name;
      }
    } catch (_) {
      // Fallback gracioso caso offline/sem conexão externa
    }

    const accounts = this.getAccounts();
    const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
    const accountData = {
      id: existingIdx >= 0 ? accounts[existingIdx].id : `nuvio-acc-${Date.now()}`,
      name: userName,
      email,
      avatar: userName.slice(0, 1).toUpperCase(),
      color: '#8B5CF6',
      isGuest: false,
      token: token || `local-token-${Date.now()}`,
      createdAt: Date.now()
    };

    if (existingIdx >= 0) accounts[existingIdx] = accountData;
    else accounts.push(accountData);

    localStorage.setItem(this.storageKeys.accounts, JSON.stringify(accounts));
    localStorage.setItem(this.storageKeys.activeId, accountData.id);
    this.updateHeaderProfileBadge();
    return accountData;
  },

  createProfile(name, email = '') {
    const cleanName = String(name || 'Novo Perfil').trim();
    const accounts = this.getAccounts();
    const colors = ['#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
    const newAcc = {
      id: `nuvio-profile-${Date.now()}`,
      name: cleanName,
      email: email || `${cleanName.toLowerCase().replace(/\s+/g, '')}@nuvio.local`,
      avatar: cleanName.slice(0, 1).toUpperCase(),
      color: colors[accounts.length % colors.length],
      isGuest: true,
      token: null,
      createdAt: Date.now()
    };
    accounts.push(newAcc);
    localStorage.setItem(this.storageKeys.accounts, JSON.stringify(accounts));
    this.switchAccount(newAcc.id);
    return newAcc;
  },

  switchAccount(accountId) {
    localStorage.setItem(this.storageKeys.activeId, accountId);
    this.updateHeaderProfileBadge();
    renderAll();
  },

  deleteAccount(accountId) {
    let accounts = this.getAccounts();
    if (accounts.length <= 1) throw new Error('Não é possível excluir o único perfil existente.');
    accounts = accounts.filter((a) => a.id !== accountId);
    localStorage.setItem(this.storageKeys.accounts, JSON.stringify(accounts));
    const activeId = localStorage.getItem(this.storageKeys.activeId);
    if (activeId === accountId) {
      this.switchAccount(accounts[0].id);
    } else {
      renderAll();
    }
  },

  cloneAccount(sourceId, targetName) {
    const accounts = this.getAccounts();
    const src = accounts.find((a) => a.id === sourceId) || this.getActiveAccount();
    const newAcc = this.createProfile(targetName || `${src.name} (Cópia)`);
    const srcHist = this.getHistory(sourceId);
    const srcFavs = this.getFavoritesAll(sourceId);
    localStorage.setItem(this.storageKeys.historyPrefix + newAcc.id, JSON.stringify(srcHist));
    localStorage.setItem(this.storageKeys.favoritesPrefix + newAcc.id, JSON.stringify(srcFavs));
    this.switchAccount(newAcc.id);
  },

  updateHeaderProfileBadge() {
    const acc = this.getActiveAccount();
    const avatarEl = document.getElementById('nuvioHeaderAvatar');
    const nameEl = document.getElementById('nuvioHeaderName');
    const isVip = acc.isVip || (acc.email || '').toLowerCase() === '11duckx@gmail.com';
    if (avatarEl) {
      avatarEl.textContent = acc.avatar || 'D';
      avatarEl.style.backgroundColor = isVip ? '#10B981' : (acc.color || '#ffffff');
      avatarEl.style.color = '#ffffff';
      if (isVip) {
        avatarEl.classList.add('ring-2', 'ring-emerald-400/80');
      }
    }
    if (nameEl) {
      nameEl.innerHTML = isVip
        ? `<span>${escapeHtml(acc.name || 'Duckx')}</span> <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-sm ml-1">VIP</span>`
        : escapeHtml(acc.name || 'fidalGO ID');
    }
  },

  // --------------------------------------------------------------------------
  // HISTÓRICO & "ONDE PAREI" (Watch Progress)
  // --------------------------------------------------------------------------
  getHistory(accId = null) {
    const id = accId || this.getActiveAccount().id;
    try {
      const raw = localStorage.getItem(this.storageKeys.historyPrefix + id);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  },

  saveProgress(item, currentTime, duration) {
    if (!item || !currentTime || currentTime < 5) return;
    const dur = Number(duration) || 3600;
    const cur = Number(currentTime);
    const pct = Math.min(100, Math.max(1, Math.round((cur / dur) * 100)));

    const acc = this.getActiveAccount();
    let hist = this.getHistory(acc.id);

    const isSeries = Boolean(item.seriesNav || item.type === 'series' || item.season);
    const season = item.seriesNav ? item.seriesNav.season : (item.season || null);
    const episode = item.seriesNav ? item.seriesNav.episode : (item.episode || null);
    const movieObj = item.movieItem || currentMovieItem;
    const itemId = isSeries ? (item.imdbId || item.id || item.number || item.name) : (movieObj?.imdbId || movieObj?.id || item.imdbId || item.id || item.number || item.name);

    hist = hist.filter((h) => {
      if (isSeries) {
        return !(h.id === itemId && Number(h.season) === Number(season) && Number(h.episode) === Number(episode));
      }
      return h.id !== itemId;
    });

    const entry = {
      id: itemId,
      title: item.seriesNav?.item?.title || movieObj?.title || item.title || item.name,
      type: isSeries ? 'series' : 'movie',
      season,
      episode,
      episodeTitle: item.seriesNav?.episodeTitle || (episode ? `Episódio ${episode}` : ''),
      currentTime: cur,
      duration: dur,
      percentage: pct,
      poster: movieObj?.poster || item.poster || item.logo || '',
      banner: movieObj?.banner || movieObj?.backdrop || item.banner || item.backdrop || item.poster || '',
      addon: item.addonOrigin || item.group || 'FrostStream',
      lastWatched: Date.now(),
      channelRef: item
    };

    hist.unshift(entry);
    if (hist.length > 60) hist = hist.slice(0, 60);

    localStorage.setItem(this.storageKeys.historyPrefix + acc.id, JSON.stringify(hist));
  },

  getProgress(itemId, season = null, episode = null) {
    const hist = this.getHistory();
    return hist.find((h) => {
      if (season !== null && episode !== null) {
        return h.id === itemId && Number(h.season) === Number(season) && Number(h.episode) === Number(episode);
      }
      return h.id === itemId;
    });
  },

  markAsCompleted(itemId, season = null, episode = null) {
    const acc = this.getActiveAccount();
    let hist = this.getHistory(acc.id);
    const entry = hist.find((h) => {
      if (season !== null && episode !== null) {
        return h.id === itemId && Number(h.season) === Number(season) && Number(h.episode) === Number(episode);
      }
      return h.id === itemId;
    });
    if (entry) {
      entry.isCompleted = true;
      entry.percentage = 100;
      localStorage.setItem(this.storageKeys.historyPrefix + acc.id, JSON.stringify(hist));
      try { renderContinuarAssistindoRail(); } catch (_) {}
    }
  },

  getContinueWatchingList() {
    const hist = this.getHistory();
    return hist.filter((h) => !h.isCompleted && (h.currentTime > 10 || h.percentage >= 2) && h.percentage < 90);
  },

  removeFromHistory(itemId, season = null, episode = null) {
    const acc = this.getActiveAccount();
    let hist = this.getHistory(acc.id);
    hist = hist.filter((h) => {
      if (season !== null && episode !== null) {
        return !(h.id === itemId && Number(h.season) === Number(season) && Number(h.episode) === Number(episode));
      }
      return h.id !== itemId;
    });
    localStorage.setItem(this.storageKeys.historyPrefix + acc.id, JSON.stringify(hist));
    renderAll();
  },

  clearAllHistory() {
    const acc = this.getActiveAccount();
    localStorage.removeItem(this.storageKeys.historyPrefix + acc.id);
    renderAll();
  },

  // --------------------------------------------------------------------------
  // MEUS FAVORITOS (Filmes, Séries e Canais)
  // --------------------------------------------------------------------------
  getFavoritesAll(accId = null) {
    const id = accId || this.getActiveAccount().id;
    try {
      const raw = localStorage.getItem(this.storageKeys.favoritesPrefix + id);
      const data = raw ? JSON.parse(raw) : { movies: [], series: [], channels: [] };
      return {
        movies: Array.isArray(data.movies) ? data.movies : [],
        series: Array.isArray(data.series) ? data.series : [],
        channels: Array.isArray(data.channels) ? data.channels : []
      };
    } catch (_) {
      return { movies: [], series: [], channels: [] };
    }
  },

  isFavorite(item) {
    if (!item) return false;
    const favs = this.getFavoritesAll();
    const itemId = String(item.imdbId || item.id || item.number || item.name);
    return (
      favs.movies.some((m) => String(m.id || m.imdbId) === itemId) ||
      favs.series.some((s) => String(s.id || s.imdbId) === itemId) ||
      favs.channels.some((c) => String(c.number || c.name) === itemId)
    );
  },

  toggleFavorite(item) {
    if (!item) return false;
    const acc = this.getActiveAccount();
    const favs = this.getFavoritesAll(acc.id);
    const itemId = String(item.imdbId || item.id || item.number || item.name);

    const isChannel = item.group === 'TV Aberta' || item.group === 'Esportes' || Boolean(item.number && item.sources);
    const isSeries = Boolean(item.type === 'series' || item.seriesNav);
    const targetKey = isChannel ? 'channels' : isSeries ? 'series' : 'movies';

    const idx = favs[targetKey].findIndex((x) => String(x.id || x.imdbId || x.number || x.name) === itemId);
    let added = false;

    if (idx >= 0) {
      favs[targetKey].splice(idx, 1);
      if (isChannel && item.number) favorites.delete(item.number);
      showPlayerToast(`✕ Removido dos Favoritos: ${item.title || item.name}`);
    } else {
      const favObj = {
        id: itemId,
        title: item.title || item.name,
        type: isChannel ? 'channel' : isSeries ? 'series' : 'movie',
        poster: item.poster || item.logo || '',
        banner: item.banner || item.backdrop || '',
        badge: item.badge || (isChannel ? 'CANAL' : isSeries ? 'SÉRIE' : 'FILME'),
        subtitle: item.subtitle || item.group || '',
        number: item.number || null,
        url: item.url || '',
        channelRef: isChannel ? item : null
      };
      favs[targetKey].unshift(favObj);
      if (isChannel && item.number) favorites.add(item.number);
      added = true;
      showPlayerToast(`♥ Adicionado aos Favoritos: ${item.title || item.name}`);
    }

    localStorage.setItem(this.storageKeys.favoritesPrefix + acc.id, JSON.stringify(favs));
    localStorage.setItem('stremio_tvos_favorites', JSON.stringify(Array.from(favorites)));
    renderAll();
    return added;
  },

  syncLegacyFavorites() {
    try {
      const raw = localStorage.getItem('stremio_tvos_favorites');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach((num) => favorites.add(num));
        }
      }
    } catch (_) {}
  },

  // --------------------------------------------------------------------------
  // BACKUP & MIGRAÇÃO (techuhak/Nuvio-Account-Manager JSON format)
  // --------------------------------------------------------------------------
  exportBackup() {
    const acc = this.getActiveAccount();
    const backupData = {
      app: 'Nuvio Media Engine (fidalGO)',
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      source: 'https://github.com/techuhak/Nuvio-Account-Manager.git',
      activeAccount: acc,
      allAccounts: this.getAccounts(),
      watchHistory: this.getHistory(acc.id),
      favorites: this.getFavoritesAll(acc.id),
      addons: DEFAULT_NUVIO_ADDONS
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nuvio-account-backup-${acc.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPlayerToast('✓ Backup Nuvio exportado com sucesso!');
  },

  async importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data) throw new Error('Arquivo JSON inválido.');
      const acc = this.getActiveAccount();

      if (Array.isArray(data.allAccounts) && data.allAccounts.length > 0) {
        localStorage.setItem(this.storageKeys.accounts, JSON.stringify(data.allAccounts));
      }
      if (Array.isArray(data.watchHistory)) {
        localStorage.setItem(this.storageKeys.historyPrefix + acc.id, JSON.stringify(data.watchHistory));
      }
      if (data.favorites && typeof data.favorites === 'object') {
        localStorage.setItem(this.storageKeys.favoritesPrefix + acc.id, JSON.stringify(data.favorites));
        (data.favorites.channels || []).forEach((c) => {
          if (c.number) favorites.add(c.number);
        });
        localStorage.setItem('stremio_tvos_favorites', JSON.stringify(Array.from(favorites)));
      }

      this.updateHeaderProfileBadge();
      renderAll();
      showPlayerToast('✓ Backup Nuvio restaurado com sucesso!');
      return true;
    } catch (err) {
      showPlayerToast(`Erro ao restaurar backup: ${err.message}`);
      return false;
    }
  }
};

let numericBuffer = '';
let numericTimer = null;

// ============================================================================
// Inicialização
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.warn('Lucide init warning:', e);
  }

  try {
    if (typeof NuvioAccountManager !== 'undefined' && NuvioAccountManager.init) {
      NuvioAccountManager.init();
    }
  } catch (e) {
    console.warn('NuvioAccountManager init warning:', e);
  }

  try {
    startLiveClock();
  } catch (e) {
    console.warn('LiveClock warning:', e);
  }

  try {
    bindEvents();
  } catch (e) {
    console.error('bindEvents error:', e);
  }

  // Inicializa imediatamente:
  // 1) TV Aberta (FrostView TV & Fênix)
  // 2) Esportes (Combate, todos Premiere, todos ESPN e todos SporTV)
  try {
    mergeNewChannels([...buildCoreOpenTvLineup(), ...buildCoreSportsLineup()]);
    loadVipCanaisCatalog();
  } catch (e) {
    console.error('mergeNewChannels initial error:', e);
  }

  try {
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    if (['board', 'live', 'sports', 'movies', 'series', 'anime', 'profile'].includes(hash)) {
      activeNavTab = hash;
      syncNavButtons(hash);
      if (hash === 'profile') {
        setTimeout(() => {
          updateLayoutSectionsVisibility();
          renderNuvioAccountModalContent();
        }, 10);
      }
    }
    window.addEventListener('hashchange', () => {
      const newHash = (window.location.hash || '').replace('#', '').toLowerCase();
      if (['board', 'live', 'sports', 'movies', 'series', 'anime', 'profile'].includes(newHash) && activeNavTab !== newHash) {
        activeNavTab = newHash;
        syncNavButtons(newHash);
        updateLayoutSectionsVisibility();
        if (newHash === 'profile') {
          renderNuvioAccountModalContent();
        } else {
          renderAll();
        }
      }
    });
  } catch (_) {}

  try {
    renderAll();
  } catch (e) {
    console.error('Initial renderAll error:', e);
  }

  // Inicialização Rápida e Leve (Saimo TV + Ramys IPTV Brasil 2026):
  // 1) Canais Ao Vivo Oficiais (Saimo TV + Ramys IPTV Brasil 2026)
  // 2) VOD Filmes e Séries em HD/4K (Saimo TV + Ramys Filmes-Series)
  try {
    await loadSaimoChannelsAndVod();
  } catch (e) {
    console.error('Saimo & Ramys load error:', e);
  }
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

async function loadNuvioCoreAddons() {
  // 1. Descobre dinamicamente os hosts dos addons oficiais Nuvio (FrostView TV, FrostStream e FenixFlix)
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

            // Se o catálogo de TV do FrostView ou Fênix tiver subcategorias/gêneros (ex: TV Aberta, Canais Abertos), busca também!
            const isFrostOrFenix = /frostview|fenix/i.test(endpoint.name);
            if (isFrostOrFenix && (cat.type === 'tv' || cat.type === 'channel' || cat.type === 'other')) {
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
                  badge: /frost/i.test(endpoint.name) ? 'FROST ANIME' : 'FÊNIX ANIME',
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

              if (/redecanais|reflux|king/i.test(endpoint.name)) {
                continue;
              }

              const isTvOrSportsCatalog =
                cat.type === 'tv' ||
                cat.type === 'channel' ||
                cat.type === 'other' ||
                cat.type === 'sports' ||
                endpoint.name.includes('Tvvio') ||
                endpoint.name.includes('FrostView') ||
                endpoint.name.includes('Fenix');

              if (isTvOrSportsCatalog) {
                const isTvvioEndpoint = /tvvio/i.test(endpoint.name) || /tvvio/i.test(endpoint.baseUrl);
                const originTag = isTvvioEndpoint
                  ? 'Tvvio'
                  : /fenix/i.test(endpoint.name)
                  ? 'Fênix TV'
                  : /frostview/i.test(endpoint.name)
                  ? 'FrostView TV'
                  : endpoint.name;

                const isFenixOrMinhaOrBest = /fenix|minhatv|bestcine/i.test(endpoint.name) || /fenix|minhatv|bestcine/i.test(endpoint.baseUrl);
                const tvChans = metas
                  .filter((m) => {
                    const cName = m.name || '';
                    if (isTvvioEndpoint || isFenixOrMinhaOrBest) return true;
                    return isAllowedSportsChannel(cName);
                  })
                  .map((m) => {
                    const cName = m.name || `Canal ${originTag}`;
                    const rawGenreStr = m.genres?.join(' ') || cat.name || originTag;
                    let groupCat = 'Canais Abertos';
                    if (isTvvioEndpoint) {
                      groupCat = (Array.isArray(m.genres) && m.genres[0]) ? m.genres[0] : 'Canais Abertos';
                    } else if (isAllowedSportsChannel(cName)) {
                      groupCat = 'Esportes';
                    } else {
                      groupCat = normalizeGroupCategory(cName, rawGenreStr);
                    }
                  const streamEndpoint = `${endpoint.baseUrl}/stream/${encodeURIComponent(m.type || cat.type)}/${encodeURIComponent(m.id)}.json`;

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
                    isOpenTvAddon: isFrostOrFenix && groupCat !== 'Esportes',
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
                if (/bestcine/i.test(endpoint.name)) return;
                const mapped = metas.map((m) => ({
                  ...mapCinemetaItem(m, 'movie'),
                  badge: badgeLabel,
                  subtitle: `${endpoint.name} • ${m.releaseInfo || 'Dublado / Legendado'}`,
                  addonBase: endpoint.baseUrl
                }));
                stremioCatalog.bestCineMovies.push(...mapped);
                if (/frost/i.test(endpoint.name)) {
                  nuvioCatalog.frostStreamMovies.push(...mapped);
                } else if (/fenix/i.test(endpoint.name)) {
                  nuvioCatalog.fenixMovies.push(...mapped);
                }
              } else if (cat.type === 'series') {
                if (/bestcine/i.test(endpoint.name)) return;
                const mapped = metas.map((m) => ({
                  ...mapCinemetaItem(m, 'series'),
                  badge: badgeLabel,
                  subtitle: `${endpoint.name} • ${m.releaseInfo || 'Dublado / Legendado'}`,
                  addonBase: endpoint.baseUrl
                }));
                stremioCatalog.bestCineSeries.push(...mapped);
                if (/frost/i.test(endpoint.name)) {
                  nuvioCatalog.frostStreamSeries.push(...mapped);
                } else if (/fenix/i.test(endpoint.name)) {
                  nuvioCatalog.fenixSeries.push(...mapped);
                }
              }
            }
          })
        );
      } catch (_) {}
    })
  );

  renderAll();
}

const loadBestCineAndBrazucaAddons = loadNuvioCoreAddons; // backward compatibility

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
    ...(nuvioCatalog.magnetFlixMovies || []),
    ...(nuvioCatalog.magnetFlixSeries || []),
    ...(nuvioCatalog.fenixMovies || []),
    ...(nuvioCatalog.fenixSeries || []),
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
    // 2a. Catálogo Oficial Saimo TV + Ramys IPTV Brasil 2026 (Ultra-rápido ~15ms)
    (async () => {
      try {
        const txt = await fetchWithTimeout(`/api/saimo-vod?q=${qEnc}`, 2000);
        if (!txt) return;
        const d = JSON.parse(txt);
        let added = 0;
        if (Array.isArray(d.items)) {
          d.items.forEach((it) => {
            collected.push({
              id: it.id,
              title: it.title,
              type: it.type || 'movie',
              poster: it.poster,
              badge: it.badge || (it.type === 'series' ? 'SÉRIE HD' : 'FILME HD'),
              subtitle: it.subtitle || 'Saimo TV • Ramys IPTV Brasil 2026',
              priority: 0,
              isSaimoVod: true
            });
            added++;
          });
        }
        if (added > 0) flushSearchProgress(false);
      } catch (_) {}
    })(),

    // 2b. Cinemeta Filmes (Ultra-rápido ~150ms via CDN global)
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
              badge: 'FROSTSTREAM • FÊNIX',
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
              badge: 'FROSTSTREAM • FÊNIX',
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
            subtitle: `${entry.y || 'HD'} • ${entry.s || 'FrostStream • Fênix • Nuvio'}`,
            badge: isSeries ? 'SÉRIE • NUVIO PT-BR' : 'FILME • NUVIO PT-BR',
            category: isSeries ? 'Séries' : 'Filmes',
            type,
            poster: posterUrl,
            background: posterUrl,
            description: `Elenco / Info: ${entry.s || 'Disponível nos addons oficiais Nuvio: FrostStream, FenixFlix e FrostView TV.'}`,
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

async function playMovieDirect(item) {
  if (searchQuery) {
    searchQuery = '';
    isSearchingCatalog = false;
    const sInput = document.getElementById('searchInput');
    if (sInput) sInput.value = '';
  }
  currentMovieItem = item;
  document.getElementById('stageSeriesSection')?.classList.add('hidden');
  document.getElementById('stremioMetaModal')?.classList.add('hidden');
  activeNavTab = 'movies';
  syncNavButtons('movies');

  // Limpa carrosséis recomendados embaixo para foco 100% no filme
  const carouselsEl = document.getElementById('carouselsContainer');
  if (carouselsEl) carouselsEl.innerHTML = '';
  document.getElementById('stremioGenreBar')?.classList.add('hidden');
  document.getElementById('appleTvHeroHub')?.classList.add('hidden');

  const stage = document.getElementById('liveStageSection');
  if (stage) stage.classList.remove('hidden');
  isPlayerVisibleOnHub = true;
  updateLayoutSectionsVisibility();

  // Exibe o painel de filme com reprodutores "na cara" imediatamente
  renderStageMovieSection({ number: 'FILME', name: item.title, movieItem: item, sources: [] });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });

  showPlayerToast(`Procurando reprodutor online para ${item.title}...`);
  await renderStremioStreamsForMeta(item, null, null, '', true);
}

async function playSeriesDirect(item, season = 1, episode = 1) {
  if (searchQuery) {
    searchQuery = '';
    isSearchingCatalog = false;
    const sInput = document.getElementById('searchInput');
    if (sInput) sInput.value = '';
  }
  currentMovieItem = null;
  document.getElementById('stageMovieSection')?.classList.add('hidden');
  document.getElementById('stremioMetaModal')?.classList.add('hidden');
  activeNavTab = 'series';
  syncNavButtons('series');

  // "Tire a parte de recomendados e deixe só a série"
  const carouselsEl = document.getElementById('carouselsContainer');
  if (carouselsEl) carouselsEl.innerHTML = '';
  document.getElementById('stremioGenreBar')?.classList.add('hidden');
  document.getElementById('appleTvHeroHub')?.classList.add('hidden');

  const stage = document.getElementById('liveStageSection');
  if (stage) stage.classList.remove('hidden');
  isPlayerVisibleOnHub = true;
  updateLayoutSectionsVisibility();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });

  showPlayerToast(`Sintonizando T${season}:E${episode} de ${item.title}...`);
  await renderStremioStreamsForMeta(item, season, episode, `Episódio ${episode}`, true);
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

  // Conecta botão "Assistir Agora" ou "Continuar de..." direto da modal
  const btnDirect = document.getElementById('btnModalDirectWatch');
  const isSeries = item.type === 'series' || item.type === 'anime';
  const progressBox = document.getElementById('metaModalProgressBox');
  const restartBtnOld = document.getElementById('btnMetaModalRestart');
  if (restartBtnOld) restartBtnOld.remove();

  if (!isSeries) {
    const itemId = item.imdbId || item.id || item.title;
    const progress = NuvioAccountManager.getProgress(itemId);
    if (progress && progress.currentTime > 10 && progress.percentage < 95) {
      const minsLeft = Math.max(1, Math.round(((progress.duration || 3600) - (progress.currentTime || 0)) / 60));
      const formattedTime = formatSecondsToTime(progress.currentTime);
      if (progressBox) {
        progressBox.classList.remove('hidden');
        progressBox.innerHTML = `
          <div class="flex items-center justify-between text-xs font-semibold">
            <span class="text-white flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Onde Parei: <strong>${formattedTime}</strong> (${progress.percentage}%)
            </span>
            <span class="text-white/50 text-[11px]">Faltam ${minsLeft} min</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full" style="width: ${progress.percentage}%"></div>
          </div>
        `;
      }
      if (btnDirect) {
        btnDirect.innerHTML = `
          <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Continuar de ${formattedTime}</span>
        `;
        btnDirect.onclick = () => {
          playMovieDirect(item);
        };
        const restartBtn = document.createElement('button');
        restartBtn.id = 'btnMetaModalRestart';
        restartBtn.type = 'button';
        restartBtn.className = 'tvos-glass hover:bg-white/15 text-white/70 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border border-white/10 cursor-pointer active:scale-95';
        restartBtn.textContent = 'Reiniciar do Início';
        restartBtn.onclick = () => {
          NuvioAccountManager.saveProgress(item, 1, progress.duration || 3600);
          playMovieDirect(item);
        };
        btnDirect.parentNode.appendChild(restartBtn);
      }
    } else {
      if (progressBox) {
        progressBox.classList.add('hidden');
        progressBox.innerHTML = '';
      }
      if (btnDirect) {
        btnDirect.innerHTML = `
          <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Assistir Agora</span>
        `;
        btnDirect.onclick = () => {
          playMovieDirect(item);
        };
      }
    }
  } else if (btnDirect) {
    btnDirect.onclick = () => {
      const firstEp = item._episodes?.[0] || { season: 1, episode: 1, name: 'Episódio 1' };
      playSeriesDirect(item, firstEp.season, firstEp.episode);
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

  // Atualiza botão principal de ação da série ("Continuar: T{s}:E{e} - {nome} ({pct}%)")
  const itemId = item.imdbId || item.id || item.title;
  const hist = NuvioAccountManager.getHistory();
  const seriesHistory = hist.filter((h) => h.id === itemId && (h.type === 'series' || Boolean(h.season)));

  let targetSeason = 1;
  let targetEpisode = 1;
  let targetTitle = 'Episódio 1';
  let targetPct = 0;
  let isContinuing = false;

  const inProgressEp = seriesHistory.find((h) => !h.isCompleted && (h.currentTime > 10 || h.percentage >= 2) && h.percentage < 90);
  if (inProgressEp) {
    targetSeason = Number(inProgressEp.season) || 1;
    targetEpisode = Number(inProgressEp.episode) || 1;
    targetTitle = inProgressEp.episodeTitle || `Episódio ${targetEpisode}`;
    targetPct = inProgressEp.percentage || 0;
    isContinuing = true;
  } else if (seriesHistory.length > 0) {
    const lastWatched = seriesHistory[0];
    const s = Number(lastWatched.season) || 1;
    const ep = Number(lastWatched.episode) || 1;
    const allEps = (videos || []).slice().sort((a, b) => ((a.season || 1) * 1000 + (a.episode || 1)) - ((b.season || 1) * 1000 + (b.episode || 1)));
    const curIdx = allEps.findIndex((x) => Number(x.season) === s && Number(x.episode) === ep);
    if (curIdx >= 0 && curIdx < allEps.length - 1) {
      const nextOne = allEps[curIdx + 1];
      targetSeason = Number(nextOne.season) || 1;
      targetEpisode = Number(nextOne.episode) || 1;
      targetTitle = nextOne.name || nextOne.title || `Episódio ${targetEpisode}`;
    } else {
      targetSeason = s;
      targetEpisode = ep;
      targetTitle = lastWatched.episodeTitle || `Episódio ${targetEpisode}`;
    }
  } else if (videos.length > 0) {
    const first = videos[0];
    targetSeason = Number(first.season) || 1;
    targetEpisode = Number(first.episode) || 1;
    targetTitle = first.name || first.title || `Episódio ${targetEpisode}`;
  }

  const btnDirect = document.getElementById('btnModalDirectWatch');
  if (btnDirect) {
    btnDirect.innerHTML = `
      <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span>${isContinuing ? `Continuar: T${targetSeason}:E${targetEpisode} - "${escapeHtml(targetTitle)}" (${targetPct}%)` : `Assistir: T${targetSeason}:E${targetEpisode} - "${escapeHtml(targetTitle)}"`}</span>
    `;
    btnDirect.onclick = () => {
      const modal = document.getElementById('stremioMetaModal');
      if (modal) modal.classList.add('hidden');
      renderStremioStreamsForMeta(item, targetSeason, targetEpisode, targetTitle, true);
    };
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
      const epProgress = NuvioAccountManager.getProgress(itemId, Number(sNum), epNum);
      const isWatched = (epProgress && epProgress.percentage >= 90) || epProgress?.isCompleted;
      const hasProgress = epProgress && epProgress.percentage > 0 && !isWatched;

      const card = document.createElement('div');
      card.className =
        'tvos-glass hover:bg-blue-600/20 p-2.5 sm:p-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 border border-white/10 hover:border-blue-400/30 transition-all group select-none';
      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="relative w-14 sm:w-16 aspect-video rounded-xl bg-black/60 overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-mono text-sky-300 font-bold border border-white/10">
            ${ep.thumbnail ? `<img src="${ep.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onerror="this.style.display='none'"/>` : `E${epNum}`}
            ${hasProgress ? `<div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20"><div class="h-full bg-[#E50914]" style="width: ${epProgress.percentage}%"></div></div>` : ''}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 truncate">${epNum}. ${escapeHtml(ep.name || ep.title || `Episódio ${epNum}`)}</span>
              ${isWatched ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">✓ Visto</span>' : ''}
              ${hasProgress ? `<span class="text-[10px] text-purple-300 font-mono font-semibold">${epProgress.percentage}%</span>` : ''}
            </div>
            <div class="text-[10px] text-white/50 truncate mt-0.5">Temporada ${sNum} • Episódio ${epNum} • Clique para reproduzir</div>
          </div>
        </div>
        <button class="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all">
          <i data-lucide="play" class="w-3.5 h-3.5 fill-white"></i>
          <span>${hasProgress ? 'Continuar' : 'Assistir'}</span>
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
// Áudio: Dublado / Legendado / Original + Resolução + Legendas
// ============================================================================
let audioPreference = localStorage.getItem('fidalgo_audio_pref') || 'dub'; // Dublado por padrão
if (audioPreference === 'all') {
  audioPreference = 'dub';
  localStorage.setItem('fidalgo_audio_pref', 'dub');
}

// Helper de pontuação por resolução de vídeo (4K > 1080p > 720p > 480p)
function getStreamResolutionScore(opt) {
  const text = `${opt?.quality || ''} ${opt?.title || ''} ${opt?.addon || ''}`.toLowerCase();
  if (/4k|2160p|uhd/i.test(text)) return 2160;
  if (/1080p|fhd|full[\s-]?hd/i.test(text)) return 1080;
  if (/720p|\bhd\b/i.test(text)) return 720;
  if (/480p|\bsd\b/i.test(text)) return 480;
  return 360;
}

// Classificador Estrito de Idioma do Stream
function classifyStreamAudio(streamOrText) {
  const isObj = typeof streamOrText === 'object' && streamOrText !== null;
  const objAudio = isObj ? (streamOrText.audio || '') : '';

  const text = typeof streamOrText === 'string'
    ? streamOrText
    : `${streamOrText?.title || ''} ${streamOrText?.name || ''} ${streamOrText?.addon || ''} ${streamOrText?.quality || ''} ${streamOrText?.origin || ''} ${streamOrText?.label || ''} ${streamOrText?.url || ''}`;
  const t = text.toLowerCase();

  const isDual = objAudio === 'both' || /dual[\s\-_]*(audio|áudio)?|multi[\s\-_]*(audio|áudio)|dub\s*[\+&/]\s*leg|dublado\s*(e|&|\/)\s*legendado/i.test(t);

  const hasExplicitDub = /\[dublado\]|\bdublado\b|\bdub\b|pt[\s\-_]?br|portugu[eê]s|\bnacional\b|🇧🇷|\baudio\s*pt\b/i.test(t);
  const hasExplicitLeg = /\[legendado\]|\blegendado\b|\bleg\b|\bingl[eê]s\b|\beng\b|\boriginal\b|\bvo\b|\bvostfr\b|\baudio\s*en\b|\benglish\b/i.test(t);

  let isDubStream = false;
  let isOrigStream = false;

  if (isDual) {
    isDubStream = true;
    isOrigStream = true;
  } else if (hasExplicitDub && !hasExplicitLeg) {
    isDubStream = true;
    isOrigStream = false;
  } else if (hasExplicitLeg && !hasExplicitDub) {
    isDubStream = false;
    isOrigStream = true;
  } else if (hasExplicitDub && hasExplicitLeg) {
    isDubStream = true;
    isOrigStream = true;
  } else {
    // Provedor nacional padrão (BestCine / Fênix) sem tag explícita de legenda: assume dublado
    const isNatProvider = /bestcine|fenix/i.test(t);
    if (isNatProvider) {
      isDubStream = true;
      isOrigStream = false;
    } else {
      isDubStream = false;
      isOrigStream = true;
    }
  }

  let category = 'orig';
  if (isDubStream && isOrigStream) category = 'both';
  else if (isDubStream) category = 'dub';
  else category = 'orig';

  return {
    isDual: isDubStream && isOrigStream,
    isDub: isDubStream,
    isOrig: isOrigStream,
    category
  };
}

function detectStreamAudio(text = '') {
  const res = classifyStreamAudio(text);
  if (res.isDual) return 'both';
  if (res.isDub && !res.isOrig) return 'dub';
  if (res.isOrig && !res.isDub) return 'leg';
  if (res.isDub) return 'dub';
  return 'leg';
}

function matchesAudioPref(opt, pref = audioPreference) {
  if (pref === 'all') return true;
  const classification = classifyStreamAudio(opt);
  if (pref === 'dub') {
    return classification.isDub;
  }
  if (pref === 'orig' || pref === 'leg') {
    return classification.isOrig;
  }
  return true;
}

// Seleciona a trilha de áudio no player HTML5 / HLS.js (ex: em fontes Dual Áudio)
function selectAudioTrackInPlayer(targetPref = audioPreference) {
  const video = document.getElementById('videoPlayer');
  if (!video) return;

  // 1. Trilha de áudio via HLS.js
  if (hlsInstance && Array.isArray(hlsInstance.audioTracks) && hlsInstance.audioTracks.length > 1) {
    const tracks = hlsInstance.audioTracks;
    let targetIdx = -1;

    if (targetPref === 'orig' || targetPref === 'leg') {
      targetIdx = tracks.findIndex((t) => {
        const str = `${t.name || ''} ${t.lang || ''}`.toLowerCase();
        return /en|eng|english|orig|vo/i.test(str);
      });
      if (targetIdx === -1) {
        targetIdx = tracks.findIndex((t) => {
          const str = `${t.name || ''} ${t.lang || ''}`.toLowerCase();
          return !/pt|por|pob|brazil|dub/i.test(str);
        });
      }
    } else if (targetPref === 'dub') {
      targetIdx = tracks.findIndex((t) => {
        const str = `${t.name || ''} ${t.lang || ''}`.toLowerCase();
        return /pt|por|pob|portugu[eê]s|dub/i.test(str);
      });
    }

    if (targetIdx >= 0 && targetIdx !== hlsInstance.audioTrack) {
      hlsInstance.audioTrack = targetIdx;
      console.log(`[AudioTrack] HLS trocou para faixa ${targetIdx} (${tracks[targetIdx]?.name || tracks[targetIdx]?.lang})`);
    }
  }

  // 2. Trilha nativa HTML5 video.audioTracks (Safari / Chrome flags)
  if (video.audioTracks && video.audioTracks.length > 1) {
    let targetIdx = -1;
    for (let i = 0; i < video.audioTracks.length; i++) {
      const t = video.audioTracks[i];
      const str = `${t.label || ''} ${t.language || ''}`.toLowerCase();
      if ((targetPref === 'orig' || targetPref === 'leg') && (/en|eng|orig|vo/i.test(str) || !/pt|por|pob/i.test(str))) {
        targetIdx = i;
        break;
      }
      if (targetPref === 'dub' && /pt|por|pob|portugu[eê]s|dub/i.test(str)) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx >= 0) {
      for (let i = 0; i < video.audioTracks.length; i++) {
        video.audioTracks[i].enabled = (i === targetIdx);
      }
    }
  }
}

// Conversor client-side de SRT para WebVTT (.vtt)
function convertSrtToVtt(srtContent = '') {
  if (!srtContent) return 'WEBVTT\n\n';
  let text = String(srtContent).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (text.startsWith('WEBVTT')) return text;

  // Substitui vírgula por ponto em timestamps SRT: 00:01:23,456 --> 00:01:23.456
  text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return `WEBVTT\n\n${text}\n`;
}

// Parser client-side de WebVTT para array de falas (cues)
function parseVttCues(vttText = '') {
  if (!vttText) return [];
  const clean = String(vttText).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');
  const cues = [];
  let i = 0;

  const parseTime = (str) => {
    if (!str) return 0;
    const parts = str.trim().split(':');
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2].replace(',', '.'));
    } else if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1].replace(',', '.'));
    }
    return 0;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const timeParts = line.split('-->');
      const start = parseTime(timeParts[0]);
      const endPart = timeParts[1].trim().split(/\s+/)[0];
      const end = parseTime(endPart);

      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }
      const rawText = textLines.join('<br>');
      if (rawText && end > start) {
        cues.push({ start, end, text: rawText });
      }
    } else {
      i++;
    }
  }
  return cues;
}

// Faz fetch da legenda e retorna texto WebVTT limpo
async function getSubtitleVttData(subUrl) {
  if (!subUrl) return '';
  let rawText = '';

  // 1. Tenta baixar via proxy do backend local (CORS garantido)
  try {
    const proxyUrl = subUrl.startsWith('/api/') ? subUrl : `/api/subtitle-file?url=${encodeURIComponent(subUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      rawText = await res.text();
    }
  } catch (_) {}

  // 2. Fallback: fetch direto
  if (!rawText || rawText.length < 10) {
    try {
      const res = await fetch(subUrl, { mode: 'cors' });
      if (res.ok) {
        rawText = await res.text();
      }
    } catch (_) {}
  }

  if (!rawText || rawText.length < 10) return '';
  return convertSrtToVtt(rawText);
}

// Faz fetch da legenda e retorna Blob URL VTT local
async function getSubtitleVttBlobUrl(subUrl) {
  const vttText = await getSubtitleVttData(subUrl);
  if (!vttText) return null;
  const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
  return URL.createObjectURL(blob);
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
  movieStageAudioPreference = pref;
  localStorage.setItem('fidalgo_movie_audio_pref', pref);
  updateStageAudioButtons();
  updateStageMovieAudioButtons();
  selectAudioTrackInPlayer(pref);

  document.querySelectorAll('#stremioMetaModal [data-audio-pref]').forEach((b) => {
    const on = b.dataset.audioPref === audioPreference;
    b.className = `px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
      on ? 'bg-white text-black border-white' : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
    }`;
  });

  const label =
    pref === 'dub'
      ? '🇧🇷 Dublado'
      : pref === 'orig'
      ? '🔉 Áudio Original'
      : pref === 'leg'
      ? '💬 Legendado'
      : '🌐 Todos os Áudios';
  showPlayerToast(`Áudio preferido: ${label}`);

  if ((pref === 'leg' || pref === 'orig') && window.PlayerAudioSubsManager) {
    window.PlayerAudioSubsManager.refreshSubtitles();
  }

  if (reloadCurrent && currentChannel?.seriesNav?.item) {
    const nav = currentChannel.seriesNav;
    const currentEpNum = Number(nav.episode) || 1;
    const currentSeasonNum = Number(nav.season) || 1;
    const epObj = (nav.item._seasonsMap?.get(currentSeasonNum) || []).find((e) => (e.episode || 1) === currentEpNum);
    const epName = epObj?.name || epObj?.title || `Episódio ${currentEpNum}`;
    renderStremioStreamsForMeta(nav.item, currentSeasonNum, currentEpNum, epName, true);
  } else if (reloadCurrent && (currentChannel?.movieItem || currentMovieItem)) {
    renderStageMovieReprodutoresList(currentChannel);
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
    const epDuration = ep.runtime || ep.duration ? `${ep.runtime || ep.duration} min` : '50 min';

    const itemId = item.imdbId || item.id || item.title;
    const epProgress = NuvioAccountManager.getProgress(itemId, Number(activeSeason), epNum);
    const isWatched = (epProgress && epProgress.percentage >= 90) || epProgress?.isCompleted;
    const hasProgress = epProgress && epProgress.percentage > 0 && !isWatched;

    const card = document.createElement('div');
    card.setAttribute('tabindex', '0');
    if (isCurrentPlaying) card.setAttribute('data-is-active', 'true');
    card.className = `stage-episode-card group w-full rounded-2xl p-3 sm:p-4 transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 border select-none ${
      isCurrentPlaying
        ? 'is-active-episode bg-emerald-500/15 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/50'
        : 'tvos-glass hover:bg-white/10 border-white/10 hover:border-sky-400/30'
    }`;

    card.innerHTML = `
      <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div class="relative w-20 sm:w-28 md:w-36 aspect-video rounded-xl bg-black/75 overflow-hidden shrink-0 flex items-center justify-center border border-white/10 shadow-md">
          ${
            ep.thumbnail
              ? `<img src="${ep.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onerror="this.style.display='none'"/>`
              : `<div class="text-xs font-mono font-bold text-sky-300">E${epNum}</div>`
          }
          <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md text-white text-[10px] font-bold">E${epNum}</span>
          <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md text-white/90 text-[10px] font-mono">${epDuration}</span>
          ${hasProgress ? `<div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20"><div class="h-full bg-[#E50914]" style="width: ${epProgress.percentage}%"></div></div>` : ''}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs sm:text-sm font-bold ${isCurrentPlaying ? 'text-emerald-300' : 'text-white group-hover:text-sky-300'} truncate" title="${escapeHtml(epName)}">
              Ep. ${epNum} - "${escapeHtml(epName)}"
            </span>
            <span class="text-[11px] font-mono text-white/40 hidden sm:inline">• ${epDuration}</span>
            ${
              isCurrentPlaying
                ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>NO AR</span>'
                : ''
            }
            ${isWatched ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">✓ Visto</span>' : ''}
            ${hasProgress ? `<span class="text-[10px] text-purple-300 font-mono font-semibold">${epProgress.percentage}%</span>` : ''}
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
          <span>${isCurrentPlaying ? 'No Ar' : (hasProgress ? 'Continuar' : 'Assistir')}</span>
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
// Painel de Reprodutores & Detalhes do Filme no Palco ("Na Cara")
// ============================================================================
let currentMovieItem = null;
let movieStageAudioPreference = localStorage.getItem('fidalgo_movie_audio_pref') || 'dub';
if (movieStageAudioPreference === 'all') {
  movieStageAudioPreference = 'dub';
  localStorage.setItem('fidalgo_movie_audio_pref', 'dub');
}

function initStageMovieAudioSelector() {
  const container = document.getElementById('stageMovieAudioSelector');
  if (!container) return;
  container.querySelectorAll('[data-stage-movie-audio]').forEach((btn) => {
    btn.onclick = () => {
      setAudioPreference(btn.dataset.stageMovieAudio, false);
      if (currentChannel) {
        renderStageMovieReprodutoresList(currentChannel);
      }
    };
  });
  updateStageMovieAudioButtons();
}

function updateStageMovieAudioButtons() {
  document.querySelectorAll('[data-stage-movie-audio]').forEach((b) => {
    const isAct = b.dataset.stageMovieAudio === audioPreference;
    b.className = `stage-movie-audio-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
      isAct ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-white/70 hover:text-white'
    }`;
  });
}

function renderStageMovieSection(ch) {
  const stageMovieSection = document.getElementById('stageMovieSection');
  if (!stageMovieSection) return;

  const isMovie = ch?.number === 'FILME' || (!ch?.seriesNav && (ch?.movieItem || currentMovieItem));
  if (!isMovie || ch?.seriesNav) {
    stageMovieSection.classList.add('hidden');
    return;
  }

  const item = ch.movieItem || currentMovieItem || { title: ch.name };
  stageMovieSection.classList.remove('hidden');

  // Atualiza Título, Ano, Rating
  const titleEl = document.getElementById('stageMovieTitle');
  if (titleEl) titleEl.textContent = item.title || ch.name;

  const yearEl = document.getElementById('stageMovieYearBadge');
  if (yearEl) {
    yearEl.textContent = item.year || item.subtitle || (item.releaseInfo ? String(item.releaseInfo) : 'Filme');
  }

  const ratingEl = document.getElementById('stageMovieRatingBadge');
  if (ratingEl) {
    const rate = item.imdbRating || item.rating || item.badge;
    if (rate && String(rate).trim().length > 0) {
      ratingEl.classList.remove('hidden');
      ratingEl.textContent = `★ ${rate}`;
    } else {
      ratingEl.classList.add('hidden');
    }
  }

  // Subtítulo do player ativo
  const subEl = document.getElementById('stageMovieSubtitle');
  const activeSource = ch.sources?.[currentSourceIdx];
  if (subEl) {
    if (activeSource) {
      subEl.textContent = `Reproduzindo via ${activeSource.origin || activeSource.label || 'Servidor Online'} • ${activeSource.isWebEmbed ? 'Web Player HD' : 'Stream Direto'}`;
    } else {
      subEl.textContent = 'Procurando reprodutor online com melhor sinal...';
    }
  }

  // Gêneros e Sinopse
  const genresEl = document.getElementById('stageMovieGenres');
  if (genresEl) {
    genresEl.textContent = Array.isArray(item.genres) && item.genres.length > 0 ? item.genres.join(' • ') : (item.category || 'Filmes HD');
  }

  const plotEl = document.getElementById('stageMoviePlot');
  if (plotEl) {
    plotEl.textContent = item.description || item.plot || item.synopsis || 'Assista a este filme com alta definição e múltiplos reprodutores online.';
  }

  // Barra de Progresso Onde Parei do Filme no Palco
  const progressBox = document.getElementById('stageMovieProgressBox');
  if (progressBox) {
    const itemId = item.imdbId || item.id || ch.number || ch.name;
    const progress = NuvioAccountManager.getProgress(itemId);
    if (progress && progress.currentTime > 10 && progress.percentage < 95) {
      const minsLeft = Math.max(1, Math.round(((progress.duration || 3600) - (progress.currentTime || 0)) / 60));
      const formattedTime = formatSecondsToTime(progress.currentTime);
      progressBox.classList.remove('hidden');
      progressBox.innerHTML = `
        <div class="flex items-center justify-between text-xs font-semibold">
          <span class="text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Onde Parei: <strong>${formattedTime}</strong> (${progress.percentage}%)
          </span>
          <span class="text-white/50 text-[11px]">Faltam ${minsLeft} min</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full" style="width: ${progress.percentage}%"></div>
        </div>
        <div class="flex items-center gap-2 pt-0.5">
          <button id="btnStageMovieRestart" type="button" class="text-[11px] text-white/60 hover:text-white underline cursor-pointer">
            Reiniciar do Início
          </button>
        </div>
      `;
      document.getElementById('btnStageMovieRestart')?.addEventListener('click', () => {
        const v = document.getElementById('videoPlayer');
        if (v) {
          v.currentTime = 0;
          v.play().catch(() => {});
        }
        NuvioAccountManager.saveProgress(item, 1, progress.duration || 3600);
        renderStageMovieSection(ch);
      });
    } else {
      progressBox.classList.add('hidden');
      progressBox.innerHTML = '';
    }
  }

  // Botão Stremio Oficial
  const stremioBtn = document.getElementById('btnStageMovieStremio');
  if (stremioBtn) {
    const imdbId = item.imdbId || item.id;
    if (imdbId) {
      stremioBtn.classList.remove('hidden');
      stremioBtn.onclick = () => {
        window.location.href = `stremio:///detail/movie/${imdbId}`;
      };
    } else {
      stremioBtn.classList.add('hidden');
    }
  }

  // Sincroniza botões de áudio
  updateStageMovieAudioButtons();

  // Renderiza a lista de reprodutores "na cara"
  renderStageMovieReprodutoresList(ch);

  if (window.lucide) {
    try { window.lucide.createIcons(); } catch (_) {}
  }
}

function renderStageMovieReprodutoresList(ch) {
  const container = document.getElementById('stageMovieReprodutoresList');
  const countBadge = document.getElementById('stageMovieReprodutoresCount');
  if (!container) return;

  const sources = ch?.sources || [];
  container.innerHTML = '';

  if (sources.length === 0) {
    if (countBadge) countBadge.textContent = '0';
    container.innerHTML = `
      <div class="col-span-full tvos-glass p-4 rounded-2xl flex items-center gap-3 text-xs text-white/70 border border-white/10">
        <span class="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shrink-0"></span>
        <span>Localizando e testando reprodutores online em tempo real...</span>
      </div>
    `;
    return;
  }

  // Filtra por preferência de áudio. Se houver fontes do áudio selecionado, exibe apenas elas; senão, exibe todas as fontes disponíveis!
  const filtered = sources
    .map((s, idx) => ({ ...s, originalIdx: idx }))
    .filter((s) => matchesAudioPref(s, audioPreference));

  const isFallback = filtered.length === 0;
  const displayList = isFallback ? sources.map((s, idx) => ({ ...s, originalIdx: idx })) : filtered;

  if (countBadge) countBadge.textContent = displayList.length;

  if (isFallback && audioPreference !== 'all' && sources.length > 0) {
    const label = audioPreference === 'dub' ? 'dublado' : 'com áudio original';
    const notice = document.createElement('div');
    notice.className = 'col-span-full tvos-glass p-3 rounded-2xl text-xs text-amber-300/90 border border-amber-500/20 mb-1 flex items-center gap-2';
    notice.innerHTML = `<span>ℹ️</span> <span>Nenhum reprodutor exclusivamente ${label} detectado. Exibindo <strong>todos os ${sources.length} reprodutores disponíveis</strong>:</span>`;
    container.appendChild(notice);
  }

  displayList.forEach((src) => {
    const isCurrentPlaying = src.originalIdx === currentSourceIdx;
    const card = document.createElement('div');
    card.setAttribute('tabindex', '0');
    card.className = `p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
      isCurrentPlaying
        ? 'bg-emerald-500/15 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/50'
        : 'tvos-glass hover:bg-white/10 border-white/10 hover:border-purple-400/40'
    }`;

    const classification = classifyStreamAudio(`${src.origin || ''} ${src.label || ''}`);
    const audioBadge =
      classification.isDual
        ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">DUAL ÁUDIO</span>'
        : classification.isDub
        ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">DUBLADO</span>'
        : '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">ORIGINAL</span>';

    card.innerHTML = `
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
            isCurrentPlaying ? 'bg-emerald-400 text-black font-extrabold' : 'bg-purple-500/25 text-purple-300 border border-purple-400/30'
          }">${escapeHtml(src.label || `Reprodutor ${src.originalIdx + 1}`)}</span>
          ${audioBadge}
        </div>
        <div class="text-xs font-semibold text-white/90 truncate mt-1">${escapeHtml(src.origin || 'Servidor Online')}</div>
      </div>
      <div class="shrink-0">
        <button type="button" class="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
          isCurrentPlaying
            ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/30'
            : 'bg-white/10 hover:bg-white hover:text-black text-white/80'
        }">
          ${
            isCurrentPlaying
              ? '<span class="w-2 h-2 rounded-full bg-black animate-ping"></span><span>NO AR</span>'
              : '<i data-lucide="play" class="w-3 h-3 fill-current"></i><span>Assistir</span>'
          }
        </button>
      </div>
    `;

    card.onclick = () => {
      if (src.originalIdx !== currentSourceIdx) {
        showPlayerToast(`Alternando para ${src.label || `Reprodutor ${src.originalIdx + 1}`}...`);
        playChannel(ch, src.originalIdx, false);
      }
    };

    container.appendChild(card);
  });

  if (window.lucide) {
    try { window.lucide.createIcons(); } catch (_) {}
  }
}

// ============================================================================
// HUD de Ajustes do Player & Áudio Saimo-TV
// (Áudio Inteligente, Multi-trilhas HLS, Legendas c/ Sincronia, Qualidade,
//  Super Resolução Upscaling SVG, Velocidade e Brilho)
// ============================================================================
const PlayerAudioSubsManager = {
  activeSubId: 'none',
  activeAudioPref: 'dub', // 'dub' | 'orig'
  currentSubs: [],
  activeCues: [],
  subtitleOffset: 0, // Atraso/adiantamento em segundos (-10s a +10s)
  syncTimer: null,

  init() {
    const btnOpen = document.getElementById('btnPlayerAudioSubs');
    const btnClose = document.getElementById('btnCloseAudioSubsDrawer');

    if (btnOpen) {
      btnOpen.onclick = (e) => {
        e.stopPropagation();
        this.toggleDrawer();
      };
    }

    const btnAspect = document.getElementById('btnPlayerAspectRatio');
    if (btnAspect) {
      btnAspect.onclick = (e) => {
        e.stopPropagation();
        if (window.StreamPlaybackEngine) {
          const mode = window.StreamPlaybackEngine.cycleAspectRatio();
          const txt = document.getElementById('btnPlayerAspectRatioText');
          if (txt) txt.textContent = `Tela: ${mode.toUpperCase()}`;
          this.updateAspectUi(mode);
        }
      };
    }

    if (btnClose) {
      btnClose.onclick = (e) => {
        e.stopPropagation();
        this.closeDrawer();
      };
    }

    // 1. Interruptor do Áudio Inteligente (Normalização de Volume Saimo-TV)
    const btnSmartAudio = document.getElementById('btnToggleAudioInteligente');
    if (btnSmartAudio) {
      btnSmartAudio.onclick = (e) => {
        e.stopPropagation();
        if (window.StreamPlaybackEngine) {
          const ativo = window.StreamPlaybackEngine.toggleAudioInteligente();
          this.updateAudioInteligenteUi(ativo);
        }
      };
    }

    // 2. Seletores Dublado / Original para fontes alternativas VOD
    document.querySelectorAll('#hudAudioOptionsList [data-hud-audio]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        this.setAudio(b.dataset.hudAudio);
      };
    });

    // 3. Ajuste de Sincronia de Legenda (-5s a +5s em passos de 0.25s e 1s)
    const btnMinus1 = document.getElementById('btnSubOffsetMinus1');
    const btnMinusQuarter = document.getElementById('btnSubOffsetMinusQuarter');
    const btnReset = document.getElementById('btnSubOffsetReset');
    const btnPlusQuarter = document.getElementById('btnSubOffsetPlusQuarter');
    const btnPlus1 = document.getElementById('btnSubOffsetPlus1');

    if (btnMinus1) btnMinus1.onclick = (e) => { e.stopPropagation(); this.setSubtitleOffset(-1.0, true); };
    if (btnMinusQuarter) btnMinusQuarter.onclick = (e) => { e.stopPropagation(); this.setSubtitleOffset(-0.25, true); };
    if (btnReset) btnReset.onclick = (e) => { e.stopPropagation(); this.setSubtitleOffset(0, false); };
    if (btnPlusQuarter) btnPlusQuarter.onclick = (e) => { e.stopPropagation(); this.setSubtitleOffset(0.25, true); };
    if (btnPlus1) btnPlus1.onclick = (e) => { e.stopPropagation(); this.setSubtitleOffset(1.0, true); };

    // 4. Seletores de Proporção de Tela
    document.querySelectorAll('#hudAspectOptions [data-aspect-mode]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const mode = b.dataset.aspectMode;
        if (window.StreamPlaybackEngine) {
          window.StreamPlaybackEngine.applyAspectRatio(mode);
          this.updateAspectUi(mode);
        }
      };
    });

    // 5. Seletores de Super Resolução (Upscaling Saimo-TV)
    document.querySelectorAll('#hudUpscalingOptions [data-upscaling-mode]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const mode = b.dataset.upscalingMode;
        if (window.StreamPlaybackEngine) {
          window.StreamPlaybackEngine.applyUpscaling(mode);
          this.updateUpscalingUi(mode);
        }
      };
    });

    // 6. Seletores de Velocidade de Reprodução
    document.querySelectorAll('#hudSpeedOptions [data-speed]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const speed = parseFloat(b.dataset.speed);
        if (window.StreamPlaybackEngine) {
          window.StreamPlaybackEngine.setPlaybackRate(speed);
          this.updateSpeedUi(speed);
        }
      };
    });

    // 7. Controle de Brilho
    const sliderBright = document.getElementById('sliderBrightness');
    if (sliderBright) {
      sliderBright.oninput = (e) => {
        const val = parseInt(e.target.value, 10);
        if (window.StreamPlaybackEngine) {
          window.StreamPlaybackEngine.applyBrightness(val);
          this.updateBrightnessUi(val);
        }
      };
    }
    const btnBrightMinus = document.getElementById('btnBrightnessMinus');
    const btnBrightPlus = document.getElementById('btnBrightnessPlus');
    const btnBrightReset = document.getElementById('btnBrightnessReset');
    if (btnBrightMinus) {
      btnBrightMinus.onclick = (e) => {
        e.stopPropagation();
        const cur = window.StreamPlaybackEngine?.getBrightness() || 100;
        const next = Math.max(50, cur - 10);
        window.StreamPlaybackEngine?.applyBrightness(next);
        this.updateBrightnessUi(next);
      };
    }
    if (btnBrightPlus) {
      btnBrightPlus.onclick = (e) => {
        e.stopPropagation();
        const cur = window.StreamPlaybackEngine?.getBrightness() || 100;
        const next = Math.min(150, cur + 10);
        window.StreamPlaybackEngine?.applyBrightness(next);
        this.updateBrightnessUi(next);
      };
    }
    if (btnBrightReset) {
      btnBrightReset.onclick = (e) => {
        e.stopPropagation();
        window.StreamPlaybackEngine?.applyBrightness(100);
        this.updateBrightnessUi(100);
      };
    }

    // Sincronização em tempo real das legendas com o elemento <video>
    const video = document.getElementById('videoPlayer');
    if (video) {
      video.addEventListener('timeupdate', () => this.updateSubtitleDisplay());
      video.addEventListener('seeking', () => this.updateSubtitleDisplay());
      video.addEventListener('seeked', () => this.updateSubtitleDisplay());
      video.addEventListener('play', () => this.startSubtitleSync());
      video.addEventListener('pause', () => this.updateSubtitleDisplay());
      video.addEventListener('ended', () => this.clearSubtitleOverlay());
    }

    // Inicializa estados da UI
    this.updateAudioInteligenteUi();
    this.updateSubtitleOffsetUi();
    this.updateAspectUi(window.StreamPlaybackEngine?.getAspectRatio() || 'fit');
    this.updateUpscalingUi(window.StreamPlaybackEngine?.getUpscaling() || 'off');
    this.updateBrightnessUi(window.StreamPlaybackEngine?.getBrightness() || 100);
    this.updateSpeedUi(1);

    window.PlayerAudioSubsManager = this;
  },

  startSubtitleSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => this.updateSubtitleDisplay(), 100);
  },

  clearSubtitleOverlay() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    const overlay = document.getElementById('subtitleOverlay');
    if (overlay) {
      overlay.dataset.currentCueText = '';
      overlay.innerHTML = '';
      overlay.classList.add('hidden');
    }
  },

  setSubtitleOffset(val, isDelta = false) {
    if (isDelta) {
      this.subtitleOffset = Math.round((this.subtitleOffset + val) * 100) / 100;
    } else {
      this.subtitleOffset = Math.round(val * 100) / 100;
    }
    this.subtitleOffset = Math.max(-10, Math.min(10, this.subtitleOffset));
    this.updateSubtitleOffsetUi();
    this.updateSubtitleDisplay();
    if (typeof showPlayerToast === 'function') {
      const off = this.subtitleOffset;
      const str = off === 0 ? 'Original (0s)' : (off > 0 ? `+${off.toFixed(2)}s` : `${off.toFixed(2)}s`);
      showPlayerToast(`⏱ Sincronia: ${str}`);
    }
  },

  updateSubtitleOffsetUi() {
    const lbl = document.getElementById('hudSubtitleOffsetLabel');
    if (!lbl) return;
    const off = this.subtitleOffset;
    if (off === 0) {
      lbl.textContent = 'Original (0,0 s)';
      lbl.className = 'font-mono font-bold text-sky-300';
    } else if (off > 0) {
      lbl.textContent = `Atrasar +${off.toFixed(2).replace('.', ',')} s`;
      lbl.className = 'font-mono font-bold text-amber-300';
    } else {
      lbl.textContent = `Adiantar ${off.toFixed(2).replace('.', ',')} s`;
      lbl.className = 'font-mono font-bold text-emerald-300';
    }
  },

  updateSubtitleDisplay() {
    const video = document.getElementById('videoPlayer');
    const overlay = document.getElementById('subtitleOverlay');
    if (!video || !overlay) return;

    if (!this.activeCues || this.activeCues.length === 0 || video.ended || this.activeSubId === 'none') {
      if (!overlay.classList.contains('hidden')) {
        overlay.dataset.currentCueText = '';
        overlay.innerHTML = '';
        overlay.classList.add('hidden');
      }
      return;
    }

    const t = video.currentTime;
    const off = this.subtitleOffset || 0;
    const cue = this.activeCues.find((c) => t >= (c.start + off) && t <= (c.end + off));
    if (cue && cue.text) {
      if (overlay.dataset.currentCueText !== cue.text) {
        overlay.dataset.currentCueText = cue.text;
        overlay.innerHTML = `<span class="tvos-sub-badge">${cue.text}</span>`;
      }
      overlay.classList.remove('hidden');
    } else {
      if (!overlay.classList.contains('hidden')) {
        overlay.dataset.currentCueText = '';
        overlay.innerHTML = '';
        overlay.classList.add('hidden');
      }
    }
  },

  updateAudioInteligenteUi(ativo = null) {
    if (ativo === null && window.StreamPlaybackEngine) {
      ativo = window.StreamPlaybackEngine.isAudioInteligenteAtivo();
    }
    const isAct = !!ativo;
    const badge = document.getElementById('badgeAudioInteligenteStatus');
    const text = document.getElementById('textAudioInteligenteStatus');
    const btn = document.getElementById('btnToggleAudioInteligente');
    if (badge) {
      badge.className = `w-2 h-2 rounded-full ${isAct ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`;
    }
    if (text) {
      text.textContent = isAct ? 'Ativado' : 'Desativado';
      text.className = isAct ? 'text-emerald-300 font-bold' : 'text-white/50 font-medium';
    }
    if (btn) {
      btn.classList.toggle('active', isAct);
    }
  },

  updateUpscalingUi(mode) {
    document.querySelectorAll('#hudUpscalingOptions [data-upscaling-mode]').forEach((b) => {
      const isAct = b.dataset.upscalingMode === mode;
      b.classList.toggle('active', isAct);
      if (isAct) {
        b.classList.add('border-cyan-400/80', 'bg-cyan-500/20', 'text-cyan-200');
      } else {
        b.classList.remove('border-cyan-400/80', 'bg-cyan-500/20', 'text-cyan-200');
      }
    });
  },

  updateAspectUi(mode) {
    document.querySelectorAll('#hudAspectOptions [data-aspect-mode]').forEach((b) => {
      const isAct = b.dataset.aspectMode === mode;
      b.classList.toggle('active', isAct);
      if (isAct) {
        b.classList.add('border-amber-400/80', 'bg-amber-500/20', 'text-amber-200');
      } else {
        b.classList.remove('border-amber-400/80', 'bg-amber-500/20', 'text-amber-200');
      }
    });
    const txt = document.getElementById('btnPlayerAspectRatioText');
    if (txt) txt.textContent = `Tela: ${mode.toUpperCase()}`;
  },

  updateSpeedUi(speed) {
    const spdStr = String(speed);
    document.querySelectorAll('#hudSpeedOptions [data-speed]').forEach((b) => {
      const isAct = b.dataset.speed === spdStr || parseFloat(b.dataset.speed) === speed;
      b.classList.toggle('active', isAct);
      if (isAct) {
        b.classList.add('border-fuchsia-400/80', 'bg-fuchsia-500/20', 'text-fuchsia-200');
      } else {
        b.classList.remove('border-fuchsia-400/80', 'bg-fuchsia-500/20', 'text-fuchsia-200');
      }
    });
    const lbl = document.getElementById('hudSpeedLabel');
    if (lbl) lbl.textContent = `${speed}x`;
  },

  updateBrightnessUi(val) {
    const slider = document.getElementById('sliderBrightness');
    if (slider) slider.value = val;
    const lbl = document.getElementById('hudBrightnessLabel');
    if (lbl) lbl.textContent = `${val}%`;
  },

  updateActiveQualityBadge(levelIdx) {
    const badge = document.getElementById('hudCurrentQualityBadge');
    if (!badge) return;
    const hls = window.StreamPlaybackEngine?.getActiveHls();
    if (levelIdx === -1 || (hls && hls.autoLevelEnabled)) {
      const curLvl = hls?.levels ? hls.levels[hls.currentLevel] : null;
      badge.textContent = curLvl?.height ? `Auto (${curLvl.height}p)` : 'Auto (ABR)';
    } else if (hls?.levels && hls.levels[levelIdx]) {
      const lvl = hls.levels[levelIdx];
      badge.textContent = lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}k`;
    }
  },

  refreshStreamAudioTracks() {
    const listEl = document.getElementById('hudStreamAudioTracks');
    const countEl = document.getElementById('hudAudioTracksCount');
    if (!listEl) return;

    listEl.innerHTML = '';
    const tracks = window.StreamPlaybackEngine?.getAudioTracks() || [];

    if (countEl) {
      countEl.textContent = tracks.length > 1 ? `${tracks.length} faixas detectadas` : (tracks.length === 1 ? '1 faixa' : 'Padrão');
    }

    if (tracks.length <= 1) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'text-[11px] text-white/40 italic px-2 py-1 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between';
      emptyDiv.innerHTML = `<span>Faixa estéreo unificada</span><span class="text-[10px] text-emerald-400">Ativa</span>`;
      listEl.appendChild(emptyDiv);
      return;
    }

    tracks.forEach((tr) => {
      const btn = document.createElement('button');
      btn.className = `hud-opt-btn p-2 rounded-xl text-xs font-semibold flex items-center justify-between border border-white/10 hover:bg-white/10 transition-all cursor-pointer ${
        tr.active ? 'active' : ''
      }`;
      btn.setAttribute('tabindex', '0');

      let icon = '🔊';
      if (/pt|por|brazil|dub/i.test(tr.name)) icon = '🇧🇷';
      else if (/en|eng|orig/i.test(tr.name)) icon = '🌐';
      else if (/es|spa/i.test(tr.name)) icon = '🇪🇸';

      btn.innerHTML = `
        <span class="flex items-center gap-2 truncate">
          <span>${icon}</span>
          <span class="truncate">${escapeHtml(tr.name)}</span>
          ${tr.lang ? `<span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60">${escapeHtml(tr.lang)}</span>` : ''}
        </span>
        <span class="hud-audio-check text-emerald-400 font-bold ${tr.active ? '' : 'hidden'}">✓</span>
      `;

      btn.onclick = (e) => {
        e.stopPropagation();
        window.StreamPlaybackEngine?.setAudioTrack(tr.id);
        this.refreshStreamAudioTracks();
      };

      listEl.appendChild(btn);
    });
  },

  refreshQualityTracks() {
    const listEl = document.getElementById('hudQualityTracks');
    if (!listEl) return;

    listEl.innerHTML = '';
    const levels = window.StreamPlaybackEngine?.getQualityLevels() || [];
    const hls = window.StreamPlaybackEngine?.getActiveHls();
    const isAuto = !hls || hls.currentLevel === -1;

    // Botão Automática (ABR)
    const btnAuto = document.createElement('button');
    btnAuto.className = `hud-opt-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/10 transition-all cursor-pointer ${
      isAuto ? 'active' : ''
    }`;
    btnAuto.setAttribute('tabindex', '0');
    btnAuto.textContent = 'Auto (ABR)';
    btnAuto.onclick = (e) => {
      e.stopPropagation();
      window.StreamPlaybackEngine?.setQualityLevel(-1);
      this.refreshQualityTracks();
      this.updateActiveQualityBadge(-1);
    };
    listEl.appendChild(btnAuto);

    levels.forEach((lvl) => {
      const isAct = !isAuto && hls && hls.currentLevel === lvl.id;
      const btn = document.createElement('button');
      btn.className = `hud-opt-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/10 transition-all cursor-pointer ${
        isAct ? 'active' : ''
      }`;
      btn.setAttribute('tabindex', '0');
      btn.textContent = lvl.label;
      btn.onclick = (e) => {
        e.stopPropagation();
        window.StreamPlaybackEngine?.setQualityLevel(lvl.id);
        this.refreshQualityTracks();
        this.updateActiveQualityBadge(lvl.id);
      };
      listEl.appendChild(btn);
    });

    this.updateActiveQualityBadge(hls ? hls.currentLevel : -1);
  },

  toggleDrawer() {
    const drawer = document.getElementById('playerAudioSubsDrawer');
    if (!drawer) return;
    if (drawer.classList.contains('is-hidden')) {
      this.openDrawer();
    } else {
      this.closeDrawer();
    }
  },

  openDrawer() {
    const drawer = document.getElementById('playerAudioSubsDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-hidden');
    this.refreshStreamAudioTracks();
    this.refreshQualityTracks();
    this.refreshSubtitles();
    this.updateAudioInteligenteUi();
    this.updateSubtitleOffsetUi();
    this.updateAspectUi(window.StreamPlaybackEngine?.getAspectRatio() || 'fit');
    this.updateUpscalingUi(window.StreamPlaybackEngine?.getUpscaling() || 'off');
    this.updateBrightnessUi(window.StreamPlaybackEngine?.getBrightness() || 100);
  },

  closeDrawer() {
    const drawer = document.getElementById('playerAudioSubsDrawer');
    if (!drawer) return;
    drawer.classList.add('is-hidden');
  },

  setAudio(pref) {
    this.activeAudioPref = pref;
    setAudioPreference(pref, false);
    selectAudioTrackInPlayer(pref);

    document.querySelectorAll('#hudAudioOptionsList [data-hud-audio]').forEach((b) => {
      const isAct = b.dataset.hudAudio === pref;
      b.classList.toggle('active', isAct);
      const chk = b.querySelector('.hud-audio-check');
      if (chk) chk.classList.toggle('hidden', !isAct);
    });

    const label = pref === 'dub' ? 'Português (Dublado)' : 'Inglês (Original)';
    showPlayerToast(`Áudio selecionado: ${label}`);

    // Chaveia para a fonte correspondente se disponível
    if (currentChannel && Array.isArray(currentChannel.sources) && currentChannel.sources.length > 1) {
      const matchIdx = currentChannel.sources.findIndex((s) => matchesAudioPref(s, pref));
      if (matchIdx >= 0 && matchIdx !== currentSourceIdx) {
        showPlayerToast(`Alternando áudio para ${currentChannel.sources[matchIdx].label || label}...`);
        playChannel(currentChannel, matchIdx, false);
      }
    }
  },

  async refreshSubtitles() {
    const listEl = document.getElementById('hudSubtitlesOptionsList');
    const statusEl = document.getElementById('hudSubsStatus');
    if (!listEl) return;

    listEl.innerHTML = '';
    if (statusEl) statusEl.textContent = 'Buscando legendas...';

    const ch = currentChannel;
    let type = 'movie';
    let id = ch?.imdbId || ch?.stremioId || currentMovieItem?.imdbId || currentMovieItem?.id;
    let season = null;
    let episode = null;

    if (ch?.seriesNav) {
      type = 'series';
      id = ch.seriesNav.item?.imdbId || ch.seriesNav.item?.id || id;
      season = ch.seriesNav.season;
      episode = ch.seriesNav.episode;
    }

    const subs = [
      { id: 'none', label: 'Sem Legendas', badge: null, lang: null, url: null }
    ];

    if (id) {
      try {
        const qUrl = `/api/subtitles?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}${season ? `&season=${season}&episode=${episode}` : ''}`;
        const res = await fetch(qUrl).then((r) => r.json()).catch(() => null);

        if (res && Array.isArray(res.subtitles) && res.subtitles.length > 0) {
          res.subtitles.forEach((s) => {
            subs.push({
              id: s.id,
              label: s.label,
              badge: s.badge,
              lang: s.lang,
              format: s.format,
              url: s.proxyUrl || s.url
            });
          });
        }
      } catch (_) {}

      // Fallbacks elegantes se a API remota estiver indisponível
      if (subs.length === 1) {
        subs.push(
          {
            id: 'opensub-pt',
            label: 'Português (OpenSubtitles)',
            badge: 'Oficial',
            lang: 'pt-BR',
            url: `/api/subtitle-file?url=${encodeURIComponent(`https://opensubtitles-v3.strem.io/subtitles/${type}/${id}.json`)}`
          },
          {
            id: 'submaker-pt',
            label: 'Português (IA - StremioSubMaker)',
            badge: 'IA',
            lang: 'pt-BR',
            url: `/api/subtitle-file?url=${encodeURIComponent(`https://submaker.fly.dev/subtitles/${type}/${id}.json`)}&ai=true`
          },
          {
            id: 'opensub-en',
            label: 'Inglês (OpenSubtitles)',
            badge: 'Oficial',
            lang: 'en',
            url: `/api/subtitle-file?url=${encodeURIComponent(`https://opensubtitles-v3.strem.io/subtitles/${type}/${id}.json`)}`
          }
        );
      }
    } else {
      subs.push(
        { id: 'opensub-pt', label: 'Português (OpenSubtitles)', badge: 'Oficial', lang: 'pt-BR', url: null },
        { id: 'submaker-pt', label: 'Português (IA - StremioSubMaker)', badge: 'IA', lang: 'pt-BR', url: null },
        { id: 'opensub-en', label: 'Inglês (OpenSubtitles)', badge: 'Oficial', lang: 'en', url: null }
      );
    }

    if (statusEl) statusEl.textContent = `${subs.length - 1} disponível(is)`;
    this.currentSubs = subs;

    // Se preferência de áudio for 'leg', auto-seleciona a primeira legenda em português disponível
    if (audioPreference === 'leg' && (this.activeSubId === 'none' || !this.activeSubId)) {
      const ptSub = subs.find((s) => s.id !== 'none' && (s.lang === 'pt-BR' || /portugu[eê]s/i.test(s.label)));
      if (ptSub) {
        this.selectSubtitle(ptSub);
      }
    }

    subs.forEach((s) => {
      const isSelected = (!this.activeSubId && s.id === 'none') || (this.activeSubId === s.id);
      const btn = document.createElement('button');
      btn.className = `hud-opt-btn p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border border-white/10 hover:bg-white/10 transition-all cursor-pointer ${
        isSelected ? 'active' : ''
      }`;
      btn.setAttribute('data-sub-id', s.id);

      const badgeHtml = s.badge
        ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${
            s.badge === 'IA' ? 'bg-sky-500/25 text-sky-300 border border-sky-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
          }">${s.badge}</span>`
        : '';

      btn.innerHTML = `
        <span class="flex items-center gap-2 truncate">
          <span>${s.id === 'none' ? '🚫' : '💬'}</span>
          <span class="truncate">${escapeHtml(s.label)}</span>
          ${badgeHtml}
        </span>
        <span class="hud-sub-check text-emerald-400 font-bold ${isSelected ? '' : 'hidden'}">✓</span>
      `;

      btn.onclick = (e) => {
        e.stopPropagation();
        this.selectSubtitle(s);
      };

      listEl.appendChild(btn);
    });
  },

  async selectSubtitle(sub) {
    this.activeSubId = sub.id;
    const video = document.getElementById('videoPlayer');
    if (!video) return;

    document.querySelectorAll('#hudSubtitlesOptionsList [data-sub-id]').forEach((b) => {
      const isAct = b.getAttribute('data-sub-id') === sub.id;
      b.classList.toggle('active', isAct);
      const chk = b.querySelector('.hud-sub-check');
      if (chk) chk.classList.toggle('hidden', !isAct);
    });

    // 2. Injeção Dinâmica: Remove todos os elementos <track> existentes do <video>
    const oldTracks = video.querySelectorAll('track');
    oldTracks.forEach((t) => {
      if (t.src && t.src.startsWith('blob:')) {
        try { URL.revokeObjectURL(t.src); } catch (_) {}
      }
      t.remove();
    });

    if (sub.id === 'none' || !sub.url) {
      this.activeCues = [];
      this.clearSubtitleOverlay();
      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = 'disabled';
        }
      }
      showPlayerToast(sub.id === 'none' ? 'Legendas desativadas' : `Legenda selecionada: ${sub.label}`);
      return;
    }

    showPlayerToast(`Carregando legenda: ${sub.label}...`);

    try {
      // 1. Obtém conteúdo WebVTT limpo e parseia as falas em tempo real
      const vttText = await getSubtitleVttData(sub.url || sub.proxyUrl);
      if (vttText && vttText.length > 20) {
        this.activeCues = parseVttCues(vttText);
        console.log(`[Subtitles] ${this.activeCues.length} falas carregadas para ${sub.label}`);
      } else {
        this.activeCues = [];
      }

      // 2. Injeção Dinâmica de Track para leitores de tela e fallback nativo
      const blob = new Blob([vttText || 'WEBVTT\n\n'], { type: 'text/vtt;charset=utf-8' });
      const subtitleVttUrl = URL.createObjectURL(blob);

      const track = document.createElement('track');
      track.className = 'injected-sub';
      track.kind = 'subtitles';
      track.label = sub.label; // ex: "Português (OpenSubtitles)"
      track.srclang = sub.lang ? sub.lang.split('-')[0] : 'pt';
      track.src = subtitleVttUrl;
      track.default = true;
      video.appendChild(track);

      // 3. Forçar Ativação nativa (textTracks)
      const forceActivateTrack = () => {
        if (video.textTracks && video.textTracks.length > 0) {
          for (let i = 0; i < video.textTracks.length; i++) {
            video.textTracks[i].mode = 'disabled';
          }
          video.textTracks[video.textTracks.length - 1].mode = 'showing';
        }
        if (track.track) {
          track.track.mode = 'showing';
        }
      };

      track.addEventListener('load', forceActivateTrack);
      forceActivateTrack();
      setTimeout(forceActivateTrack, 200);

      // 4. Inicia renderização visual instantânea no overlay Apple tvOS
      this.startSubtitleSync();
      this.updateSubtitleDisplay();

      showPlayerToast(`✓ Legenda ativada: ${sub.label}`);
    } catch (err) {
      console.error('[Subtitles] Erro ao carregar legenda:', err);
      showPlayerToast(`Legenda ativa: ${sub.label}`);
    }
  },

  onTrackStarted(ch) {
    this.closeDrawer();
    this.activeSubId = 'none';
    this.activeCues = [];
    this.subtitleOffset = 0;
    this.updateSubtitleOffsetUi();
    this.clearSubtitleOverlay();
    const oldTracks = document.getElementById('videoPlayer')?.querySelectorAll('track') || [];
    oldTracks.forEach((t) => {
      if (t.src && t.src.startsWith('blob:')) {
        try { URL.revokeObjectURL(t.src); } catch (_) {}
      }
      t.remove();
    });
    this.refreshSubtitles();
    this.refreshStreamAudioTracks();
    this.refreshQualityTracks();
  }
};

// ============================================================================
// Teste Rápido de Provedores em Tempo Real (Fast Ping / Probe de Streams)
// ============================================================================
async function findFastestWorkingStream(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const usable = candidates.filter((s) => !s.isTorrent && !s.isComandoPlaySearch && !s.isComandoPlayDirect && !s.isExternalScheme);
  if (usable.length === 0) return candidates[0] || null;
  if (usable.length === 1) return usable[0];

  const topCandidates = usable.slice(0, 6);

  const testCandidate = async (opt) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const isEmbed = Boolean(opt.isWebEmbed) || isEmbedWebUrl(opt.url);

      await fetch(opt.url, {
        method: isEmbed ? 'GET' : 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timer);
      return opt;
    } catch (_) {
      return null;
    }
  };

  const results = await Promise.allSettled(topCandidates.map(testCandidate));
  const working = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean);

  if (working.length > 0) {
    return working[0];
  }

  // Fallback seguro: MultiEmbed 4K ou o primeiro da lista
  return topCandidates.find((c) => /multiembed|vidlink/i.test(c.url)) || topCandidates[0];
}

// Monta a lista de Streams exclusivas (BestCine PT-BR & Fênix)
async function renderStremioStreamsForMeta(item, season = null, episode = null, epTitle = '', autoPlay = false) {
  const container = document.getElementById('metaStreamsList');
  const indicator = document.getElementById('metaEpisodeIndicator');

  const isSeries = (item.type === 'series' || item.type === 'anime') && season && episode;
  indicator.textContent = isSeries ? `T${season}:E${episode} ${epTitle ? `• ${epTitle}` : ''}` : 'Filme Completo';

  container.innerHTML = `
    <div class="tvos-glass p-4 rounded-2xl text-xs text-white/70 flex items-center gap-3">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
      <span>Consultando <strong>MagnetFlix e Fênix</strong> (Fontes Oficiais)...</span>
    </div>
  `;

  const imdbId = item.imdbId || item.id || '';
  const stremioStreamId = isSeries ? `${imdbId}:${season}:${episode}` : imdbId;
  let streamOptions = [];

  // Consulta Saimo TV VOD (Local, ultra-rápido ~5ms com dublado e legendado)
  try {
    const saimoVodTxt = await fetchWithTimeout(`/api/saimo-vod?title=${encodeURIComponent(item.title)}&type=${encodeURIComponent(item.type || 'movie')}`, 2500);
    if (saimoVodTxt) {
      const saimoData = JSON.parse(saimoVodTxt);
      if (Array.isArray(saimoData.streams) && saimoData.streams.length > 0) {
        saimoData.streams.forEach((s, idx) => {
          streamOptions.push({
            addon: 'Saimo TV',
            priority: -1,
            rawTitle: s.title || `${item.title} (HD)`,
            label: s.title || `Fonte ${idx + 1} (${s.audio})`,
            audio: s.audio || 'dublado',
            quality: 'HD',
            size: '',
            url: s.url,
            isDirectHttp: true
          });
        });
      }
    }
  } catch (_) {}

  // Fontes Exclusivas: MagnetFlix HD e Fênix (FenixFlix HD) — BestCine VOD removido pois upstream Xtream está "FORA DO AR"
  const vodAddons = [
    {
      name: 'MagnetFlix HD',
      baseUrl: 'https://magnetflix.flixbr.online/qualities%3D4k%2C1080p%2C720p%2Csd%7Caudio%3Ddublado%2Clegendado%7Ccatalogs%3Dpopulares_movie%2Cpopulares_series%2Crecentes_servidor_movie%2Crecentes_servidor_series%2Cemalta_movie%2Cemalta_series',
      isMagnetflix: true,
      priority: 0
    },
    { name: 'FenixFlix HD', baseUrl: 'https://fenixflix.fenixhub.online', isFenix: true, priority: 1 }
  ];

  await Promise.allSettled(
    vodAddons.map(async (addon) => {
      try {
        const streamUrl = `${addon.baseUrl}/stream/${encodeURIComponent(item.type)}/${encodeURIComponent(stremioStreamId)}.json`;
        const txt = await fetchTextSafe(streamUrl, false, 4000);
        if (!txt) return;
        const data = JSON.parse(txt);
        if (!Array.isArray(data.streams)) return;

        data.streams.forEach((st) => {
          if (!st.url && !st.infoHash) return;
          const textToCheck = `${st.name || ''} ${st.title || ''} ${st.description || ''} ${st.url || ''}`;
          if (/sponsor|advertisement|\bpromo\b|an[uú]ncio|warez/i.test(textToCheck)) return;
          // Bloqueia servidores IPTV mortos ou que exibem slide de "FORA DO AR"
          if (/srcine\.site|dbonline\.tech-cdn|2kbrfonte\.space|oneplayfastpro|gmafast|clickhost\.xyz\/embed/i.test(textToCheck)) return;

          const rawTitle = (st.title || st.description || st.name || item.title)
            .replace(/\r?\n/g, ' • ')
            .trim();
          const isMagnetflix = addon.isMagnetflix || /magnet/i.test(addon.name) || /magnet/i.test(st.name || '');
          const isFenix = addon.isFenix || /fenix/i.test(addon.name) || /fenix/i.test(st.name || '');

          const qualityBadge = isMagnetflix ? 'MAGNETFLIX HD' : 'FÊNIX HD';
          const addonLabel = isMagnetflix ? 'MagnetFlix' : 'Fênix';

          if (st.url) {
            streamOptions.push({
              addon: addonLabel,
              title: rawTitle,
              quality: qualityBadge,
              url: st.url,
              isWebEmbed: false,
              priority: addon.priority ?? (isMagnetflix ? 0 : 1)
            });
          }
        });
      } catch (_) {}
    })
  );

  // Classifica idioma e pontuação por resolução de cada stream
  streamOptions.forEach((o) => {
    const c = classifyStreamAudio(`${o.title} ${o.addon} ${o.quality}`);
    o.audio = c.category;
    o.isDub = c.isDub;
    o.isOrig = c.isOrig;
    o.isDual = c.isDual;
    o.resolutionScore = getStreamResolutionScore(o);
  });

  // Ordenação inteligente: 1) Dublado por padrão, 2) Prioridade do provedor (MagnetFlix > Fênix), 3) Resolução
  streamOptions.sort((a, b) => {
    if (audioPreference === 'dub') {
      if (a.isDub && !b.isDub) return -1;
      if (!a.isDub && b.isDub) return 1;
    } else if (audioPreference === 'orig' || audioPreference === 'leg') {
      if (a.isOrig && !b.isOrig) return -1;
      if (!a.isOrig && b.isOrig) return 1;
    }
    if ((a.priority || 0) !== (b.priority || 0)) {
      return (a.priority || 0) - (b.priority || 0);
    }
    return (b.resolutionScore || 0) - (a.resolutionScore || 0);
  });

  container.innerHTML = '';

  // Seletor de Áudio: Dublado (Padrão) | Áudio Original | Legendado | Todos
  const audioBar = document.createElement('div');
  audioBar.className = 'flex items-center gap-2 mb-1 flex-wrap';
  audioBar.innerHTML = `
    <span class="text-[11px] font-bold uppercase tracking-wider text-white/60 mr-1">Áudio:</span>
    ${[
      ['dub', '🇧🇷 Dublado (Padrão)'],
      ['orig', '🔉 Áudio Original'],
      ['leg', '💬 Legendado'],
      ['all', 'Todos']
    ]
      .map(
        ([k, label]) =>
          `<button data-audio-pref="${k}" class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            audioPreference === k ? 'bg-white text-black border-white shadow' : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
          }">${label}</button>`
      )
      .join('')}
  `;
  container.appendChild(audioBar);

  const listWrap = document.createElement('div');
  listWrap.className = 'flex flex-col gap-2.5';
  container.appendChild(listWrap);

  const playOption = (opt) => {
    document.getElementById('stremioMetaModal')?.classList.add('hidden');

    const nextEp = isSeries ? getNextEpisodeInfo(item, season, episode) : null;
    const audioLabel = opt.isDual ? 'Dual Áudio' : opt.isDub ? 'Dublado' : 'Original';

    let matchedSources = streamOptions.filter((s) => matchesAudioPref(s));
    if (matchedSources.length === 0) matchedSources = streamOptions;

    const embedSources = matchedSources.map((s, sIdx) => ({
      label: `${s.addon} (${s.resolutionScore >= 2160 ? '4K' : s.resolutionScore >= 1080 ? '1080p' : 'HD'}) ${sIdx + 1}`,
      url: s.url,
      origin: `${s.addon} • ${s.quality}`,
      isWebEmbed: false
    }));

    const targetIdx = Math.max(0, embedSources.findIndex((s) => s.url === opt.url));

    const playable = {
      number: isSeries ? `T${season}E${episode}` : 'FILME',
      name: isSeries ? `${item.title} — T${season}:E${episode}` : item.title,
      group: 'MagnetFlix & Fênix',
      logo: item.poster,
      url: opt.url,
      isWebEmbed: false,
      sources: embedSources,
      seriesNav: isSeries ? { item, season: Number(season), episode: Number(episode) } : null,
      movieItem: !isSeries ? item : null,
      epg: {
        program: isSeries ? `${item.title} (Temporada ${season}, Episódio ${episode})` : item.title,
        category: `${opt.addon} • ${opt.quality} • ${audioLabel}`,
        timeSlot: isSeries ? `T${season}:E${episode}` : 'Filme Completo',
        synopsis: item.description || `Reproduzindo via ${opt.addon}.`,
        progress: 100,
        elapsed: 'Stream Direto',
        remaining: opt.quality,
        next: isSeries ? (nextEp ? `T${nextEp.season}:E${nextEp.episode}${nextEp.name ? ` • ${nextEp.name}` : ''}` : 'Último episódio') : 'Recomendados'
      }
    };

    playChannel(playable, targetIdx, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderList = () => {
    listWrap.innerHTML = '';
    let visible = streamOptions.filter((o) => matchesAudioPref(o));
    let isShowingAllFallback = false;

    if (visible.length === 0 && streamOptions.length > 0) {
      visible = streamOptions;
      isShowingAllFallback = true;
    }

    if (visible.length === 0) {
      listWrap.innerHTML = `<div class="tvos-glass p-4 rounded-2xl text-xs text-white/60">Nenhuma fonte disponível no BestCine ou Fênix para este título no momento.</div>`;
      return;
    }

    if (isShowingAllFallback && audioPreference !== 'all') {
      const label = audioPreference === 'dub' ? 'dublada' : 'com áudio original';
      const banner = document.createElement('div');
      banner.className = 'tvos-glass p-3 rounded-xl text-xs text-amber-300/90 border border-amber-500/20 mb-1 flex items-center gap-2';
      banner.innerHTML = `<span>ℹ️</span> <span>Nenhuma fonte exclusivamente ${label} detectada. Exibindo <strong>todas as fontes do BestCine e Fênix</strong>:</span>`;
      listWrap.appendChild(banner);
    }

    visible.forEach((opt) => {
      const audioTag =
        opt.isDual
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">DUAL ÁUDIO</span>'
          : opt.isDub
          ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">DUBLADO</span>'
          : '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">ORIGINAL</span>';
      const card = document.createElement('div');
      card.setAttribute('tabindex', '0');
      card.className = 'stremio-stream-card p-3.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3 border border-white/10 hover:border-emerald-400/40 transition-all';
      card.innerHTML = `
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
              opt.addon === 'BestCine' ? 'bg-blue-500/25 text-blue-300 border border-blue-400/30' : 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
            }">${escapeHtml(opt.addon)}</span>
            <span class="text-[11px] font-mono text-emerald-400 font-semibold">${escapeHtml(opt.quality)}</span>
            ${audioTag}
          </div>
          <div class="text-xs font-medium text-white/85 truncate mt-1.5">${escapeHtml(opt.title)}</div>
        </div>
        <div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow font-bold">▶</div>
      `;
      card.addEventListener('click', () => playOption(opt));
      listWrap.appendChild(card);
    });
  };

  audioBar.querySelectorAll('[data-audio-pref]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setAudioPreference(btn.dataset.audioPref, false);
      audioBar.querySelectorAll('[data-audio-pref]').forEach((b) => {
        const on = b.dataset.audioPref === audioPreference;
        b.className = `px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
          on ? 'bg-white text-black border-white shadow' : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
        }`;
      });
      renderList();
    });
  });

  renderList();

  // AutoPlay inteligente e imediato: reproduz automaticamente a melhor stream (Dublada + Maior Resolução 4K/1080p)
  if (autoPlay && streamOptions.length > 0) {
    let candidates = streamOptions.filter((s) => matchesAudioPref(s));
    if (candidates.length === 0) candidates = streamOptions;

    const best = candidates[0];
    if (best) {
      showPlayerToast(`Reproduzindo automaticamente a melhor fonte: ${best.addon} (${best.quality})...`);
      playOption(best);
      return;
    } else {
      showPlayerToast('Nenhum provedor disponível no BestCine ou Fênix.');
    }
  }
}

// ============================================================================
// 1.5 Catálogo Unificado de Canais de TV Ao Vivo (TVPlay IPFS & Tvvio)
// ============================================================================
async function loadLiveTvAddons() {
  const statusEl = document.getElementById('syncStatusText');
  const tvEndpoints = [
    { name: 'TVPlay IPFS', catalogUrl: 'https://tvplay.megaembed-frost.workers.dev/catalog/tv/tvplay.json', base: 'https://tvplay.megaembed-frost.workers.dev' },
    { name: 'Tvvio', catalogUrl: 'https://tvvio.megaembed-frost.workers.dev/catalog/tv/tvvio.json', base: 'https://tvvio.megaembed-frost.workers.dev' }
  ];

  await Promise.allSettled(
    tvEndpoints.map(async (ep) => {
      try {
        const txt = await fetchTextSafe(ep.catalogUrl, false, 8000);
        if (!txt) return;
        const data = JSON.parse(txt);
        const metas = Array.isArray(data.metas) ? data.metas : [];
        if (metas.length === 0) return;

        const isTvplay = ep.name.includes('TVPlay');
        const mappedChans = metas.map((m, idx) => {
          const rawId = String(m.id || '');
          const slug = rawId.replace(/^(ec:|ecipfs-)/, '') || `tv-${idx + 1}`;
          const genre = normalizeGroupCategory(m.name, (Array.isArray(m.genres) ? m.genres.join(' ') : ''));
          const streamJson = `${ep.base}/stream/tv/${m.id}.json`;
          const liveEmbed = `https://1210.playerembcanais.com/${slug}`;
          const vipEmbed = `/api/vipcanais-embed?slug=${slug}`;
          const vipStream = `/api/vipcanais-stream?slug=${slug}&redirect=1`;
          const vipDirectWeb = `https://vipcanais.net/minha-conta/assistir/${slug}/`;

          const sources = [
            { label: 'VIP Canais HLS (Sem Anúncios)', url: vipStream, origin: 'VIP Canais Oficial (HLS)', isHls: true },
            { label: 'VIP Canais (Web Player)', url: vipEmbed, origin: 'VIP Canais (Vitalício)', isWebEmbed: true, directFallback: vipDirectWeb },
            { label: 'Player Web HD (Livre)', url: liveEmbed, origin: `${ep.name} Web`, isWebEmbed: true },
            { label: `${ep.name} Direto`, url: streamJson, origin: ep.name, isStremioStream: true }
          ];

          return {
            name: m.name,
            number: String(idx + 1).padStart(3, '0'),
            group: genre,
            genres: m.genres && m.genres.length > 0 ? m.genres : [genre],
            subCategory: genre,
            isOpenTvAddon: genre === 'Canais Abertos',
            isTvvio: true,
            isTvplay: isTvplay,
            slug: slug,
            stremioId: m.id,
            stremioType: 'tv',
            isStremioTvMeta: false,
            logo: m.poster || m.logo || createLogoSvg(m.name, '#0284c7', '#0f172a'),
            url: vipStream,
            isWebEmbed: false,
            addonBase: ep.base,
            sources: sources,
            epg: {
              program: `${m.name} — Ao Vivo`,
              category: `${genre} • HD Digital`,
              timeSlot: 'Agora • Ao Vivo',
              synopsis: m.description || `Transmissão ao vivo de ${m.name}.`,
              progress: 60,
              elapsed: 'Ao Vivo',
              remaining: 'Sinal HD',
              next: 'Programação Contínua'
            }
          };
        });

        if (mappedChans.length > 0) {
          mergeNewChannels(mappedChans);
        }
      } catch (err) {
        console.warn(`Erro ao carregar catálogo ${ep.name}:`, err);
      }
    })
  );

  if (statusEl) {
    statusEl.textContent = `${channels.length} canais sincronizados • TVPlay IPFS • Tvvio • Nuvio Media`;
  }
}
const loadTvvioLiveChannels = loadLiveTvAddons; // backward compatibility

// ============================================================================
// 1.6 Catálogo Oficial Fenix TV (https://fenixtv.fenixhub.online/manifest.json)
// Eventos Ao Vivo, Uptv (+1800 canais), Cinegardem, Almofadinhas e Rabicho
// ============================================================================
async function loadFenixTvLiveChannels() {
  const statusEl = document.getElementById('syncStatusText');
  const fenixBase = 'https://fenixtv.fenixhub.online';
  const fenixCatalogs = [
    { id: 'tv_eventos', name: 'Eventos Ao Vivo', defaultGroup: 'Esportes' },
    { id: 'tv_nettv', name: 'Uptv Canais', defaultGroup: 'Canais Abertos' },
    { id: 'tv_exploud', name: 'Cinegardem', defaultGroup: 'Canais Abertos' },
    { id: 'tv_embedtv', name: 'Almofadinhas', defaultGroup: 'Canais Abertos' },
    { id: 'tv_reidoscanais', name: 'Rabicho', defaultGroup: 'Variedades' }
  ];

  const allDiscovered = [];

  await Promise.allSettled(
    fenixCatalogs.map(async (cat) => {
      try {
        const catUrl = `${fenixBase}/catalog/tv/${cat.id}.json`;
        const txt = await fetchTextSafe(catUrl, false, 12000);
        if (!txt) return;
        const data = JSON.parse(txt);
        const metas = Array.isArray(data.metas) ? data.metas : [];
        if (metas.length === 0) return;

        metas.forEach((m, idx) => {
          if (!m.id || !m.name) return;
          const rawGenres = Array.isArray(m.genres) ? m.genres.join(' ') : '';
          const rawDesc = m.description || '';
          const group = cat.id === 'tv_eventos'
            ? 'Esportes'
            : normalizeGroupCategory(m.name, `${rawGenres} ${rawDesc} ${cat.defaultGroup}`);
          
          const streamUrl = `${fenixBase}/stream/tv/${encodeURIComponent(m.id)}.json`;
          const isDirectStream = Array.isArray(m.streams) && m.streams.length > 0;
          const inlineStreams = isDirectStream
            ? m.streams.filter(s => s.url).map((s, sIdx) => ({
                label: (s.title || s.name || `Fenix TV ${sIdx + 1}`).replace(/^\?+\s*/, '').replace(/\n+/g, ' — ').trim(),
                url: s.url,
                origin: 'Fenix TV',
                isHls: true
              }))
            : [];

          const sources = inlineStreams.length > 0 ? inlineStreams : [
            {
              label: 'Fenix TV HD (CDN / Proxy)',
              url: streamUrl,
              origin: 'Fenix TV',
              isStremioStream: true
            }
          ];

          allDiscovered.push({
            name: m.name,
            number: String(idx + 1).padStart(3, '0'),
            group: group,
            genres: [group, ...(m.genres || [])],
            subCategory: group,
            isOpenTvAddon: group === 'Canais Abertos' || group === 'TV Aberta',
            isTvvio: true,
            isTvplay: true,
            isFenixTv: true,
            stremioId: m.id,
            stremioType: m.type || 'tv',
            isStremioTvMeta: true,
            logo: m.poster || m.logo || createLogoSvg(m.name.slice(0, 5), '#7c3aed', '#0f172a'),
            url: sources[0].url,
            isWebEmbed: false,
            addonBase: fenixBase,
            sources: sources,
            epg: {
              program: m.name,
              category: `${group} • Fenix TV`,
              timeSlot: 'Agora • Ao Vivo',
              synopsis: m.description || `Transmissão ao vivo de ${m.name} via Fenix TV.`,
              progress: 50,
              elapsed: 'Ao Vivo',
              remaining: 'Sinal Digital',
              next: 'Programação Contínua'
            }
          });
        });
      } catch (err) {
        console.warn(`Erro ao carregar Fenix TV (${cat.id}):`, err);
      }
    })
  );

  if (allDiscovered.length > 0) {
    mergeNewChannels(allDiscovered);
    if (statusEl) {
      statusEl.textContent = `${channels.length} canais sincronizados • Fenix TV • TVPlay IPFS • Tvvio • VIP Canais`;
    }
  }
}

// ============================================================================
// 1.7 Minha TV / Brazuca IPTV (https://da5f663b4690-minhatv.baby-beamup.club)
// TV Aberta, Filmes e Desenhos Infantis
// ============================================================================
async function loadMinhaTvLiveChannels() {
  const statusEl = document.getElementById('syncStatusText');
  const minhaBase = 'https://da5f663b4690-minhatv.baby-beamup.club';
  const catUrl = `${minhaBase}/catalog/tv/minhatv_channels.json`;

  try {
    const txt = await fetchTextSafe(catUrl, true, 25000);
    if (!txt) return;
    const data = JSON.parse(txt);
    const metas = Array.isArray(data.metas) ? data.metas : [];
    if (metas.length === 0) return;

    const allDiscovered = [];

    metas.forEach((m, idx) => {
      if (!m.id || !m.name) return;
      const rawGenres = Array.isArray(m.genres) ? m.genres.join(' ') : (m.genre || '');
      const cleanName = m.name
        .replace(/^Canais\s*\|\s*[^|]+\|\s*/i, '')
        .replace(/^LAT\s*\|\s*/i, '')
        .replace(/\s*\|\s*(UHD|4K|FHD|HD|SD)\b/gi, '')
        .replace(/\b(UHD|4K|FHD|HD|SD)\b/gi, '')
        .trim();
      const group = normalizeGroupCategory(cleanName, `${rawGenres} ${m.description || ''} ${m.name}`);

      const streamUrl = `${minhaBase}/stream/tv/${encodeURIComponent(m.id)}.json`;
      const isDirectStream = Array.isArray(m.streams) && m.streams.length > 0;
      const inlineStreams = isDirectStream
        ? m.streams
            .filter((s) => s.url && !/livepix|pix\b|apoie|doacao/i.test(s.url + ' ' + (s.title || '') + ' ' + (s.name || '')))
            .map((s, sIdx) => ({
              label: (s.title || s.name || `Minha TV / Brazuca ${sIdx + 1}`).replace(/^\?+\s*/, '').replace(/\n+/g, ' — ').trim(),
              url: s.url,
              origin: 'Minha TV (Brazuca)',
              isHls: true
            }))
        : [];

      const sources = inlineStreams.length > 0 ? inlineStreams : [
        {
          label: 'Minha TV / Brazuca (HD/4K)',
          url: streamUrl,
          origin: 'Minha TV (Brazuca)',
          isStremioStream: true
        }
      ];

      allDiscovered.push({
        name: cleanName,
        number: String(idx + 1).padStart(3, '0'),
        group: group,
        genres: [group, ...(m.genres || [])],
        subCategory: group,
        isOpenTvAddon: group === 'Canais Abertos' || group === 'TV Aberta',
        isTvvio: true,
        isMinhaTv: true,
        isBrazuca: true,
        stremioId: m.id,
        stremioType: m.type || 'tv',
        isStremioTvMeta: true,
        logo: m.poster || m.logo || createLogoSvg(cleanName.slice(0, 5), '#0284c7', '#0f172a'),
        url: sources[0].url,
        isWebEmbed: false,
        addonBase: minhaBase,
        sources: sources,
        epg: {
          program: cleanName,
          category: `${group} • Minha TV Brazuca`,
          timeSlot: 'Agora • Ao Vivo',
          synopsis: m.description || `Transmissão ao vivo de ${cleanName} via Minha TV / Brazuca.`,
          progress: 50,
          elapsed: 'Ao Vivo',
          remaining: 'Sinal Digital',
          next: 'Programação Contínua'
        }
      });
    });

    if (allDiscovered.length > 0) {
      mergeNewChannels(allDiscovered);
      if (statusEl) {
        statusEl.textContent = `${channels.length} canais sincronizados • Minha TV • BestCine • Fenix TV • VIP Canais`;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar Minha TV / Brazuca:', err);
  }
}

// ============================================================================
// 1.8 BestCine TV Ao Vivo (https://bestcine.dpdns.org - Todos os Canais)
// ============================================================================
async function loadBestCineLiveChannels() {
  // BestCine upstream offline — desativado para prevenir imagens de "fora do ar"
  return;
}

// ============================================================================
// 1.83 Catálogo Oficial Saimo TV & VOD (350+ Canais Ao Vivo + Filmes & Séries HD)
// ============================================================================
async function loadSaimoChannelsAndVod() {
  const statusEl = document.getElementById('syncStatusText');
  try {
    const chTxt = await fetchWithTimeout('/api/saimo-channels', 4000);
    if (chTxt) {
      const data = JSON.parse(chTxt);
      if (Array.isArray(data.channels) && data.channels.length > 0) {
        mergeNewChannels(data.channels);
        if (statusEl) {
          statusEl.textContent = `${channels.length} canais sincronizados • Saimo TV • Tvvio • Fenix • VIP Canais`;
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar canais Saimo TV:', e);
  }

  try {
    const vodTxt = await fetchWithTimeout('/api/saimo-vod', 4000);
    if (vodTxt) {
      const vodData = JSON.parse(vodTxt);
      if (vodData.highlights) {
        if (Array.isArray(vodData.highlights.movies) && vodData.highlights.movies.length > 0) {
          stremioCatalog.trendingMovies.unshift(...vodData.highlights.movies);
          nuvioCatalog.magnetFlixMovies.unshift(...vodData.highlights.movies);
        }
        if (Array.isArray(vodData.highlights.series) && vodData.highlights.series.length > 0) {
          stremioCatalog.trendingSeries.unshift(...vodData.highlights.series);
          nuvioCatalog.magnetFlixSeries.unshift(...vodData.highlights.series);
        }
        renderRightContentArea();
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar VOD Saimo TV:', e);
  }
}

// ============================================================================
// 1.84 Catálogo Oficial MagnetFlix (Filmes & Séries em 4K/HD Dublados PT-BR)
// ============================================================================
async function loadMagnetFlixCatalogs() {
  const magnetBase = 'https://magnetflix.flixbr.online/qualities%3D4k%2C1080p%2C720p%2Csd%7Caudio%3Ddublado%2Clegendado%7Ccatalogs%3Dpopulares_movie%2Cpopulares_series%2Crecentes_servidor_movie%2Crecentes_servidor_series%2Cemalta_movie%2Cemalta_series';
  const movieCatIds = ['populares_movie', 'recentes_servidor_movie', 'emalta_movie', 'popular'];
  const seriesCatIds = ['populares_series', 'recentes_servidor_series', 'emalta_series', 'popular'];

  await Promise.allSettled([
    ...movieCatIds.map(async (catId) => {
      try {
        const url = `${magnetBase}/catalog/movie/${catId}.json`;
        const txt = await fetchTextSafe(url, false, 5000);
        if (!txt) return;
        const d = JSON.parse(txt);
        const metas = Array.isArray(d.metas) ? d.metas : [];
        const mapped = metas.map((m) => ({
          ...mapCinemetaItem(m, 'movie'),
          badge: 'MAGNETFLIX HD',
          subtitle: `MagnetFlix • ${m.releaseInfo || 'Dublado / Legendado'}`,
          addonBase: magnetBase,
          isMagnetFlix: true
        }));
        mapped.forEach((item) => {
          if (!nuvioCatalog.magnetFlixMovies.some((x) => (x.imdbId || x.title) === (item.imdbId || item.title))) {
            nuvioCatalog.magnetFlixMovies.push(item);
          }
        });
      } catch (_) {}
    }),
    ...seriesCatIds.map(async (catId) => {
      try {
        const url = `${magnetBase}/catalog/series/${catId}.json`;
        const txt = await fetchTextSafe(url, false, 5000);
        if (!txt) return;
        const d = JSON.parse(txt);
        const metas = Array.isArray(d.metas) ? d.metas : [];
        const mapped = metas.map((m) => ({
          ...mapCinemetaItem(m, 'series'),
          badge: 'MAGNETFLIX HD',
          subtitle: `MagnetFlix • ${m.releaseInfo || 'Dublado / Legendado'}`,
          addonBase: magnetBase,
          isMagnetFlix: true
        }));
        mapped.forEach((item) => {
          if (!nuvioCatalog.magnetFlixSeries.some((x) => (x.imdbId || x.title) === (item.imdbId || item.title))) {
            nuvioCatalog.magnetFlixSeries.push(item);
          }
        });
      } catch (_) {}
    })
  ]);

  if (activeNavTab === 'movies' || activeNavTab === 'series') {
    renderAll();
  }
}

// ============================================================================
// 1.85 Catálogo IPTV (https://catalogo-iptv-production.up.railway.app)
// Canais Ao Vivo (TV)
// ============================================================================
async function loadCatalogoIptvLiveChannels() {
  const statusEl = document.getElementById('syncStatusText');
  const iptvBase = 'https://catalogo-iptv-production.up.railway.app';
  const manifestUrl = `${iptvBase}/manifest.json`;

  try {
    let manifest = null;
    try {
      const manifestTxt = await fetchTextSafe(manifestUrl, true, 8000);
      if (manifestTxt) {
        manifest = JSON.parse(manifestTxt);
      }
    } catch (_) {}

    const tvCatalogs = [];
    if (manifest && Array.isArray(manifest.catalogs)) {
      manifest.catalogs.forEach((c) => {
        if (c.type === 'tv' || /canal|tv|iptv|live/i.test(c.id || c.name || '')) {
          tvCatalogs.push(c);
        }
      });
    }

    if (tvCatalogs.length === 0) {
      tvCatalogs.push(
        { id: 'catalogo-iptv', name: 'Catálogo IPTV', type: 'tv' },
        { id: 'iptv-channels', name: 'Canais Ao Vivo', type: 'tv' },
        { id: 'channels', name: 'Canais', type: 'tv' },
        { id: 'tv', name: 'TV', type: 'tv' }
      );
    }

    const allDiscovered = [];

    await Promise.allSettled(
      tvCatalogs.map(async (cat) => {
        try {
          const catUrl = `${iptvBase}/catalog/tv/${encodeURIComponent(cat.id)}.json`;
          const txt = await fetchTextSafe(catUrl, true, 12000);
          if (!txt) return;
          const data = JSON.parse(txt);
          const metas = Array.isArray(data.metas) ? data.metas : [];
          if (metas.length === 0) return;

          metas.forEach((m, idx) => {
            if (!m.id || !m.name) return;
            const rawGenres = Array.isArray(m.genres) ? m.genres.join(' ') : (m.genre || '');
            const cleanName = m.name
              .replace(/\s*\|\s*IPTV/gi, '')
              .replace(/\s*\|\s*(UHD|4K|FHD|HD|SD)\b/gi, '')
              .replace(/\b(UHD|4K|FHD|HD|SD)\b/gi, '')
              .trim();
            const group = normalizeGroupCategory(cleanName, `${rawGenres} ${m.description || ''} ${m.name} ${cat.name || ''}`);

            const streamUrl = `${iptvBase}/stream/tv/${encodeURIComponent(m.id)}.json`;
            const isDirectStream = Array.isArray(m.streams) && m.streams.length > 0;
            const inlineStreams = isDirectStream
              ? m.streams.filter((s) => s.url).map((s, sIdx) => ({
                  label: (s.title || s.name || `Catálogo IPTV ${sIdx + 1}`).replace(/^\?+\s*/, '').replace(/\n+/g, ' — ').trim(),
                  url: s.url,
                  origin: 'Catálogo IPTV',
                  isHls: true
                }))
              : [];

            const sources = inlineStreams.length > 0 ? inlineStreams : [
              {
                label: 'Catálogo IPTV Ao Vivo (HD)',
                url: streamUrl,
                origin: 'Catálogo IPTV',
                isStremioStream: true
              }
            ];

            allDiscovered.push({
              name: cleanName,
              number: String(idx + 1).padStart(3, '0'),
              group: group,
              genres: [group, ...(m.genres || [])],
              subCategory: group,
              isOpenTvAddon: group === 'Canais Abertos' || group === 'TV Aberta',
              isTvvio: true,
              isCatalogoIptv: true,
              stremioId: m.id,
              stremioType: m.type || 'tv',
              isStremioTvMeta: true,
              logo: m.poster || m.background || createLogoSvg(cleanName.slice(0, 5), '#0284c7', '#0f172a'),
              url: sources[0].url,
              isWebEmbed: false,
              addonBase: iptvBase,
              sources: sources,
              epg: {
                program: cleanName,
                category: `${group} • Catálogo IPTV`,
                timeSlot: 'Agora • Ao Vivo',
                synopsis: m.description || `Transmissão ao vivo de ${cleanName} via Catálogo IPTV.`,
                progress: 50,
                elapsed: 'Ao Vivo',
                remaining: 'Sinal Digital',
                next: 'Programação Contínua'
              }
            });
          });
        } catch (_) {}
      })
    );

    if (allDiscovered.length > 0) {
      mergeNewChannels(allDiscovered);
      if (statusEl) {
        statusEl.textContent = `${channels.length} canais sincronizados • Catálogo IPTV • BestCine • Minha TV • Fenix TV`;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar Catálogo IPTV:', err);
  }
}

// ============================================================================
// 2. Carregamento de Canais de Esportes Adicionais (FrostView TV & Fênix)
// ============================================================================
async function loadAllRealLiveChannels() {
  const statusEl = document.getElementById('syncStatusText');

  // Busca diretamente os catálogos de TV Ao Vivo dos addons FrostView TV e Fênix!
  const frostAndFenixEndpoints = activeAddonEndpoints.filter((e) => /frostview|fenix/i.test(e.name));
  const candidateTvPaths = [
    '/catalog/tv/frostview-tv-channels.json',
    '/catalog/tv/frostview-tv-channels/genre=TV%20Aberta.json',
    '/catalog/tv/frostview-tv-channels/genre=Abertos.json',
    '/catalog/tv/fenixflix_tv.json',
    '/catalog/tv/fenix.json',
    '/catalog/tv/canais.json',
    '/catalog/tv/tv.json'
  ];

  const discoveredTvChannels = [];

  await Promise.allSettled(
    frostAndFenixEndpoints.flatMap((ep) =>
      candidateTvPaths.map(async (pathSuffix) => {
        const isFenixPath = pathSuffix.includes('fenix');
        const isFrostPath = pathSuffix.includes('frostview');
        if (isFenixPath && !/fenix/i.test(ep.name)) return;
        if (isFrostPath && !/frostview/i.test(ep.name)) return;

        const txt = await fetchTextSafe(`${ep.baseUrl}${pathSuffix}`, false, 2400);
        if (!txt) return;
        try {
          const data = JSON.parse(txt);
          const metas = Array.isArray(data.metas) ? data.metas : [];
          const originTag = /fenix/i.test(ep.name) ? 'Fênix TV' : 'FrostView TV';

          metas.forEach((m) => {
            const cName = m.name || `Canal ${originTag}`;
            if (/frostview/i.test(originTag) && !isAllowedSportsChannel(cName)) return;
            const rawGenreStr = m.genres?.join(' ') || '';
            const groupCat = isAllowedSportsChannel(cName) ? 'Esportes' : normalizeGroupCategory(cName, rawGenreStr);
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
    .filter((c) => c.group === 'Esportes' || isAllowedSportsChannel(c.name))
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
    statusEl.textContent = `${channels.length} canais • FrostView TV • FrostStream • FenixFlix (Nuvio Engine)`;
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
    try {
      if (window.location.hash !== `#${tabName}`) {
        window.location.hash = `#${tabName}`;
      }
    } catch (_) {}

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

    // Show/hide Stremio Genre bar when on Filmes ou Séries
    const genreBar = document.getElementById('stremioGenreBar');
    if (genreBar) {
      genreBar.classList.toggle('hidden', tabName !== 'movies' && tabName !== 'series');
    }

    if (tabName === 'profile') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      updateLayoutSectionsVisibility();
      renderNuvioAccountModalContent();
      if (window.lucide) lucide.createIcons();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    } else if (tabName === 'board') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      renderAll();
      return;
    } else if (tabName === 'live') {
      isPlayerVisibleOnHub = true;
      setCategoryChip('TV Aberta', false);
      renderAll();
      if ((!currentChannel || currentChannel.group === 'Esportes' || currentChannel.number === 'FILME' || String(currentChannel.number || '').startsWith('T')) && channels.length > 0) {
        const openTv = channels.find((c) => c.group === 'TV Aberta') || channels[0];
        playChannel(openTv, 0);
      }
      return;
    } else if (tabName === 'sports') {
      isPlayerVisibleOnHub = true;
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
      if (nuvioCatalog.magnetFlixMovies.length === 0) {
        loadMagnetFlixCatalogs();
      }
      renderAll();
      return;
    } else if (tabName === 'anime') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      genreBar?.classList.add('hidden');
      renderAll();
      return;
    } else if (tabName === 'series') {
      isPlayerVisibleOnHub = false;
      currentChannel = null;
      destroyPlayers();
      document.getElementById('liveStageSection')?.classList.add('hidden');
      if (nuvioCatalog.magnetFlixSeries.length === 0) {
        loadMagnetFlixCatalogs();
      }
      renderAll();
      return;
    }

    renderAll();
  };

  window.activateTab = activateTab;

  document.querySelectorAll('[data-nav-tab]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activateTab(btn.dataset.navTab);
    });
  });

  document.querySelectorAll('[data-rail-btn]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activateTab(btn.dataset.railBtn);
    });
  });

  document.getElementById('brandHomeBtn')?.addEventListener('click', () => activateTab('board'));
  document.getElementById('btnBackToHomeFromProfile')?.addEventListener('click', () => activateTab('board'));
  document.getElementById('btnVerTodoHistorico')?.addEventListener('click', () => {
    activateTab('profile');
    setTimeout(() => {
      document.querySelector('[data-nuvio-tab="history"]')?.click();
    }, 50);
  });

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

  document.getElementById('btnRailFavorites')?.addEventListener('click', () => {
    activateTab('live');
    setCategoryChip('Favoritos', true);
  });

  document.getElementById('btnRailAddons')?.addEventListener('click', () => {
    document.getElementById('sourcesModal')?.classList.remove('hidden');
  });

  // Inicializa o seletor de áudio (Dublado / Legendado / Todos) dos painéis de séries e filmes
  initStageAudioSelector();
  initStageMovieAudioSelector();
  PlayerAudioSubsManager.init();

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
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        const delta = e.deltaX || e.deltaY;
        if (delta !== 0) {
          e.preventDefault();
          genrePillsBar.scrollLeft += delta;
        }
      }
    },
    { passive: false }
  );

  // Category Chips + Botões de Rolagem Horizontal (‹ / ›) + Arrastar com Mouse
  document.querySelectorAll('[data-cat-pill]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const targetCat = chip.dataset.catPill;
      if (activeNavTab !== 'live') {
        activeNavTab = 'live';
        syncNavButtons('live');
      }
      setCategoryChip(targetCat, true);
    });
  });

  const setupCatBarScroll = (barId, btnLeftId, btnRightId) => {
    const bar = document.getElementById(barId);
    const bLeft = document.getElementById(btnLeftId);
    const bRight = document.getElementById(btnRightId);
    if (!bar) return;
    bLeft?.addEventListener('click', () => {
      bar.scrollBy({ left: -180, behavior: 'smooth' });
    });
    bRight?.addEventListener('click', () => {
      bar.scrollBy({ left: 180, behavior: 'smooth' });
    });
    bar.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
          const delta = e.deltaX || e.deltaY;
          if (delta !== 0) {
            e.preventDefault();
            bar.scrollLeft += delta;
          }
        }
      },
      { passive: false }
    );
  };

  setupCatBarScroll('categoryFilterPills', 'btnCatScrollLeft', 'btnCatScrollRight');
  setupCatBarScroll('categoryFilterPillsHorizontal', 'btnCatHScrollLeft', 'btnCatHScrollRight');

  // Arrastar com o mouse (Drag Scroll) nas barras horizontais de categorias e temas
  const enableMouseDragScroll = (elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    let isDrag = false;
    let startX = 0;
    let scrollStart = 0;
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDrag = true;
      startX = e.pageX - el.offsetLeft;
      scrollStart = el.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      isDrag = false;
    });
    el.addEventListener('mousemove', (e) => {
      if (!isDrag) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollStart - (x - startX) * 1.4;
    });
  };

  enableMouseDragScroll('categoryFilterPills');
  enableMouseDragScroll('categoryFilterPillsHorizontal');
  enableMouseDragScroll('stremioGenrePills');

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

  // Função global invocada pelo teclado nativo da Android TV ou ponte Java
  window.handleGlobalSearch = function (text) {
    const sInput = document.getElementById('globalSearchInput');
    const btnClear = document.getElementById('btnClearSearch');
    if (sInput) {
      sInput.value = text || '';
    }
    const val = (text || '').trim();
    searchQuery = val.toLowerCase();
    btnClear?.classList.toggle('hidden', !searchQuery);

    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    if (!searchQuery) {
      isSearchingCatalog = false;
      stremioCatalog.searchResults = [];
      renderAll();
      return;
    }

    isSearchingCatalog = true;
    stremioCatalog.searchResults = [];
    renderAll();

    if (searchQuery.length >= 2) {
      searchStremioAndComandoPlay(val);
    }
  };

  searchInput?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    searchQuery = val.toLowerCase();
    btnClearSearch?.classList.toggle('hidden', !searchQuery);

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

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchStremioAndComandoPlay(searchInput.value.trim());
    }
  });

  btnClearSearch?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    isSearchingCatalog = false;
    stremioCatalog.searchResults = [];
    btnClearSearch?.classList.add('hidden');
    renderAll();
  });

  // Numeric Channel Input (CH 001)
  const chInput = document.getElementById('channelNumberInput');
  chInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
    if (e.target.value.length === 3) {
      tuneByChannelNumber(e.target.value);
      setTimeout(() => (e.target.value = ''), 600);
    }
  });

  chInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chInput.value.trim()) {
      tuneByChannelNumber(chInput.value.trim());
      chInput.value = '';
      chInput.blur();
    }
  });

  // Smart TV Keyboard Navigation (Fallback global para números/escape; navegação D-Pad é gerenciada por tv-navigation.js)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('stremioMetaModal')?.classList.add('hidden');
      document.getElementById('sourcesModal')?.classList.add('hidden');
      return;
    }

    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleGlobalNumberKey(e.key);
      return;
    }
  });

  // Player Action Buttons
  document.getElementById('btnNextEpisode')?.addEventListener('click', () => playNextEpisode());
  document.getElementById('btnNextEpisodeStage')?.addEventListener('click', () => playNextEpisode());
  document.getElementById('btnNextEpisodeOverlay')?.addEventListener('click', () => playNextEpisode());
  document.getElementById('btnNextSource')?.addEventListener('click', () => {
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

  document.getElementById('btnToggleProxy')?.addEventListener('click', (e) => {
    useProxy = !useProxy;
    const s = e.currentTarget.querySelector('span');
    if (s) s.textContent = useProxy ? 'Proxy Ativo' : 'Direto';
    showPlayerToast(useProxy ? 'Proxy Anti-CORS ativado' : 'Conexão direta ativada');
    if (currentChannel) playChannel(currentChannel, currentSourceIdx);
  });

  document.getElementById('btnOpenStremioApp')?.addEventListener('click', () => {
    if (!currentChannel) return;
    const id = currentChannel.imdbId || currentChannel.stremioId || currentChannel.id;
    const type = currentChannel.seriesNav ? 'series' : (currentChannel.group === 'filmes' || currentChannel.number === 'FILME' ? 'movie' : 'series');
    if (id && String(id).startsWith('tt')) {
      window.location.href = `stremio:///detail/${type}/${id}`;
      showPlayerToast('Abrindo título no aplicativo Stremio...');
    } else {
      window.location.href = `stremio:///`;
      showPlayerToast('Abrindo aplicativo Stremio...');
    }
  });

  document.getElementById('btnOpenVlc')?.addEventListener('click', () => {
    if (!currentChannel) return;
    const directSrc = currentChannel.sources?.find((s) => !s.isWebEmbed && !s.url.endsWith('.json'))?.url ||
      currentChannel.sources?.[currentSourceIdx]?.url || currentChannel.url;
    window.location.href = `vlc://${directSrc}`;
    showPlayerToast('Enviando para o VLC Media Player...');
  });

  // Meta Modal Close
  document.getElementById('btnCloseMetaModal')?.addEventListener('click', () => {
    document.getElementById('stremioMetaModal')?.classList.add('hidden');
  });

  // Sources & Addons Modal
  const sourcesModal = document.getElementById('sourcesModal');
  const openSources = () => sourcesModal?.classList.remove('hidden');
  document.getElementById('btnOpenSourcesModal')?.addEventListener('click', openSources);
  document.getElementById('btnMobileSources')?.addEventListener('click', openSources);
  document.getElementById('btnCloseSourcesModal')?.addEventListener('click', () => {
    sourcesModal?.classList.add('hidden');
  });

  // Nuvio Account Manager (techuhak/Nuvio-Account-Manager)
  const openNuvioAccount = () => {
    activateTab('profile');
  };
  document.getElementById('btnOpenNuvioAccountModal')?.addEventListener('click', openNuvioAccount);
  document.getElementById('btnMobileAccount')?.addEventListener('click', openNuvioAccount);
  document.getElementById('btnCloseNuvioAccountModal')?.addEventListener('click', () => {
    activateTab('board');
  });

  // Tabs do Nuvio Account Manager
  document.querySelectorAll('[data-nuvio-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('[data-nuvio-tab]').forEach((b) => {
        b.classList.remove('active', 'text-white');
        b.classList.add('text-white/60');
      });
      tabBtn.classList.add('active', 'text-white');
      tabBtn.classList.remove('text-white/60');

      const tab = tabBtn.dataset.nuvioTab;
      document.getElementById('nuvioTabAccounts')?.classList.toggle('hidden', tab !== 'accounts');
      document.getElementById('nuvioTabHistory')?.classList.toggle('hidden', tab !== 'history');
      document.getElementById('nuvioTabFavorites')?.classList.toggle('hidden', tab !== 'favorites');
      document.getElementById('nuvioTabBackup')?.classList.toggle('hidden', tab !== 'backup');
      if (window.lucide) lucide.createIcons();
    });
  });

  // Login Nuvio
  document.getElementById('btnNuvioLoginSubmit')?.addEventListener('click', async () => {
    const email = document.getElementById('nuvioLoginEmailInput')?.value.trim();
    const pass = document.getElementById('nuvioLoginPassInput')?.value;
    if (!email || !pass) {
      showPlayerToast('Por favor, informe e-mail e senha.');
      return;
    }
    showPlayerToast('Conectando à conta Nuvio...');
    try {
      await NuvioAccountManager.loginNuvioAccount(email, pass);
      document.getElementById('nuvioLoginEmailInput').value = '';
      document.getElementById('nuvioLoginPassInput').value = '';
      renderNuvioAccountModalContent();
      showPlayerToast('✓ Conta Nuvio sincronizada com sucesso!');
    } catch (err) {
      showPlayerToast(`Falha no login: ${err.message}`);
    }
  });

  // Criar Perfil
  document.getElementById('btnCreateNewProfile')?.addEventListener('click', () => {
    const nameInput = document.getElementById('nuvioNewProfileNameInput');
    const name = nameInput?.value.trim();
    if (!name) {
      showPlayerToast('Digite um nome para o perfil.');
      return;
    }
    NuvioAccountManager.createProfile(name);
    nameInput.value = '';
    renderNuvioAccountModalContent();
    showPlayerToast(`✓ Perfil "${name}" criado com sucesso!`);
  });

  // Clonar Perfil Ativo
  document.getElementById('btnCloneActiveProfile')?.addEventListener('click', () => {
    const active = NuvioAccountManager.getActiveAccount();
    NuvioAccountManager.cloneAccount(active.id, `${active.name} (Cópia)`);
    renderNuvioAccountModalContent();
    showPlayerToast(`✓ Perfil "${active.name}" clonado com sucesso!`);
  });

  // Limpar Histórico
  document.getElementById('btnClearAllNuvioHistory')?.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar todo o histórico de reprodução deste perfil?')) {
      NuvioAccountManager.clearAllHistory();
      renderNuvioAccountModalContent();
      showPlayerToast('✓ Histórico limpo.');
    }
  });

  // Filtros de Favoritos
  document.querySelectorAll('#nuvioFavFilterBtns [data-fav-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nuvioFavFilterBtns [data-fav-filter]').forEach((b) => {
        b.classList.remove('bg-white', 'text-black');
        b.classList.add('text-white/60');
      });
      btn.classList.add('bg-white', 'text-black');
      btn.classList.remove('text-white/60');
      renderNuvioFavoritesList(btn.dataset.favFilter);
    });
  });

  // Exportar Backup JSON
  document.getElementById('btnExportNuvioBackup')?.addEventListener('click', () => {
    NuvioAccountManager.exportBackup();
  });

  // Importar Backup JSON
  document.getElementById('nuvioBackupFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const ok = await NuvioAccountManager.importBackup(ev.target.result);
      if (ok) renderNuvioAccountModalContent();
    };
    reader.readAsText(file);
  });

  // Migrar do Stremio
  document.getElementById('btnMigrateFromStremio')?.addEventListener('click', () => {
    NuvioAccountManager.syncLegacyFavorites();
    const count = favorites.size;
    renderNuvioAccountModalContent();
    showPlayerToast(`✓ Sincronizados ${count} canais favoritos do Stremio para o Nuvio!`);
  });

  // Player Favorite Button
  document.getElementById('btnPlayerFavorite')?.addEventListener('click', () => {
    if (currentChannel) {
      NuvioAccountManager.toggleFavorite(currentChannel);
      updatePlayerFavoriteButton();
    }
  });

  document.getElementById('btnAddStremioAddon')?.addEventListener('click', async () => {
    const addonUrl = document.getElementById('stremioAddonUrlInput')?.value.trim();
    if (!addonUrl) return;
    sourcesModal?.classList.add('hidden');

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
    showPlayerToast('Addon Nuvio instalado com sucesso!');
  });

  document.getElementById('btnSearchComandoPlay')?.addEventListener('click', async () => {
    const q = document.getElementById('comandoPlayQueryInput')?.value.trim();
    if (!q) return;
    sourcesModal?.classList.add('hidden');
    await searchStremioAndComandoPlay(q);
  });

  document.querySelectorAll('[data-repo-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      sourcesModal?.classList.add('hidden');
      const action = btn.dataset.repoAction;
      if (action === 'super-all') {
        showPlayerToast('Sincronizando Addons Nuvio (FrostView + FrostStream + Fênix)...');
        await loadBestCineAndBrazucaAddons();
        await loadAllRealLiveChannels();
        await loadComandoPlayCatalog();
      }
      if (action === 'frostview') {
        showPlayerToast('Sincronizando canais IPTV do FrostView TV...');
        await loadBestCineAndBrazucaAddons();
      }
      if (action === 'fenix') {
        showPlayerToast('Sincronizando catálogo e canais FenixFlix...');
        await loadBestCineAndBrazucaAddons();
        await loadAllRealLiveChannels();
      }
      if (action === 'froststream') {
        showPlayerToast('Sincronizando catálogo FrostStream...');
        await loadBestCineAndBrazucaAddons();
      }
    });
  });

  document.getElementById('btnScanCustomGh')?.addEventListener('click', async () => {
    const repo = document.getElementById('customGhRepoInput')?.value.trim();
    if (!repo) return;
    sourcesModal?.classList.add('hidden');
    await loadGithubRepoCatalog(repo, repo);
  });

  document.getElementById('btnLoadCustomM3u')?.addEventListener('click', async () => {
    const url = document.getElementById('customM3uUrlInput')?.value.trim();
    if (!url) return;
    sourcesModal?.classList.add('hidden');
    await loadM3uPlaylistUrl(url, 'Lista M3U');
  });

  document.getElementById('customM3uFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const added = parseCatalogTextToChannels(ev.target.result, file.name);
      mergeNewChannels(added, `Arquivo ${file.name} importado`);
      sourcesModal?.classList.add('hidden');
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
      c.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
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
    const activeEl = document.querySelector('.channel-card.active, .vod-card.active-playing-channel');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, 60);
}

// ============================================================================
// Renderização da Interface (Hub Inicial Apple TV + Canal Aberto + Esportes + Busca Limpa)
// ============================================================================
function renderAll() {
  filterChannelList();
  updateLayoutSectionsVisibility();
  renderAppleTvHeroHub();
  renderContinuarAssistindoRail();
  renderChannelSidebar();
  renderRightContentArea();
  if (window.lucide) lucide.createIcons();
}

function updateLayoutSectionsVisibility() {
  const sidebar = document.getElementById('channelSidebar');
  const heroHub = document.getElementById('appleTvHeroHub');
  const liveStage = document.getElementById('liveStageSection');
  const genreBar = document.getElementById('stremioGenreBar');
  const profileView = document.getElementById('profileView');
  const rightSection = document.getElementById('rightScrollSection');

  // MODO PERFIL EM TELA CHEIA (Apple tvOS / Liquid Glass)
  if (activeNavTab === 'profile') {
    sidebar?.classList.add('hidden');
    heroHub?.classList.add('hidden');
    liveStage?.classList.add('hidden');
    genreBar?.classList.add('hidden');
    document.getElementById('horizontalChannelsCategoryBar')?.classList.add('hidden');
    document.getElementById('continuarAssistindoSection')?.classList.add('hidden');
    rightSection?.classList.add('hidden');
    profileView?.classList.remove('hidden');
    return;
  }

  // Fora do perfil: esconde a view de perfil e exibe a área principal
  profileView?.classList.add('hidden');
  rightSection?.classList.remove('hidden');

  // 1. MODO BUSCA ATIVA: Oculta TUDO (Hero, Barra Lateral, Filtros) para focar 100% na busca
  if (searchQuery) {
    sidebar?.classList.add('hidden');
    heroHub?.classList.add('hidden');
    if (isPlayerVisibleOnHub && (currentMovieItem || currentChannel)) {
      liveStage?.classList.remove('hidden');
    } else {
      liveStage?.classList.add('hidden');
    }
    genreBar?.classList.add('hidden');
    document.getElementById('horizontalChannelsCategoryBar')?.classList.add('hidden');
    document.getElementById('continuarAssistindoSection')?.classList.add('hidden');
    return;
  }

  // 2. MODO NAVEGAÇÃO POR ABAS (Hub Inicial Apple TV | Canal Aberto | Esportes | Filmes | Séries)
  const isLiveOrSportsTab = activeNavTab === 'live' || activeNavTab === 'sports';

  // Barra lateral vertical desabilitada: a lista de canais com categorias agora é 100% horizontal abaixo do player!
  sidebar?.classList.add('hidden');

  // Barra Horizontal de Categorias de Canais (abaixo do player nas abas Canais e Esportes)
  const catHBar = document.getElementById('horizontalChannelsCategoryBar');
  catHBar?.classList.toggle('hidden', !isLiveOrSportsTab);

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
  if (rightSection) {
    const isPlayerOpen = !liveStage?.classList.contains('hidden');
    rightSection.classList.toggle('mobile-player-top', isLiveOrSportsTab && isPlayerOpen);
  }
}

function getHeroFeaturedItems() {
  const pool = [
    ...(nuvioCatalog.magnetFlixMovies || []).slice(0, 4),
    ...(nuvioCatalog.magnetFlixSeries || []).slice(0, 3),
    ...(nuvioCatalog.fenixMovies || []).slice(0, 2),
    ...(nuvioCatalog.frostStreamMovies || []).slice(0, 2),
    ...stremioCatalog.trendingMovies.slice(0, 4),
    ...(nuvioCatalog.fenixSeries || []).slice(0, 2),
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
  if (unique.length === 0) {
    return [
      {
        title: 'Deadpool & Wolverine',
        type: 'movie',
        poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        background: 'https://image.tmdb.org/t/p/original/yDHYTjA3R0neXjRIad42Y4PfSZm.jpg',
        badge: '★ 8.8 IMDb',
        subtitle: '2024',
        genres: ['Ação', 'Comédia', 'Ficção'],
        description: 'Wolverine se recupera quando cruza o caminho do tagarela Deadpool. Juntos, eles formam uma aliança relutante contra um inimigo comum.',
        addon: 'FrostStream • Nuvio'
      },
      {
        title: 'Duna: Parte 2',
        type: 'movie',
        poster: 'https://image.tmdb.org/t/p/w500/czembW0RJJrbtQIbt4457p8006V.jpg',
        background: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg',
        badge: '★ 8.9 IMDb',
        subtitle: '2024',
        genres: ['Ficção Científica', 'Aventura'],
        description: 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.',
        addon: 'FenixFlix • Nuvio'
      },
      {
        title: 'Arcane',
        type: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397FQ3OJt2.jpg',
        background: 'https://image.tmdb.org/t/p/original/2wT5B3kM0eMbmFp004fC9V4659f.jpg',
        badge: '★ 9.0 IMDb',
        subtitle: '2024',
        genres: ['Animação', 'Ação', 'Fantasia'],
        description: 'Em meio ao conflito entre as cidades-gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas.',
        addon: 'FrostStream • Nuvio'
      }
    ];
  }
  return unique;
}

function renderContinuarAssistindoRail() {
  const section = document.getElementById('continuarAssistindoSection');
  const rail = document.getElementById('continuarAssistindoRail');
  const countBadge = document.getElementById('continuarAssistindoCount');
  if (!section || !rail) return;

  // Só exibe na aba 'board' (Início) e se não houver busca ativa
  if (activeNavTab !== 'board' || searchQuery) {
    section.classList.add('hidden');
    return;
  }

  const list = NuvioAccountManager.getContinueWatchingList();
  if (!list || list.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  if (countBadge) countBadge.textContent = list.length;
  rail.innerHTML = '';

  list.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'vod-card continue-watching-card group flex-shrink-0 cursor-pointer relative select-none rounded-2xl overflow-hidden tvos-glass border border-white/10 hover:border-white/35 transition-all duration-300';
    card.style.width = '240px';
    card.tabIndex = 0;

    const remainingSecs = Math.max(0, (item.duration || 3600) - (item.currentTime || 0));
    const minsLeft = Math.max(1, Math.round(remainingSecs / 60));
    const tagText = minsLeft > 60 ? `Faltam ${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `Faltam ${minsLeft} min`;
    const isSeries = item.type === 'series' || Boolean(item.season);
    const epLabel = isSeries && item.season ? `T${item.season}:E${item.episode}` : (isSeries ? 'Série' : 'Filme');

    const thumb = item.banner || item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

    card.innerHTML = `
      <div class="relative w-full aspect-video bg-black/60 overflow-hidden">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="if(this.src!=='${escapeHtml(item.poster || '')}') this.src='${escapeHtml(item.poster || '')}'; else this.style.display='none';" />
        
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
        
        <!-- Play hover icon -->
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="w-10 h-10 rounded-full bg-white/95 text-black flex items-center justify-center shadow-xl">
            <svg class="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>

        <!-- Badges -->
        <div class="absolute top-2 left-2 flex items-center gap-1.5">
          <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/75 text-purple-300 border border-white/15 backdrop-blur-md">
            ${escapeHtml(epLabel)}
          </span>
        </div>

        <!-- Tag tempo restante / porcentagem -->
        <div class="absolute bottom-2 right-2">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/85 text-white/90 border border-white/10 backdrop-blur-md">
            ${escapeHtml(tagText)} • ${item.percentage}%
          </span>
        </div>

        <!-- Botão Remover do Histórico -->
        <button data-remove-hist-card="${escapeHtml(item.id)}" data-season="${item.season || ''}" data-episode="${item.episode || ''}" class="card-remove-history-btn" title="Remover do histórico">✕</button>

        <!-- Barra de progresso linear no rodapé (3px red #E50914) -->
        <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div class="h-full bg-[#E50914]" style="width: ${item.percentage}%"></div>
        </div>
      </div>

      <div class="p-2.5 flex flex-col gap-0.5 bg-[#0e121a]/90">
        <h4 class="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">${escapeHtml(item.title)}</h4>
        <p class="text-[10px] text-white/50 truncate">${item.episodeTitle ? escapeHtml(item.episodeTitle) : (item.addon || 'fidalGO ID')}</p>
      </div>
    `;

    // Click handler to resume
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-remove-hist-card]')) return;
      if (item.type === 'series') {
        playSeriesDirect(item, item.season || 1, item.episode || 1);
      } else {
        playMovieDirect(item);
      }
    });

    // Remove button handler
    card.querySelector('[data-remove-hist-card]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = item.season ? Number(item.season) : null;
      const ep = item.episode ? Number(item.episode) : null;
      NuvioAccountManager.removeFromHistory(item.id, s, ep);
      renderContinuarAssistindoRail();
    });

    rail.appendChild(card);
  });
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
    `Assista agora a "${current.title}" em alta definição com opções dubladas e legendadas via FrostStream, FenixFlix e FrostView TV.`;

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
    const isFav = NuvioAccountManager.isFavorite(current);
    saveBtn.classList.toggle('text-pink-400', isFav);
    saveBtn.onclick = () => {
      NuvioAccountManager.toggleFavorite(current);
      const nowFav = NuvioAccountManager.isFavorite(current);
      saveBtn.classList.toggle('text-pink-400', nowFav);
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
      return matchesSearchQuery(`${ch.number} ${ch.name} ${ch.group} ${ch.subCategory || ''}`, searchQuery);
    }
    if (activeCategoryChip === 'Favoritos') {
      return favorites.has(ch.number) || (typeof NuvioAccountManager !== 'undefined' && NuvioAccountManager.isFavorite(ch));
    }
    if (activeCategoryChip === 'ALL') {
      return true;
    }
    if (activeNavTab === 'sports') {
      return ch.group === 'Esportes' || (ch.genres && ch.genres.includes('Esportes')) || isAllowedSportsChannel(ch.name);
    }

    const targetCat = String(activeCategoryChip || '').toLowerCase().trim();

    if (targetCat === 'esportes') {
      return ch.group === 'Esportes' || (ch.genres && ch.genres.includes('Esportes')) || isAllowedSportsChannel(ch.name);
    }

    if (targetCat === 'canais abertos' || targetCat === 'tv aberta') {
      return ch.group === 'Canais Abertos' || ch.group === 'TV Aberta' || Boolean(ch.isOpenTvAddon) || (Array.isArray(ch.genres) && (ch.genres.includes('Canais Abertos') || ch.genres.includes('TV Aberta')));
    }

    if (targetCat === 'filmes e séries' || targetCat === 'filmes e series') {
      return ch.group === 'Filmes e Séries' || ch.group === 'Filmes' || ch.group === 'Séries' || (Array.isArray(ch.genres) && ch.genres.some((g) => /filme|s[eé]rie/i.test(g)));
    }

    const chGroup = String(ch.group || '').toLowerCase().trim();
    const chSub = String(ch.subCategory || '').toLowerCase().trim();
    const hasGenre = Array.isArray(ch.genres) && ch.genres.some((g) => String(g).toLowerCase().trim() === targetCat);

    return chGroup === targetCat || chSub === targetCat || hasGenre;
  });

  const badgeEl = document.getElementById('channelTotalBadge');
  if (badgeEl) badgeEl.textContent = `${filteredChannels.length}`;
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
  const displayLimit = window._channelDisplayLimit || 600;
  const sliceList = filteredChannels.slice(0, displayLimit);

  sliceList.forEach((ch) => {
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

  if (filteredChannels.length > displayLimit) {
    const moreBtn = document.createElement('button');
    moreBtn.className = 'w-full py-3 my-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/15 shadow-sm text-center cursor-pointer';
    moreBtn.textContent = `+ Carregar mais (${filteredChannels.length - displayLimit} canais restantes)`;
    moreBtn.addEventListener('click', () => {
      window._channelDisplayLimit = (window._channelDisplayLimit || 600) + 600;
      renderChannelSidebar();
    });
    frag.appendChild(moreBtn);
  }

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
          <p class="text-xs text-white/50">Consultando FrostView TV, FrostStream, FenixFlix e ComandoPlay</p>
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
    .filter((c) => (c.group === 'TV Aberta' || c.isOpenTvAddon) && c.group !== 'Esportes')
    .slice(0, 36)
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
    .filter((c) => c.group === 'Esportes' || isAllowedSportsChannel(c.name))
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
    const isTvEnvironment = document.body.classList.contains('tv-device') || /Android TV|SmartTV|tvOS|FidalGoTV/i.test(navigator.userAgent);
    const newMovies = [
      ...nuvioCatalog.magnetFlixMovies,
      ...nuvioCatalog.fenixMovies,
      ...comandoItems.filter((i) => i.type === 'movie'),
      ...trendingMovies
    ];
    const newSeries = [
      ...nuvioCatalog.magnetFlixSeries,
      ...nuvioCatalog.fenixSeries,
      ...comandoItems.filter((i) => i.type === 'series'),
      ...trendingSeries
    ];

    carouselsEl.appendChild(
      buildCarouselRow('Novos Filmes Dublados & Lançamentos — Nuvio Media Hub', 'sparkles', newMovies.slice(0, 20), false, false)
    );
    carouselsEl.appendChild(
      buildCarouselRow('Séries Novas & Episódios em Alta', 'clapperboard', newSeries.slice(0, 20), false, false)
    );
    if (openTvChannelCards.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Canais Abertos do Brasil — Ao Vivo Agora', 'tv', openTvChannelCards.slice(0, 20), true, false)
      );
    }
    if (!isTvEnvironment) {
      if (sportsItems.length > 0) {
        carouselsEl.appendChild(
          buildCarouselRow('Esportes Ao Vivo — Cobertura Completa', 'trophy', sportsItems.slice(0, 20), true, false)
        );
      }
      carouselsEl.appendChild(
        buildCarouselRow('Filmes Aclamados pela Crítica (4K / FHD)', 'award', topMovies, false, false)
      );
      carouselsEl.appendChild(
        buildCarouselRow('Séries Mais Assistidas no Mundo', 'flame', topSeries, false, false)
      );
    }
    return;
  }

  // --------------------------------------------------------------------------
  // ABA 2: CANAIS (Exclusivo Tvvio & Esportes com Addons)
  // --------------------------------------------------------------------------
  if (activeNavTab === 'live') {
    // 1. Linha Dinâmica da Categoria Ativa (baseada no chip de categoria selecionado)
    const catChannels = filteredChannels.map((c) => ({
      id: `actcat-${c.number}`,
      title: c.name,
      subtitle: `Canal ${c.number} • ${(c.sources || []).length} fonte(s)`,
      badge: (c.group || 'TV').toUpperCase(),
      category: c.group,
      poster: c.logo,
      isLogoPoster: true,
      url: c.url,
      channelRef: c
    }));

    const catTitle = activeCategoryChip === 'ALL'
      ? 'Todos os Canais Ao Vivo'
      : `Canais — ${activeCategoryChip}`;

    if (catChannels.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow(catTitle, 'tv', catChannels, true, false)
      );
    }

    // 2. Linhas Horizontais para Cada Categoria de TV Ao Vivo
    const tvvioCategories = [
      { key: 'Canais Abertos', title: 'Canais Abertos — TV Digital Ao Vivo', icon: 'tv' },
      { key: 'Esportes', title: 'Esportes & Eventos Ao Vivo — Premiere, SporTV, ESPN & CazéTV', icon: 'trophy' },
      { key: 'Filmes e Séries', title: 'Filmes & Séries — Canais Lineares HD', icon: 'film' },
      { key: 'Variedades', title: 'Canais de Variedades & Entretenimento', icon: 'radio' },
      { key: 'Notícias', title: 'Notícias & Jornalismo 24h — Sinal Digital', icon: 'newspaper' },
      { key: 'Infantil', title: 'Canais Infantis & Desenhos — Kids HD', icon: 'smile' },
      { key: 'Religiosos', title: 'Canais Religiosos & Inspiração', icon: 'heart' }
    ];

    tvvioCategories.forEach((catObj) => {
      if (String(activeCategoryChip || '').toLowerCase() === catObj.key.toLowerCase() && catChannels.length > 0) return;

      const catItems = channels
        .filter((c) => {
          const g = String(c.group || '').toLowerCase();
          const target = catObj.key.toLowerCase();
          if (target === 'canais abertos') {
            return g === 'canais abertos' || g === 'tv aberta' || Boolean(c.isOpenTvAddon);
          }
          if (target === 'esportes') {
            return g === 'esportes' || isAllowedSportsChannel(c.name);
          }
          if (target === 'filmes e séries' || target === 'filmes e series') {
            return g === 'filmes e séries' || g === 'filmes' || g === 'séries' || (Array.isArray(c.genres) && c.genres.some((x) => /filme|s[eé]rie/i.test(x)));
          }
          return g === target || (Array.isArray(c.genres) && c.genres.some((x) => String(x).toLowerCase() === target));
        })
        .map((c) => ({
          id: `tvcat-${catObj.key}-${c.number}`,
          title: c.name,
          subtitle: `${c.group} • Canal ${c.number}`,
          badge: (c.group || 'TV').toUpperCase(),
          category: c.group,
          poster: c.logo,
          isLogoPoster: true,
          url: c.url,
          channelRef: c
        }));

      if (catItems.length > 0) {
        carouselsEl.appendChild(
          buildCarouselRow(catObj.title, catObj.icon, catItems, true, false)
        );
      }
    });

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
        <p class="text-sm text-white/70">Carregando animes do FrostStream e FenixFlix...</p>`;
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
    if (currentChannel && currentChannel.number === 'FILME' && isPlayerVisibleOnHub) {
      carouselsEl.innerHTML = '';
      document.getElementById('stremioGenreBar')?.classList.add('hidden');
      return;
    }

    const allPtBrMovies = [
      ...nuvioCatalog.magnetFlixMovies,
      ...nuvioCatalog.fenixMovies,
      ...nuvioCatalog.frostStreamMovies,
      ...comandoItems.filter((i) => i.type === 'movie')
    ];
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

    if (nuvioCatalog.magnetFlixMovies.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Roleta — Filmes Populares & Lançamentos (MagnetFlix HD)', 'sparkles', nuvioCatalog.magnetFlixMovies, false, false)
      );
    }
    if (ptBrMovies.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Roleta — Filmes Dublados PT-BR (Fênix & FrostStream)', 'flame', ptBrMovies, false, false)
      );
    }
    carouselsEl.appendChild(
      buildCarouselRow('Roleta — Filmes em Alta na Semana (Nuvio Media)', 'flame', trendingMovies, false, false)
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
    if (currentChannel && currentChannel.seriesNav && isPlayerVisibleOnHub) {
      carouselsEl.innerHTML = '';
      document.getElementById('stremioGenreBar')?.classList.add('hidden');
      return;
    }

    const allPtBrSeries = [
      ...nuvioCatalog.magnetFlixSeries,
      ...nuvioCatalog.fenixSeries,
      ...nuvioCatalog.frostStreamSeries,
      ...comandoItems.filter((i) => i.type === 'series')
    ];
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

    if (nuvioCatalog.magnetFlixSeries.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Roleta — Séries Populares & Destaques (MagnetFlix HD)', 'sparkles', nuvioCatalog.magnetFlixSeries, false, false)
      );
    }
    if (ptBrSeries.length > 0) {
      carouselsEl.appendChild(
        buildCarouselRow('Roleta — Séries Dubladas, Doramas & Animes (Fênix & FrostStream)', 'flame', ptBrSeries, false, false)
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

function buildCarouselRow(title, iconName, rawItems, isLandscape = false, isExpandedGrid = false) {
  const items = deduplicateMediaItems(rawItems);
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
  row.className = 'roleta-track flex items-center gap-4 overflow-x-auto pb-3 pt-1.5 px-1';

  let isDragging = false;
  let dragMoved = false;

  const isTvEnvironment = document.body.classList.contains('tv-device') || /Android TV|SmartTV|tvOS|FidalGoTV/i.test(navigator.userAgent);
  const rowLimit = isTvEnvironment ? 30 : 60;

  items.slice(0, rowLimit).forEach((item) => {
    const card = document.createElement('div');
    const landscapeClass = isLandscape ? 'landscape-card' : '';
    const aspectClass = isLandscape ? 'aspect-video' : 'aspect-[2/3]';
    const isCurrentActive = Boolean(
      item.channelRef && currentChannel &&
      (item.channelRef.number === currentChannel.number || item.channelRef.name === currentChannel.name)
    );
    const activeClass = isCurrentActive ? 'active-playing-channel' : '';

    card.className = `vod-card ${landscapeClass} ${activeClass} rounded-2xl overflow-hidden cursor-pointer group relative flex flex-col select-none`;
    card.setAttribute('tabindex', '0');
    if (item.channelRef) {
      card.dataset.channelNum = String(item.channelRef.number || '');
      card.dataset.channelName = String(item.channelRef.name || '');
    }

    card.innerHTML = `
      <div class="relative w-full ${aspectClass} bg-black/60 overflow-hidden flex items-center justify-center">
        <img src="${item.poster}" alt="${escapeHtml(item.title)}" draggable="false" loading="lazy" class="w-full h-full ${item.isLogoPoster ? 'object-contain p-6' : 'object-cover'} group-hover:scale-105 transition-transform duration-500 pointer-events-none" onerror="this.style.display='none'" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none"></div>
        <span class="absolute top-2 left-2 text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full ${item.badge?.startsWith('★') ? 'badge-imdb-apple' : 'badge-addon-origin'} backdrop-blur-md pointer-events-none">
          ${escapeHtml(item.badge || item.addon || 'HD')}
        </span>
        ${isCurrentActive ? '<span class="absolute top-2 right-2 text-[10px] font-bold tracking-tight px-2 py-0.5 rounded-full badge-live-apple shadow-lg flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>NO AR</span>' : ''}
        <div class="absolute bottom-2.5 left-3 right-3 pointer-events-none">
          <h4 class="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">${escapeHtml(item.title)}</h4>
          <p class="text-[11px] text-white/65 truncate mt-0.5">${escapeHtml(item.subtitle)}</p>
        </div>
      </div>
    `;

    // Botão Favorito no Card (Nuvio Account Manager)
    const isFav = NuvioAccountManager.isFavorite(item);
    const favBtn = document.createElement('button');
    favBtn.className = `card-fav-btn ${isFav ? 'is-favorite' : ''}`;
    favBtn.title = isFav ? 'Remover dos favoritos' : 'Favoritar';
    favBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="${isFav ? '#f43f5e' : 'none'}" stroke="${isFav ? '#f43f5e' : '#ffffff'}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const added = NuvioAccountManager.toggleFavorite(item);
      favBtn.classList.toggle('is-favorite', added);
      const icon = favBtn.querySelector('svg');
      if (icon) {
        icon.style.fill = added ? '#f43f5e' : 'none';
        icon.style.stroke = added ? '#f43f5e' : '#ffffff';
      }
    });
    card.querySelector('.relative').appendChild(favBtn);

    // Se for card de "Continuar Assistindo" (Onde Parei)
    if (item.isContinueWatching) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'card-remove-history-btn';
      removeBtn.title = 'Remover do histórico';
      removeBtn.innerHTML = '✕';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        NuvioAccountManager.removeFromHistory(item.id, item.season, item.episode);
      });
      card.querySelector('.relative').appendChild(removeBtn);

      if (item.progress && item.progress > 0) {
        const progBox = document.createElement('div');
        progBox.className = 'continue-progress-container';
        progBox.innerHTML = `<div class="continue-progress-bar" style="width: ${item.progress}%"></div>`;
        card.querySelector('.relative').appendChild(progBox);
      }
    }

    card.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (item.isContinueWatching) {
        if (item.type === 'series' || item.type === 'anime') {
          playSeriesDirect(item, item.season || 1, item.episode || 1);
        } else {
          playMovieDirect(item);
        }
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

    // Roda do mouse gira a roleta horizontalmente apenas quando há intenção horizontal (deltaX ou Shift)
    // permitindo a rolagem vertical livre da página no PC
    row.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
          const maxScroll = row.scrollWidth - row.clientWidth;
          if (maxScroll <= 0) return;
          const delta = e.deltaX || e.deltaY;
          const atStart = row.scrollLeft <= 2 && delta < 0;
          const atEnd = row.scrollLeft >= maxScroll - 2 && delta > 0;
          if (!atStart && !atEnd) {
            e.preventDefault();
            row.scrollLeft += delta * 1.35;
          }
        }
      },
      { passive: false }
    );

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

function advanceToNextSource(reason = '', isSilent = true) {
  clearPlayerWatchdog();
  if (!currentChannel) return;
  const total = currentChannel.sources?.length || 1;
  const nextIdx = currentSourceIdx + 1;
  if (nextIdx < total) {
    if (!isSilent) {
      const nextSrc = currentChannel.sources[nextIdx];
      showPlayerToast(`${reason} — Alternando para ${nextSrc?.origin || `Fonte ${nextIdx + 1}`}...`);
    }
    setTimeout(() => {
      if (currentChannel) {
        playChannel(currentChannel, nextIdx, true);
      }
    }, 150);
  } else if (!currentChannel.triedTvvioFallback) {
    currentChannel.triedTvvioFallback = true;
    const slug = currentChannel.slug || (currentChannel.stremioId ? String(currentChannel.stremioId).replace(/^(ec:|ecipfs-)/, '') : '');
    if (slug) {
      currentChannel.sources.push(
        {
          label: 'VIP Canais HLS (Sem Anúncios)',
          url: `/api/vipcanais-stream?slug=${slug}&redirect=1`,
          origin: 'VIP Canais Oficial (HLS)',
          isHls: true
        },
        {
          label: 'VIP Canais (Web Player)',
          url: `/api/vipcanais-embed?slug=${slug}`,
          origin: 'VIP Canais (Vitalício)',
          isWebEmbed: true,
          directFallback: `https://vipcanais.net/minha-conta/assistir/${slug}/`
        },
        {
          label: 'Player Web HD (Livre)',
          url: `https://1210.playerembcanais.com/${slug}`,
          origin: 'TVPlay / Tvvio Web',
          isWebEmbed: true
        },
        {
          label: 'TVPlay IPFS (Failover)',
          url: `https://tvplay.megaembed-frost.workers.dev/stream/tv/ecipfs-${slug}.json`,
          origin: 'TVPlay IPFS',
          isStremioStream: true
        },
        {
          label: 'Tvvio Direto (Failover)',
          url: `https://tvvio.megaembed-frost.workers.dev/stream/tv/ec:${slug}.json`,
          origin: 'Tvvio',
          isStremioStream: true
        }
      );
      setTimeout(() => {
        if (currentChannel) {
          playChannel(currentChannel, currentSourceIdx + 1, true);
        }
      }, 150);
      return;
    }
    showPlayerToast('Sinal temporariamente indisponível.');
  } else {
    showPlayerToast('Sinal temporariamente indisponível.');
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
  if (video && currentChannel && video.currentTime > 5 && video.duration) {
    NuvioAccountManager.saveProgress(currentChannel, video.currentTime, video.duration);
  }
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
  document.getElementById('stageMovieSection')?.classList.add('hidden');
  currentMovieItem = null;
  document.getElementById('btnNextEpisode')?.classList.add('hidden');
  document.getElementById('btnNextEpisodeStage')?.classList.add('hidden');
  document.getElementById('btnNextEpisodeOverlay')?.classList.add('hidden');
  PlayerAudioSubsManager?.closeDrawer();
  const oldTracks = video?.querySelectorAll('track.injected-sub');
  oldTracks?.forEach((t) => t.remove());
}

function isEmbedWebUrl(url = '') {
  if (!url) return false;
  if (/fenixtv\.fenixhub\.online/i.test(url)) return false;
  if (/\/api\/vipcanais-(stream|hls)/i.test(url)) return false;
  if (/\.(m3u8|mp4|mkv|webm|ts)(\?|$)/i.test(url)) return false;
  if (
    /\/(embed|player|watch|assistir|filmes|series|filme|serie|ch\.php)\b/i.test(url) ||
    /vipcanais-embed|vidsrc|autoembed|multiembed|vidlink|embedder|comandoplay|embedcanais|playerembcanais|redecanais|nossoplayer|player3/i.test(url) ||
    /\.(php|html)(\?|$)/i.test(url)
  ) {
    return true;
  }
  return false;
}

async function playChannel(ch, sourceIdx = 0, isSilentFailover = false) {
  currentChannel = ch;
  currentSourceIdx = sourceIdx;
  isPlayerVisibleOnHub = true;

  // No Hub Inicial (board) não deve passar nenhum vídeo: se o usuário iniciar um vídeo a partir do Hub,
  // alterna automaticamente para a aba correspondente (Esportes, Filmes, Séries ou Canal Aberto)
  const grp = String(ch.group || '').toLowerCase();
  const isSeries = Boolean(ch.seriesNav || String(ch.number || '').startsWith('T') || grp.includes('série') || grp.includes('serie'));
  const isMovie = Boolean(ch.number === 'FILME' || grp === 'filmes');

  let tabSwitched = false;
  if (activeNavTab === 'board' || activeNavTab === 'profile') {
    if (grp.includes('esporte')) activeNavTab = 'sports';
    else if (isMovie) activeNavTab = 'movies';
    else if (isSeries) activeNavTab = 'series';
    else activeNavTab = 'live';

    syncNavButtons(activeNavTab);
    updateLayoutSectionsVisibility();
    tabSwitched = true;
  }

  if (tabSwitched) {
    renderRightContentArea();
    document.getElementById('liveStageSection')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Atualiza o card de canal ativo sem destruir o DOM e sem mover ou resetar a barra de canais
    document.querySelectorAll('.vod-card.active-playing-channel, .channel-card.active').forEach((c) => {
      c.classList.remove('active-playing-channel', 'active');
      const oldBadge = c.querySelector('.badge-live-apple');
      if (oldBadge) oldBadge.remove();
    });

    const activeCard =
      document.querySelector(`[data-channel-num="${ch.number}"]`) ||
      document.querySelector(`[data-id="actcat-${ch.number}"]`) ||
      (ch.name ? document.querySelector(`[data-channel-name="${CSS.escape(ch.name)}"]`) : null);

    if (activeCard) {
      activeCard.classList.add('active-playing-channel');
      const cardRel = activeCard.querySelector('.relative');
      if (cardRel && !cardRel.querySelector('.badge-live-apple')) {
        const liveBadge = document.createElement('span');
        liveBadge.className =
          'absolute top-2 right-2 text-[10px] font-bold tracking-tight px-2 py-0.5 rounded-full badge-live-apple shadow-lg flex items-center gap-1';
        liveBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>NO AR';
        cardRel.appendChild(liveBadge);
      }
    }

    if (activeNavTab !== 'board') {
      document.getElementById('liveStageSection')?.classList.remove('hidden');
    }
  }

  // Multi-fontes resiliente para canais infantis (BestCine, Catálogo IPTV, Fenix TV, TVPlay)
  const isKidsChannel = ch.group === 'Infantil' ||
    /infantil|kids|desenho|cartoon|cartoonito|nickelodeon|nick\b|gloob|gloobinho|disney|boomerang|tooncast|baby|r[aá]\s*tim\s*bum|discovery\s*kids/i.test(ch.name);
  if (isKidsChannel) {
    const normKey = normalizeChannelMergeKey(ch.name);
    // Agrega fontes de outros addons como alternativas sem sobrescrever a fonte principal
    const fenixMatch = channels.find(c => c.isFenixTv && (normalizeChannelMergeKey(c.name) === normKey || c.name.toLowerCase().includes(ch.name.toLowerCase()) || ch.name.toLowerCase().includes(c.name.toLowerCase())));
    if (fenixMatch && Array.isArray(fenixMatch.sources) && fenixMatch.sources.length > 0) {
      if (!ch.sources || ch.sources.length === 0) {
        ch.sources = [...fenixMatch.sources];
        ch.addonBase = fenixMatch.addonBase;
        ch.stremioId = fenixMatch.stremioId;
        ch.isFenixTv = true;
        ch.isStremioTvMeta = fenixMatch.isStremioTvMeta;
      } else {
        const existingUrls = new Set(ch.sources.map(s => s.url));
        fenixMatch.sources.forEach(fs => {
          if (!existingUrls.has(fs.url)) {
            ch.sources.push(fs);
            existingUrls.add(fs.url);
          }
        });
      }
    }
  }

  // Se a fonte selecionada for um endpoint JSON de stream do Stremio (TVPlay / Tvvio / FrostView TV / Rede Canais), resolve antes de tocar
  const selectedSourceUrl = ch.sources?.[sourceIdx]?.url || ch.url;
  if ((ch.isStremioTvMeta || selectedSourceUrl.endsWith('.json')) && selectedSourceUrl.endsWith('.json')) {
    if (!isSilentFailover) {
      showPlayerToast(`Carregando ${ch.name}...`);
    }
    const candidateUrls = [selectedSourceUrl];
    const slug = ch.slug || (ch.stremioId ? String(ch.stremioId).replace(/^(ec:|ecipfs-)/, '') : '');
    if (slug) {
      candidateUrls.push(
        `https://tvplay.megaembed-frost.workers.dev/stream/tv/ecipfs-${slug}.json`,
        `https://tvvio.megaembed-frost.workers.dev/stream/tv/ec:${slug}.json`,
        `https://tvvio.megaembed-frost.workers.dev/stream/tv/${slug}.json`
      );
    }
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
        const isProxyNeeded = /minhatv|bestcine|baby-beamup|fenix/i.test(cUrl);
        const txt = await fetchTextSafe(cUrl, isProxyNeeded, 8000);
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
            let direct = s.url || s.externalUrl || (s.ytId ? `https://www.youtube.com/embed/${s.ytId}?autoplay=1` : '');
            if (!direct || /livepix|pix\b|apoie|doacao/i.test(direct + ' ' + (s.title || '') + ' ' + (s.name || ''))) return null;
            let isWeb = isEmbedWebUrl(direct);
            if (direct.includes('fenixtv.fenixhub.online/proxy?url=')) {
              const uMatch = direct.match(/[?&]url=([^&]+)/);
              if (uMatch) {
                try { direct = decodeURIComponent(uMatch[1]); } catch (_) {}
              }
            }
            if (direct.includes('cdn10embed.xyz') && slug) {
              direct = `/api/vipcanais-embed?slug=${slug}`;
              isWeb = true;
            }
            if (!isWeb && window.location.protocol === 'https:' && direct.startsWith('http:') && hasLocalServer && useProxy) {
              direct = `/api/proxy?url=${encodeURIComponent(direct)}`;
            }
            const cleanTitle = (s.title || s.name || `Sinal ${i + 1}`)
              .replace(/^\?+\s*/, '')
              .replace(/\n+/g, ' — ')
              .trim();
            const srcOrigin = ch.sources?.[sourceIdx]?.origin || (cUrl.includes('minhatv') ? 'Minha TV (Brazuca)' : cUrl.includes('bestcine') ? 'BestCine' : ch.isFenixTv ? 'Fenix TV' : 'TVPlay / Tvvio');
            return {
              label: cleanTitle,
              url: direct,
              origin: srcOrigin,
              isWebEmbed: isWeb,
              isHls: !isWeb && (/\.m3u8/i.test(direct) || /fenixtv|bestcine|minhatv|nille121/i.test(direct))
            };
          })
          .filter(Boolean);

        if (resolved.length === 0 && slug) {
          resolved.push(
            {
              label: 'VIP Canais HLS (Sem Anúncios)',
              url: `/api/vipcanais-stream?slug=${slug}&redirect=1`,
              origin: 'VIP Canais Oficial (HLS)',
              isHls: true
            },
            {
              label: 'VIP Canais (Web Player)',
              url: `/api/vipcanais-embed?slug=${slug}`,
              origin: 'VIP Canais (Vitalício)',
              isWebEmbed: true,
              directFallback: `https://vipcanais.net/minha-conta/assistir/${slug}/`
            },
            {
              label: 'Player Web HD (Livre)',
              url: `https://1210.playerembcanais.com/${slug}`,
              origin: 'TVPlay / Tvvio Web',
              isWebEmbed: true
            }
          );
        }

        if (resolved.length > 0) {
          const otherSources = (ch.sources || []).filter((_, idx) => idx !== sourceIdx);
          ch.sources = [...resolved, ...otherSources].filter((s) => getStreamSourceScore(s) > -50);
          ch.sources.sort((a, b) => getStreamSourceScore(b) - getStreamSourceScore(a));
          ch.url = ch.sources[0]?.url || ch.url;
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
  const isSourceEmbed = !activeSource?.isHls && (Boolean(activeSource ? activeSource.isWebEmbed : ch.isWebEmbed) || isEmbedWebUrl(activeUrl));

  const extBtn = document.getElementById('btnOpenExternalPage');
  extBtn.classList.toggle('hidden', !isSourceEmbed);
  extBtn.onclick = () => window.open(activeUrl, '_blank');

  destroyPlayers();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('rightScrollSection')?.scrollTo({ top: 0, behavior: 'smooth' });

  renderStageSeriesSection(ch);
  renderStageMovieSection(ch);
  PlayerAudioSubsManager?.onTrackStarted(ch);

  if (isSourceEmbed) {
    const video = document.getElementById('videoPlayer');
    const embed = document.getElementById('embedPlayer');
    video.classList.add('hidden');
    embed.classList.remove('hidden');
    embed.removeAttribute('sandbox');
    embed.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    embed.src = activeUrl;
    if (!isSilentFailover) {
      showPlayerToast(`Carregando ${ch.name}...`);
    }

    clearPlayerWatchdog();
    // Watchdog silencioso de 4.5s caso o embed não carregue ou fique em tela preta
    playerWatchdogTimer = setTimeout(() => {
      advanceToNextSource('Servidor demorou a responder', true);
    }, 4500);

    embed.onload = () => {
      clearPlayerWatchdog();
      showPlayerToast(`✓ No Ar: ${ch.name}`);
    };
    embed.onerror = () => {
      advanceToNextSource('Falha ao carregar servidor', true);
    };
    return;
  }

  startHlsOrDirectStream(activeUrl, ch, sourceIdx, isSilentFailover);
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
  updatePlayerFavoriteButton();
}

function updatePlayerFavoriteButton() {
  const btn = document.getElementById('btnPlayerFavorite');
  const label = document.getElementById('playerFavoriteLabel');
  if (!btn || !currentChannel) return;
  const isFav = NuvioAccountManager.isFavorite(currentChannel);
  btn.classList.toggle('text-pink-400', isFav);
  btn.classList.toggle('border-pink-500/40', isFav);
  const icon = btn.querySelector('svg');
  if (icon) {
    icon.style.fill = isFav ? '#f43f5e' : 'none';
    icon.style.stroke = isFav ? '#f43f5e' : '#ffffff';
  }
  if (label) {
    label.textContent = isFav ? 'Favoritado' : 'Favoritar';
  }
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

function startHlsOrDirectStream(rawUrl, ch, sourceIdx, isSilentFailover = false) {
  if (rawUrl && !rawUrl.includes('/api/proxy') && hasLocalServer && useProxy) {
    const isHttpsPage = window.location.protocol === 'https:';
    const isHttpStream = rawUrl.startsWith('http:');
    const needsCorsProxy = /bestcine|squareweb|workers\.dev|explouddev|dadinhodetapioca|tiktokcdn|conexaodaluz/i.test(rawUrl);
    if ((isHttpsPage && isHttpStream) || needsCorsProxy) {
      rawUrl = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    }
  }
  const video = document.getElementById('videoPlayer');
  if (video) {
    if (!video.getAttribute('crossorigin')) {
      video.setAttribute('crossorigin', 'anonymous');
    }
    video.crossOrigin = 'anonymous';
  }
  if (!isSilentFailover) {
    showPlayerToast(`Carregando ${ch.name}...`);
  }

  clearPlayerWatchdog();
  playerWatchdogTimer = setTimeout(() => {
    if (video.paused && video.readyState < 2 && !video.ended) {
      advanceToNextSource('Transmissão demorou a iniciar', true);
    }
  }, 4500);

  const savedProgress = NuvioAccountManager.getProgress(
    ch.imdbId || ch.stremioId || ch.id || ch.name,
    ch.seriesNav ? ch.seriesNav.season : null,
    ch.seriesNav ? ch.seriesNav.episode : null
  ) || (currentMovieItem ? NuvioAccountManager.getProgress(currentMovieItem.imdbId || currentMovieItem.id || currentMovieItem.title) : null);

  let hasResumedPlayback = false;
  const tryResume = () => {
    if (hasResumedPlayback) return;
    if (savedProgress && savedProgress.currentTime > 10 && savedProgress.currentTime < (video.duration || 999999) - 25) {
      hasResumedPlayback = true;
      try {
        video.currentTime = savedProgress.currentTime;
        const mins = Math.floor(savedProgress.currentTime / 60);
        const secs = Math.floor(savedProgress.currentTime % 60);
        showPlayerToast(`▶ Retomando de ${mins}:${secs < 10 ? '0' : ''}${secs} (${savedProgress.percentage}%)`);
      } catch (_) {}
    }
  };

  video.onplaying = () => {
    clearPlayerWatchdog();
    showPlayerToast(`✓ No Ar: ${ch.name}`);
    tryResume();
    selectAudioTrackInPlayer(audioPreference);
  };

  video.onloadedmetadata = () => {
    tryResume();
    selectAudioTrackInPlayer(audioPreference);
  };

  video.ontimeupdate = () => {
    if (video.duration && video.currentTime > 5 && !video.paused) {
      const now = Date.now();
      if (!video._lastHistorySave || now - video._lastHistorySave > 12000) {
        video._lastHistorySave = now;
        NuvioAccountManager.saveProgress(ch, video.currentTime, video.duration);
      }
    }
  };

  video.onpause = () => {
    if (video.duration && video.currentTime > 5) {
      NuvioAccountManager.saveProgress(ch, video.currentTime, video.duration);
    }
  };

  video.onended = () => {
    const itemId = ch.imdbId || ch.stremioId || ch.id || ch.name;
    const season = ch.seriesNav ? ch.seriesNav.season : null;
    const episode = ch.seriesNav ? ch.seriesNav.episode : null;
    NuvioAccountManager.markAsCompleted(itemId, season, episode);
    showPlayerToast('✓ Reprodução concluída!');
    if (ch.seriesNav) {
      setTimeout(() => {
        playNextEpisode();
      }, 1500);
    }
  };

  video.onerror = () => {
    advanceToNextSource('Erro no sinal de vídeo', true);
  };

  if (/\.(mp4|webm)(\?|$)/i.test(rawUrl)) {
    if (window.StreamPlaybackEngine) {
      window.StreamPlaybackEngine.destroyPlaybackEngines();
    }
    video.src = rawUrl;
    video.play().catch(() => {});
    return;
  }

  const isMpegTs = /\.ts(\?|$)/i.test(rawUrl) && !/\.m3u8/i.test(rawUrl);
  if (isMpegTs && window.StreamPlaybackEngine && window.mpegts) {
    mpegtsPlayer = window.StreamPlaybackEngine.initMpegtsPlayer({
      video,
      streamUrl: rawUrl,
      isLive: true,
      onFatalFallback: () => {
        advanceToNextSource(`Fonte ${sourceIdx + 1} falhou no mpegts`, true);
      }
    });
    return;
  }

  if (window.StreamPlaybackEngine) {
    hlsInstance = window.StreamPlaybackEngine.initHlsPlayer({
      video,
      streamUrl: rawUrl,
      isLive: !ch.isMovie && !ch.isSeries,
      onManifestParsed: () => {
        clearPlayerWatchdog();
        showPlayerToast(`✓ No Ar: ${ch.name}`);
        selectAudioTrackInPlayer(audioPreference);
      },
      onFatalFallback: (data) => {
        if (!rawUrl.includes('/api/proxy') && useProxy && hasLocalServer) {
          console.warn('[Playback] Tentando proxy local para:', rawUrl);
          playStream(ch, sourceIdx, `/api/proxy?url=${encodeURIComponent(rawUrl)}`);
        } else {
          advanceToNextSource(`Fonte ${sourceIdx + 1} indisponível`, true);
        }
      }
    });

    if (hlsInstance) {
      hlsInstance.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        selectAudioTrackInPlayer(audioPreference);
      });
      return;
    }
  } else if (window.Hls && Hls.isSupported()) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 30,
      maxBufferLength: 30,
      manifestLoadingTimeOut: 15000
    });

    hlsInstance.loadSource(rawUrl);
    hlsInstance.attachMedia(video);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      clearPlayerWatchdog();
      showPlayerToast(`✓ No Ar: ${ch.name}`);
      video.play().catch(() => {});
      selectAudioTrackInPlayer(audioPreference);
    });

    hlsInstance.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      selectAudioTrackInPlayer(audioPreference);
    });

    let triedProxy = false;
    hlsInstance.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        if (!triedProxy && useProxy && hasLocalServer) {
          triedProxy = true;
          hlsInstance.loadSource(`/api/proxy?url=${encodeURIComponent(rawUrl)}`);
        } else {
          advanceToNextSource(`Fonte ${sourceIdx + 1} falhou`, true);
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = rawUrl;
    video.play().catch(() => {});
  }
}

function renderNuvioAccountModalContent() {
  const activeAcc = NuvioAccountManager.getActiveAccount();
  const allAccounts = NuvioAccountManager.getAccounts();
  const historyList = NuvioAccountManager.getHistory();
  const favorites = NuvioAccountManager.getFavoritesAll();

  // 1. Perfil ativo
  const activeAvatar = document.getElementById('nuvioActiveProfileAvatar');
  const activeName = document.getElementById('nuvioActiveProfileName');
  const activeEmail = document.getElementById('nuvioActiveProfileEmail');
  const isVip = activeAcc.isVip || (activeAcc.email || '').toLowerCase() === '11duckx@gmail.com';
  if (activeAvatar) {
    activeAvatar.textContent = activeAcc.avatar || 'D';
    activeAvatar.style.backgroundColor = isVip ? '#10B981' : (activeAcc.color || '#8B5CF6');
  }
  if (activeName) {
    activeName.innerHTML = isVip
      ? `<span>${escapeHtml(activeAcc.name)}</span> <span class="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black uppercase tracking-wider ml-2">VIP Vitalício</span>`
      : escapeHtml(activeAcc.name);
  }
  if (activeEmail) {
    activeEmail.innerHTML = isVip
      ? `${escapeHtml(activeAcc.email)} • <span class="text-emerald-400 font-semibold">VIP Canais Conectado</span>`
      : escapeHtml(activeAcc.email);
  }

  // 2. Badges de contagem
  const histCountBadge = document.getElementById('nuvioHistoryBadgeCount');
  if (histCountBadge) histCountBadge.textContent = historyList.length;

  const totalFavs = (favorites.movies?.length || 0) + (favorites.series?.length || 0) + (favorites.channels?.length || 0);
  const favCountBadge = document.getElementById('nuvioFavoritesBadgeCount');
  if (favCountBadge) favCountBadge.textContent = totalFavs;

  // 3. Lista de Perfis Salvos
  const profilesList = document.getElementById('nuvioSavedProfilesList');
  if (profilesList) {
    profilesList.innerHTML = '';
    allAccounts.forEach((acc) => {
      const isCurrent = acc.id === activeAcc.id;
      const row = document.createElement('div');
      row.className = `tvos-glass p-3 rounded-2xl flex items-center justify-between gap-3 border ${
        isCurrent ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-white/25'
      } transition-all`;
      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow shrink-0" style="background-color: ${acc.color || '#8B5CF6'}">
            ${acc.avatar || 'N'}
          </div>
          <div class="min-w-0">
            <div class="font-bold text-xs text-white truncate flex items-center gap-1.5">
              <span>${escapeHtml(acc.name)}</span>
              ${isCurrent ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-500 text-white font-semibold">Atual</span>' : ''}
            </div>
            <div class="text-[11px] text-white/45 truncate">${escapeHtml(acc.email)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${!isCurrent ? `
            <button data-switch-acc="${acc.id}" class="tvos-glass hover:bg-white text-white hover:text-black px-2.5 py-1 rounded-xl text-xs font-semibold transition-all">
              Usar
            </button>
          ` : ''}
          ${allAccounts.length > 1 ? `
            <button data-delete-acc="${acc.id}" class="hover:bg-red-500/20 text-white/50 hover:text-red-300 w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all" title="Excluir Perfil">
              ✕
            </button>
          ` : ''}
        </div>
      `;
      profilesList.appendChild(row);
    });

    profilesList.querySelectorAll('[data-switch-acc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        NuvioAccountManager.switchAccount(btn.dataset.switchAcc);
        renderNuvioAccountModalContent();
        showPlayerToast('✓ Perfil alternado com sucesso!');
      });
    });

    profilesList.querySelectorAll('[data-delete-acc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        try {
          NuvioAccountManager.deleteAccount(btn.dataset.deleteAcc);
          renderNuvioAccountModalContent();
          showPlayerToast('✓ Perfil excluído com sucesso.');
        } catch (err) {
          showPlayerToast(err.message);
        }
      });
    });
  }

  // 4. Lista do Histórico ("Onde Parei")
  const historyContainer = document.getElementById('nuvioHistoryListContainer');
  if (historyContainer) {
    historyContainer.innerHTML = '';
    if (historyList.length === 0) {
      historyContainer.innerHTML = `
        <div class="tvos-glass rounded-2xl p-8 text-center text-xs text-white/50 space-y-1">
          <p class="font-bold text-white text-sm">Nenhum item em andamento</p>
          <p>Filmes e séries que você assistir aparecerão aqui com o progresso exato salvo.</p>
        </div>
      `;
    } else {
      historyList.forEach((h) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'tvos-glass p-3 rounded-2xl flex items-center justify-between gap-3 border border-white/10 hover:border-white/25 transition-all';
        const minsLeft = Math.max(1, Math.round(((h.duration || 3600) - (h.currentTime || 0)) / 60));
        const epLabel = h.season ? `T${h.season} : E${h.episode}` : (h.type === 'series' ? 'Série' : 'Filme');

        itemRow.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-16 rounded-xl bg-black/60 overflow-hidden shrink-0 border border-white/10 relative">
              <img src="${h.poster}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'" />
              <div class="continue-progress-container"><div class="continue-progress-bar" style="width: ${h.percentage}%"></div></div>
            </div>
            <div class="min-w-0">
              <div class="font-bold text-xs text-white truncate">${escapeHtml(h.title)}</div>
              <div class="text-[11px] text-purple-300 font-semibold mt-0.5">${escapeHtml(epLabel)} • ${h.percentage}%</div>
              <div class="text-[10px] text-white/45 mt-0.5">${minsLeft} min restantes</div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button data-resume-hist="${h.id}" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
              <i data-lucide="play" class="w-3 h-3 fill-white"></i>
              <span>Retomar</span>
            </button>
            <button data-remove-hist="${h.id}" data-season="${h.season || ''}" data-episode="${h.episode || ''}" class="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 text-xs transition-all" title="Remover">
              ✕
            </button>
          </div>
        `;
        historyContainer.appendChild(itemRow);
      });

      historyContainer.querySelectorAll('[data-resume-hist]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const hId = btn.dataset.resumeHist;
          const found = historyList.find((x) => x.id === hId);
          if (found) {
            document.getElementById('nuvioAccountModal')?.classList.add('hidden');
            if (found.type === 'series') {
              playSeriesDirect(found, found.season || 1, found.episode || 1);
            } else {
              playMovieDirect(found);
            }
          }
        });
      });

      historyContainer.querySelectorAll('[data-remove-hist]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const hId = btn.dataset.removeHist;
          const s = btn.dataset.season ? Number(btn.dataset.season) : null;
          const ep = btn.dataset.episode ? Number(btn.dataset.episode) : null;
          NuvioAccountManager.removeFromHistory(hId, s, ep);
          renderNuvioAccountModalContent();
        });
      });
    }
  }

  // 5. Lista de Favoritos
  renderNuvioFavoritesList('all');
}

function renderNuvioFavoritesList(filter = 'all') {
  const container = document.getElementById('nuvioFavoritesListContainer');
  if (!container) return;
  const favs = NuvioAccountManager.getFavoritesAll();
  let pool = [];

  if (filter === 'all') {
    pool = [...favs.movies, ...favs.series, ...favs.channels];
  } else if (filter === 'movies') {
    pool = favs.movies;
  } else if (filter === 'series') {
    pool = favs.series;
  } else if (filter === 'channels') {
    pool = favs.channels;
  }

  container.innerHTML = '';
  if (pool.length === 0) {
    container.innerHTML = `
      <div class="col-span-full tvos-glass rounded-2xl p-8 text-center text-xs text-white/50 space-y-1">
        <p class="font-bold text-white text-sm">Nenhum favorito encontrado</p>
        <p>Clique no ícone de coração em qualquer filme, série ou canal para salvar aqui.</p>
      </div>
    `;
    return;
  }

  pool.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'tvos-glass rounded-2xl p-2.5 flex flex-col gap-2 border border-white/10 hover:border-white/30 cursor-pointer group transition-all relative';
    card.innerHTML = `
      <div class="relative w-full aspect-[2/3] bg-black/60 rounded-xl overflow-hidden">
        <img src="${item.poster}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" onerror="this.style.display='none'" />
        <span class="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-purple-300 border border-white/15">
          ${item.badge || (item.type === 'channel' ? 'CANAL' : item.type === 'series' ? 'SÉRIE' : 'FILME')}
        </span>
        <button data-fav-remove-id="${item.id}" class="card-fav-btn is-favorite" title="Desfavoritar">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
      </div>
      <div class="min-w-0">
        <h5 class="text-xs font-bold text-white truncate">${escapeHtml(item.title)}</h5>
        <p class="text-[10px] text-white/50 truncate">${escapeHtml(item.subtitle || '')}</p>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-fav-remove-id]')) return;
      document.getElementById('nuvioAccountModal')?.classList.add('hidden');
      if (item.type === 'channel' || item.channelRef) {
        const foundCh = channels.find((c) => String(c.number || c.name) === String(item.number || item.title)) || item.channelRef;
        if (foundCh) playChannel(foundCh, 0);
      } else if (item.type === 'series') {
        playSeriesDirect(item, 1, 1);
      } else {
        playMovieDirect(item);
      }
    });

    card.querySelector('[data-fav-remove-id]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      NuvioAccountManager.toggleFavorite(item);
      renderNuvioFavoritesList(filter);
      const favBadge = document.getElementById('nuvioFavoritesBadgeCount');
      const allFavs = NuvioAccountManager.getFavoritesAll();
      if (favBadge) favBadge.textContent = (allFavs.movies.length + allFavs.series.length + allFavs.channels.length);
    });

    container.appendChild(card);
  });
}

function showPlayerToast(message) {
  const toast = document.getElementById('playerStatusToast');
  const text = document.getElementById('playerStatusToastText');
  if (text) text.textContent = message;
  if (toast) {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  }
}

function toggleFavoriteChannel(number) {
  const ch = channels.find((c) => c.number === number);
  if (ch) {
    NuvioAccountManager.toggleFavorite(ch);
  } else {
    if (favorites.has(number)) favorites.delete(number);
    else favorites.add(number);
    localStorage.setItem('stremio_tvos_favorites', JSON.stringify(Array.from(favorites)));
    renderAll();
  }
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
  const txt = `${name} ${rawGroup}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Esportes & Eventos Ao Vivo
  if (isAllowedSportsChannel(name) || /esporte|sport|futebol|soccer|combate|premiere|espn|sportv|caze|bandsports|tnt\s*sports|fox\s*sports|dazn|nba|nfl|ufc|f1/i.test(txt) || /⚽|🥊|🏀|🏎️|🎾/u.test(name)) {
    return 'Esportes';
  }

  // 2. Notícias
  if (/news|noticia|jornal|cnn|bandnews|globonews|globo\s*news|record\s*news|jovem\s*pan|bloomberg|al\s*jazeera|bbc/i.test(txt)) {
    return 'Notícias';
  }

  // 3. Infantil (Cartoon, Disney, Nick, Gloob, Discovery Kids, Desenhos 24h, etc.)
  if (/infantil|infantis|kids|desenho|cartoon|cartoonito|nickelodeon|nick\b|gloob|gloobinho|disney|boomerang|tooncast|baby\s*tv|baby|ra\s*tim\s*bum|discovery\s*kids|dreamworks|animax|peppa|turma\s*da\s*monica|galinha\s*pintadinha/i.test(txt)) {
    return 'Infantil';
  }

  // 4. Filmes e Séries
  if (/filme|movie|cinema|telecine|hbo|megapix|cinemax|paramount|space|studiouniversal|studio\s*universal|warner|sony|axn|universal|star\s*channel|serie|series|anime|dorama|comedy\s*central|syfy|a&e|amc|tnt(?!.*sports)|tcm|cine|24\s*horas/i.test(txt)) {
    return 'Filmes e Séries';
  }

  // 5. Religiosos
  if (/religi|cancao\s*nova|rede\s*vida|redevida|aparecida|boa\s*vontade|gospel|novo\s*tempo|rit|evang|biblia|padre|igreja|adventista/i.test(txt)) {
    return 'Religiosos';
  }

  // 6. Variedades & Documentários
  if (/variedade|entretenimento|multishow|gnt|viva|discovery|history|nat\s*geo|national\s*geographic|animal\s*planet|tlc|hgtv|e!|arte|curta|off|food|woohoo|travel|fashion|home|investiga|id\b|reality|a\s*fazenda|bbb/i.test(txt)) {
    return 'Variedades';
  }

  // 7. Canais Abertos (Globo, SBT, Record, Band, RedeTV, Cultura, etc.)
  if (/globo|sbt|record|band|redetv|cultura|tv\s*brasil|gazeta|futura|educa|tv\s*escola|legislat|senado|camara|tribuna/i.test(txt)) {
    return 'Canais Abertos';
  }

  // Fallbacks baseados na tag do grupo do addon:
  if (/aberto|aberta/i.test(rawGroup)) return 'Canais Abertos';
  if (/esporte/i.test(rawGroup)) return 'Esportes';
  if (/filme|serie/i.test(rawGroup)) return 'Filmes e Séries';
  if (/noticia/i.test(rawGroup)) return 'Notícias';
  if (/infantil|infantis|desenho/i.test(rawGroup)) return 'Infantil';
  if (/religio/i.test(rawGroup)) return 'Religiosos';
  if (/variedade|entretenimento|document|reality/i.test(rawGroup)) return 'Variedades';

  return 'Canais Abertos';
}

function getStreamSourceScore(src) {
  if (!src) return -100;
  const origin = (src.origin || '').toLowerCase();
  const url = (src.url || '').toLowerCase();
  const label = (src.label || '').toLowerCase();

  // Filtra links de doação/pix/anúncio
  if (/livepix|pix\b|apoie|doacao/i.test(url + ' ' + label)) return -100;

  const isEmbed = Boolean(src.isWebEmbed) || isEmbedWebUrl(url);
  const isDirectHls = Boolean(src.isHls) || /\.m3u8?(\?|$)/i.test(url) || url.includes('/stream/tv/');

  let baseScore = 20;
  if (origin.includes('fenix') || url.includes('fenix')) baseScore = 65;
  else if (origin.includes('bestcine') || url.includes('bestcine')) baseScore = 60;
  else if (origin.includes('minha tv') || origin.includes('brazuca') || url.includes('minhatv') || url.includes('baby-beamup')) baseScore = 55;
  else if (origin.includes('tvplay') || origin.includes('tvvio') || url.includes('megaembed-frost')) baseScore = 40;

  if (isDirectHls) baseScore += 35;
  if (isEmbed) baseScore -= 45;

  return baseScore;
}

function mergeNewChannels(newItems, toastMsg = null) {
  const byName = new Map();
  const bySlug = new Map();

  channels.forEach((ch) => {
    const key = normalizeChannelMergeKey(ch.name);
    if (key) byName.set(key, ch);
    const slug = normalizeChannelSlug(ch.slug || ch.stremioId);
    if (slug) bySlug.set(slug, ch);
  });

  newItems.forEach((item) => {
    // Se for canal regional indesejado da Globo (mas se vier do Tvvio, TVPlay, Fenix TV, Minha TV ou BestCine, aceita)
    if (!item.isTvvio && !item.isTvplay && !item.isFenixTv && !item.isMinhaTv && !item.isBestCine && isUnwantedOtherGlobo(item.name)) {
      return;
    }

    // Regra de canais de Esportes vs Categorias
    if (isAllowedSportsChannel(item.name) || item.group === 'Esportes') {
      item.group = 'Esportes';
    }

    const key = normalizeChannelMergeKey(item.name);
    const slug = normalizeChannelSlug(item.slug || item.stremioId);

    // Deduplicação estrita: se bater o slug (ex: "aee") OU o nome normalizado (ex: "ae", "globosp", "sportv"):
    let existing = null;
    if (slug && bySlug.has(slug)) {
      existing = bySlug.get(slug);
    } else if (key && byName.has(key)) {
      existing = byName.get(key);
    }

    if (existing) {
      if ((item.isTvvio || item.isTvplay || item.isMinhaTv || item.isBestCine || item.isFenixTv) && !existing.isTvvio && !existing.isTvplay) {
        existing.isTvvio = true;
        if (item.group) existing.group = item.group;
        if (item.genres) existing.genres = item.genres;
        if (item.subCategory) existing.subCategory = item.subCategory;
      }
      if (item.isFenixTv) existing.isFenixTv = true;
      if (item.isMinhaTv) existing.isMinhaTv = true;
      if (item.isBestCine) existing.isBestCine = true;
      const incomingSources = item.sources || [{ label: 'Fonte', url: item.url, origin: 'IPTV' }];
      incomingSources.forEach((inc) => {
        if (!existing.sources.some((s) => s.url === inc.url)) {
          const isDirectStream = /\.m3u8?(\?|$)|\/stream\//i.test(inc.url) && !inc.isWebEmbed;
          const newSrc = {
            label: inc.label || `Fonte ${existing.sources.length + 1}`,
            url: inc.url,
            origin: inc.origin || 'IPTV',
            isWebEmbed: Boolean(inc.isWebEmbed),
            isStremioStream: Boolean(inc.isStremioStream)
          };
          if (isDirectStream) {
            existing.sources.push(newSrc);
          } else {
            existing.sources.push(newSrc);
          }
        }
      });
      if (existing.logo?.startsWith('data:image/svg') && item.logo && !item.logo.startsWith('data:image/svg')) {
        existing.logo = item.logo;
      }
      if (!existing.slug && slug) existing.slug = slug;
      if (!existing.stremioId && item.stremioId) existing.stremioId = item.stremioId;

      // Ordena fontes com base no score de prioridade: Fênix TV, Minha TV (Brazuca), BestCine...
      existing.sources = existing.sources.filter(s => getStreamSourceScore(s) > -50);
      existing.sources.sort((a, b) => getStreamSourceScore(b) - getStreamSourceScore(a));
      existing.url = existing.sources[0]?.url || existing.url;
    } else {
      const nextNum = String(channels.length + 1).padStart(3, '0');
      const entry = { ...item, number: nextNum };
      if (Array.isArray(entry.sources) && entry.sources.length > 0) {
        entry.sources = entry.sources.filter(s => getStreamSourceScore(s) > -50);
        entry.sources.sort((a, b) => getStreamSourceScore(b) - getStreamSourceScore(a));
        entry.url = entry.sources[0]?.url || entry.url;
      }
      channels.push(entry);
      if (key) byName.set(key, entry);
      if (slug) bySlug.set(slug, entry);
    }
  });

  window.channels = channels;
  window.filteredChannels = filteredChannels;
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
