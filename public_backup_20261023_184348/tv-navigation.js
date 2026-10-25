/**
 * FIDAL GO — Navegação Espacial Profissional para Android TV & TV Box (tvOS Engine)
 * Navegação por Zonas e Linhas (Row-Based Linear Navigation)
 * Totalmente adaptada para controle remoto (D-Pad, OK, Voltar, Teclado Numérico)
 */

(function () {
  'use strict';

  let currentFocusedElement = null;
  let lastContentFocusedElement = null;
  let numberBuffer = '';
  let numberTimer = null;
  let overlayEl = null;

  // Inactivity & HUD Auto-hide timers
  let playerInactivityTimer = null;
  let osdTimer = null;

  // Detecta dispositivo Smart TV / Android TV / Fire TV / Mi Stick / WebOS / Tizen
  const isTvDevice = /Android TV|SmartTV|BRAVIA|NetCast|Tizen|Web0S|MiBox|MiStick|FireTV|AFT|CrKey|Cordova|Capacitor|FidalGoTV|tvOS/i.test(navigator.userAgent);
  if (isTvDevice) {
    document.body.classList.add('tv-device');
  }

  // Cria overlay visual para sintonia direta de canais por números (0-9)
  function createNumberOverlay() {
    if (document.getElementById('tvChannelDirectOverlay')) return;
    overlayEl = document.createElement('div');
    overlayEl.id = 'tvChannelDirectOverlay';
    overlayEl.className = 'hidden fixed top-8 right-8 z-[9999] tvos-glass px-6 py-4 rounded-3xl border-2 border-sky-400 shadow-2xl flex items-center gap-3 backdrop-blur-md animate-pulse';
    overlayEl.innerHTML = `
      <div class="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
      </div>
      <div>
        <div class="text-[11px] font-bold uppercase tracking-wider text-sky-300">Sintonia de Canal</div>
        <div class="text-2xl font-black text-white font-mono tracking-widest" id="tvChannelDirectNumber">---</div>
      </div>
    `;
    document.body.appendChild(overlayEl);
  }

  // Feedback Visual OSD no Player (Seek +10s / -10s, Play, Pause)
  function showPlayerOsd(text, icon = '▶') {
    const osd = document.getElementById('playerRemoteOsd');
    if (!osd) return;

    const iconEl = document.getElementById('playerRemoteOsdIcon');
    const textEl = document.getElementById('playerRemoteOsdText');
    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;

    osd.classList.remove('hidden');
    osd.classList.remove('tv-osd-hidden');

    if (osdTimer) clearTimeout(osdTimer);
    osdTimer = setTimeout(() => {
      osd.classList.add('tv-osd-hidden');
      setTimeout(() => {
        osd.classList.add('hidden');
      }, 250);
    }, 1200);
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.classList.contains('hidden') || el.classList.contains('is-hidden')) return false;
    if (el.closest('.hidden') || el.closest('.is-hidden')) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findFirstVisible(selector, root = document) {
    const list = root.querySelectorAll(selector);
    for (let i = 0; i < list.length; i++) {
      if (isVisible(list[i])) return list[i];
    }
    return null;
  }

  function findAllVisible(selector, root = document) {
    return Array.from(root.querySelectorAll(selector)).filter(isVisible);
  }

  // Aplica o foco visual Apple tvOS e garante centralização suave nos carrosséis
  function setFocus(el, shouldScroll = true) {
    if (!el || !isVisible(el)) return false;

    if (currentFocusedElement && currentFocusedElement !== el) {
      currentFocusedElement.classList.remove('tv-focused');
      currentFocusedElement.classList.remove('focused');
    }

    currentFocusedElement = el;
    el.classList.add('tv-focused');
    el.classList.add('focused');

    // Guarda o último elemento de conteúdo focado para restaurar ao sair do player
    if (
      el.classList.contains('vod-card') ||
      el.classList.contains('channel-card') ||
      el.matches('[data-nav-tab]')
    ) {
      lastContentFocusedElement = el;
    }

    // Foca o elemento sem invocar rolagem brusca padrão do navegador
    try {
      if (el.id === 'globalSearchInput') {
        // Não dá focus nativo imediatamente no input de busca para evitar travar as setas D-Pad
        // O teclado da TV será aberto assim que o usuário pressionar OK/Enter
        if (document.activeElement && document.activeElement !== el && document.activeElement.tagName === 'INPUT') {
          document.activeElement.blur();
        }
      } else if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
        el.focus({ preventScroll: true });
      } else {
        el.focus();
      }
    } catch (_) {}

    // Revela somente o necessário no carrossel ou na tela (sem saltos bruscos)
    if (shouldScroll) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch (_) {
        try { el.scrollIntoView(false); } catch (__) {}
      }
    }

    return true;
  }

  // Auto-esconder o HUD do player após 4 segundos de inatividade
  function hidePlayerHud() {
    const playerBox = document.getElementById('livePlayerBox');
    const video = document.getElementById('videoPlayer');
    const drawer = document.getElementById('playerAudioSubsDrawer');
    const metaModal = document.getElementById('stremioMetaModal');

    if (!playerBox || !video) return;
    if (video.paused || video.ended) return;
    if (drawer && !drawer.classList.contains('is-hidden')) return;
    if (metaModal && !metaModal.classList.contains('hidden')) return;

    playerBox.classList.add('tv-hud-hidden');
  }

  function showPlayerHud() {
    const playerBox = document.getElementById('livePlayerBox');
    if (playerBox) {
      playerBox.classList.remove('tv-hud-hidden');
    }
    resetPlayerInactivityTimer();
  }

  function resetPlayerInactivityTimer() {
    if (playerInactivityTimer) clearTimeout(playerInactivityTimer);

    const playerBox = document.getElementById('livePlayerBox');
    const video = document.getElementById('videoPlayer');
    const drawer = document.getElementById('playerAudioSubsDrawer');

    if (!playerBox || !video) return;
    if (video.paused || video.ended) return;
    if (drawer && !drawer.classList.contains('is-hidden')) return;

    playerInactivityTimer = setTimeout(hidePlayerHud, 4000);
  }

  // Coleta todos os elementos interativos visíveis na tela
  function getFocusables() {
    const selector = [
      '#mainNavTabs [data-nav-tab]',
      '#globalSearchInput',
      '#btnOpenSourcesModal',
      '#btnOpenNuvioAccountModal',
      '#btnDownloadApk',
      '#btnHeroWatchNow',
      '#btnHeroPrev',
      '#btnHeroNext',
      '#multiSourcePills button',
      '#btnPlayerAudioSubs',
      '#btnPlayerFavorite',
      '#btnNextSource',
      '#btnToggleProxy',
      '#btnClosePlayerStage',
      '#btnCatHScrollLeft',
      '#btnCatHScrollRight',
      '.cat-chip',
      '.vod-card',
      '.channel-card',
      '#stageSeasonList button',
      '#stageEpisodesList > div',
      '[data-stage-movie-audio]',
      '#stageMovieReprodutoresList > div',
      '#btnNextEpisode',
      '#btnNextEpisodeStage',
      '#btnNextEpisodeOverlay',
      '#btnCloseAudioSubsDrawer',
      '[data-hud-audio]',
      '.hud-subs-item',
      '.hud-opt-btn',
      '#videoPlayer',
      '.genre-pill',
      '.stremio-stream-card',
      'button:not(.hidden)',
      'a[href]:not(.hidden)',
      '[tabindex="0"]:not(.hidden)'
    ].join(', ');

    const seen = new Set();
    const result = [];
    const elements = document.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!seen.has(el) && isVisible(el)) {
        seen.add(el);
        result.push(el);
      }
    }
    return result;
  }

  // Abre teclado da Android TV ou caixa de diálogo nativa
  function openTvSearchInput() {
    const searchInput = document.getElementById('globalSearchInput');
    const currentVal = searchInput ? searchInput.value : '';

    if (window.FidalAppBridge && typeof window.FidalAppBridge.openSearchDialog === 'function') {
      window.FidalAppBridge.openSearchDialog(currentVal);
      return;
    }

    if (window.FidalAppBridge && typeof window.FidalAppBridge.showKeyboard === 'function') {
      window.FidalAppBridge.showKeyboard();
      if (searchInput) {
        searchInput.focus();
        try { searchInput.select(); } catch (_) {}
      }
      return;
    }

    if (searchInput) {
      searchInput.focus();
      try { searchInput.select(); } catch (_) {}
    }
  }

  // Navegação Especializada por Zonas de Interface da TV
  function handleNavigation(dir) {
    if (!currentFocusedElement || !document.body.contains(currentFocusedElement) || !isVisible(currentFocusedElement)) {
      const initial =
        findFirstVisible('[data-nav-tab].active') ||
        findFirstVisible('[data-nav-tab]') ||
        findFirstVisible('.cat-chip.active') ||
        findFirstVisible('.cat-chip') ||
        findFirstVisible('.vod-card, .channel-card') ||
        getFocusables()[0];
      if (initial) setFocus(initial);
      return;
    }

    const current = currentFocusedElement;

    // 1. ZONA: Menu Superior de Abas ([data-nav-tab])
    if (current.matches('[data-nav-tab]')) {
      const tabs = findAllVisible('#mainNavTabs [data-nav-tab]');
      const idx = tabs.indexOf(current);

      if (dir === 'right') {
        if (idx >= 0 && idx + 1 < tabs.length) {
          if (setFocus(tabs[idx + 1])) return;
        } else {
          const search = findFirstVisible('#globalSearchInput');
          if (search && setFocus(search)) return;
        }
      } else if (dir === 'left') {
        if (idx > 0) {
          if (setFocus(tabs[idx - 1])) return;
        }
      } else if (dir === 'down') {
        // Desce para o player stage, chips de categoria, hero ou cards
        const playerBtn = findFirstVisible('#multiSourcePills button, #btnPlayerAudioSubs, #btnNextSource, #btnClosePlayerStage');
        if (playerBtn && setFocus(playerBtn)) return;

        const activeCat = findFirstVisible('.cat-chip.active') || findFirstVisible('.cat-chip');
        if (activeCat && setFocus(activeCat)) return;

        const heroBtn = findFirstVisible('#btnHeroWatchNow');
        if (heroBtn && setFocus(heroBtn)) return;

        const firstCard = findFirstVisible('.vod-card, .channel-card');
        if (firstCard && setFocus(firstCard)) return;
      }
    }

    // 1.1 ZONA: Barra de Busca (#globalSearchInput) & Botões do Header
    if (current.id === 'globalSearchInput') {
      if (dir === 'left') {
        const tabs = findAllVisible('#mainNavTabs [data-nav-tab]');
        if (tabs.length > 0 && setFocus(tabs[tabs.length - 1])) return;
      } else if (dir === 'right') {
        const nextBtn = findFirstVisible('#btnOpenSourcesModal, #btnOpenNuvioAccountModal, #btnDownloadApk');
        if (nextBtn && setFocus(nextBtn)) return;
      } else if (dir === 'down') {
        const target = findFirstVisible('#btnHeroWatchNow, .cat-chip.active, .cat-chip, .vod-card, .channel-card');
        if (target && setFocus(target)) return;
      }
    }

    if (current.id === 'btnOpenSourcesModal') {
      if (dir === 'left') {
        const search = findFirstVisible('#globalSearchInput');
        if (search && setFocus(search)) return;
      } else if (dir === 'right') {
        const accBtn = findFirstVisible('#btnOpenNuvioAccountModal, #btnDownloadApk');
        if (accBtn && setFocus(accBtn)) return;
      } else if (dir === 'down') {
        const target = findFirstVisible('#btnHeroWatchNow, .cat-chip.active, .cat-chip, .vod-card, .channel-card');
        if (target && setFocus(target)) return;
      }
    }

    if (current.id === 'btnOpenNuvioAccountModal') {
      if (dir === 'left') {
        const prevBtn = findFirstVisible('#btnOpenSourcesModal, #globalSearchInput');
        if (prevBtn && setFocus(prevBtn)) return;
      } else if (dir === 'right') {
        const apkBtn = findFirstVisible('#btnDownloadApk');
        if (apkBtn && setFocus(apkBtn)) return;
      } else if (dir === 'down') {
        const target = findFirstVisible('#btnHeroWatchNow, .cat-chip.active, .cat-chip, .vod-card, .channel-card');
        if (target && setFocus(target)) return;
      }
    }

    if (current.id === 'btnDownloadApk') {
      if (dir === 'left') {
        const accBtn = findFirstVisible('#btnOpenNuvioAccountModal, #btnOpenSourcesModal');
        if (accBtn && setFocus(accBtn)) return;
      } else if (dir === 'down') {
        const target = findFirstVisible('#btnHeroWatchNow, .cat-chip.active, .cat-chip, .vod-card, .channel-card');
        if (target && setFocus(target)) return;
      }
    }

    // 2. ZONA: Hero Banner da Apple TV+ (#btnHeroWatchNow / #btnHeroPrev / #btnHeroNext)
    if (current.id === 'btnHeroWatchNow' || current.id === 'btnHeroPrev' || current.id === 'btnHeroNext') {
      if (dir === 'up') {
        const activeTab = findFirstVisible('[data-nav-tab].active') || findFirstVisible('[data-nav-tab]');
        if (activeTab && setFocus(activeTab)) return;
      } else if (dir === 'down') {
        const firstCard = findFirstVisible('.vod-card, .channel-card');
        if (firstCard && setFocus(firstCard)) return;
      } else if (dir === 'left') {
        if (current.id === 'btnHeroWatchNow') {
          const prevBtn = findFirstVisible('#btnHeroPrev');
          if (prevBtn && setFocus(prevBtn)) return;
        }
      } else if (dir === 'right') {
        if (current.id === 'btnHeroWatchNow') {
          const nextBtn = findFirstVisible('#btnHeroNext');
          if (nextBtn && setFocus(nextBtn)) return;
        }
      }
    }

    // 2.1 ZONA: Controles do Player e Palco Ao Vivo
    const isPlayerControl = current.id === 'videoPlayer' ||
      current.id === 'btnNextSource' ||
      current.id === 'btnPlayerAudioSubs' ||
      current.id === 'btnPlayerFavorite' ||
      current.id === 'btnToggleProxy' ||
      current.id === 'btnClosePlayerStage' ||
      current.id === 'btnNextEpisodeOverlay' ||
      current.closest('#multiSourcePills') ||
      current.closest('#livePlayerBox');

    if (isPlayerControl) {
      if (dir === 'up') {
        const activeTab = findFirstVisible('[data-nav-tab].active') || findFirstVisible('[data-nav-tab]');
        if (activeTab && setFocus(activeTab)) return;
      } else if (dir === 'down') {
        const firstEp = findFirstVisible('#stageEpisodesList > div');
        const firstSrc = findFirstVisible('#stageMovieReprodutoresList > div');
        if (firstEp && setFocus(firstEp)) return;
        if (firstSrc && setFocus(firstSrc)) return;

        const cat = findFirstVisible('.cat-chip.active') || findFirstVisible('.cat-chip');
        if (cat && setFocus(cat)) return;

        const firstCard = findFirstVisible('.vod-card, .channel-card');
        if (firstCard && setFocus(firstCard)) return;
      } else if (dir === 'left' || dir === 'right') {
        const pControls = findAllVisible('#multiSourcePills button, #btnPlayerAudioSubs, #btnPlayerFavorite, #btnNextSource, #btnToggleProxy, #btnClosePlayerStage');
        const pIdx = pControls.indexOf(current);
        if (dir === 'left' && pIdx > 0) {
          if (setFocus(pControls[pIdx - 1])) return;
        } else if (dir === 'right' && pIdx >= 0 && pIdx + 1 < pControls.length) {
          if (setFocus(pControls[pIdx + 1])) return;
        }
      }
    }

    // 3. ZONA: Chips de Categoria (.cat-chip)
    if (current.classList.contains('cat-chip')) {
      const chips = findAllVisible('.cat-chip');
      const idx = chips.indexOf(current);

      if (dir === 'right') {
        if (idx >= 0 && idx + 1 < chips.length) {
          if (setFocus(chips[idx + 1])) return;
        }
      } else if (dir === 'left') {
        if (idx > 0) {
          if (setFocus(chips[idx - 1])) return;
        }
      } else if (dir === 'down') {
        const firstCard = findFirstVisible('.vod-card, .channel-card');
        if (firstCard && setFocus(firstCard)) return;
      } else if (dir === 'up') {
        const playerBtn = findFirstVisible('#multiSourcePills button, #btnPlayerAudioSubs, #btnNextSource, #btnClosePlayerStage');
        if (playerBtn && setFocus(playerBtn)) return;

        const activeTab = findFirstVisible('[data-nav-tab].active') || findFirstVisible('[data-nav-tab]');
        if (activeTab && setFocus(activeTab)) return;
      }
    }

    // 4. ZONA: Carrosséis / Linhas de Filmes, Séries e Canais (.vod-card, .channel-card)
    if (current.classList.contains('vod-card') || current.classList.contains('channel-card')) {
      const row = current.closest('.roleta-track') || current.closest('[data-genre-row]') || current.parentElement;
      const rowCards = row ? findAllVisible('.vod-card, .channel-card', row) : [];
      const cardIdx = rowCards.indexOf(current);

      if (dir === 'right') {
        if (cardIdx >= 0 && cardIdx + 1 < rowCards.length) {
          if (setFocus(rowCards[cardIdx + 1])) return;
        }
      } else if (dir === 'left') {
        if (cardIdx > 0) {
          if (setFocus(rowCards[cardIdx - 1])) return;
        }
      } else if (dir === 'down') {
        const allRows = Array.from(document.querySelectorAll('.roleta-track, [data-genre-row]')).filter(r => isVisible(r));
        const currentRowIdx = allRows.indexOf(row);
        if (currentRowIdx >= 0 && currentRowIdx + 1 < allRows.length) {
          const nextRowCards = findAllVisible('.vod-card, .channel-card', allRows[currentRowIdx + 1]);
          if (nextRowCards.length > 0) {
            const target = nextRowCards[Math.min(Math.max(0, cardIdx), nextRowCards.length - 1)];
            if (setFocus(target)) return;
          }
        }
      } else if (dir === 'up') {
        const allRows = Array.from(document.querySelectorAll('.roleta-track, [data-genre-row]')).filter(r => isVisible(r));
        const currentRowIdx = allRows.indexOf(row);
        if (currentRowIdx > 0) {
          const prevRowCards = findAllVisible('.vod-card, .channel-card', allRows[currentRowIdx - 1]);
          if (prevRowCards.length > 0) {
            const target = prevRowCards[Math.min(Math.max(0, cardIdx), prevRowCards.length - 1)];
            if (setFocus(target)) return;
          }
        } else {
          // Primeira linha de cards: sobe para chips de categoria, player ou topo
          const cat = findFirstVisible('.cat-chip.active') || findFirstVisible('.cat-chip');
          if (cat && setFocus(cat)) return;

          const playerBtn = findFirstVisible('#multiSourcePills button, #btnPlayerAudioSubs, #btnNextSource, #btnClosePlayerStage');
          if (playerBtn && setFocus(playerBtn)) return;

          const heroBtn = findFirstVisible('#btnHeroWatchNow');
          if (heroBtn && setFocus(heroBtn)) return;

          const activeTab = findFirstVisible('[data-nav-tab].active') || findFirstVisible('[data-nav-tab]');
          if (activeTab && setFocus(activeTab)) return;
        }
      }
    }

    // 5. ZONA: Painel de Séries & Reprodutores de Filmes
    if (current.closest('#stageSeasonList')) {
      const seasons = findAllVisible('#stageSeasonList button');
      const sIdx = seasons.indexOf(current);
      if (dir === 'down' && sIdx + 1 < seasons.length) { if (setFocus(seasons[sIdx + 1])) return; }
      if (dir === 'up') {
        if (sIdx > 0) { if (setFocus(seasons[sIdx - 1])) return; }
        const ccBtn = findFirstVisible('#btnPlayerAudioSubs');
        if (ccBtn && setFocus(ccBtn)) return;
      }
      if (dir === 'right') {
        const firstEp = findFirstVisible('#stageEpisodesList > div');
        if (firstEp && setFocus(firstEp)) return;
      }
    }

    if (current.closest('#stageEpisodesList')) {
      const eps = findAllVisible('#stageEpisodesList > div');
      const epIdx = eps.indexOf(current);
      if (dir === 'down' && epIdx + 1 < eps.length) { if (setFocus(eps[epIdx + 1])) return; }
      if (dir === 'up') {
        if (epIdx > 0) { if (setFocus(eps[epIdx - 1])) return; }
        const ccBtn = findFirstVisible('#btnPlayerAudioSubs');
        if (ccBtn && setFocus(ccBtn)) return;
      }
      if (dir === 'left') {
        const activeSeason = findFirstVisible('#stageSeasonList button.font-bold, #stageSeasonList button');
        if (activeSeason && setFocus(activeSeason)) return;
      }
    }

    if (current.closest('#stageMovieReprodutoresList')) {
      const srcs = findAllVisible('#stageMovieReprodutoresList > div');
      const sIdx = srcs.indexOf(current);
      if (dir === 'down' && sIdx + 1 < srcs.length) { if (setFocus(srcs[sIdx + 1])) return; }
      if (dir === 'up') {
        if (sIdx > 0) { if (setFocus(srcs[sIdx - 1])) return; }
        const ccBtn = findFirstVisible('#btnPlayerAudioSubs');
        if (ccBtn && setFocus(ccBtn)) return;
      }
    }

    // 6. ZONA: Drawer de Áudio & Ajustes do Player (Saimo-TV)
    if (current.closest('#playerAudioSubsDrawer')) {
      if (current.tagName === 'INPUT' && current.type === 'range') {
        if (dir === 'left') {
          current.value = Math.max(Number(current.min || 50), Number(current.value) - 5);
          current.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
        if (dir === 'right') {
          current.value = Math.min(Number(current.max || 150), Number(current.value) + 5);
          current.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }

      if (dir === 'left' || dir === 'right') {
        fallbackSpatialNavigation(dir, current);
        return;
      }

      const drawerFocusables = findAllVisible('#playerAudioSubsDrawer button, #playerAudioSubsDrawer input, #playerAudioSubsDrawer [tabindex="0"]');
      const dIdx = drawerFocusables.indexOf(current);
      if (dir === 'down' && dIdx + 1 < drawerFocusables.length) {
        if (setFocus(drawerFocusables[dIdx + 1])) return;
      }
      if (dir === 'up' && dIdx > 0) {
        if (setFocus(drawerFocusables[dIdx - 1])) return;
      }
    }

    // Fallback: Navegação Espacial por Coordenadas
    fallbackSpatialNavigation(dir, current);
  }

  // Navegação Espacial Geométrica de Fallback
  function fallbackSpatialNavigation(direction, current) {
    const focusables = getFocusables();
    const currentRect = current.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const el of focusables) {
      if (el === current) continue;
      const r = el.getBoundingClientRect();
      const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };

      const dx = c.x - currentCenter.x;
      const dy = c.y - currentCenter.y;

      let isValid = false;
      let primary = 0;
      let secondary = 0;

      switch (direction) {
        case 'up': isValid = dy < -4; primary = Math.abs(dy); secondary = Math.abs(dx); break;
        case 'down': isValid = dy > 4; primary = Math.abs(dy); secondary = Math.abs(dx); break;
        case 'left': isValid = dx < -4; primary = Math.abs(dx); secondary = Math.abs(dy); break;
        case 'right': isValid = dx > 4; primary = Math.abs(dx); secondary = Math.abs(dy); break;
      }

      if (isValid) {
        const score = primary + secondary * 2.0;
        if (score < minDistance) {
          minDistance = score;
          bestCandidate = el;
        }
      }
    }

    if (bestCandidate) {
      setFocus(bestCandidate);
    }
  }

  // Tratamento da sintonia direta por números (0-9)
  function handleNumberInput(digit) {
    createNumberOverlay();
    numberBuffer += String(digit);

    const numDisplay = document.getElementById('tvChannelDirectNumber');
    if (numDisplay) numDisplay.textContent = numberBuffer;
    if (overlayEl) overlayEl.classList.remove('hidden');

    if (numberTimer) clearTimeout(numberTimer);

    numberTimer = setTimeout(() => {
      if (overlayEl) overlayEl.classList.add('hidden');
      const targetNum = numberBuffer.trim();
      numberBuffer = '';

      if (typeof window.channels !== 'undefined' && Array.isArray(window.channels)) {
        const found = window.channels.find((c) => {
          const numStr = String(c.number || '').replace(/\D/g, '');
          return numStr === targetNum || Number(numStr) === Number(targetNum);
        });

        if (found && typeof window.playChannel === 'function') {
          if (typeof window.showPlayerToast === 'function') {
            window.showPlayerToast(`Sintonizando Canal ${targetNum}: ${found.name}`);
          }
          window.playChannel(found, 0);
          return;
        }
      }

      if (typeof window.showPlayerToast === 'function') {
        window.showPlayerToast(`Canal ${targetNum} não encontrado.`);
      }
    }, 1800);
  }

  // Captura global de teclas do controle remoto (D-Pad, OK, Voltar, Seek, Play/Pause)
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    const keyCode = e.keyCode;

    // Se o usuário estiver digitando em campo de texto, permite digitação nativa
    const isTyping = document.activeElement && (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    );

    if (isTyping) {
      if (key === 'Escape' || keyCode === 27) {
        document.activeElement.blur();
      }
      return;
    }

    const playerBox = document.getElementById('livePlayerBox');
    const isPlayerVisible = playerBox && !playerBox.closest('.hidden');
    const isHudHidden = isPlayerVisible && playerBox.classList.contains('tv-hud-hidden');
    const video = document.getElementById('videoPlayer');

    const isDpadKey =
      key === 'ArrowUp' || keyCode === 19 || keyCode === 38 ||
      key === 'ArrowDown' || keyCode === 20 || keyCode === 40 ||
      key === 'ArrowLeft' || keyCode === 21 || keyCode === 37 ||
      key === 'ArrowRight' || keyCode === 22 || keyCode === 39 ||
      key === 'Enter' || keyCode === 23 || keyCode === 13 || keyCode === 66;

    const isVideoFocused = currentFocusedElement && (
      currentFocusedElement.id === 'videoPlayer' ||
      currentFocusedElement.id === 'livePlayerBox' ||
      currentFocusedElement.closest('#livePlayerBox')
    );

    // 1. DIRETRIZ CRÍTICA: Primeiro toque com HUD oculto no player apenas "acorda" a interface se o foco estiver nele
    if (isHudHidden && isVideoFocused && isDpadKey) {
      e.preventDefault();
      e.stopPropagation();
      showPlayerHud();
      return;
    }

    // 2. CONTROLE DO PLAYER AO VIVO / VOD quando focado ou sem foco explícito fora
    // Se o player estiver ativo e tocando, gerencia atalhos de TV (Seek 10s e Play/Pause)
    if (isPlayerVisible && video && !video.paused && (isVideoFocused || currentFocusedElement?.id === 'videoPlayer')) {
      if (key === 'ArrowLeft' || keyCode === 21) {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
        showPlayerOsd('-10s', '⏪');
        resetPlayerInactivityTimer();
        return;
      }
      if (key === 'ArrowRight' || keyCode === 22) {
        e.preventDefault();
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
        showPlayerOsd('+10s', '⏩');
        resetPlayerInactivityTimer();
        return;
      }
      if (key === 'Enter' || keyCode === 23 || keyCode === 13 || keyCode === 66) {
        if (currentFocusedElement?.id === 'videoPlayer' || currentFocusedElement?.id === 'livePlayerBox') {
          e.preventDefault();
          video.pause();
          showPlayerOsd('Pausado', '⏸');
          showPlayerHud();
          return;
        }
      }
    }

    // Se o vídeo estiver pausado no player e usuário der OK/Enter nele
    if (isPlayerVisible && video && video.paused && (currentFocusedElement?.id === 'videoPlayer' || currentFocusedElement?.id === 'livePlayerBox')) {
      if (key === 'Enter' || keyCode === 23 || keyCode === 13 || keyCode === 66) {
        e.preventDefault();
        video.play().catch(() => {});
        showPlayerOsd('Reproduzindo', '▶');
        resetPlayerInactivityTimer();
        return;
      }
    }

    // Teclas de Mídia Dedicadas (Play, Pause, FastForward, Rewind)
    if (key === 'MediaPlayPause' || keyCode === 179 || keyCode === 85) {
      e.preventDefault();
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
          showPlayerOsd('Reproduzindo', '▶');
        } else {
          video.pause();
          showPlayerOsd('Pausado', '⏸');
        }
      }
      return;
    }
    if (key === 'MediaFastForward' || keyCode === 228 || keyCode === 90) {
      e.preventDefault();
      if (video) {
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
        showPlayerOsd('+10s', '⏩');
      }
      return;
    }
    if (key === 'MediaRewind' || keyCode === 227 || keyCode === 89) {
      e.preventDefault();
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showPlayerOsd('-10s', '⏪');
      }
      return;
    }

    // Setas Direcionais (D-Pad para Android TV / TV Stick)
    if (key === 'ArrowUp' || keyCode === 19 || keyCode === 38) {
      e.preventDefault();
      handleNavigation('up');
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }
    if (key === 'ArrowDown' || keyCode === 20 || keyCode === 40) {
      e.preventDefault();
      handleNavigation('down');
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }
    if (key === 'ArrowLeft' || keyCode === 21 || keyCode === 37) {
      e.preventDefault();
      handleNavigation('left');
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }
    if (key === 'ArrowRight' || keyCode === 22 || keyCode === 39) {
      e.preventDefault();
      handleNavigation('right');
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }

    // Botão OK / Center / Enter
    if (key === 'Enter' || keyCode === 23 || keyCode === 13 || keyCode === 66) {
      e.preventDefault();
      if (currentFocusedElement) {
        currentFocusedElement.click();
      }
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }

    // Botão Voltar (Back / Escape / Android Keycode 4 / Tizen 10009 / WebOS 461)
    const isBackKey =
      key === 'Escape' ||
      key === 'Backspace' ||
      key === 'GoBack' ||
      key === 'Back' ||
      keyCode === 4 ||
      keyCode === 27 ||
      keyCode === 10009 ||
      keyCode === 461;

    if (isBackKey) {
      // 1. Gaveta de Áudio & Legendas
      const drawer = document.getElementById('playerAudioSubsDrawer');
      if (drawer && !drawer.classList.contains('is-hidden')) {
        e.preventDefault();
        drawer.classList.add('is-hidden');
        const ccBtn = document.getElementById('btnPlayerAudioSubs');
        if (ccBtn) setFocus(ccBtn);
        return;
      }

      // 2. Modais Abertos (Stremio Meta, Fontes, Conta Nuvio)
      const metaModal = document.getElementById('stremioMetaModal');
      const sourcesModal = document.getElementById('sourcesModal');
      const nuvioModal = document.getElementById('nuvioAccountModal');
      if (metaModal && !metaModal.classList.contains('hidden')) {
        e.preventDefault();
        metaModal.classList.add('hidden');
        if (lastContentFocusedElement) setFocus(lastContentFocusedElement);
        return;
      }
      if (sourcesModal && !sourcesModal.classList.contains('hidden')) {
        e.preventDefault();
        sourcesModal.classList.add('hidden');
        if (lastContentFocusedElement) setFocus(lastContentFocusedElement);
        return;
      }
      if (nuvioModal && !nuvioModal.classList.contains('hidden')) {
        e.preventDefault();
        nuvioModal.classList.add('hidden');
        if (lastContentFocusedElement) setFocus(lastContentFocusedElement);
        return;
      }

      // 3. Tela Cheia (Fullscreen)
      if (document.fullscreenElement) {
        e.preventDefault();
        document.exitFullscreen().catch(() => {});
        return;
      }

      // 4. Se o palco do player estiver aberto, fecha o player e volta ao catálogo
      const stageSection = document.getElementById('liveStageSection');
      if (stageSection && !stageSection.classList.contains('hidden')) {
        e.preventDefault();
        const closeBtn = document.getElementById('btnClosePlayerStage');
        if (closeBtn) closeBtn.click();
        if (lastContentFocusedElement && isVisible(lastContentFocusedElement)) {
          setFocus(lastContentFocusedElement);
        } else {
          const firstCard = findFirstVisible('.vod-card, .channel-card');
          if (firstCard) setFocus(firstCard);
        }
        return;
      }

      // 5. Se estiver em uma aba secundária, volta para a aba "Início" (Board)
      const activeTab = document.querySelector('[data-nav-tab].active');
      if (activeTab && activeTab.dataset.navTab !== 'board') {
        e.preventDefault();
        const boardTab = document.querySelector('[data-nav-tab="board"]');
        if (boardTab) {
          boardTab.click();
          setFocus(boardTab);
        }
        return;
      }

      // Previne encerramento indesejado do app na Smart TV
      e.preventDefault();
      return;
    }

    // Teclas Numéricas (0-9) para Sintonia Direta
    if (/^[0-9]$/.test(key) || (keyCode >= 48 && keyCode <= 57) || (keyCode >= 7 && keyCode <= 16)) {
      const digit = key >= '0' && key <= '9' ? key : String(keyCode >= 48 ? keyCode - 48 : keyCode - 7);
      handleNumberInput(digit);
    }
  });

  // Listener para garantir visibilidade suave de elementos focados em carrosséis horizontais sem saltos desnecessários
  window.addEventListener('focusin', (e) => {
    if (
      e.target &&
      e.target.classList &&
      (e.target.classList.contains('vod-card') ||
        e.target.classList.contains('channel-card') ||
        e.target.classList.contains('stage-episode-card'))
    ) {
      try {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch (_) {}
    }
  });

  // MutationObserver para garantir atributos tabindex="0" em cards dinâmicos
  function initDynamicTabindexObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            if (
              node.classList.contains('vod-card') ||
              node.classList.contains('channel-card') ||
              node.classList.contains('stage-episode-card') ||
              node.classList.contains('stremio-stream-card') ||
              node.classList.contains('cat-chip')
            ) {
              if (!node.hasAttribute('tabindex')) {
                node.setAttribute('tabindex', '0');
              }
            }

            // Garante foco nos botões internos
            const innerCards = node.querySelectorAll?.('.vod-card, .channel-card, .stage-episode-card, .stremio-stream-card, .cat-chip');
            innerCards?.forEach((card) => {
              if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Inicialização do foco na inicialização da página
  window.addEventListener('load', () => {
    createNumberOverlay();
    initDynamicTabindexObserver();

    // Monitora eventos do vídeo para gerenciar inatividade do player
    const video = document.getElementById('videoPlayer');
    if (video) {
      video.addEventListener('play', () => resetPlayerInactivityTimer());
      video.addEventListener('pause', () => showPlayerHud());
      video.addEventListener('ended', () => showPlayerHud());
      video.addEventListener('timeupdate', () => {
        const playerBox = document.getElementById('livePlayerBox');
        if (playerBox && !playerBox.classList.contains('tv-hud-hidden') && !playerInactivityTimer) {
          resetPlayerInactivityTimer();
        }
      });
    }

    setTimeout(() => {
      const preferred =
        findFirstVisible('[data-nav-tab].active') ||
        findFirstVisible('[data-nav-tab]') ||
        findFirstVisible('.cat-chip.active') ||
        findFirstVisible('.cat-chip') ||
        findFirstVisible('.vod-card, .channel-card');
      if (preferred) setFocus(preferred);
    }, 600);
  });

  // Disparo direto de comandos do controle remoto (via ponte Java ou eventos nativos)
  function onRemoteKey(action, param) {
    if (currentFocusedElement && currentFocusedElement.id === 'globalSearchInput' && action === 'enter') {
      openTvSearchInput();
      return;
    }

    if (document.activeElement && document.activeElement.id === 'globalSearchInput') {
      if (action === 'enter') {
        openTvSearchInput();
        return;
      }
      if (action === 'left' || action === 'right' || action === 'down') {
        document.activeElement.blur();
        handleNavigation(action);
        return;
      }
    }

    const isTyping = document.activeElement && (
      (document.activeElement.tagName === 'INPUT' && document.activeElement.id !== 'globalSearchInput') ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    );

    if (isTyping) {
      if (action === 'back' || action === 'down') {
        if (window.FidalAppBridge && typeof window.FidalAppBridge.hideKeyboard === 'function') {
          window.FidalAppBridge.hideKeyboard();
        }
        document.activeElement.blur();
        if (action === 'down') {
          handleNavigation('down');
        }
        return;
      }
      if (action === 'enter') {
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput && typeof window.handleGlobalSearch === 'function') {
          window.handleGlobalSearch(searchInput.value);
        }
        if (window.FidalAppBridge && typeof window.FidalAppBridge.hideKeyboard === 'function') {
          window.FidalAppBridge.hideKeyboard();
        }
        document.activeElement.blur();
        return;
      }
      return;
    }

    const playerBox = document.getElementById('livePlayerBox');
    const isPlayerVisible = playerBox && !playerBox.closest('.hidden');
    const isHudHidden = isPlayerVisible && playerBox.classList.contains('tv-hud-hidden');
    const video = document.getElementById('videoPlayer');

    const isVideoFocused = currentFocusedElement && (
      currentFocusedElement.id === 'videoPlayer' ||
      currentFocusedElement.id === 'livePlayerBox' ||
      currentFocusedElement.closest('#livePlayerBox')
    );

    // 1. Acorda o HUD se o player estiver tocando com HUD oculto (apenas se o foco estiver dentro do player)
    if (isHudHidden && isVideoFocused && (action === 'up' || action === 'down' || action === 'left' || action === 'right' || action === 'enter')) {
      showPlayerHud();
      return;
    }

    // 2. Teclas direcionais
    if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
      if (isPlayerVisible && video && !video.paused && isVideoFocused) {
        if (action === 'left') {
          video.currentTime = Math.max(0, video.currentTime - 10);
          showPlayerOsd('-10s', '⏪');
          resetPlayerInactivityTimer();
          return;
        }
        if (action === 'right') {
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
          showPlayerOsd('+10s', '⏩');
          resetPlayerInactivityTimer();
          return;
        }
      }

      handleNavigation(action);
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }

    // 3. Tecla OK / Enter
    if (action === 'enter') {
      if (currentFocusedElement && currentFocusedElement.id === 'globalSearchInput') {
        openTvSearchInput();
        return;
      }

      if (isPlayerVisible && video && (currentFocusedElement?.id === 'videoPlayer' || currentFocusedElement?.id === 'livePlayerBox')) {
        if (video.paused) {
          video.play().catch(() => {});
          showPlayerOsd('Reproduzindo', '▶');
        } else {
          video.pause();
          showPlayerOsd('Pausado', '⏸');
          showPlayerHud();
        }
        resetPlayerInactivityTimer();
        return;
      }

      if (currentFocusedElement) {
        currentFocusedElement.click();
      } else {
        const initial =
          findFirstVisible('[data-nav-tab].active') ||
          findFirstVisible('[data-nav-tab]') ||
          findFirstVisible('.cat-chip.active') ||
          findFirstVisible('.cat-chip') ||
          findFirstVisible('.vod-card, .channel-card');
        if (initial) {
          setFocus(initial);
          initial.click();
        }
      }
      if (isPlayerVisible) resetPlayerInactivityTimer();
      return;
    }

    // 4. Tecla Voltar (Back)
    if (action === 'back') {
      const drawer = document.getElementById('playerAudioSubsDrawer');
      if (drawer && !drawer.classList.contains('is-hidden')) {
        drawer.classList.add('is-hidden');
        const ccBtn = document.getElementById('btnPlayerAudioSubs');
        if (ccBtn) setFocus(ccBtn);
        return;
      }

      const metaModal = document.getElementById('stremioMetaModal');
      const sourcesModal = document.getElementById('sourcesModal');
      const nuvioModal = document.getElementById('nuvioAccountModal');
      if (metaModal && !metaModal.classList.contains('hidden')) {
        metaModal.classList.add('hidden');
        if (lastContentFocusedElement) setFocus(lastContentFocusedElement);
        return;
      }
      if (sourcesModal && !sourcesModal.classList.contains('hidden')) {
        sourcesModal.classList.add('hidden');
        if (lastContentFocusedElement) setFocus(lastContentFocusedElement);
        return;
      }
      if (nuvioModal && !nuvioModal.classList.contains('hidden')) {
        nuvioModal.classList.add('hidden');
        if (lastContentFocusedElement) setFocus(lastContentFocusedElement);
        return;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        return;
      }

      const stageSection = document.getElementById('liveStageSection');
      if (stageSection && !stageSection.classList.contains('hidden')) {
        const closeBtn = document.getElementById('btnClosePlayerStage');
        if (closeBtn) closeBtn.click();
        if (lastContentFocusedElement && isVisible(lastContentFocusedElement)) {
          setFocus(lastContentFocusedElement);
        } else {
          const firstCard = findFirstVisible('.vod-card, .channel-card');
          if (firstCard) setFocus(firstCard);
        }
        return;
      }

      const activeTab = document.querySelector('[data-nav-tab].active');
      if (activeTab && activeTab.dataset.navTab !== 'board') {
        const boardTab = document.querySelector('[data-nav-tab="board"]');
        if (boardTab) {
          boardTab.click();
          setFocus(boardTab);
        }
        return;
      }
      return;
    }

    // 5. Mídia
    if (action === 'playpause') {
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
          showPlayerOsd('Reproduzindo', '▶');
        } else {
          video.pause();
          showPlayerOsd('Pausado', '⏸');
        }
      }
      return;
    }
    if (action === 'play') {
      if (video && video.paused) {
        video.play().catch(() => {});
        showPlayerOsd('Reproduzindo', '▶');
      }
      return;
    }
    if (action === 'pause') {
      if (video && !video.paused) {
        video.pause();
        showPlayerOsd('Pausado', '⏸');
      }
      return;
    }
    if (action === 'forward') {
      if (video) {
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
        showPlayerOsd('+10s', '⏩');
      }
      return;
    }
    if (action === 'rewind') {
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showPlayerOsd('-10s', '⏪');
      }
      return;
    }

    // 6. Números
    if (action === 'digit') {
      handleNumberInput(param);
      return;
    }
  }

  window.TVNavigation = {
    setFocus,
    handleNavigation,
    getFocusables,
    showPlayerHud,
    hidePlayerHud,
    showPlayerOsd,
    onRemoteKey,
    openTvSearchInput
  };

  // Garante que clicar no campo de busca chame o teclado da TV
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('click', (e) => {
        if (window.FidalAppBridge && typeof window.FidalAppBridge.openSearchDialog === 'function') {
          e.preventDefault();
          openTvSearchInput();
        }
      });
    }
  });
})();
