// Download each selected MP3 once, keep its compressed Blob for this page's
// lifetime, and play only blob: URLs. Never decode the whole playlist to PCM.
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
  let context = null, gain = null, active = false, playing = false, blocked = false, errored = false;
  let unavailable = false, index = -1, generation = 0, pending = null;
  let remaining = [];
  const media = new Map();
  const random = () => (host.Math || Math).random();
  const persist = () => {
    try { host.localStorage.setItem(BGM_STORAGE_KEY, JSON.stringify({enabled,volume})); } catch { /* In-memory controls still work. */ }
  };
  function nextTrack() {
    if (!remaining.length) remaining = BGM_TRACKS.map((_track, i) => i);
    // A shuffle bag plays every song once per round. Exclude the previous song
    // at round boundaries too, so it never immediately repeats.
    const choices = remaining.filter(i => i !== index);
    const next = choices[Math.floor(random() * choices.length)];
    remaining.splice(remaining.indexOf(next), 1);
    return next;
  }
  function ensureGraph() {
    if (context) return true;
    const AudioContext = host.AudioContext || host.webkitAudioContext;
    if (!AudioContext || !host.Audio || !host.fetch || !host.URL?.createObjectURL) { unavailable = true; return false; }
    try {
      context = new AudioContext();
      gain = context.createGain();
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.connect(context.destination);
      return true;
    } catch { context = null; gain = null; unavailable = true; return false; }
  }
  // Call directly from the initial Start click. It creates no media or requests.
  function unlock() {
    if (!ensureGraph()) return Promise.resolve(false);
    try {
      return Promise.resolve(context.state === 'running' ? undefined : context.resume())
        .then(() => true, () => false);
    } catch { return Promise.resolve(false); }
  }
  function currentMedia() {
    if (media.has(index)) return media.get(index);
    const audio = new host.Audio();
    audio.preload = 'none';
    audio.playsInline = true;
    audio.crossOrigin = 'anonymous';
    const track = BGM_TRACKS[index];
    const urls = [new URL(track.url, host.document.baseURI).href, `${BGM_MIRROR_BASE}${track.id}.mp3`];
    if (random() >= 0.5) urls.reverse();
    const source = context.createMediaElementSource(audio);
    // GainNode controls actual output on iOS, where element.volume is ignored.
    source.connect(gain);
    const entry = {audio,source,urls,blob:null,objectURL:null,download:null,playToken:0};
    media.set(index, entry);
    audio.addEventListener('ended', () => {
      if (!active || !enabled || !playing || audio !== media.get(index)?.audio) return;
      playing = false;
      index = nextTrack();
      generation += 1;
      pending = null;
      void play();
    });
    audio.addEventListener('error', () => {
      if ([2,3,4].includes(audio.error?.code)) failed(entry, entry.playToken, false);
    });
    return entry;
  }
  function download(entry) {
    if (!entry.download) {
      // Cache the promise, including failures. Toggle, stage changes and retries
      // cannot start another transfer. Only a failed fetch/body tries the other
      // mirror once; playback/autoplay errors never redownload a cached song.
      entry.download = (async () => {
        let failure;
        for (const url of entry.urls) {
          try {
            const response = await host.fetch(url, {mode:'cors',credentials:'omit'});
            if (!response.ok) throw new Error(`BGM HTTP ${response.status}`);
            const blob = await response.blob();
            if (!blob.size) throw new Error('Empty BGM');
            entry.objectURL = host.URL.createObjectURL(blob);
            entry.blob = blob;
            return;
          } catch (error) { failure = error; }
        }
        throw failure;
      })();
    }
    return entry.download;
  }
  function failed(entry, token, retryable = true) {
    if (token !== generation || !active || !enabled || entry !== media.get(index)) return false;
    generation += 1;
    pending = null;
    playing = false;
    blocked = retryable;
    errored = !retryable;
    entry.audio.pause();
    return false;
  }
  function stop() {
    generation += 1;
    pending = null;
    playing = false;
    for (const {audio} of media.values()) audio.pause();
    // In-flight downloads finish into the same cache. Retain blobs on the top
    // screen and while muted; the browser releases them on document unload.
  }
  function play() {
    if (!active || !enabled || unavailable) return Promise.resolve(false);
    if (pending) return pending;
    if (!ensureGraph()) return Promise.resolve(false);
    if (index < 0) index = nextTrack();
    const token = ++generation;
    let entry;
    try {
      const resumed = unlock();
      entry = currentMedia();
      const audio = entry.audio;
      entry.playToken = token;
      const begin = () => {
        if (token !== generation || !active || !enabled) return false;
        if (audio.src !== entry.objectURL) audio.src = entry.objectURL;
        if (audio.ended) audio.currentTime = 0;
        return audio.play();
      };
      // Cached playback calls play synchronously with the retry gesture. The
      // first download can need a later user retry on strict autoplay devices.
      const started = entry.objectURL ? begin() : download(entry).then(begin);
      pending = Promise.all([resumed, started]).then(([ok]) => {
        if (token !== generation || !active || !enabled) return false;
        if (!ok) return failed(entry, token);
        playing = true; blocked = false; errored = false;
        return true;
      }, error => failed(entry, token, ['NotAllowedError','AbortError'].includes(error?.name))).finally(() => { if (token === generation) pending = null; });
      return pending;
    } catch {
      if (entry) return Promise.resolve(failed(entry, token));
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
      if (!enabled) { blocked = false; errored = false; stop(); return Promise.resolve(false); }
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
      return JSON.stringify({enabled,volume,active,playing,blocked,errored,unavailable,track:BGM_TRACKS[index]?.id || ''});
    }
  };
  host.NandemoBGM = api;
  return api;
}
