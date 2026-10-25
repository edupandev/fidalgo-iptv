/**
 * FIDAL GO — Core de Reprodução e Recuperação Resiliente de Streaming
 * Implementa a especificação de engenharia reversa para hls.js, mpegts.js e proxy local:
 * - Recuperação oficial hls.js em 3 camadas (startLoad, recoverMediaError, swapAudioCodec)
 * - Reconexão transparente mpegts.js em live com backoff
 * - Isolamento por generationToken para prevenir vazamento de eventos assíncronos
 * - Telemetria de saúde (TTFF, rebuffers, stalls)
 * - Sem alterar layout, temas ou componentes visuais de UI
 */

(function () {
  'use strict';

  let currentGenerationToken = 0;
  let activeHls = null;
  let activeMpegts = null;
  let activeVideoElement = null;

  // Estado de recuperação da engine ativa
  let hlsNetworkRetries = 0;
  let hlsMediaRecoveries = 0;
  let mpegtsReconnectAttempts = 0;
  let mpegtsReconnectTimer = null;
  let isReconnecting = false;

  // Telemetria local de reprodução
  const telemetry = {
    startTime: 0,
    ttff: null, // Time to First Frame em ms
    rebuffersCount: 0,
    totalRebufferDurationMs: 0,
    lastWaitingStart: 0,
    currentEngine: null,
    recoveredMediaErrors: 0,
    recoveredNetworkErrors: 0,
    lastError: null
  };

  /**
   * Reseta o estado de telemetria para uma nova reprodução
   */
  function resetTelemetry(engineName) {
    telemetry.startTime = performance.now();
    telemetry.ttff = null;
    telemetry.rebuffersCount = 0;
    telemetry.totalRebufferDurationMs = 0;
    telemetry.lastWaitingStart = 0;
    telemetry.currentEngine = engineName;
    telemetry.lastError = null;
  }

  /**
   * Destrói todas as engines ativas de forma limpa, limpando timers e desconectando do elemento <video>
   */
  function destroyPlaybackEngines() {
    currentGenerationToken++;

    if (mpegtsReconnectTimer) {
      clearTimeout(mpegtsReconnectTimer);
      mpegtsReconnectTimer = null;
    }

    if (activeHls) {
      try {
        activeHls.stopLoad();
        activeHls.detachMedia();
        activeHls.destroy();
      } catch (_) {}
      activeHls = null;
    }

    if (activeMpegts) {
      try {
        activeMpegts.pause();
        activeMpegts.unload();
        activeMpegts.detachMediaElement();
        activeMpegts.destroy();
      } catch (_) {}
      activeMpegts = null;
    }

    hlsNetworkRetries = 0;
    hlsMediaRecoveries = 0;
    mpegtsReconnectAttempts = 0;
    isReconnecting = false;
  }

  /**
   * Configura listeners de telemetria no elemento <video>
   */
  function attachVideoTelemetry(video, token) {
    activeVideoElement = video;

    const onPlaying = () => {
      if (token !== currentGenerationToken) return;
      if (telemetry.ttff === null && telemetry.startTime > 0) {
        telemetry.ttff = Math.round(performance.now() - telemetry.startTime);
        console.log(`[PlaybackEngine] TTFF (Primeiro Frame): ${telemetry.ttff} ms (${telemetry.currentEngine})`);
      }
      if (telemetry.lastWaitingStart > 0) {
        const stallDur = performance.now() - telemetry.lastWaitingStart;
        telemetry.totalRebufferDurationMs += stallDur;
        telemetry.lastWaitingStart = 0;
      }
      // Zera contadores de recuperação após estabilização de reprodução
      hlsNetworkRetries = 0;
      hlsMediaRecoveries = 0;
      mpegtsReconnectAttempts = 0;
    };

    const onWaiting = () => {
      if (token !== currentGenerationToken) return;
      telemetry.rebuffersCount++;
      telemetry.lastWaitingStart = performance.now();
    };

    video.addEventListener('playing', onPlaying, { once: false });
    video.addEventListener('waiting', onWaiting, { once: false });

    // Aplica configurações visuais e de áudio preservadas (Saimo-TV)
    applyAspectRatio(currentAspectRatio, video);
    applyBrightness(currentBrightness, video);
    applyUpscaling(currentUpscaling);
    conectarAudioInteligente(video);
  }

  /**
   * Cria e inicializa o player hls.js com a configuração de referência recomendada e máquina de recuperação oficial
   */
  function initHlsPlayer({
    video,
    streamUrl,
    isLive = true,
    onManifestParsed = null,
    onFatalFallback = null
  }) {
    destroyPlaybackEngines();
    const token = currentGenerationToken;
    resetTelemetry('hls.js');
    attachVideoTelemetry(video, token);

    if (!window.Hls || !Hls.isSupported()) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('[PlaybackEngine] HLS nativo do navegador');
        video.src = streamUrl;
        video.play().catch(() => {});
        return null;
      }
      if (typeof onFatalFallback === 'function') {
        onFatalFallback({ code: 'UNSUPPORTED_FORMAT', message: 'HLS não suportado neste navegador' });
      }
      return null;
    }

    // Configuração oficial de referência (estabilidade contínua e buffer balanceado)
    const hlsConfig = {
      enableWorker: true,
      lowLatencyMode: false, // lowLatencyMode:false evita rebuffers intermitentes em conexões domésticas
      backBufferLength: 30,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      manifestLoadingTimeOut: 15000,
      manifestLoadingMaxRetry: 3,
      levelLoadingTimeOut: 15000,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 4,
      startLevel: -1 // ABR automático inicial
    };

    const hls = new Hls(hlsConfig);
    activeHls = hls;

    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      if (token !== currentGenerationToken) return;
      hls.loadSource(streamUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      if (token !== currentGenerationToken) return;
      video.play().catch(() => {});
      if (typeof onManifestParsed === 'function') {
        onManifestParsed(data);
      }
      if (typeof window.PlayerAudioSubsManager?.refreshStreamAudioTracks === 'function') {
        window.PlayerAudioSubsManager.refreshStreamAudioTracks();
      }
      if (typeof window.PlayerAudioSubsManager?.refreshQualityTracks === 'function') {
        window.PlayerAudioSubsManager.refreshQualityTracks();
      }
    });

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      if (token !== currentGenerationToken) return;
      if (typeof window.PlayerAudioSubsManager?.refreshStreamAudioTracks === 'function') {
        window.PlayerAudioSubsManager.refreshStreamAudioTracks();
      }
    });

    hls.on(Hls.Events.LEVEL_LOADED, () => {
      if (token !== currentGenerationToken) return;
      if (typeof window.PlayerAudioSubsManager?.refreshQualityTracks === 'function') {
        window.PlayerAudioSubsManager.refreshQualityTracks();
      }
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      if (token !== currentGenerationToken) return;
      if (typeof window.PlayerAudioSubsManager?.updateActiveQualityBadge === 'function') {
        window.PlayerAudioSubsManager.updateActiveQualityBadge(data?.level);
      }
    });

    // ========================================================================
    // MÁQUINA DE RECUPERAÇÃO OFICIAL HLS.JS (Item 2 do Prompt)
    // ========================================================================
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (token !== currentGenerationToken) return;

      if (!data.fatal) {
        return; // Ignora erros não fatais recuperados internamente pelo hls.js
      }

      console.warn(`[PlaybackEngine] HLS Erro Fatal: ${data.type} / Detalhe: ${data.details}`, data);

      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          if (hlsNetworkRetries < 3) {
            hlsNetworkRetries++;
            const backoffMs = [1000, 2000, 4000][hlsNetworkRetries - 1] || 2000;
            console.log(`[PlaybackEngine] Tentativa de recuperação de rede #${hlsNetworkRetries} em ${backoffMs}ms via hls.startLoad()`);
            setTimeout(() => {
              if (token !== currentGenerationToken || !activeHls) return;
              activeHls.startLoad();
              telemetry.recoveredNetworkErrors++;
            }, backoffMs);
          } else {
            console.error('[PlaybackEngine] Recuperação de rede esgotada');
            telemetry.lastError = data;
            if (typeof onFatalFallback === 'function') {
              onFatalFallback(data);
            }
          }
          break;

        case Hls.ErrorTypes.MEDIA_ERROR:
          hlsMediaRecoveries++;
          if (hlsMediaRecoveries === 1) {
            console.log('[PlaybackEngine] Tentativa de recuperação de mídia #1 via hls.recoverMediaError()');
            activeHls.recoverMediaError();
            telemetry.recoveredMediaErrors++;
          } else if (hlsMediaRecoveries === 2) {
            console.log('[PlaybackEngine] Tentativa de recuperação de mídia #2 via hls.swapAudioCodec() + recoverMediaError()');
            activeHls.swapAudioCodec();
            activeHls.recoverMediaError();
            telemetry.recoveredMediaErrors++;
          } else {
            console.error('[PlaybackEngine] Recuperação de mídia esgotada');
            telemetry.lastError = data;
            if (typeof onFatalFallback === 'function') {
              onFatalFallback(data);
            }
          }
          break;

        default:
          console.error('[PlaybackEngine] Erro irrecuperável de engine HLS:', data.type);
          telemetry.lastError = data;
          if (typeof onFatalFallback === 'function') {
            onFatalFallback(data);
          }
          break;
      }
    });

    return hls;
  }

  /**
   * Cria e inicializa o player mpegts.js com reconexão resiliente em live (Item 4)
   */
  function initMpegtsPlayer({
    video,
    streamUrl,
    isLive = true,
    onFatalFallback = null
  }) {
    destroyPlaybackEngines();
    const token = currentGenerationToken;
    resetTelemetry('mpegts.js');
    attachVideoTelemetry(video, token);

    if (!window.mpegts || !mpegts.getFeatureList().mseLivePlayback) {
      if (typeof onFatalFallback === 'function') {
        onFatalFallback({ code: 'UNSUPPORTED_FORMAT', message: 'mpegts não suportado neste navegador' });
      }
      return null;
    }

    const player = mpegts.createPlayer(
      {
        type: 'mpegts',
        isLive: isLive,
        url: streamUrl
      },
      {
        enableWorker: true,
        lazyLoad: false,
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 3.0,
        liveBufferLatencyMinRemain: 1.0,
        autoCleanupSourceBuffer: true
      }
    );

    activeMpegts = player;
    player.attachMediaElement(video);
    player.load();
    player.play().catch(() => {});

    // Reconexão de live que fecha ou apresenta erro (Item 4)
    const handleMpegtsError = (errType, errDetail) => {
      if (token !== currentGenerationToken) return;
      if (isReconnecting) return;

      if (mpegtsReconnectAttempts < 3) {
        mpegtsReconnectAttempts++;
        isReconnecting = true;
        const delay = [1000, 2000, 4000][mpegtsReconnectAttempts - 1] || 2000;
        console.warn(`[PlaybackEngine] mpegts.js caiu (${errType}/${errDetail}). Reconectando tentativa #${mpegtsReconnectAttempts} em ${delay}ms...`);

        mpegtsReconnectTimer = setTimeout(() => {
          if (token !== currentGenerationToken) return;
          isReconnecting = false;
          initMpegtsPlayer({ video, streamUrl, isLive, onFatalFallback });
        }, delay);
      } else {
        console.error('[PlaybackEngine] Falha definitiva no mpegts.js');
        if (typeof onFatalFallback === 'function') {
          onFatalFallback({ code: 'MPEGTS_FATAL_ERROR', errType, errDetail });
        }
      }
    };

    player.on(mpegts.Events.ERROR, (type, detail, info) => {
      handleMpegtsError(type, detail);
    });

    return player;
  }

  // ========================================================================
  // 1. Áudio Inteligente (Normalização Dinâmica de Volume / Web Audio API DRC)
  // Portado diretamente da arquitetura do Saimo-TV (audioInteligente.ts)
  // Nivela volumes discrepantes e aplica ganho de +3dB nos canais sem clipping
  // ========================================================================
  const CHAVE_AUDIO_INTELIGENTE = 'saimo-audio-inteligente';
  let audioCtx = null;
  let audioCompressor = null;
  let audioMakeupGain = null;
  const connectedAudioElements = new WeakSet();

  function isAudioInteligenteAtivo() {
    const salvo = localStorage.getItem(CHAVE_AUDIO_INTELIGENTE);
    return salvo === null ? true : salvo === 'true';
  }

  function aplicarParametrosAudioInteligente() {
    if (!audioCtx || !audioCompressor || !audioMakeupGain) return;
    const ativo = isAudioInteligenteAtivo();
    const t = audioCtx.currentTime;

    if (ativo) {
      // Parâmetros calibrados do Saimo-TV para áudio broadcast e cinema
      audioCompressor.threshold.setValueAtTime(-22, t);
      audioCompressor.knee.setValueAtTime(24, t);
      audioCompressor.ratio.setValueAtTime(8, t);
      audioCompressor.attack.setValueAtTime(0.005, t);
      audioCompressor.release.setValueAtTime(0.20, t);
      audioMakeupGain.gain.setValueAtTime(1.4, t); // +3 dB de reforço dinâmico limpo
    } else {
      audioCompressor.threshold.setValueAtTime(0, t);
      audioMakeupGain.gain.setValueAtTime(1.0, t);
    }
  }

  function obterAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      audioCtx = new AudioContextClass();
      audioCompressor = audioCtx.createDynamicsCompressor();
      audioMakeupGain = audioCtx.createGain();

      audioCompressor.connect(audioMakeupGain);
      audioMakeupGain.connect(audioCtx.destination);

      aplicarParametrosAudioInteligente();
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  function setAudioInteligenteAtivo(ativo) {
    localStorage.setItem(CHAVE_AUDIO_INTELIGENTE, ativo ? 'true' : 'false');
    aplicarParametrosAudioInteligente();
    window.dispatchEvent(new CustomEvent('saimo-audio-inteligente-mudou', { detail: { ativo } }));
    if (typeof window.showPlayerToast === 'function') {
      window.showPlayerToast(ativo ? '🔊 Áudio Inteligente: Ativado' : '🔈 Áudio Inteligente: Desativado');
    }
  }

  function toggleAudioInteligente() {
    const novo = !isAudioInteligenteAtivo();
    setAudioInteligenteAtivo(novo);
    return novo;
  }

  function conectarAudioInteligente(video) {
    if (!video || connectedAudioElements.has(video)) return;

    // Conecta se for MSE (blob:) ou tiver crossorigin liberado
    if (video.src && !video.src.startsWith('blob:') && !video.src.startsWith('data:') && !video.crossOrigin) {
      return;
    }

    try {
      const ctx = obterAudioContext();
      if (!ctx || !audioCompressor) return;

      const source = ctx.createMediaElementSource(video);
      source.connect(audioCompressor);
      connectedAudioElements.add(video);

      const retomar = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      };
      video.addEventListener('play', retomar, { passive: true });
    } catch (_) {
      // Ignora nós já acoplados ou restrições de DRM do navegador
    }
  }

  // ========================================================================
  // 2. Super Resolução Upscaling (SVG Convolution Filters) & Brilho
  // ========================================================================
  const CHAVE_UPSCALING = 'saimo-upscaling';
  const CHAVE_BRILHO = 'saimo-brightness';

  let currentUpscaling = localStorage.getItem(CHAVE_UPSCALING) || 'off';
  let currentBrightness = parseInt(localStorage.getItem(CHAVE_BRILHO) || '100', 10);

  function applyUpscaling(mode) {
    if (!['off', 'hd', '4k'].includes(mode)) mode = 'off';
    currentUpscaling = mode;
    localStorage.setItem(CHAVE_UPSCALING, mode);
    document.documentElement.dataset.upscaling = mode;
    window.dispatchEvent(new CustomEvent('saimo-upscaling-mudou', { detail: { mode } }));
    const labels = {
      'off': 'Desligado (Nativo)',
      'hd': 'Nitidez HD (FHD)',
      '4k': 'Super Resolução 4K'
    };
    if (typeof window.showPlayerToast === 'function') {
      window.showPlayerToast(`✨ Upscaling: ${labels[mode] || mode}`);
    }
    return mode;
  }

  function cycleUpscaling() {
    const modes = ['off', 'hd', '4k'];
    const nextIdx = (modes.indexOf(currentUpscaling) + 1) % modes.length;
    return applyUpscaling(modes[nextIdx]);
  }

  function applyBrightness(percent, videoEl = activeVideoElement) {
    const val = Math.max(50, Math.min(150, parseInt(percent, 10) || 100));
    currentBrightness = val;
    localStorage.setItem(CHAVE_BRILHO, val.toString());

    const video = videoEl || activeVideoElement || document.getElementById('videoPlayer') || document.querySelector('video');
    const container = document.getElementById('playerVideoStage') || (video ? video.parentElement : null);
    if (container) {
      container.style.filter = val !== 100 ? `brightness(${val}%)` : '';
    } else if (video) {
      video.style.filter = val !== 100 ? `brightness(${val}%)` : '';
    }
    return val;
  }

  // ========================================================================
  // 3. Modos de Aspect Ratio (Proporção)
  // ========================================================================
  const ASPECT_MODES = ['fit', 'zoom', 'fill', '16-9'];
  const ASPECT_LABELS = {
    'fit': 'Ajustar (Original)',
    'zoom': 'Zoom (Sem Bordas)',
    'fill': 'Preencher (Esticar)',
    '16-9': '16:9 Tela Cheia'
  };
  let currentAspectRatio = localStorage.getItem('fidal_aspect_ratio') || 'fit';

  function applyAspectRatio(mode, videoEl = activeVideoElement) {
    if (!ASPECT_MODES.includes(mode)) mode = 'fit';
    currentAspectRatio = mode;
    localStorage.setItem('fidal_aspect_ratio', mode);

    const video = videoEl || activeVideoElement || document.getElementById('liveVideo') || document.querySelector('video');
    if (!video) return mode;

    video.style.transition = 'object-fit 0.2s ease, transform 0.2s ease';
    if (mode === 'fit') {
      video.style.objectFit = 'contain';
      video.style.transform = 'none';
      video.style.width = '100%';
      video.style.height = '100%';
    } else if (mode === 'zoom') {
      video.style.objectFit = 'cover';
      video.style.transform = 'none';
      video.style.width = '100%';
      video.style.height = '100%';
    } else if (mode === 'fill') {
      video.style.objectFit = 'fill';
      video.style.transform = 'none';
      video.style.width = '100%';
      video.style.height = '100%';
    } else if (mode === '16-9') {
      video.style.objectFit = 'fill';
      video.style.aspectRatio = '16 / 9';
      video.style.transform = 'none';
      video.style.width = '100%';
      video.style.height = '100%';
    }

    if (typeof window.showPlayerToast === 'function') {
      window.showPlayerToast(`📺 Proporção: ${ASPECT_LABELS[mode]}`);
    }
    return mode;
  }

  function cycleAspectRatio(videoEl = activeVideoElement) {
    const nextIdx = (ASPECT_MODES.indexOf(currentAspectRatio) + 1) % ASPECT_MODES.length;
    return applyAspectRatio(ASPECT_MODES[nextIdx], videoEl);
  }

  // ========================================================================
  // 4. Faixas de Áudio Dinâmicas HLS & Qualidade de Vídeo
  // ========================================================================
  function getAudioTracks() {
    if (!activeHls || !Array.isArray(activeHls.audioTracks) || activeHls.audioTracks.length === 0) {
      return [];
    }
    return activeHls.audioTracks.map((t, idx) => ({
      id: idx,
      name: t.name || t.lang || `Faixa ${idx + 1}`,
      lang: t.lang || '',
      channels: t.channels || 2,
      active: activeHls.audioTrack === idx
    }));
  }

  function setAudioTrack(trackId) {
    if (activeHls && Array.isArray(activeHls.audioTracks) && typeof trackId === 'number') {
      if (trackId >= 0 && trackId < activeHls.audioTracks.length) {
        activeHls.audioTrack = trackId;
        const track = activeHls.audioTracks[trackId];
        const label = track?.name || track?.lang || `Faixa ${trackId + 1}`;
        if (typeof window.showPlayerToast === 'function') {
          window.showPlayerToast(`🔊 Áudio: ${label}`);
        }
        return true;
      }
    }
    return false;
  }

  function cycleAudioTrack() {
    if (!activeHls || !Array.isArray(activeHls.audioTracks) || activeHls.audioTracks.length <= 1) {
      if (typeof window.PlayerAudioSubsManager?.toggleDrawer === 'function') {
        window.PlayerAudioSubsManager.toggleDrawer();
      }
      return -1;
    }
    const nextIdx = (activeHls.audioTrack + 1) % activeHls.audioTracks.length;
    setAudioTrack(nextIdx);
    return nextIdx;
  }

  function getQualityLevels() {
    if (!activeHls || !Array.isArray(activeHls.levels) || activeHls.levels.length === 0) {
      return [];
    }
    return activeHls.levels.map((lvl, idx) => ({
      id: idx,
      height: lvl.height || 0,
      width: lvl.width || 0,
      bitrate: lvl.bitrate || 0,
      label: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)} kbps`,
      active: activeHls.currentLevel === idx
    }));
  }

  function setQualityLevel(levelId) {
    if (activeHls) {
      activeHls.currentLevel = levelId;
      const label = levelId === -1 ? 'Automática (Auto ABR)' : (activeHls.levels[levelId]?.height ? `${activeHls.levels[levelId].height}p` : `Nível ${levelId}`);
      if (typeof window.showPlayerToast === 'function') {
        window.showPlayerToast(`📺 Resolução: ${label}`);
      }
      return true;
    }
    return false;
  }

  function setPlaybackRate(rate) {
    const video = activeVideoElement || document.getElementById('videoPlayer') || document.querySelector('video');
    if (video) {
      video.playbackRate = rate;
      if (typeof window.showPlayerToast === 'function') {
        window.showPlayerToast(`⚡ Velocidade: ${rate}x`);
      }
      return rate;
    }
    return 1;
  }

  function getPlaybackRate() {
    const video = activeVideoElement || document.getElementById('videoPlayer') || document.querySelector('video');
    return video ? video.playbackRate : 1;
  }

  // Atalhos de teclado e controle remoto Saimo-TV (Tecla W para Proporção, Tecla A para Áudio, Tecla S para Ajustes)
  window.addEventListener('keydown', (e) => {
    const isInput = e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
    if (isInput) return;

    if (e.key === 'w' || e.key === 'W' || e.keyCode === 184 || e.keyCode === 170 || e.key === 'F3') {
      cycleAspectRatio();
    } else if (e.key === 'a' || e.key === 'A') {
      cycleAudioTrack();
    } else if (e.key === 's' || e.key === 'S') {
      if (typeof window.PlayerAudioSubsManager?.toggleDrawer === 'function') {
        window.PlayerAudioSubsManager.toggleDrawer();
      }
    }
  });

  // Exporta a interface global do StreamPlaybackEngine e AudioInteligenteService
  window.StreamPlaybackEngine = {
    initHlsPlayer,
    initMpegtsPlayer,
    destroyPlaybackEngines,
    getTelemetry: () => ({ ...telemetry }),
    getActiveHls: () => activeHls,
    getActiveMpegts: () => activeMpegts,
    applyAspectRatio,
    cycleAspectRatio,
    getAspectRatio: () => currentAspectRatio,
    getAspectRatioLabel: () => ASPECT_LABELS[currentAspectRatio] || currentAspectRatio,
    // Áudio Inteligente (Saimo-TV)
    isAudioInteligenteAtivo,
    setAudioInteligenteAtivo,
    toggleAudioInteligente,
    conectarAudioInteligente,
    // Upscaling & Imagem
    applyUpscaling,
    cycleUpscaling,
    getUpscaling: () => currentUpscaling,
    applyBrightness,
    getBrightness: () => currentBrightness,
    // Trilhas e Qualidade
    getAudioTracks,
    setAudioTrack,
    cycleAudioTrack,
    getQualityLevels,
    setQualityLevel,
    setPlaybackRate,
    getPlaybackRate
  };

  window.AudioInteligenteService = {
    isAtivo: isAudioInteligenteAtivo,
    setAtivo: setAudioInteligenteAtivo,
    toggle: toggleAudioInteligente,
    conectar: conectarAudioInteligente
  };

  console.log('[PlaybackEngine] Módulo de streaming Saimo-TV unificado carregado com sucesso.');
})();
