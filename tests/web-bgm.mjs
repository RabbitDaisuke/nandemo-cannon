// Browser-free behavior checks; no network and no real audio device.
import assert from 'node:assert/strict';
import {installBGM, BGM_TRACKS, BGM_STORAGE_KEY, DEFAULT_BGM_VOLUME} from '../web/bgmer-player.mjs';

function fixture(saved = null) {
  const audios = [], contexts = [], sources = [], writes = [];
  const storage = new Map(saved === null ? [] : [[BGM_STORAGE_KEY, saved]]);
  class Audio {
    constructor() { this.events = {}; this.paused = true; this.ended = false; this.playCalls = 0; audios.push(this); }
    set volume(_value) { throw new Error('Do not depend on iOS element.volume'); }
    addEventListener(name, callback) { this.events[name] = callback; }
    play() { this.playCalls++; this.paused = false; return this.failure ? Promise.reject(this.failure) : (this.pending || Promise.resolve()); }
    pause() { this.paused = true; }
    end() { this.ended = true; this.paused = true; this.events.ended(); }
  }
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.resumeCalls = 0; contexts.push(this); }
    createGain() { return {gain:{setValueAtTime:value => writes.push(value),setTargetAtTime:value => writes.push(value)},connect(){}}; }
    createMediaElementSource(audio) { assert(!sources.some(source => source.audio === audio)); const source = {audio,connect(){}}; sources.push(source); return source; }
    resume() { this.resumeCalls++; this.state = 'running'; return this.failure ? Promise.reject(this.failure) : Promise.resolve(); }
  }
  const host = {Audio,AudioContext,document:{baseURI:'https://example.test/nandemo-cannon/'},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
  const api = installBGM(host);
  return {api,host,audios,contexts,sources,writes,storage,state:()=>JSON.parse(api.getStateJSON())};
}
const settle = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
let checks = 0;
function check(value, message) { checks++; assert(value,message); }

const a = fixture();
check(a.audios.length === 0 && a.contexts.length === 0, 'Install fetched or started music on the top screen');
check(a.state().volume === DEFAULT_BGM_VOLUME && a.state().enabled, 'Default music settings changed');
const unlock = a.api.unlock();
check(a.contexts[0].resumeCalls === 1 && a.audios.length === 0, 'Unlock was not synchronous or created audible media');
await unlock;
check(a.writes[0] === 0.025, 'Initial gain is not extremely low before sources connect');
const first = a.api.startGameplay(), shared = a.api.startGameplay();
check(first === shared, 'Repeated startup did not share the pending play attempt');
await first;
check(a.audios.length === 1 && a.sources.length === 1 && a.audios[0].preload === 'none', 'Music was not lazy streaming through a reusable media source');
check(a.audios[0].src === 'https://example.test/nandemo-cannon/audio/bgm/088.mp3' && a.state().playing, 'First gameplay track did not start');
a.api.setVolume(0.04);
check(a.writes.at(-1) === 0.04 && JSON.parse(a.storage.get(BGM_STORAGE_KEY)).volume === 0.04, 'Gain adjustment was not applied and persisted');
a.api.setVolume(10);
check(a.state().volume === 1 && a.writes.at(-1) === 1, 'Volume did not clamp its upper bound');
a.api.setVolume(-2);
check(a.state().volume === 0 && a.writes.at(-1) === 0, 'Volume did not clamp its lower bound');
a.api.setVolume(NaN);
check(a.state().volume === 0, 'Invalid volume corrupted state');
await a.api.toggle();
check(!a.state().enabled && a.audios[0].paused, 'Switching music off did not pause the element');
await a.api.toggle();
check(a.state().playing && a.audios.length === 1 && a.sources.length === 1, 'Music toggle recreated or reconnected media');
for (let i=0;i<BGM_TRACKS.length;i++) { a.audios[i].end(); await settle(); }
check(a.audios.length === 3 && a.sources.length === 3 && a.state().track === '088', 'Playlist did not cycle using its three cached elements');
check(a.audios[0].currentTime === 0 && a.audios[0].playCalls === 3, 'Returning track did not reuse the original element');
a.api.stopGameplay();
check(!a.state().active && !a.state().playing && a.audios.every(audio => audio.paused), 'Returning to the top did not stop all output');
a.audios[0].end(); await settle();
check(a.state().track === '088' && a.audios.every(audio => audio.paused), 'A late ended event restarted music on the top');
check(installBGM(a.host) === a.api, 'Installing twice created a second player');

const restored = fixture(JSON.stringify({enabled:false,volume:0.013}));
await restored.api.startGameplay();
check(restored.audios.length === 0 && restored.state().volume === 0.013 && !restored.state().enabled, 'Saved disabled music downloaded a track');
const invalid = fixture('{broken');
check(invalid.state().volume === 0.025, 'Broken localStorage was not tolerated');
Object.defineProperty(invalid.host,'localStorage',{get(){throw new Error('Private storage unavailable');}});
invalid.api.setVolume(0.01);
check(invalid.state().volume === 0.01, 'Unavailable localStorage broke live volume controls');

const denied = fixture();
await denied.api.unlock();
denied.contexts[0].state = 'suspended';
denied.contexts[0].failure = new Error('Autoplay denied');
await denied.api.startGameplay();
check(denied.state().blocked && !denied.state().playing && denied.audios[0].paused, 'Autoplay refusal was not handled safely');
denied.contexts[0].failure = null;
await denied.api.toggle();
check(denied.state().playing && !denied.state().blocked && denied.audios.length === 1, 'User retry after autoplay denial failed or recreated media');
denied.audios[0].events.error();
check(denied.state().blocked && !denied.state().playing && denied.audios.length === 1, 'Media error triggered an unbounded retry or was hidden');

const late = fixture();
await late.api.unlock();
let resolvePlay;
const deferred = new Promise(resolve => { resolvePlay = resolve; });
late.host.Audio.prototype.play = function(){this.playCalls++;this.paused=false;return deferred;};
const started = late.api.startGameplay();
late.api.stopGameplay();
resolvePlay(); await started;
check(!late.state().playing && late.audios[0].paused, 'A late play promise revived music after leaving gameplay');

const unsupported = fixture();
delete unsupported.host.AudioContext;
await unsupported.api.startGameplay();
check(unsupported.state().unavailable && unsupported.audios.length === 0, 'Missing Web Audio fell back to uncontrollable volume');
console.log(JSON.stringify({suite:'web-bgm',checks,status:'passed',verification:'Node API fixtures; no browser, network, or audible playback'}));
