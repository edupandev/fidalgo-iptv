/**
 * FIDAL GO — Navegação Espacial Profissional para Android TV & TV Box (tvOS Engine)
 * Navegação por Zonas e Linhas (Row-Based Linear Navigation)
 * Totalmente adaptada para controle remoto (D-Pad, OK, Voltar, Teclado Numérico)
 */

(function () {
  'use strict';

  let currentFocusedElement = null;
  let numberBuffer = '';
  let numberTimer = null;
  let overlayEl = null;

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

  // Aplica o foco visual Apple tvOS
  function setFocus(el, shouldScroll = true) {
    if (!el || el.closest('.hidden')) return false;

    if (currentFocusedElement && currentFocusedElement !== el) {
      currentFocusedElement.classList.remove('tv-focused');
    }

    currentFocusedElement = el;
    el.classList.add('tv-focused');

    // Se o elemento não for input de texto, foca sem acionar teclado virtual
    if (el.tagName !== 'INPUT') {
      try { el.focus({ preventScroll: true }); } catch (_) {}
    }

    if (shouldScroll) {
      try {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      } catch (_) {}
    }

    return true;
  }

  // Coleta elementos focáveis visíveis
  function getFocusables() {
    const selector = [
      '[data-nav-tab]',
      '#btnHeroWatchNow',
      '#btnHeroPrev',
      '#btnHeroNext',
      '.vod-card',
      '.channel-card',
      '.cat-chip',
      '#stageSeasonList button',
      '#stageEpisodesList > div',
      '[data-stage-audio]',
      '#btnNextEpisode',
      '#btnNextEpisodeStage',
      '#btnNextEpisodeOverlay',
      '#btnNextSource',
      '#btnClosePlayerStage',
      '.genre-pill',
      '.stremio-stream-card',
      '#btnOpenSourcesModal',
      '#btnDownloadApk',
      '#globalSearchInput'
    ].join(', ');

    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      if (el.closest('.hidden')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  // Navegação Especializada por Zonas de Interface da TV
  function handleNavigation(dir) {
    if (!currentFocusedElement || !document.body.contains(currentFocusedElement) || currentFocusedElement.closest('.hidden')) {
      const initial =
        document.querySelector('[data-nav-tab].active') ||
        document.querySelector('.channel-card') ||
        document.querySelector('.vod-card') ||
        getFocusables()[0];
      if (initial) setFocus(initial);
      return;
    }

    const current = currentFocusedElement;

    // 1. ZONA: Menu Superior de Abas ([data-nav-tab])
    if (current.matches('[data-nav-tab]')) {
      const tabs = Array.from(document.querySelectorAll('[data-nav-tab]:not(.hidden)'));
      const idx = tabs.indexOf(current);

      if (dir === 'right') {
        if (idx >= 0 && idx + 1 < tabs.length) {
          setFocus(tabs[idx + 1]);
          return;
        } else {
          const search = document.getElementById('globalSearchInput');
          if (search && !search.closest('.hidden')) {
            setFocus(search);
            return;
          }
        }
      } else if (dir === 'left') {
        if (idx > 0) {
          setFocus(tabs[idx - 1]);
          return;
        }
      } else if (dir === 'down') {
        // Desce para o conteúdo da aba ativa
        const activeTab = document.querySelector('[data-nav-tab].active')?.dataset.navTab || 'board';
        if (activeTab === 'board') {
          const heroBtn = document.getElementById('btnHeroWatchNow');
          const firstVod = document.querySelector('.vod-card');
          if (heroBtn && !heroBtn.closest('.hidden')) { setFocus(heroBtn); return; }
          if (firstVod) { setFocus(firstVod); return; }
        } else if (activeTab === 'live' || activeTab === 'sports') {
          const activeChan = document.querySelector('.channel-card.active') || document.querySelector('.channel-card');
          const activeCat = document.querySelector('.cat-chip.active');
          if (activeCat && !activeCat.closest('.hidden')) { setFocus(activeCat); return; }
          if (activeChan) { setFocus(activeChan); return; }
        } else {
          const firstCard = document.querySelector('.vod-card') || document.querySelector('.channel-card');
          if (firstCard) { setFocus(firstCard); return; }
        }
      }
    }

    // 1.1 ZONA: Barra de Busca (#globalSearchInput)
    if (current.id === 'globalSearchInput') {
      if (dir === 'left') {
        const tabs = Array.from(document.querySelectorAll('[data-nav-tab]:not(.hidden)'));
        if (tabs.length > 0) { setFocus(tabs[tabs.length - 1]); return; }
      } else if (dir === 'down') {
        const heroBtn = document.getElementById('btnHeroWatchNow');
        const firstCard = document.querySelector('.vod-card') || document.querySelector('.channel-card');
        if (heroBtn && !heroBtn.closest('.hidden')) { setFocus(heroBtn); return; }
        if (firstCard) { setFocus(firstCard); return; }
      }
    }

    // 2. ZONA: Hero Banner da Apple TV+ (#btnHeroWatchNow / #btnHeroPrev / #btnHeroNext)
    if (current.id === 'btnHeroWatchNow' || current.id === 'btnHeroPrev' || current.id === 'btnHeroNext') {
      if (dir === 'up') {
        const activeTab = document.querySelector('[data-nav-tab].active') || document.querySelector('[data-nav-tab]');
        if (activeTab) { setFocus(activeTab); return; }
      } else if (dir === 'down') {
        const firstCard = document.querySelector('.vod-card');
        if (firstCard) { setFocus(firstCard); return; }
      } else if (dir === 'left') {
        if (current.id === 'btnHeroWatchNow') {
          const prevBtn = document.getElementById('btnHeroPrev');
          if (prevBtn) { setFocus(prevBtn); return; }
        }
      } else if (dir === 'right') {
        if (current.id === 'btnHeroWatchNow') {
          const nextBtn = document.getElementById('btnHeroNext');
          if (nextBtn) { setFocus(nextBtn); return; }
        }
      }
    }

    // 3. ZONA: Carrosséis / Linhas de Filmes e Séries (.vod-card)
    if (current.classList.contains('vod-card')) {
      const row = current.closest('.roleta-track') || current.parentElement;
      const rowCards = row ? Array.from(row.querySelectorAll('.vod-card')) : [];
      const cardIdx = rowCards.indexOf(current);

      if (dir === 'right') {
        if (cardIdx >= 0 && cardIdx + 1 < rowCards.length) {
          setFocus(rowCards[cardIdx + 1]);
          return;
        }
      } else if (dir === 'left') {
        if (cardIdx > 0) {
          setFocus(rowCards[cardIdx - 1]);
          return;
        }
      } else if (dir === 'down') {
        // Desce para a linha seguinte
        const allRows = Array.from(document.querySelectorAll('.roleta-track, [data-genre-row]'));
        const currentRowIdx = allRows.indexOf(row);
        if (currentRowIdx >= 0 && currentRowIdx + 1 < allRows.length) {
          const nextRowCards = Array.from(allRows[currentRowIdx + 1].querySelectorAll('.vod-card'));
          if (nextRowCards.length > 0) {
            const target = nextRowCards[Math.min(cardIdx, nextRowCards.length - 1)];
            setFocus(target);
            return;
          }
        }
      } else if (dir === 'up') {
        // Sobe para a linha anterior ou Hero Banner
        const allRows = Array.from(document.querySelectorAll('.roleta-track, [data-genre-row]'));
        const currentRowIdx = allRows.indexOf(row);
        if (currentRowIdx > 0) {
          const prevRowCards = Array.from(allRows[currentRowIdx - 1].querySelectorAll('.vod-card'));
          if (prevRowCards.length > 0) {
            const target = prevRowCards[Math.min(cardIdx, prevRowCards.length - 1)];
            setFocus(target);
            return;
          }
        } else {
          // Primeira linha: sobe para o Hero Banner ou Menu
          const heroBtn = document.getElementById('btnHeroWatchNow');
          const activeTab = document.querySelector('[data-nav-tab].active');
          if (heroBtn && !heroBtn.closest('.hidden')) { setFocus(heroBtn); return; }
          if (activeTab) { setFocus(activeTab); return; }
        }
      }
    }

    // 4. ZONA: Lista de Canais Ao Vivo (.channel-card)
    if (current.classList.contains('channel-card')) {
      const list = Array.from(document.querySelectorAll('.channel-card:not(.hidden)'));
      const idx = list.indexOf(current);

      if (dir === 'down') {
        if (idx >= 0 && idx + 1 < list.length) {
          setFocus(list[idx + 1]);
          return;
        }
      } else if (dir === 'up') {
        if (idx > 0) {
          setFocus(list[idx - 1]);
          return;
        } else {
          const cat = document.querySelector('.cat-chip.active') || document.querySelector('.cat-chip');
          if (cat) { setFocus(cat); return; }
        }
      } else if (dir === 'right') {
        // Pula para os controles do player ou fechar player
        const playerBtn = document.getElementById('btnNextSource') || document.getElementById('btnClosePlayerStage') || document.getElementById('videoPlayer');
        if (playerBtn && !playerBtn.closest('.hidden')) { setFocus(playerBtn); return; }
      } else if (dir === 'left') {
        // Pula para os botões do rail esquerdo de navegação
        const activeRail = document.querySelector('.rail-btn.active') || document.querySelector('.rail-btn');
        if (activeRail && !activeRail.closest('.hidden')) { setFocus(activeRail); return; }
      }
    }

    // 4.1 ZONA: Controles do Player e Palco Ao Vivo
    if (current.id === 'btnNextSource' || current.id === 'btnClosePlayerStage' || current.id === 'videoPlayer' || current.closest('#liveStageSection')) {
      if (dir === 'left') {
        // Volta direto para a lista de canais
        const activeChan = document.querySelector('.channel-card.active') || document.querySelector('.channel-card');
        if (activeChan) { setFocus(activeChan); return; }
      } else if (dir === 'up') {
        const activeTab = document.querySelector('[data-nav-tab].active');
        if (activeTab) { setFocus(activeTab); return; }
      }
    }

    // 5. ZONA: Chips de Categoria (.cat-chip)
    if (current.classList.contains('cat-chip')) {
      const chips = Array.from(document.querySelectorAll('.cat-chip:not(.hidden)'));
      const idx = chips.indexOf(current);

      if (dir === 'right' && idx >= 0 && idx + 1 < chips.length) {
        setFocus(chips[idx + 1]);
        return;
      } else if (dir === 'left' && idx > 0) {
        setFocus(chips[idx - 1]);
        return;
      } else if (dir === 'down') {
        const firstChan = document.querySelector('.channel-card.active') || document.querySelector('.channel-card');
        if (firstChan) { setFocus(firstChan); return; }
      } else if (dir === 'up') {
        const activeTab = document.querySelector('[data-nav-tab].active');
        if (activeTab) { setFocus(activeTab); return; }
      }
    }

    // 6. ZONA: Painel de Séries (Temporadas & Episódios)
    if (current.closest('#stageSeasonList')) {
      const seasons = Array.from(document.querySelectorAll('#stageSeasonList button'));
      const sIdx = seasons.indexOf(current);
      if (dir === 'down' && sIdx + 1 < seasons.length) { setFocus(seasons[sIdx + 1]); return; }
      if (dir === 'up' && sIdx > 0) { setFocus(seasons[sIdx - 1]); return; }
      if (dir === 'right') {
        const firstEp = document.querySelector('#stageEpisodesList > div');
        if (firstEp) { setFocus(firstEp); return; }
      }
    }

    if (current.closest('#stageEpisodesList')) {
      const eps = Array.from(document.querySelectorAll('#stageEpisodesList > div'));
      const epIdx = eps.indexOf(current);
      if (dir === 'down' && epIdx + 1 < eps.length) { setFocus(eps[epIdx + 1]); return; }
      if (dir === 'up' && epIdx > 0) { setFocus(eps[epIdx - 1]); return; }
      if (dir === 'left') {
        const activeSeason = document.querySelector('#stageSeasonList button.font-bold') || document.querySelector('#stageSeasonList button');
        if (activeSeason) { setFocus(activeSeason); return; }
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

  // Captura global de teclas do controle remoto
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    const keyCode = e.keyCode;

    // Se o usuário estiver digitando em um campo de texto (busca, canal, etc.), permite digitação nativa completa
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

    // Setas Direcionais (D-Pad)
    if (key === 'ArrowUp' || keyCode === 19) {
      e.preventDefault();
      handleNavigation('up');
      return;
    }
    if (key === 'ArrowDown' || keyCode === 20) {
      e.preventDefault();
      handleNavigation('down');
      return;
    }
    if (key === 'ArrowLeft' || keyCode === 21) {
      e.preventDefault();
      handleNavigation('left');
      return;
    }
    if (key === 'ArrowRight' || keyCode === 22) {
      e.preventDefault();
      handleNavigation('right');
      return;
    }

    // Botão OK / Center / Enter
    if (key === 'Enter' || keyCode === 23 || keyCode === 13 || keyCode === 66) {
      e.preventDefault();
      if (currentFocusedElement) {
        currentFocusedElement.click();
      }
      return;
    }

    // Botão Voltar (Back / Escape / Android Keycode 4)
    if (key === 'Escape' || key === 'Backspace' || keyCode === 4 || keyCode === 27) {
      const metaModal = document.getElementById('stremioMetaModal');
      const sourcesModal = document.getElementById('sourcesModal');
      if (metaModal && !metaModal.classList.contains('hidden')) {
        e.preventDefault();
        metaModal.classList.add('hidden');
        return;
      }
      if (sourcesModal && !sourcesModal.classList.contains('hidden')) {
        e.preventDefault();
        sourcesModal.classList.add('hidden');
        return;
      }

      if (document.fullscreenElement) {
        e.preventDefault();
        document.exitFullscreen().catch(() => {});
        return;
      }
    }

    // Teclas Numéricas (0-9)
    if (/^[0-9]$/.test(key) || (keyCode >= 48 && keyCode <= 57) || (keyCode >= 7 && keyCode <= 16)) {
      const digit = key >= '0' && key <= '9' ? key : String(keyCode >= 48 ? keyCode - 48 : keyCode - 7);
      handleNumberInput(digit);
    }
  });

  // Inicialização do foco na inicialização da página
  window.addEventListener('load', () => {
    createNumberOverlay();
    setTimeout(() => {
      const preferred =
        document.querySelector('[data-nav-tab].active') ||
        document.querySelector('[data-nav-tab]') ||
        document.querySelector('.channel-card');
      if (preferred) setFocus(preferred);
    }, 600);
  });

  window.TVNavigation = {
    setFocus,
    handleNavigation,
    getFocusables
  };
})();
