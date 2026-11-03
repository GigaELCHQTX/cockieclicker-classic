(() => {
  'use strict';

  const buildings = [
    { id: 'cursor', name: 'Zeiger', icon: '👆', description: 'Klickt gelegentlich für dich.', basePrice: 15, cps: 0.1 },
    { id: 'grandma', name: 'Oma', icon: '👵', description: 'Eine nette Oma, die Kekse backt.', basePrice: 100, cps: 1 },
    { id: 'farm', name: 'Keksfarm', icon: '🌾', description: 'Baut Kekszutaten auf dem Feld an.', basePrice: 1100, cps: 8 },
    { id: 'mine', name: 'Keksmine', icon: '⛏️', description: 'Fördert köstlichen Keksteig.', basePrice: 12000, cps: 47 },
    { id: 'factory', name: 'Fabrik', icon: '🏭', description: 'Produziert Kekse am Fließband.', basePrice: 130000, cps: 260 },
    { id: 'bank', name: 'Keksbank', icon: '🏦', description: 'Investiert deine Kekse gewinnbringend.', basePrice: 1400000, cps: 1400 },
    { id: 'temple', name: 'Kekstempel', icon: '🛕', description: 'Bittet die Keks-Götter um Ertrag.', basePrice: 20000000, cps: 7800 },
    { id: 'portal', name: 'Portal', icon: '🌀', description: 'Öffnet ein Portal in die Keksdimension.', basePrice: 330000000, cps: 44000 }
  ];
  const SAVE_KEY = 'cookie-clicker-classic-save-v1';
  const $ = (id) => document.getElementById(id);
  const countFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

  let state = loadGame();
  let lastSave = Date.now();

  function freshState() {
    return { cookies: 0, totalBaked: 0, buildings: Object.fromEntries(buildings.map((item) => [item.id, 0])) };
  }

  function loadGame() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || typeof saved !== 'object') return freshState();
      const next = freshState();
      next.cookies = Math.max(0, Number(saved.cookies) || 0);
      next.totalBaked = Math.max(next.cookies, Number(saved.totalBaked) || 0);
      for (const item of buildings) next.buildings[item.id] = Math.max(0, Math.floor(Number(saved.buildings?.[item.id]) || 0));
      const elapsed = Math.min(8 * 60 * 60, Math.max(0, (Date.now() - Number(saved.savedAt || Date.now())) / 1000));
      const offlineCookies = elapsed * getCps(next);
      next.cookies += offlineCookies;
      next.totalBaked += offlineCookies;
      return next;
    } catch {
      return freshState();
    }
  }

  function getCps(current = state) {
    return buildings.reduce((sum, item) => sum + (current.buildings[item.id] || 0) * item.cps, 0);
  }

  function priceFor(item) {
    return Math.ceil(item.basePrice * Math.pow(1.15, state.buildings[item.id] || 0));
  }

  function formatNumber(value) {
    if (value >= 1e15) return `${countFormat.format(value / 1e15)} Billiarden`;
    if (value >= 1e12) return `${countFormat.format(value / 1e12)} Billionen`;
    if (value >= 1e9) return `${countFormat.format(value / 1e9)} Milliarden`;
    if (value >= 1e6) return `${countFormat.format(value / 1e6)} Millionen`;
    return countFormat.format(value);
  }

  function renderShop() {
    $('shop-list').innerHTML = buildings.map((item) => {
      const price = priceFor(item);
      const amount = state.buildings[item.id] || 0;
      return `<button class="shop-item" type="button" data-building="${item.id}" ${state.cookies < price ? 'disabled' : ''} aria-label="${item.name} kaufen für ${formatNumber(price)} Kekse"><span class="item-icon" aria-hidden="true">${item.icon}</span><span><span class="item-name">${item.name}</span><span class="item-description">${item.description}</span></span><span class="item-price"><strong>🍪 ${formatNumber(price)}</strong><small>Besitz: ${amount}</small></span></button>`;
    }).join('');
  }

  function render() {
    $('cookie-count').textContent = formatNumber(state.cookies);
    $('per-second').textContent = formatNumber(getCps());
    $('total-baked').textContent = formatNumber(state.totalBaked);
    $('building-count').textContent = countFormat.format(Object.values(state.buildings).reduce((sum, amount) => sum + amount, 0));
    renderShop();
  }

  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
      $('save-status').textContent = 'Gespeichert';
      window.setTimeout(() => { $('save-status').textContent = 'Automatisch gespeichert'; }, 1400);
    } catch {
      $('save-status').textContent = 'Speichern nicht möglich';
    }
  }

  $('big-cookie').addEventListener('click', () => {
    state.cookies += 1;
    state.totalBaked += 1;
    $('big-cookie').classList.add('popped');
    window.setTimeout(() => $('big-cookie').classList.remove('popped'), 100);
    render();
  });

  $('shop-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-building]');
    if (!button) return;
    const item = buildings.find((building) => building.id === button.dataset.building);
    if (!item) return;
    const price = priceFor(item);
    if (state.cookies < price) return;
    state.cookies -= price;
    state.buildings[item.id] += 1;
    render();
    saveGame();
  });

  $('reset-button').addEventListener('click', () => {
    if (!window.confirm('Möchtest du wirklich neu anfangen? Dein Spielstand wird gelöscht.')) return;
    state = freshState();
    saveGame();
    render();
  });

  window.setInterval(() => {
    const now = Date.now();
    const elapsed = Math.min((now - lastSave) / 1000, 5);
    lastSave = now;
    const baked = getCps() * elapsed;
    state.cookies += baked;
    state.totalBaked += baked;
    render();
  }, 250);

  window.setInterval(saveGame, 10000);
  window.addEventListener('beforeunload', saveGame);
  render();
})();
