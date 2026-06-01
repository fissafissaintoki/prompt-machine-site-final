const USED_KEY = "prompterator_used_prompt_hashes_v2";
const CURRENT_KEY = "prompterator_current_prompt_v2";

const modes = {
  mureka: {
    labels: ["Sound", "Energy", "Hook"],
    slots: [
      [
        "dark orchestral anthem",
        "Irish rebel folk",
        "cosmic elephant fanfare",
        "ragga jungle hymn",
        "sea shanty rave",
        "epic trailer score",
        "ancient druid choir",
        "cyberpunk synth march"
      ],
      [
        "thunderous war drums",
        "burning fiddle energy",
        "cathedral-scale choir",
        "ragga jungle pressure",
        "cinematic trailer rise",
        "stormy rebel momentum",
        "ancient druid trance",
        "neon synth pulse"
      ],
      [
        "a chorus that feels legendary",
        "a rebel chant exploding into harmony",
        "a cosmic trumpet call",
        "a bass drop that opens the sea",
        "a tavern refrain sung by thousands",
        "a final heroic modulation",
        "a choir answering from the forest",
        "a marching synth hook"
      ]
    ],
    template(values) {
      return `Create a full ${values[0]} song with ${values[1]}, built around ${values[2]}. Make it epic, memorable, emotional, non-childish, with a strong intro, powerful chorus, cinematic dynamics and a final section that feels legendary.`;
    }
  },
  visual: {
    labels: ["Subject", "Style", "Effect"],
    slots: [
      [
        "glowing data shaman",
        "cyber warrior",
        "jungle mammoth queen",
        "cosmic logistics commander",
        "mystic slot machine",
        "floating cathedral engine",
        "neon fox spirit",
        "storm gate traveler"
      ],
      [
        "dark neon realism",
        "premium cinematic concept art",
        "surreal editorial photography",
        "high contrast cyberpunk poster art",
        "baroque sci-fi chiaroscuro",
        "ultra-detailed fantasy realism",
        "volumetric wide-angle scene",
        "sharp high-end game key art"
      ],
      [
        "digital disintegration",
        "portal manifestation",
        "glitch explosion",
        "particle dissolve",
        "burning portal warp",
        "pixel sorting storm",
        "volumetric hyperspace trail",
        "neon smoke eruption"
      ]
    ],
    template(values) {
      return `Create a ${values[1]} image of a ${values[0]}, using ${values[2]}. Make it sharp, dramatic, high contrast, visually explosive, premium quality, centered composition, intense atmosphere, no cheap cartoon look.`;
    }
  },
  crazy: {
    labels: ["Creature", "World", "Chaos"],
    slots: [
      [
        "jungle mammoth queen",
        "singing forklift oracle",
        "cosmic squirrel emperor",
        "tea-drunk pirate angel",
        "breakdancing neon monks",
        "haunted slot machine priest"
      ],
      [
        "burning disco monastery",
        "floating warehouse planet",
        "zero-gravity tavern",
        "mushroom moon market",
        "ancient server temple",
        "bioluminescent jungle station"
      ],
      [
        "the sky starts beatboxing",
        "a portal opens inside a teacup",
        "the bass summons a dragon",
        "time loops on the chorus",
        "the machine becomes alive",
        "gravity forgets its job"
      ]
    ],
    template(values) {
      return `Create an absolutely unhinged scene: ${values[0]} inside a ${values[1]}, while ${values[2]}. Make it cinematic, bizarre, hilarious, detailed, beautiful, chaotic and impossible to ignore.`;
    }
  }
};

const state = {
  mode: "visual",
  values: ["", "", ""],
  used: readUsedHashes()
};

