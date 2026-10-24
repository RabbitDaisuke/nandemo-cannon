// Browser-free behavior checks; no network and no real audio device.
import assert from 'node:assert/strict';
import {installBGM, BGM_TRACKS, BGM_STORAGE_KEY, DEFAULT_BGM_VOLUME, BGM_MIRROR_BASE} from '../web/bgmer-player.mjs';

function fixture(saved = null, random = 0) {
  const audios = [], contexts = [], sources = [], writes = [], requests = [], blobs = new Map(), responses = new Map();
  const storage = new Map(saved === null ? [] : [[BGM_STORAGE_KEY, saved]]);
  class Audio {
    constructor() { this.events = {}; this.paused = true; this.ended = false; this.playCalls = 0; this.srcWrites = []; audios.push(this); }
    set volume(_value) { throw new Error('Do not depend on iOS element.volume'); }
    set src(value) { assert(value.startsWith('blob:'), 'Audio must never request an HTTP URL'); this._src=value; this.error=null; this.srcWrites.push({value,crossOrigin:this.crossOrigin}); }
    get src() { return this._src; }
    addEventListener(name, callback) { this.events[name] = callback; }
    play() { this.playCalls++; this.paused = false; this.ended = false; return this.failure ? Promise.reject(this.failure) : (this.pending || Promise.resolve()); }
    pause() { this.paused = true; }
    end() { this.ended = true; this.paused = true; this.events.ended(); }
    fail(code) { this.error={code}; this.events.error(); }
  }
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.resumeCalls = 0; contexts.push(this); }
    createGain() { return {gain:{setValueAtTime:value => writes.push(value),setTargetAtTime:value => writes.push(value)},connect(){}}; }
    createMediaElementSource(audio) { assert(!sources.some(source => source.audio === audio)); const source = {audio,connect(){}}; sources.push(source); return source; }
    resume() { this.resumeCalls++; if(this.failure) return Promise.reject(this.failure); this.state = 'running'; return Promise.resolve(); }
  }
  const host = {
    Audio,AudioContext,Math:{random:typeof random==='function'?random:()=>random},
    URL:{createObjectURL(blob){const url=`blob:test/${blobs.size}`;blobs.set(url,blob);return url;}},
    async fetch(url,options){
      requests.push({url,options});
      const override=responses.get(url);
      if(override instanceof Error)throw override;
      return override || {ok:true,blob:async()=>new Blob([url],{type:'audio/mpeg'})};
    },
    document:{baseURI:'https://example.test/nandemo-cannon/'},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}
  };
  const api = installBGM(host);
  return {api,host,audios,contexts,sources,writes,storage,requests,blobs,responses,state:()=>JSON.parse(api.getStateJSON()),current:()=>audios.find(audio=>!audio.paused)};
}
const settle = async () => { for (let i=0;i<24;i++) await Promise.resolve(); };
const defer = () => {let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const localURL='https://example.test/nandemo-cannon/audio/bgm/088.mp3', remoteURL=`${BGM_MIRROR_BASE}088.mp3`;
let checks = 0;
function check(value, message) { checks++; assert(value,message); }

const a = fixture();
check(a.audios.length === 0 && a.contexts.length === 0 && a.requests.length === 0, 'Install fetched or started music on the top screen');
check(a.state().volume === DEFAULT_BGM_VOLUME && a.state().enabled, 'Default music settings changed');
const unlock = a.api.unlock();
check(a.contexts[0].resumeCalls === 1 && a.audios.length === 0 && a.requests.length===0, 'Unlock was not synchronous or started a request');
await unlock;
check(a.writes[0] === 0.025, 'Initial gain is not extremely low before sources connect');
const first = a.api.startGameplay(), shared = a.api.startGameplay();
check(first === shared, 'Repeated startup did not share the pending play attempt');
await first;
check(a.audios.length === 1 && a.sources.length === 1 && a.requests.length===1, 'First use did not lazily fetch exactly one track');
check(a.requests[0].url===localURL && a.state().playing && a.audios[0].src.startsWith('blob:'), 'First song did not play from memory');
check(await a.blobs.get(a.audios[0].src).text()===localURL, 'The cached blob lost its downloaded bytes');
check(a.requests.every(r=>r.options.mode==='cors'&&r.options.credentials==='omit'), 'Fetch did not explicitly use anonymous CORS');
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
check(a.state().playing && a.audios.length === 1 && a.sources.length === 1 && a.requests.length===1, 'Toggle recreated media or downloaded the song again');
const order=[a.state().track];
for (let i=0;i<17;i++) { a.current().end(); await settle(); order.push(a.state().track); }
check(a.audios.length === 3 && a.sources.length === 3 && a.blobs.size===3, 'Playlist did not reuse its three cached elements and compressed blobs');
check(a.requests.length===3 && new Set(a.requests.map(r=>r.url)).size===3, 'Six playlist rounds downloaded a song more than once');
check(order.every((id,i)=>i===0||id!==order[i-1]), 'A song immediately repeated across round boundaries');
check(Array.from({length:6},(_,i)=>new Set(order.slice(i*3,i*3+3)).size).every(size=>size===3), 'A shuffle round skipped or repeated a song');
check(a.audios.every(audio=>audio.srcWrites.length===1&&audio.currentTime===0), 'Repeating a song rewrote its source or failed to rewind');
const beforeStop=a.state().track;
a.api.stopGameplay();
check(!a.state().active && !a.state().playing && a.audios.every(audio=>audio.paused), 'Returning to the top did not stop all output');
a.audios[0].end(); await settle();
check(a.state().track === beforeStop && a.audios.every(audio=>audio.paused), 'A late ended event restarted music on the top');
await a.api.startGameplay();
check(a.requests.length===3&&a.state().playing, 'Starting another game discarded the session cache');
check(installBGM(a.host) === a.api, 'Installing twice created a second player');

const restored = fixture(JSON.stringify({enabled:false,volume:0.013}));
await restored.api.startGameplay();
check(restored.audios.length===0&&restored.requests.length===0&&restored.state().volume===0.013&&!restored.state().enabled, 'Saved disabled music downloaded a track');
const invalid = fixture('{broken');
check(invalid.state().volume === 0.025, 'Broken localStorage was not tolerated');
Object.defineProperty(invalid.host,'localStorage',{get(){throw new Error('Private storage unavailable');}});
invalid.api.setVolume(0.01);
check(invalid.state().volume === 0.01, 'Unavailable localStorage broke live volume controls');

const denied = fixture();
await denied.api.unlock();
denied.contexts[0].failure = new Error('Autoplay denied');
denied.contexts[0].state = 'suspended';
await denied.api.startGameplay();
check(denied.state().blocked&&!denied.state().playing&&denied.audios[0].paused, 'Autoplay refusal was not handled safely');
denied.contexts[0].failure = null;
await denied.api.toggle();
check(denied.state().playing&&!denied.state().blocked&&denied.audios.length===1&&denied.requests.length===1, 'User retry after autoplay denial recreated or redownloaded media');

for(const missing of ['AudioContext','fetch','URL']){
  const unsupported=fixture();delete unsupported.host[missing];await unsupported.api.startGameplay();
  check(unsupported.state().unavailable&&unsupported.requests.length===0, `Missing ${missing} did not fail without requests`);
}
// Independently control track and host choices: first random value chooses the
// song, second chooses its mirror. Test both 50/50 mirror halves.
let calls=0;
const remote=fixture(null,()=>calls++===0?0:0.5);
await remote.api.startGameplay();
check(remote.requests.length===1&&remote.requests[0].url===remoteURL, 'The upper random half did not select exactly one remote source');
for(const random of [0,0.49,0.99]){
  const f=fixture(null,random);await f.api.startGameplay();
  check(f.state().track===BGM_TRACKS[Math.floor(random*3)].id, 'First song is not randomly selected from the whole playlist');
}
const reverse=fixture(null,0.99);await reverse.api.startGameplay();
const reverseOrder=[reverse.state().track];
for(let i=0;i<5;i++){reverse.current().end();await settle();reverseOrder.push(reverse.state().track);}
check(reverseOrder.join()!==order.slice(0,6).join()&&reverseOrder.every((id,i)=>!i||id!==reverseOrder[i-1]), 'Randomness did not change the playlist or repeated a boundary song');

for(const failure of [new Error('Network/CORS'),{ok:false,status:404},{ok:true,blob:async()=>{throw Error('Body interrupted');}},{ok:true,blob:async()=>new Blob()}]){
  const f=fixture();f.responses.set(localURL,failure);await f.api.startGameplay();
  check(f.state().playing&&f.requests.length===2&&f.requests[1].url===remoteURL&&f.blobs.size===1, 'Failed download did not use the other mirror once');
  await f.api.toggle();await f.api.toggle();
  check(f.requests.length===2&&f.state().playing, 'Playback retried a mirror after its successful fallback was cached');
}
let remoteCalls=0;
const reverseFailure=fixture(null,()=>remoteCalls++===0?0:0.99);
reverseFailure.responses.set(remoteURL,new Error('Remote missing'));await reverseFailure.api.startGameplay();
check(reverseFailure.requests.map(r=>r.url).join()===`${remoteURL},${localURL}`&&reverseFailure.state().playing, 'Remote failure did not fall back locally');
const both=fixture();both.responses.set(localURL,new Error('Local failure'));both.responses.set(remoteURL,new Error('Remote failure'));
await both.api.startGameplay();
check(both.state().errored&&!both.state().blocked,"Failed downloads were misclassified as autoplay blocking");
await both.api.toggle();
check(!both.state().enabled&&!both.state().errored,"Failed downloads prevented switching BGM off");
await both.api.toggle();both.api.stopGameplay();await both.api.startGameplay();
check(both.requests.length===2&&both.state().errored&&!both.state().playing, 'Two failed hosts caused repeat downloads or a retry loop');

for(const name of ['NotAllowedError','AbortError']){
  const f=fixture();f.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return Promise.reject(Object.assign(Error(name),{name}));};
  await f.api.startGameplay();
  check(f.state().blocked&&!f.state().playing&&f.requests.length===1, `${name} wrongly redownloaded a cached song`);
  f.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return Promise.resolve();};
  const retry=f.api.toggle();
  check(f.audios[0].playCalls===2,'Cached autoplay retry did not call play synchronously in the gesture');
  await retry;
  check(f.state().playing&&f.requests.length===1&&f.blobs.size===1, 'User retry discarded the blob cache');
}
for(const code of [2,3,4]){
  const f=fixture();await f.api.startGameplay();f.audios[0].fail(code);await settle();
  check(f.state().errored&&!f.state().playing&&f.requests.length===1, `MediaError ${code} redownloaded cached bytes`);
}

