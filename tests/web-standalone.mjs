// Validate the actual upload ZIP without launching a browser. The HTTP smoke
// runs the exported shell with a stubbed renderer; it is not GPU/browser QA.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {BGM_TRACKS} from '../web/bgmer-player.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = path.join(root, 'out/packages/nandemo-cannon-standalone-4.7.2.zip');
const unpacked = await fs.mkdtemp(path.join(os.tmpdir(), 'nandemo-standalone-'));
const prefix = '/embedded/game/12345/';
const requests = [];
let server;
try {
  execFileSync('unzip', ['-q', archive, '-d', unpacked]);
  const names = execFileSync('unzip', ['-Z1', archive], {encoding:'utf8'}).trim().split('\n').filter(name => !name.endsWith('/'));
  assert(names.includes('index.html'), 'index.html must be at ZIP root');
  assert(names.length <= 1000 && new Set(names).size === names.length, 'Upload file count / duplicate names');
  let total = 0;
  for (const name of names) {
    assert(name.length <= 240 && !name.startsWith('/') && !name.split('/').includes('..'), `Invalid upload path: ${name}`);
    const bytes = await fs.readFile(path.join(unpacked, name));
    assert(bytes.length <= 200 * 1024 * 1024, `Oversized file: ${name}`);
    assert(bytes.equals(await fs.readFile(path.join(root, 'out/portal', name))), `ZIP bytes changed: ${name}`);
    total += bytes.length;
  }
  assert(total <= 500 * 1024 * 1024, 'Oversized upload');
  assert(!names.some(name => /\.(gz|mjs|zip)$/.test(name)), 'Unexpected compression or module MIME dependency');
  assert(!names.some(name => name.includes('third-party/openclipart')), 'Source-only SVG provenance leaked into the upload files');
  for (const name of ['share', 'bgmer-player']) {
    assert((await fs.readFile(path.join(unpacked, `${name}.js`))).equals(await fs.readFile(path.join(root, `web/${name}.mjs`))), `Stale bundled module: ${name}`);
  }
  const hintSource = await fs.readFile(path.join(root, 'web/input-hint.mjs'), 'utf8');
  assert(hintSource.includes('export const STANDALONE_INPUT_HINT = false;'), 'Pages input hint must default to disabled');
  assert.equal(await fs.readFile(path.join(unpacked, 'input-hint.js'), 'utf8'), hintSource.replace('export const STANDALONE_INPUT_HINT = false;', `export const STANDALONE_INPUT_HINT = ${(process.env.STANDALONE_INPUT_HINT ?? '1') === '1'};`));
  for (const name of ['index.pck','LICENSE','licenses/otologic.txt','licenses/bgmer.txt','licenses/godot/LICENSE.txt','licenses/godot/COPYRIGHT.txt']) assert(names.includes(name), `Missing ${name}`);
  const runtime = JSON.parse(await fs.readFile(path.join(unpacked, 'runtime.json'), 'utf8'));
  assert(!runtime.archives && !runtime.archiveURL && !runtime.gzipSHA256, 'Standalone still uses archive/mirror loading');
  assert.equal(runtime.executable, './runtime/godot/4.7.2/godot');
  const mergedSettings = JSON.parse(await fs.readFile(path.join(root, 'out/standalone/runtime.json'), 'utf8'));
  assert(mergedSettings.gzipSHA256, 'Packaging mutated the Pages input');
  const originalHTML = await fs.readFile(path.join(root, 'out/standalone/index.html'), 'utf8');
  assert(originalHTML.includes('installBGM(window);') && originalHTML.includes('installCompressedWasm(runtime, document.baseURI)'), 'Pages mirror routing changed');

  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      assert(url.pathname.startsWith(prefix));
      const name = decodeURIComponent(url.pathname.slice(prefix.length));
      assert(names.includes(name), `Unbundled request: ${name}`);
      const mime = {'.html':'text/html','.js':'application/javascript','.json':'application/json','.wasm':'application/wasm','.mp3':'audio/mpeg'}[path.extname(name)] || 'application/octet-stream';
      res.writeHead(200, {'Content-Type':mime});
      res.end(await fs.readFile(path.join(unpacked, name)));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  const localFetch = async input => {
    const url = new URL(input, base);
    assert(url.href.startsWith(base), `External startup request: ${url}`);
    requests.push(url.pathname);
    const response = await fetch(url);
    assert(response.ok, `Missing bundled file: ${url}`);
    return response;
  };
  const html = await (await localFetch('index.html')).text();
  assert(!html.includes('$GODOT_') && !html.includes('installCompressedWasm'), 'Export placeholders / compressed loader remain');
  // Images, preload, favicon and local credit links must resolve under any path.
  for (const [, name] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) if (!/^https?:/.test(name)) await localFetch(name);
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert(script, 'Missing boot script');
  for (const [, name] of script.matchAll(/from '([^']+)'/g)) await localFetch(name);
  const nodes = new Map(['#start','#progress','#message','#cover','#canvas'].map(id => [id, {
    hidden:id === '#progress', disabled:false, textContent:'',
    addEventListener(name, fn) { this[name] = fn; },
    removeAttribute() {}, setAttribute() {}, focus() {}
  }]));
  let started = false, musicStarted = false;
  const context = vm.createContext({console, URL, Response, WebAssembly, fetch:localFetch,
    installInputHint(){},
    installBGM(_host, options) {
      assert.equal(options.mirrorBase, null, 'Portal did not select local-only music');
      return {unlock(){},startGameplay(){musicStarted=true;},stopGameplay(){}};
    },
    installResultSharing(_host, options) {
      assert.equal(options.gameURL, 'https://rabbitdaisuke.github.io/nandemo-cannon/');
    },
    document:{baseURI:base,querySelector:id=>nodes.get(id),createElement:()=>({}),head:{appendChild(scriptNode){
      void (async () => {
        try {
          const officialJS = await (await localFetch(scriptNode.src)).text();
          const engineContext = vm.createContext({console, URL, Response, WebAssembly});
          vm.runInContext(officialJS + '\nglobalThis.OfficialEngine = Engine;', engineContext);
          context.Engine = class {
            constructor(config) { this.config = new engineContext.OfficialEngine(config).config; }
            static getMissingFeatures({threads}) { assert.equal(threads, false); return []; }
            async startGame() {
              assert.equal(this.config.mainPack, 'index.pck');
              assert.equal(this.config.canvasResizePolicy, 2);
              const locations = this.config.getModuleConfig(this.config.executable, null);
              const wasmResponse = await localFetch(locations.locateFile('godot.wasm'));
              await WebAssembly.compileStreaming(wasmResponse);
              for (const name of ['godot.audio.worklet.js','godot.audio.position.worklet.js']) await localFetch(locations.locateFile(name));
              const pck = new Uint8Array(await (await localFetch(this.config.mainPack)).arrayBuffer());
              assert.equal(Buffer.from(pck.subarray(0,4)).toString(), 'GDPC');
              assert(!Buffer.from(pck).includes(Buffer.from('docs/third-party/openclipart')), 'Source-only SVG originals entered the game pack');
              started = true;
            }
          };
          scriptNode.onload();
        } catch (error) { scriptNode.onerror(error); }
      })();
    }}}
  });
  context.window = context;
  vm.runInContext(script.replace(/^import .*;\n/gm, ''), context);
  await nodes.get('#start').click();
  assert(started && musicStarted && nodes.get('#cover').hidden, `Shell boot failed: ${nodes.get('#message').textContent}`);
  for (const track of BGM_TRACKS) {
    const bytes = Buffer.from(await (await localFetch(track.url)).arrayBuffer());
    assert(bytes.equals(await fs.readFile(path.join(root, 'web', track.url))), `Bundled song changed: ${track.id}`);
  }
  console.log(JSON.stringify({suite:'standalone',status:'passed',files:names.length,extractedBytes:total,zipBytes:(await fs.stat(archive)).size,httpRequests:requests.length,checks:['ZIP round-trip','upload limits','deep relative paths','exported shell startup with renderer stub','official WASM compilation','official JS worklet routing','PCK and three local songs','original licenses','unchanged Pages input'],browserTests:'not run'}));
} finally {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await fs.rm(unpacked, {recursive:true, force:true});
}