const els = {
  machine: document.getElementById("machine"),
  unleashButton: document.getElementById("unleashButton"),
  promptOutput: document.getElementById("promptOutput"),
  copyButton: document.getElementById("copyButton"),
  deleteButton: document.getElementById("deleteButton"),
  toast: document.getElementById("toast"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  spinButtons: Array.from(document.querySelectorAll(".spin-button")),
  slots: Array.from(document.querySelectorAll(".slot")),
  labels: [0, 1, 2].map((index) => document.getElementById(`slotLabel${index}`)),
  values: [0, 1, 2].map((index) => document.getElementById(`slotValue${index}`))
};

function readUsedHashes() {
  try {
    const value = JSON.parse(localStorage.getItem(USED_KEY) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function saveUsedHashes() {
  localStorage.setItem(USED_KEY, JSON.stringify(Array.from(state.used).slice(-5000)));
}

function hashPrompt(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String(hash >>> 0);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomValues(modeName = state.mode) {
  return modes[modeName].slots.map((items) => randomItem(items));
}

function setMode(modeName) {
  state.mode = modeName;
  state.values = randomValues(modeName);
  els.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === modeName);
  });
  renderSlots();
  clearPrompt(false);
}

function spinSlot(index) {
  const slot = els.slots[index];
  const values = modes[state.mode].slots[index];
  slot.classList.add("is-spinning");

  let ticks = 0;
  const spinner = window.setInterval(() => {
    els.values[index].textContent = randomItem(values);
    ticks += 1;
    if (ticks > 9) {
      window.clearInterval(spinner);
      state.values[index] = randomItem(values);
      renderSlots();
      slot.classList.remove("is-spinning");
      slot.classList.add("is-hit");
      window.setTimeout(() => slot.classList.remove("is-hit"), 540);
    }
  }, 52);
}

function renderSlots() {
  const mode = modes[state.mode];
  mode.labels.forEach((label, index) => {
    els.labels[index].textContent = label;
    els.values[index].textContent = state.values[index];
  });
}

function buildPrompt(values = state.values) {
  return modes[state.mode].template(values);
}

function createUniquePrompt() {
  const totalCombinations = modes[state.mode].slots.reduce((total, slot) => total * slot.length, 1);

  for (let attempt = 0; attempt < totalCombinations + 80; attempt += 1) {
    if (attempt > 0) {
      state.values = randomValues();
    }

    const prompt = buildPrompt();
    const promptHash = hashPrompt(`${state.mode}|${prompt}`);

    if (!state.used.has(promptHash)) {
      state.used.add(promptHash);
      saveUsedHashes();
      localStorage.setItem(CURRENT_KEY, prompt);
      return prompt;
    }
  }

  state.used.clear();
  saveUsedHashes();
  const prompt = buildPrompt();
  state.used.add(hashPrompt(`${state.mode}|${prompt}`));
  saveUsedHashes();
  localStorage.setItem(CURRENT_KEY, prompt);
  return prompt;
}

function unleash() {
  const prompt = createUniquePrompt();
  renderSlots();
  els.promptOutput.value = prompt;

  els.machine.classList.remove("is-unleashing");
  els.unleashButton.classList.remove("is-pulsing");
  void els.machine.offsetWidth;
  els.machine.classList.add("is-unleashing");
  els.unleashButton.classList.add("is-pulsing");

  window.setTimeout(() => {
    els.machine.classList.remove("is-unleashing");
    els.unleashButton.classList.remove("is-pulsing");
  }, 780);
}

async function copyPrompt() {
  const prompt = els.promptOutput.value.trim();
  if (!prompt) return;

  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    els.promptOutput.removeAttribute("readonly");
    els.promptOutput.select();
    document.execCommand("copy");
    els.promptOutput.setAttribute("readonly", "readonly");
    window.getSelection().removeAllRanges();
  }

  showToast("COPIED");
}

function clearPrompt(show = true) {
  els.promptOutput.value = "";
  localStorage.removeItem(CURRENT_KEY);
  if (show) showToast("DELETED");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.setTimeout(() => els.toast.classList.remove("is-visible"), 900);
}

els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

els.spinButtons.forEach((button) => {
  button.addEventListener("click", () => spinSlot(Number(button.dataset.spin)));
});

els.unleashButton.addEventListener("click", unleash);
els.copyButton.addEventListener("click", copyPrompt);
els.deleteButton.addEventListener("click", () => clearPrompt(true));

setMode("visual");