// Stop while fetching and while reading the body. Cache successful completion
// without playback; a restart must join the same promise, not abort/retry it.
for(const phase of ['fetch','body'])for(const action of ['top','off']){
  const f=fixture(), transfer=defer();
  const response={ok:true,blob:()=>phase==='body'?transfer.promise:Promise.resolve(new Blob(['cached']))};
  f.responses.set(localURL,phase==='fetch'?transfer.promise:response);
  const playback=f.api.startGameplay();await settle();
  if(action==='top')f.api.stopGameplay();else await f.api.toggle();
  transfer.resolve(phase==='fetch'?response:new Blob(['cached']));await playback;await settle();
  check(!f.state().playing&&f.audios[0].paused&&f.audios[0].playCalls===0&&f.blobs.size===1, `Late ${phase} completion played after ${action}`);
  if(action==='top')await f.api.startGameplay();else await f.api.toggle();
  check(f.state().playing&&f.requests.length===1, `Restart after ${action} redownloaded a completed ${phase}`);
}
const inFlight=fixture(), body=defer();
inFlight.responses.set(localURL,{ok:true,blob:()=>body.promise});
const old=inFlight.api.startGameplay();await settle();inFlight.api.stopGameplay();
const restarted=inFlight.api.startGameplay();await settle();
check(inFlight.requests.length===1&&inFlight.audios[0].playCalls===0, 'Restart during download created a duplicate transfer');
body.resolve(new Blob(['only transfer']));await Promise.all([old,restarted]);
check(inFlight.state().playing&&inFlight.audios[0].playCalls===1, 'Old and restarted download continuations both played');

