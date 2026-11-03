(() => {
  'use strict';

  const buildings = [
    { id: 'cursor', name: 'Cursor', icon: '🖱️', description: 'Clicks cookies for you.', basePrice: 15, cps: 0.1 },
    { id: 'grandma', name: 'Grandma', icon: '👵', description: 'A nice old lady bakes cookies.', basePrice: 100, cps: 1 },
    { id: 'farm', name: 'Farm', icon: '🌾', description: 'Grows cookie ingredients.', basePrice: 1100, cps: 8 },
    { id: 'mine', name: 'Mine', icon: '⛏️', description: 'Digs up chocolate and dough.', basePrice: 12000, cps: 47 },
    { id: 'factory', name: 'Factory', icon: '🏭', description: 'Produces cookies on the assembly line.', basePrice: 130000, cps: 260 },
    { id: 'bank', name: 'Bank', icon: '🏦', description: 'Invests cookies for profit.', basePrice: 1400000, cps: 1400 },
    { id: 'temple', name: 'Temple', icon: '🛕', description: 'Prays to the cookie gods.', basePrice: 20000000, cps: 7800 },
    { id: 'portal', name: 'Portal', icon: '🌀', description: 'Opens a route to the cookieverse.', basePrice: 330000000, cps: 44000 }
  ];

  const SAVE_KEY = 'cookie-clicker-classic-save-v1';

  const state = loadGame();
  let lastFrame = Date.now();

  const cookieCountEl = document.getElementById('cookie-count');
  const cookiesPerSecondEl = document.getElementById('cookies-per-second');
  const shopListEl = document.getElementById('shop-list');
  const resetButton = document.getElementById('reset-button');
  const cookieButton = document.getElementById('cookie-button');

  function getCps() {
    return buildings.reduce((sum, item) => sum + (state.buildings[item.id] || 0) * item.cps, 0);
  }

  function formatNumber(value) {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return `${Math.floor(value)}`;
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
      loaded.cookies = Number(saved.cookies) || 0;
      loaded.totalBaked = Number(saved.totalBaked) || loaded.cookies;

      for (const item of buildings) {
        loaded.buildings[item.id] = Number(saved.buildings?.[item.id]) || 0;
      }

      return loaded;
    } catch {
      return freshState();
    }
  }

  function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function buyPrice(item) {
    return Math.ceil(item.basePrice * Math.pow(1.15, state.buildings[item.id] || 0));
  }

  function renderShop() {
    shopListEl.innerHTML = buildings.map((item) => {
      const price = buyPrice(item);
      const count = state.buildings[item.id] || 0;
      const disabled = state.cookies < price ? 'disabled' : '';

      return `
        <button class="shop-item" type="button" data-building="${item.id}" ${disabled}>
          <span class="shop-thumb" aria-hidden="true">${item.icon}</span>
          <span class="shop-body">
            <span class="shop-name">${item.name}</span>
            <span class="shop-desc">${item.description}</span>
          </span>
          <span class="shop-price">
            <strong>${formatNumber(price)}</strong>
            <span class="count">${count}</span>
          </span>
        </button>
      `;
    }).join('');
  }

  function render() {
    cookieCountEl.textContent = formatNumber(state.cookies);
    cookiesPerSecondEl.textContent = formatNumber(getCps());
    renderShop();
  }

  cookieButton.addEventListener('click', () => {
    state.cookies += 1;
    state.totalBaked += 1;
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
    render();
    saveGame();
  });

  resetButton.addEventListener('click', () => {
    const next = freshState();
    Object.assign(state, next);
    render();
    saveGame();
  });

  setInterval(() => {
    const now = Date.now();
    const elapsed = (now - lastFrame) / 1000;
    lastFrame = now;

    const earnings = getCps() * elapsed;
    state.cookies += earnings;
    state.totalBaked += earnings;
    render();
  }, 250);

  render();
})();
