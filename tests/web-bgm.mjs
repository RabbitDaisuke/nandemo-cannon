// Browser-free behavior checks; no network and no real audio device.
import assert from 'node:assert/strict';
import {installBGM, BGM_TRACKS, BGM_STORAGE_KEY, DEFAULT_BGM_VOLUME, BGM_MIRROR_BASE} from '../web/bgmer-player.mjs';

function fixture(saved = null, random = 0) {
  const audios = [], contexts = [], sources = [], writes = [], playFailures = new Map();
  const storage = new Map(saved === null ? [] : [[BGM_STORAGE_KEY, saved]]);
  class Audio {
    constructor() { this.events = {}; this.paused = true; this.ended = false; this.playCalls = 0; this.srcWrites = []; audios.push(this); }
    set volume(_value) { throw new Error('Do not depend on iOS element.volume'); }
    set src(value) { this._src=value; this.error=null; this.srcWrites.push({value,crossOrigin:this.crossOrigin}); }
    get src() { return this._src; }
    addEventListener(name, callback) { this.events[name] = callback; }
    play() { this.playCalls++; this.paused = false; const failure=this.failure||playFailures.get(this.src); return failure ? Promise.reject(failure) : (this.pending || Promise.resolve()); }
    pause() { this.paused = true; }
    end() { this.ended = true; this.paused = true; this.events.ended(); }
    fail(code) { this.error={code}; this.events.error(); }
  }
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.resumeCalls = 0; contexts.push(this); }
    createGain() { return {gain:{setValueAtTime:value => writes.push(value),setTargetAtTime:value => writes.push(value)},connect(){}}; }
    createMediaElementSource(audio) { assert(!sources.some(source => source.audio === audio)); const source = {audio,connect(){}}; sources.push(source); return source; }
    resume() { this.resumeCalls++; this.state = 'running'; return this.failure ? Promise.reject(this.failure) : Promise.resolve(); }
  }
  const host = {Audio,AudioContext,Math:{random:()=>random},fetch(){throw Error('Music must not probe or preload');},document:{baseURI:'https://example.test/nandemo-cannon/'},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
  const api = installBGM(host);
  return {api,host,audios,contexts,sources,writes,storage,playFailures,state:()=>JSON.parse(api.getStateJSON())};
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
check(denied.audios[0].srcWrites.length === 1, 'AudioContext autoplay denial changed mirrors');

const late = fixture();
await late.api.unlock();
let resolvePlay;
const deferred = new Promise(resolve => { resolvePlay = resolve; });
late.host.Audio.prototype.play = function(){this.playCalls++;this.paused=false;return deferred;};
const started = late.api.startGameplay();
late.api.stopGameplay();
resolvePlay(); await started;
late.audios[0].fail(2); await settle();
check(!late.state().playing && late.audios[0].paused && late.audios[0].srcWrites.length === 1, 'A late promise or MediaError revived music after leaving gameplay');

const unsupported = fixture();
delete unsupported.host.AudioContext;
await unsupported.api.startGameplay();
check(unsupported.state().unavailable && unsupported.audios.length === 0, 'Missing Web Audio fell back to uncontrollable volume');

const localURL='https://example.test/nandemo-cannon/audio/bgm/088.mp3', remoteURL=`${BGM_MIRROR_BASE}088.mp3`;
check(a.audios.every(audio=>audio.srcWrites.length===1&&audio.srcWrites[0].crossOrigin==='anonymous'), 'Normal playback fetched multiple origins or set CORS after src');
const remote=fixture(null,0.5);
check(remote.audios.length===0,'Choosing the remote mirror caused an early download');
await remote.api.startGameplay();
check(remote.audios[0].src===remoteURL&&remote.audios[0].srcWrites.length===1&&remote.sources.length===1,'The upper random half did not select exactly one remote source');

const localFailure=fixture(JSON.stringify({enabled:true,volume:0.013}));
localFailure.playFailures.set(localURL,new Error('Network failure'));
await localFailure.api.startGameplay();
check(localFailure.state().playing&&localFailure.audios[0].src===remoteURL&&localFailure.audios[0].srcWrites.length===2,'Rejected local playback did not fall back once to the remote mirror');
check(localFailure.audios.length===1&&localFailure.sources.length===1&&localFailure.state().volume===0.013&&localFailure.writes.at(-1)===0.013,'Mirror fallback recreated a source or changed the saved gain');
localFailure.audios[0].fail(3); await settle();
check(localFailure.state().blocked&&!localFailure.state().playing&&localFailure.audios[0].srcWrites.length===2,'Both failed mirrors triggered a third source or an automatic loop');

for(const code of [2,3,4]){
  const f=fixture(null,0.99);await f.api.startGameplay();
  f.audios[0].fail(code);await settle();
  check(f.state().playing&&f.audios[0].src===localURL&&f.audios[0].srcWrites.length===2&&f.audios[0].srcWrites.every(write=>write.crossOrigin==='anonymous'),`Remote MediaError ${code} did not fall back locally with CORS enabled`);
}
const mediaDenied=fixture();
mediaDenied.playFailures.set(localURL,Object.assign(new Error('Gesture required'),{name:'NotAllowedError'}));
await mediaDenied.api.startGameplay();
check(mediaDenied.state().blocked&&mediaDenied.audios[0].srcWrites.length===1,'HTMLAudio autoplay denial wrongly switched mirrors');
mediaDenied.playFailures.clear();await mediaDenied.api.toggle();
check(mediaDenied.state().playing&&mediaDenied.audios[0].srcWrites.length===1,'User autoplay retry did not retain its source');
const aborted=fixture();
aborted.playFailures.set(localURL,Object.assign(new Error('Playback interrupted'),{name:'AbortError'}));
await aborted.api.startGameplay();
check(aborted.state().blocked&&!aborted.state().playing&&aborted.audios[0].srcWrites.length===1,'A playback interruption wrongly switched mirrors');

const duplicate=fixture();let rejectOriginal;
duplicate.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return this.playCalls===1?new Promise((_resolve,reject)=>{rejectOriginal=reject;}):Promise.resolve();};
const original=duplicate.api.startGameplay();
duplicate.audios[0].fail(2);rejectOriginal(new Error('Same failed request'));
await original;await settle();
check(duplicate.state().playing&&duplicate.audios[0].srcWrites.length===2&&duplicate.audios[0].playCalls===2,'An error event plus play rejection caused duplicate fallback or clobbered successful playback');

for(const action of ['top','off']){
  const f=fixture();let finishFallback;
  f.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return this.playCalls===1?Promise.reject(new Error('Missing track')):new Promise(resolve=>{finishFallback=resolve;});};
  const playback=f.api.startGameplay();await settle();
  if(action==='top')f.api.stopGameplay();else await f.api.toggle();
  finishFallback();await playback;
  f.audios[0].fail(2);await settle();
  check(!f.state().playing&&f.audios[0].paused&&f.audios[0].srcWrites.length===2,`A pending fallback restarted music after ${action}`);
}
console.log(JSON.stringify({suite:'web-bgm',checks,status:'passed',verification:'Node API fixtures; no browser, network, or audible playback'}));
