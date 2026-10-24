// BGMer tracks stream only during gameplay. No fetch/decodeAudioData preload.
export const BGM_TRACKS = Object.freeze([
  {id:'088', title:'陽気な週末', url:'./audio/bgm/088.mp3'},
  {id:'415', title:'おめざのじかん', url:'./audio/bgm/415.mp3'},
  {id:'073', title:'いったりきたり', url:'./audio/bgm/073.mp3'}
]);
export const BGM_STORAGE_KEY = 'nandemo-cannon.bgm.v1';
export const DEFAULT_BGM_VOLUME = 0.025;

export function installBGM(host = window) {
  if (host.NandemoBGM) return host.NandemoBGM;
  let enabled = true, volume = DEFAULT_BGM_VOLUME;
  try {
    const saved = JSON.parse(host.localStorage.getItem(BGM_STORAGE_KEY));
    if (typeof saved?.enabled === 'boolean') enabled = saved.enabled;
    if (typeof saved?.volume === 'number' && Number.isFinite(saved.volume)) volume = Math.min(1, Math.max(0, saved.volume));
  } catch { /* Private mode, unavailable storage, and invalid JSON keep defaults. */ }
  let context = null, gain = null, active = false, playing = false, blocked = false;
  let unavailable = false, index = 0, generation = 0, pending = null;
  const media = new Map();
  const persist = () => {
    try { host.localStorage.setItem(BGM_STORAGE_KEY, JSON.stringify({enabled,volume})); } catch { /* In-memory controls still work. */ }
  };
  function ensureGraph() {
    if (context) return true;
    const AudioContext = host.AudioContext || host.webkitAudioContext;
    if (!AudioContext || !host.Audio) { unavailable = true; return false; }
    try {
      context = new AudioContext();
      gain = context.createGain();
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.connect(context.destination);
      return true;
    } catch { context = null; gain = null; unavailable = true; return false; }
  }
  // Call directly from the initial Start click. It creates no media and no sound.
  function unlock() {
    if (!ensureGraph()) return Promise.resolve(false);
    try {
      return Promise.resolve(context.state === 'running' ? undefined : context.resume())
        .then(() => true, () => { blocked = true; return false; });
    } catch { blocked = true; return Promise.resolve(false); }
  }
  function currentMedia() {
    if (media.has(index)) return media.get(index).audio;
    const audio = new host.Audio();
    audio.preload = 'none';
    audio.playsInline = true;
    audio.src = new URL(BGM_TRACKS[index].url, host.document.baseURI).href;
    const source = context.createMediaElementSource(audio);
    // GainNode controls actual output on iOS, where element.volume is ignored.
    source.connect(gain);
    media.set(index, {audio,source});
    audio.addEventListener('ended', () => {
      if (!active || !enabled || audio !== media.get(index)?.audio) return;
      index = (index + 1) % BGM_TRACKS.length;
      generation += 1;
      pending = null;
      void play();
    });
    audio.addEventListener('error', () => {
      if (audio === media.get(index)?.audio && active && enabled) {
        playing = false; blocked = true;
      }
    });
    return audio;
  }
  function stop() {
    generation += 1;
    pending = null;
    playing = false;
    for (const {audio} of media.values()) audio.pause();
  }
  function play() {
    if (!active || !enabled || unavailable) return Promise.resolve(false);
    if (pending) return pending;
    if (!ensureGraph()) return Promise.resolve(false);
    const token = ++generation;
    let audio;
    try {
      const resumed = unlock();
      audio = currentMedia();
      if (audio.ended) audio.currentTime = 0;
      // Do not await resume before play: both must see the same user gesture.
      const started = audio.play();
      pending = Promise.all([resumed, started]).then(([ok]) => {
        if (token !== generation || !active || !enabled) return false;
        if (!ok) { audio.pause(); blocked = true; return false; }
        playing = true; blocked = false;
        return true;
      }, () => {
        if (token === generation) { playing = false; blocked = true; }
        return false;
      }).finally(() => { if (token === generation) pending = null; });
      return pending;
    } catch {
      if (audio) audio.pause();
      playing = false; blocked = true;
      return Promise.resolve(false);
    }
  }
  const api = {
    unlock,
    startGameplay() {
      if (active && (playing || pending)) return pending || Promise.resolve(true);
      active = true;
      return play();
    },
    stopGameplay() { active = false; stop(); },
    toggle() {
      if (blocked && enabled) { blocked = false; return play(); }
      enabled = !enabled;
      persist();
      if (!enabled) { blocked = false; stop(); return Promise.resolve(false); }
      return play();
    },
    setVolume(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) return volume;
      volume = Math.min(1, Math.max(0, number));
      if (gain) gain.gain.setTargetAtTime(volume, context.currentTime, 0.015);
      persist();
      return volume;
    },
    getStateJSON() {
      return JSON.stringify({enabled,volume,active,playing,blocked,unavailable,track:BGM_TRACKS[index].id});
    }
  };
  host.NandemoBGM = api;
  return api;
}
