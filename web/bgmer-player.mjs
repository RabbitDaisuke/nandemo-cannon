// BGMer tracks stream only during gameplay. No fetch/decodeAudioData preload.
export const BGM_TRACKS = Object.freeze([
  {id:'088', title:'陽気な週末', url:'./audio/bgm/088.mp3'},
  {id:'415', title:'おめざのじかん', url:'./audio/bgm/415.mp3'},
  {id:'073', title:'いったりきたり', url:'./audio/bgm/073.mp3'}
]);
export const BGM_STORAGE_KEY = 'nandemo-cannon.bgm.v1';
export const DEFAULT_BGM_VOLUME = 0.025;
export const BGM_MIRROR_BASE = 'https://daisukedaisuketeam.github.io/nanndemo/audio/bgm/';

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
    if (media.has(index)) return media.get(index);
    const audio = new host.Audio();
    audio.preload = 'none';
    audio.playsInline = true;
    // Web Audio otherwise silences cross-origin media, even if plain <audio> plays.
    audio.crossOrigin = 'anonymous';
    const track = BGM_TRACKS[index];
    const urls = [new URL(track.url, host.document.baseURI).href, `${BGM_MIRROR_BASE}${track.id}.mp3`];
    if ((host.Math?.random || Math.random)() >= 0.5) urls.reverse();
    audio.src = urls[0];
    const source = context.createMediaElementSource(audio);
    // GainNode controls actual output on iOS, where element.volume is ignored.
    source.connect(gain);
    const entry = {audio,source,urls,fallbackUsed:false,playToken:0};
    media.set(index, entry);
    audio.addEventListener('ended', () => {
      if (!active || !enabled || audio !== media.get(index)?.audio) return;
      index = (index + 1) % BGM_TRACKS.length;
      generation += 1;
      pending = null;
      void play();
    });
    audio.addEventListener('error', () => {
      // Assigning src clears old errors. Aborted loads are not mirror failures.
      if ([2,3,4].includes(audio.error?.code)) void failed(entry, entry.playToken, audio.error);
    });
    return entry;
  }
  function failed(entry, token, error) {
    if (token !== generation || !active || !enabled || entry !== media.get(index)) return Promise.resolve(false);
    playing = false;
    entry.audio.pause();
    if (['NotAllowedError','AbortError'].includes(error?.name) || entry.fallbackUsed) {
      blocked = true;
      return Promise.resolve(false);
    }
    // Invalidate the old play promise before changing src, so an error event
    // followed by a rejection cannot launch a second fallback.
    entry.fallbackUsed = true;
    generation += 1;
    pending = null;
    entry.audio.src = entry.urls[1];
    return play();
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
    let entry, audio;
    try {
      const resumed = unlock();
      entry = currentMedia();
      audio = entry.audio;
      entry.playToken = token;
      if (audio.ended) audio.currentTime = 0;
      // Do not await resume before play: both must see the same user gesture.
      const started = audio.play();
      pending = Promise.all([resumed, started]).then(([ok]) => {
        if (token !== generation || !active || !enabled) return false;
        if (!ok) { audio.pause(); blocked = true; return false; }
        playing = true; blocked = false;
        return true;
      }, error => failed(entry, token, error)).finally(() => { if (token === generation) pending = null; });
      return pending;
    } catch (error) {
      if (entry) return failed(entry, token, error);
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
