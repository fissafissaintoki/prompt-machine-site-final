const state = {
  isSpinning: false,
  currentPrompt: null,
  promptsData: [],
  tracksData: [],
  visualsData: [],
  stats: {
    picture: 12,
    mureka: 7,
    crazy: 19,
    chaos: 87,
    last: "MUREKA"
  }
};

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return fallback;
  }
}

function normalizePrompts(raw) {
  if (Array.isArray(raw)) return raw;
  const out = [];
  if (raw.picture_prompts) raw.picture_prompts.forEach(prompt => out.push({ type: "picture", category: "PICTURE PROMPT", prompt }));
  if (raw.mureka_prompts) raw.mureka_prompts.forEach(prompt => out.push({ type: "mureka", category: "MUREKA PROMPT", prompt }));
  if (raw.crazy_prompts) raw.crazy_prompts.forEach(prompt => out.push({ type: "crazy", category: "CRAZY PROMPT", prompt }));
  return out;
}

async function loadData() {
  const [promptsRaw, tracksRaw, visualsRaw] = await Promise.all([
    loadJson('data/prompts.json', []),
    loadJson('data/tracks.json', []),
    loadJson('data/visuals.json', [])
  ]);

  state.promptsData = normalizePrompts(promptsRaw);
  state.tracksData = Array.isArray(tracksRaw) ? tracksRaw : [];
  state.visualsData = Array.isArray(visualsRaw) ? visualsRaw : [];

  initializeUI();
}

function initializeMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('closeMenuBtn');
  const menuLinks = document.querySelectorAll('.menu-link');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });

  closeBtn.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
  });

  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
    });
  });
}

function getRandomPrompt() {
  if (!state.promptsData.length) return null;
  return state.promptsData[Math.floor(Math.random() * state.promptsData.length)];
}

function spinSlotMachine() {
  if (state.isSpinning) return;
  state.isSpinning = true;

  const leverBtn = document.getElementById('leverBtn');
  const outputContent = document.getElementById('outputContent');
  const copyBtn = document.getElementById('copyBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const slots = [document.getElementById('slot1'), document.getElementById('slot2'), document.getElementById('slot3')];

  leverBtn.disabled = true;
  copyBtn.disabled = true;
  deleteBtn.disabled = true;
  outputContent.innerHTML = '<p class="output-placeholder">Machine spinning...</p>';
  slots.forEach(slot => slot.classList.add('spinning'));

  const slotValues = [
    ['AI','IMG','PICT','VIZ','ART','RND'],
    ['GEN','SONG','BIT','SND','MIX','TRK'],
    ['CODE','PROMPT','TEXT','WILD','IDEA','RIFF']
  ];

  const spinDuration = 1200;
  const spinSpeed = 55;
  let elapsed = 0;

  const spinInterval = setInterval(() => {
    elapsed += spinSpeed;

    slots.forEach((slot, i) => {
      const values = slotValues[i];
      slot.textContent = values[Math.floor(Math.random() * values.length)];
    });

    if (elapsed >= spinDuration) {
      clearInterval(spinInterval);
      slots.forEach(slot => slot.classList.remove('spinning'));

      const finalPrompt = getRandomPrompt();
      if (finalPrompt) {
        state.currentPrompt = finalPrompt;
        const type = (finalPrompt.type || '').toLowerCase();

        if (type.includes('picture')) {
          slots[0].textContent = 'PICT';
          slots[1].textContent = 'VIZ';
          slots[2].textContent = 'ART';
        } else if (type.includes('mureka') || type.includes('music')) {
          slots[0].textContent = 'SONG';
          slots[1].textContent = 'BASS';
          slots[2].textContent = 'BEAT';
        } else {
          slots[0].textContent = 'CODE';
          slots[1].textContent = 'PROMPT';
          slots[2].textContent = 'WILD';
        }

        displayPrompt(finalPrompt);
        recordPull(finalPrompt);
        copyBtn.disabled = false;
        deleteBtn.disabled = false;
        animateOutputWindow();
      } else {
        outputContent.innerHTML = '<p class="output-placeholder">No prompt data found.</p>';
      }

      leverBtn.disabled = false;
      state.isSpinning = false;
    }
  }, spinSpeed);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function displayPrompt(prompt) {
  const outputContent = document.getElementById('outputContent');
  const promptText = prompt.prompt || prompt.text || prompt.content || '';
  const promptType = prompt.category || prompt.type || 'PROMPT';

  outputContent.innerHTML = `
    <p>${escapeHtml(promptText)}</p>
    <p class="output-type">
      ${escapeHtml(promptType)}
    </p>
  `;
}

function getPromptBucket(prompt) {
  const type = `${prompt.type || ''} ${prompt.category || ''}`.toLowerCase();
  if (type.includes('mureka') || type.includes('music')) return 'mureka';
  if (type.includes('picture') || type.includes('image') || type.includes('visual')) return 'picture';
  return 'crazy';
}

function recordPull(prompt) {
  const bucket = getPromptBucket(prompt);
  state.stats[bucket] += 1;
  state.stats.last = bucket.toUpperCase();
  state.stats.chaos = Math.min(99, 72 + Math.floor(Math.random() * 28));
  updateControlPanel();
}

function updateControlPanel() {
  const lastPull = document.getElementById('lastPull');
  const chaosValue = document.getElementById('chaosValue');
  const pictureDrops = document.getElementById('pictureDrops');
  const murekaDrops = document.getElementById('murekaDrops');
  const crazyDrops = document.getElementById('crazyDrops');
  const chaosBars = document.querySelectorAll('#chaosBars span');

  if (lastPull) lastPull.textContent = state.stats.last;
  if (chaosValue) chaosValue.textContent = `${state.stats.chaos}%`;
  if (pictureDrops) pictureDrops.textContent = state.stats.picture;
  if (murekaDrops) murekaDrops.textContent = state.stats.mureka;
  if (crazyDrops) crazyDrops.textContent = state.stats.crazy;

  const activeBars = Math.max(1, Math.round((state.stats.chaos / 100) * chaosBars.length));
  chaosBars.forEach((bar, index) => {
    bar.classList.toggle('active', index < activeBars);
  });
}

function animateOutputWindow() {
  const outputWindow = document.querySelector('.output-window');
  outputWindow.style.animation = 'none';
  setTimeout(() => {
    outputWindow.style.animation = 'glitch-animation 0.4s ease';
  }, 10);
}

function initializeOutputButtons() {
  const copyBtn = document.getElementById('copyBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  copyBtn.addEventListener('click', () => {
    if (!state.currentPrompt) return;
    const promptText = state.currentPrompt.prompt || state.currentPrompt.text || state.currentPrompt.content || '';
    navigator.clipboard.writeText(promptText).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓ COPIED';
      setTimeout(() => copyBtn.innerHTML = originalText, 1500);
    });
  });

  deleteBtn.addEventListener('click', () => {
    state.currentPrompt = null;
    document.getElementById('outputContent').innerHTML = '<p class="output-placeholder">Pull the lever to generate...</p>';
    copyBtn.disabled = true;
    deleteBtn.disabled = true;
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '✓ CLEARED';
    setTimeout(() => deleteBtn.innerHTML = originalText, 1000);
  });
}

