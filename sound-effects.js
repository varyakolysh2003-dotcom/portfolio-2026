const preferenceKey = 'portfolio-sound-enabled';
const soundGroups = {
  "default": [
    "/assets/sounds/default/click-002.mp3",
    "/assets/sounds/default/click-003.mp3"
  ],
  "cat": [
    "/assets/sounds/cat/freesound_community-cat-meow-14536.mp3",
    "/assets/sounds/cat/u_6ekfl947a2-cat-meow-297927.mp3"
  ],
  "bid": [
    "/assets/sounds/bid/digital-input-alert-clean-short-brukowskij-simple-input-5-0m00s.mp3",
    "/assets/sounds/bid/ui-ding-jam-fx-2-2-00-01.mp3"
  ],
  "food": [
    "/assets/sounds/food/drop-003.mp3",
    "/assets/sounds/food/drop-004.mp3"
  ],
  "shoes": [
    "/assets/sounds/shoes/47313572-ui-pop-sound-316482.mp3"
  ]
};

export function setupSoundEffects(button) {
  let enabled = true;
  try {
    enabled = localStorage.getItem(preferenceKey) !== 'false';
  } catch { /* Sound still works when browser storage is unavailable. */ }

  const groups = Object.fromEntries(Object.entries(soundGroups).map(([name, urls]) => [name, {
    clips: urls.map(url => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.5;
      return audio;
    }),
    queue: [],
    previous: -1,
  }]));
  let activeClip = null;

  function nextClip(name) {
    const group = groups[name];
    const { clips, previous } = group;
    let { queue } = group;
    if (!queue.length) {
      queue = clips.map((_, index) => index);
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      // Every effect plays once per shuffled cycle, without back-to-back repeats.
      if (queue.length > 1 && queue[0] === previous) [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    group.previous = queue.shift();
    group.queue = queue;
    return clips[group.previous];
  }

  function updateButton() {
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    const label = enabled ? 'Turn off click sounds' : 'Turn on click sounds';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.dataset.soundEnabled = String(enabled);
  }

  button?.addEventListener('click', () => {
    enabled = !enabled;
    updateButton();
    try { localStorage.setItem(preferenceKey, String(enabled)); } catch { /* Optional persistence. */ }
    if (!enabled && activeClip) {
      activeClip.pause();
      activeClip.currentTime = 0;
    }
  });

  // A click covers mouse, touch taps, and keyboard activation exactly once.
  // It does not fire for scrolling or a cancelled touch gesture.
  document.addEventListener('click', (event) => {
    if (!enabled) return;
    if (activeClip) {
      activeClip.pause();
      activeClip.currentTime = 0;
    }
    const icon = event.target.closest('.study-icon');
    const group = icon?.classList.contains('cat') ? 'cat'
      : icon?.classList.contains('live') ? 'bid'
      : icon?.classList.contains('food') ? 'food'
      : icon?.classList.contains('sold') ? 'shoes'
      : 'default';
    activeClip = nextClip(group);
    activeClip.play().catch(() => { /* Ignore a browser playback restriction. */ });
  });

  updateButton();
}