for(const action of ['top','off']){
  const f=fixture(), playback=defer();
  f.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return playback.promise;};
  const playing=f.api.startGameplay();await settle();
  if(action==='top')f.api.stopGameplay();else await f.api.toggle();
  playback.resolve();await playing;f.audios[0].fail(2);await settle();
  check(!f.state().playing&&f.audios[0].paused&&f.requests.length===1, `Late play or error revived audio after ${action}`);
}
const duplicate=fixture(), rejection=defer();
duplicate.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return rejection.promise;};
const original=duplicate.api.startGameplay();await settle();duplicate.audios[0].fail(3);rejection.reject(Error('Same media failure'));
await original;await settle();
check(duplicate.state().errored&&!duplicate.state().playing&&duplicate.requests.length===1, 'Duplicate error event and promise rejection redownloaded audio');
const lateSuccess=fixture(), successfulPlay=defer();
lateSuccess.host.Audio.prototype.play=function(){this.playCalls++;this.paused=false;return successfulPlay.promise;};
const oldPlay=lateSuccess.api.startGameplay();await settle();lateSuccess.audios[0].fail(3);successfulPlay.resolve();
await oldPlay;
check(lateSuccess.state().errored&&!lateSuccess.state().playing&&lateSuccess.audios[0].paused, 'A late successful play promise cleared a newer media error');
await lateSuccess.api.toggle();
check(!lateSuccess.state().enabled, 'A media error prevented disabling music');
const lateResume=fixture(), resume=defer();
lateResume.host.AudioContext.prototype.resume=function(){return resume.promise;};
lateResume.responses.set(localURL,Error('Local failed'));lateResume.responses.set(remoteURL,Error('Mirror failed'));
await lateResume.api.startGameplay();
resume.reject(Error('Late autoplay refusal'));await settle();
check(lateResume.state().errored&&!lateResume.state().blocked, 'Late AudioContext rejection changed a permanent error into autoplay blocking');
await lateResume.api.toggle();
check(!lateResume.state().enabled&&lateResume.requests.length===2, 'Late resume rejection prevented disabling music or retried downloads');
console.log(JSON.stringify({suite:'web-bgm',checks,status:'passed',verification:'Node API fixtures; no browser, network, or audible playback'}));