function initializeLever() {
  document.getElementById('leverBtn').addEventListener('click', spinSlotMachine);
}

function renderTracks() {
  const tracksContainer = document.getElementById('tracksContainer');
  tracksContainer.innerHTML = '';

  if (!state.tracksData.length) {
    tracksContainer.innerHTML = '<p style="color:var(--text-secondary);">No tracks available.</p>';
    return;
  }

  state.tracksData.forEach(track => tracksContainer.appendChild(createTrackCard(track)));
}

function createTrackCard(track) {
  const card = document.createElement('div');
  card.className = 'track-card';

  const cover = track.cover
    ? `<img src="${escapeHtml(track.cover)}" alt="${escapeHtml(track.title)}" class="track-cover">`
    : `<div class="track-cover"></div>`;

  const audio = track.audio ? `<audio controls preload="metadata" src="${escapeHtml(track.audio)}"></audio>` : '';

  const certificate = track.certificate
    ? `<a href="${escapeHtml(track.certificate)}" target="_blank" class="track-action-btn" rel="noopener">📜 License</a>`
    : '';

  const play = track.audio
    ? `<a href="${escapeHtml(track.audio)}" target="_blank" class="track-action-btn" rel="noopener">🎵 Open Track</a>`
    : '';

  card.innerHTML = `
    ${cover}
    <div class="track-title">${escapeHtml(track.title || 'Untitled Track')}</div>
    <div class="track-meta">
      ${track.mood ? `<span class="track-mood">${escapeHtml(track.mood)}</span>` : ''}
      ${track.style ? `<span class="track-style">${escapeHtml(track.style)}</span>` : ''}
      ${track.source ? `<span class="track-source">${escapeHtml(track.source)}</span>` : ''}
      ${track.status ? `<span class="track-source">${escapeHtml(track.status)}</span>` : ''}
    </div>
    ${track.description ? `<div class="track-description">${escapeHtml(track.description)}</div>` : ''}
    ${audio}
    <div class="track-actions">${play}${certificate}</div>
  `;

  return card;
}

function renderVisuals() {
  const visualGrid = document.getElementById('visualGrid');
  visualGrid.innerHTML = '';

  if (!state.visualsData.length) {
    visualGrid.innerHTML = '<p style="color:var(--text-secondary);grid-column:1/-1;text-align:center;">No visuals available.</p>';
    return;
  }

  state.visualsData.forEach(visual => visualGrid.appendChild(createVisualCard(visual)));
}

function createVisualCard(visual) {
  const card = document.createElement('div');
  card.className = 'visual-card';
  const info = [visual.world, visual.style].filter(Boolean).join(' · ');

  card.innerHTML = `
    ${visual.image ? `<img src="${escapeHtml(visual.image)}" alt="${escapeHtml(visual.title)}" class="visual-image">` : `<div class="visual-placeholder">${escapeHtml(visual.title || 'AI VISUAL')}</div>`}
    <div class="visual-overlay">
      <div class="visual-title">${escapeHtml(visual.title || 'Untitled Visual')}</div>
      ${info ? `<div class="visual-info">${escapeHtml(info)}</div>` : ''}
    </div>
  `;

  return card;
}

function initializeUI() {
  initializeMenu();
  initializeLever();
  initializeOutputButtons();
  updateControlPanel();
  renderTracks();
  renderVisuals();
}

document.addEventListener('DOMContentLoaded', loadData);
