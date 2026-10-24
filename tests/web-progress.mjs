// Browser-free persistence fixtures. IndexedDB and network access are forbidden.
import assert from 'node:assert/strict';
import {installProgressStore, PROGRESS_STORAGE_KEY} from '../web/progress-store.mjs';
let checks = 0;
function check(value, message) { checks++; assert(value, message); }
function fixture({href = 'https://html5.plicy.net/uploads/239777/index.html', data = new Map(), privacy = false, quota = false} = {}) {
  const calls = [];
  const storage = {
    getItem(key) { calls.push(['get', key]); return data.get(key) ?? null; },
    setItem(key, value) {
      calls.push(['set', key, value]);
      if (quota) throw Error('QuotaExceededError');
      data.set(key, value);
    }
  };
  const host = {location:{href},
    get localStorage() { if (privacy) throw Error('SecurityError'); return storage; },
    get indexedDB() { throw Error('Never probe or fall back to IndexedDB'); },
    get fetch() { throw Error('Never access the network'); }
  };
  return {host,data,calls,install:()=>installProgressStore(host)};
}
const fresh = fixture();
const api = fresh.install();
check(api === fresh.host.NandemoProgress && api.isLocalStorage(), 'PLiCy bridge was not installed/enabled');
check(api.loadJSON() === '{}', 'A fresh game did not start with empty scores');
check(api.saveJSON('{"1":120,"45":2500,"1234":0}') === true, 'Synchronous save failed');
check(fresh.data.get(PROGRESS_STORAGE_KEY) === '{"1":120,"45":2500,"1234":0}', 'Scores were not written before saveJSON returned');
check(fresh.calls.every(call => call[1] === 'nandemo-cannon.progress.v1'), 'Progress key changed or depends on an asset URL');
const reloaded = fixture({href:'https://html5.plicy.net/next-version/239777/game/index.html',data:fresh.data}).install();
check(reloaded.loadJSON() === api.loadJSON(), 'Reload or changed upload URL lost saved progress');
check(JSON.parse(reloaded.loadJSON())['1234'] === 0, 'A future stage ID or zero score was discarded');
const reads = fresh.calls.length;
check(fresh.install() === api && fresh.calls.length === reads, 'Reinstall recreated the store or reread storage');
fresh.data.set(PROGRESS_STORAGE_KEY, '{"1":999}');
check(JSON.parse(api.loadJSON())['1'] === 120, 'loadJSON stopped returning the latest session cache');
const invalidEntries = '{"1":42,"2":-1,"3":"8","4":true,"5":null,"6":{},"7":[],"8":1e999,"9":0,"10":1.5,"0":9,"-1":9,"1.2":9,"01":9,"word":9,"9007199254740992":9,"__proto__":{}}';
api.saveJSON(invalidEntries);
check(api.loadJSON() === '{"1":42,"9":0,"10":1.5}', 'Malformed stage IDs or scores were not filtered');
check(fresh.data.get(PROGRESS_STORAGE_KEY) === api.loadJSON(), 'Persisted scores differ from validated session memory');
const filteredRead = fixture({data:new Map([[PROGRESS_STORAGE_KEY,invalidEntries]])}).install();
check(filteredRead.loadJSON() === api.loadJSON(), 'Stored data bypassed score validation');
for (const bad of ['{broken', '[]', 'null', 'true', '42', '"text"']) {
  const f = fixture({data:new Map([[PROGRESS_STORAGE_KEY,bad]])});
  check(f.install().loadJSON() === '{}', `Corrupt/non-dictionary storage was accepted: ${bad}`);
}
for (const privacy of [false, true]) {
  const f = fixture({privacy,quota:!privacy});
  const failed = f.install();
  check(failed.isLocalStorage(), 'Blocked storage incorrectly enabled another persistence backend');
  check(failed.saveJSON('{"1":10}') === false && failed.loadJSON() === '{"1":10}', 'Failed storage write lost the in-memory score');
  check(failed.saveJSON('{"1":20,"200":30}') === false && failed.loadJSON() === '{"1":20,"200":30}', 'Latest failed save did not replace session memory');
  check(f.data.size === 0, 'A failed write unexpectedly persisted data');
}
for (const href of [
  'https://rabbitdaisuke.github.io/nandemo-cannon/',
  'https://html.itch.zone/html/123/game/index.html',
  'https://html5.plicy.net.example.test/239777/index.html',
  'https://html5.plicy.net@other.test/239777/index.html',
  'https://other.test/html5.plicy.net/239777/index.html',
  'http://html5.plicy.net/uploads/239777/index.html',
  'not a URL'
]) {
  const f = fixture({href});
  const other = f.install();
  check(!other.isLocalStorage() && other.saveJSON('{"1":10}') === false && other.loadJSON() === '{}', `Unrelated host enabled PLiCy persistence: ${href}`);
  check(f.calls.length === 0, `Unrelated host touched localStorage: ${href}`);
}
console.log(JSON.stringify({suite:'web-progress',checks,status:'passed',verification:'Storage API fixtures; no browser, IndexedDB, or network'}));
