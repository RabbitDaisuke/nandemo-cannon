// CI-only transport checks. Invoke through ./build.sh; all fetches are mocked.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {installCompressedWasm} from '../web/wasm-loader.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const wasm = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]);
const gzip = gzipSync(wasm);
const entry = 'runtime/godot/4.7.2/godot.wasm.gz';
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, body] of entries) {
    const filename = Buffer.from(name), header = Buffer.alloc(30), directory = Buffer.alloc(46);
    let crc = 0xffffffff;
    for (const byte of body) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    crc = (crc ^ 0xffffffff) >>> 0;
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(10, 4); header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(body.length, 18); header.writeUInt32LE(body.length, 22); header.writeUInt16LE(filename.length, 26);
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(10, 6); directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(body.length, 20); directory.writeUInt32LE(body.length, 24); directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    local.push(header, filename, body); central.push(directory, filename); offset += header.length + filename.length + body.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
const current = zip([[entry, gzip], ['game.txt', Buffer.from('current game')]]);
const older = zip([[entry, gzip], ['game.txt', Buffer.from('older game')]]);
const wrongEngine = zip([[entry, gzipSync(Buffer.from('different engine'))]]);
const base = 'https://game.example/', engineURL = base + 'runtime/godot/4.7.2/godot.wasm';
const settings = {executable: './runtime/godot/4.7.2/godot', wasmBytes: wasm.length, wasmSHA256: hash(wasm), gzipSHA256: hash(gzip)};
const sources = [{url: '/local.zip', bytes: current.length, sha256: hash(current)}, {url: 'https://mirror.example/game.zip'}];
let checks = 0;
async function check(name, run) { await run(); console.log(`PASS: ${name}`); checks++; }
function install(config, random, serve) {
  const calls = [];
  let randomCalls = 0;
  const original = async input => { calls.push(String(input)); return serve(String(input)); };
  const scope = {fetch: original, crypto: globalThis.crypto, DecompressionStream, random: () => { randomCalls++; return random; }};
  const restore = installCompressedWasm({...settings, ...config}, base, scope);
  return {scope, calls, original, restore, randomCalls: () => randomCalls};
}
async function readWasm(scope) {
  const response = await scope.fetch(engineURL);
  assert.equal(response.headers.get('Content-Type'), 'application/wasm');
  await WebAssembly.compileStreaming(response.clone());
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), wasm);
}
for (const [random, expected] of [[0.25, base + 'local.zip'], [0.75, sources[1].url]]) {
  await check(`mirror selection ${random} and one shared download`, async () => {
    const test = install({archives: sources}, random, url => new Response(url === base + 'local.zip' ? current : older));
    await Promise.all([readWasm(test.scope), readWasm(test.scope)]);
    assert.deepEqual(test.calls, [expected]); assert.equal(test.randomCalls(), 1);
    await test.scope.fetch(base + 'runtime/godot/4.7.2/godot.js');
    assert.equal(test.calls.at(-1), base + 'runtime/godot/4.7.2/godot.js');
    test.restore(); assert.equal(test.scope.fetch, test.original);
  });
}
for (const failure of ['HTTP', 'network', 'body', 'size', 'archive hash', 'entry hash', 'invalid ZIP']) {
  await check(`${failure} failure tries the other mirror once`, async () => {
    const first = {url: '/local.zip'};
    if (failure === 'size') first.bytes = current.length + 1;
    if (failure === 'archive hash') first.sha256 = '0'.repeat(64);
    const test = install({archives: [first, sources[1]]}, 0.25, url => {
      if (url !== base + 'local.zip') return new Response(older);
      if (failure === 'HTTP') return new Response('', {status: 503});
      if (failure === 'network') throw new Error('network unavailable');
      if (failure === 'body') return {ok: true, arrayBuffer: async () => { throw new Error('incomplete body'); }};
      return new Response(failure === 'entry hash' ? wrongEngine : failure === 'invalid ZIP' ? Buffer.alloc(32) : current);
    });
    await Promise.all([readWasm(test.scope), readWasm(test.scope)]);
    assert.deepEqual(test.calls, [base + 'local.zip', sources[1].url]); test.restore();
  });
}
await check('both mirrors reject a different engine without further retries', async () => {
  const test = install({archives: sources.map(({url}) => ({url}))}, 0.75, () => new Response(wrongEngine));
  await assert.rejects(test.scope.fetch(engineURL), /Engine integrity/);
  await assert.rejects(test.scope.fetch(engineURL), /Engine integrity/);
  assert.deepEqual(test.calls, [sources[1].url, base + 'local.zip']); test.restore();
});
await check('legacy archiveURL keeps size and hash checks', async () => {
  const test = install({archiveURL: '/local.zip', archiveBytes: current.length, archiveSHA256: hash(current)}, 0, () => new Response(current));
  await readWasm(test.scope); assert.deepEqual(test.calls, [base + 'local.zip']); test.restore();
});
await check('raw WASM archive entry still requires its engine hash', async () => {
  const raw = zip([['engine.wasm', wasm]]);
  const test = install({archives: [{url: '/raw.zip'}], wasmEntry: 'engine.wasm'}, 0, () => new Response(raw));
  await readWasm(test.scope); test.restore();
});
for (const [name, body] of [['direct gzip', gzip], ['HTTP-decoded WASM', wasm]]) {
  await check(name, async () => {
    const test = install({}, 0, () => new Response(body));
    await readWasm(test.scope); assert.deepEqual(test.calls, [engineURL + '.gz']); test.restore();
  });
}
console.log(`${checks} web mirror checks passed`);
