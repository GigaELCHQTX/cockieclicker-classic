(() => {
  'use strict';

  const buildings = [
    { id: 'cursor', name: 'Cursor', icon: '👆', description: 'Autoclicks every 5 seconds.', basePrice: 15, cps: 0.2 },
    { id: 'grandma', name: 'Grandma', icon: '👵🏻', description: 'A nice grandma to bake more cookies.', basePrice: 100, cps: 1 },
    { id: 'factory', name: 'Factory', icon: '🏭', description: 'Produces large quantities of cookies.', basePrice: 500, cps: 4 },
    { id: 'mine', name: 'Mine', icon: '⛏️', description: 'Mines out cookie dough and chocolate chips.', basePrice: 2000, cps: 10 },
    { id: 'shipment', name: 'Shipment', icon: '🚀', description: 'Brings in fresh cookies from the cookie planet.', basePrice: 7000, cps: 20 },
    { id: 'alchemy', name: 'Alchemy lab', icon: '⚗️', description: 'Turns gold into cookies!', basePrice: 50000, cps: 50 },
    { id: 'portal', name: 'Portal', icon: '🌀', description: 'Opens a door to the Cookieverse.', basePrice: 1000000, cps: 1000 },
    { id: 'timemachine', name: 'Time machine', icon: '⏰', description: 'Brings cookies from the past, before they were even eaten.', basePrice: 123456789, cps: 98765 }
  ];

  const SAVE_KEY = 'cookie-clicker-classic-save-v1';
  const state = loadGame();
  let lastFrame = Date.now();
  let cursorTimers = [];

  const cookieCountEl = document.getElementById('cookie-count');
  const cookiesPerSecondEl = document.getElementById('cookies-per-second');
  const shopListEl = document.getElementById('shop-list');
  const cursorLayerEl = document.getElementById('cursor-layer');
  const resetButton = document.getElementById('reset-button');
  const cookieButton = document.getElementById('cookie-button');
  const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

  function getCps() {
    return buildings.reduce((sum, item) => sum + (state.buildings[item.id] || 0) * item.cps, 0);
  }

  function getNonCursorCps() {
    return buildings.reduce((sum, item) => item.id === 'cursor' ? sum : sum + (state.buildings[item.id] || 0) * item.cps, 0);
  }

  function formatNumber(value) {
    if (value >= 1e15) return `${numberFormat.format(value / 1e15)} quadrillion`;
    if (value >= 1e12) return `${numberFormat.format(value / 1e12)} trillion`;
    if (value >= 1e9) return `${numberFormat.format(value / 1e9)} billion`;
    if (value >= 1e6) return `${numberFormat.format(value / 1e6)} million`;
    return numberFormat.format(Math.floor(value));
  }

  function freshState() {
    return {
      cookies: 0,
      totalBaked: 0,
      buildings: Object.fromEntries(buildings.map((item) => [item.id, 0]))
    };
  }

  function loadGame() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || typeof saved !== 'object') return freshState();

      const loaded = freshState();
      loaded.cookies = Math.max(0, Number(saved.cookies) || 0);
      loaded.totalBaked = Math.max(loaded.cookies, Number(saved.totalBaked) || 0);
      for (const item of buildings) {
        loaded.buildings[item.id] = Math.max(0, Math.floor(Number(saved.buildings?.[item.id]) || 0));
      }
      return loaded;
    } catch {
      return freshState();
    }
  }

  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // The game remains playable if browser storage is unavailable.
    }
  }

  function buyPrice(item) {
    return Math.ceil(item.basePrice * Math.pow(1.15, state.buildings[item.id] || 0));
  }

  function renderCursors() {
    const count = state.buildings.cursor || 0;
    const fragment = document.createDocumentFragment();
    const maxPerRing = 10;
    const firstRadius = 126;
    const ringGap = 48;

    for (let index = 0; index < count; index += 1) {
      const ring = Math.floor(index / maxPerRing);
      const positionInRing = index % maxPerRing;
      const countInRing = Math.min(maxPerRing, count - ring * maxPerRing);
      const angle = -Math.PI / 2 + (Math.PI * 2 * positionInRing) / countInRing;
      const radius = firstRadius + ring * ringGap;
      const marker = document.createElement('span');
      marker.className = 'cursor-marker';
      marker.dataset.cursorIndex = String(index);
      marker.style.setProperty('--cursor-x', `${Math.cos(angle) * radius}px`);
      marker.style.setProperty('--cursor-y', `${Math.sin(angle) * radius}px`);
      marker.style.setProperty('--cursor-angle', `${(angle * 180 / Math.PI) + 90}deg`);
      marker.innerHTML = '<span class="cursor-hand">👆</span><span class="cursor-number">+1</span>';
      fragment.appendChild(marker);
    }

    cursorLayerEl.replaceChildren(fragment);
  }

  function showManualClickNumber() {
    const number = document.createElement('span');
    number.className = 'cursor-number';
    number.textContent = '+1';
    number.style.cssText = 'position:absolute;left:0;top:-30px;opacity:1;color:#fff;font:700 20px Georgia,serif;text-shadow:1px 1px 2px #111,-1px -1px 2px #111;white-space:nowrap;pointer-events:none;';
    cursorLayerEl.appendChild(number);

    if (typeof number.animate === 'function') {
      const animation = number.animate([
        { opacity: 0, transform: 'translate(-50%, 8px) scale(.8)' },
        { opacity: 1, offset: 0.18 },
        { opacity: 0, transform: 'translate(-50%, -28px) scale(1)' }
      ], { duration: 900, easing: 'ease-out' });
      animation.onfinish = () => number.remove();
    } else {
      window.setTimeout(() => number.remove(), 900);
    }
  }

  function renderShop() {
    shopListEl.innerHTML = buildings.map((item) => {
      const price = buyPrice(item);
      const count = state.buildings[item.id] || 0;
      const disabled = state.cookies < price ? 'disabled' : '';

      return `
        <button class="shop-item" type="button" data-building="${item.id}" ${disabled} aria-label="Buy ${item.name} for ${formatNumber(price)} cookies">
          <span class="shop-thumb" aria-hidden="true">${item.icon}</span>
          <span class="shop-body">
            <span class="shop-name">${item.name} - <span class="cookie-price">🍪 ${formatNumber(price)}</span></span>
            <span class="shop-desc">${item.description}</span>
          </span>
          <span class="shop-count" aria-label="Owned: ${count}">${count}</span>
        </button>
      `;
    }).join('');
  }

  function render() {
    cookieCountEl.textContent = formatNumber(state.cookies);
    cookiesPerSecondEl.textContent = formatNumber(getCps());
    renderShop();
    renderCursors();
  }

  function addCursorCookie(cursorIndex) {
    state.cookies += 1;
    state.totalBaked += 1;
    const marker = cursorLayerEl.querySelector(`[data-cursor-index="${cursorIndex}"]`);
    const number = marker?.querySelector('.cursor-number');
    if (number) {
      number.classList.remove('pop');
      void number.offsetWidth;
      number.classList.add('pop');
    }
  }

  function setupCursorTimers(newCursorIndex = null) {
    const count = state.buildings.cursor || 0;
    const now = Date.now();
    cursorTimers.length = count;

    if (newCursorIndex !== null) {
      cursorTimers[newCursorIndex] = now + 5000;
      return;
    }

    for (let index = 0; index < count; index += 1) {
      cursorTimers[index] = now + (5000 * (index + 1)) / count;
    }
  }

  cookieButton.addEventListener('click', () => {
    state.cookies += 1;
    state.totalBaked += 1;
    showManualClickNumber();
    render();
    saveGame();
  });

  shopListEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-building]');
    if (!button) return;
    const item = buildings.find((entry) => entry.id === button.dataset.building);
    if (!item) return;

    const price = buyPrice(item);
    if (state.cookies < price) return;
    state.cookies -= price;
    state.buildings[item.id] += 1;
    if (item.id === 'cursor') setupCursorTimers(state.buildings.cursor - 1);
    render();
    saveGame();
  });

  resetButton.addEventListener('click', () => {
    if (!window.confirm('Reset your game and start over?')) return;
    Object.assign(state, freshState());
    cursorTimers = [];
    render();
    saveGame();
  });

  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.min((now - lastFrame) / 1000, 5);
    lastFrame = now;

    const passiveCookies = getNonCursorCps() * elapsed;
    state.cookies += passiveCookies;
    state.totalBaked += passiveCookies;

    for (let index = 0; index < cursorTimers.length; index += 1) {
      while (cursorTimers[index] <= now) {
        addCursorCookie(index);
        cursorTimers[index] += 5000;
      }
    }

    render();
  }, 250);

  setInterval(saveGame, 10000);
  window.addEventListener('beforeunload', saveGame);
  setupCursorTimers();
  render();
})();
