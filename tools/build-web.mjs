// Internal implementation. Use the repository root ./build.sh.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {gzipSync, gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {verifyRuntime} from './verify-runtime.mjs';
import {publishRuntime} from './publish-statically.mjs';
import {installCompressedWasm} from '../web/wasm-loader.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'bundle';
const stage = path.join(root, 'out/export');
const standalone = path.join(root, 'out/standalone');
const runtimeDirectory = path.join(root, 'out/runtime/godot/4.7.2');
const dist = path.join(root, 'dist');
const godot = process.env.GODOT_BIN || 'godot';
const hash = data => createHash('sha256').update(data).digest('hex');
async function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(godot, args, {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {output += chunk; process.stdout.write(chunk);});
    child.on('error', reject);
    child.on('close', code => code === 0 && !/SCRIPT ERROR:|Parse Error:|^ERROR:/m.test(output) ? resolve(output) : reject(new Error(`Godot failed (${code}).`)));
  });
}
const version = (await run(['--version'])).trim();
if (!version.startsWith('4.7.2.stable.')) throw new Error(`Expected Godot 4.7.2; got ${version}`);
if (!['bundle', 'pages'].includes(mode)) throw new Error('Unknown export mode');
for (const directory of [stage, standalone, runtimeDirectory, dist]) {
  await fs.rm(directory, {recursive: true, force: true});
  await fs.mkdir(directory, {recursive: true});
}
await fs.writeFile(path.join(dist, '.gdignore'), '');
await run(['--headless', '--script', 'res://tools/engine-licenses.gd']);
await run(['--headless', '--export-release', 'Web', 'out/export/index.html']);
// Load the exported PCK with the same engine, catching omitted dynamic resources.
await run(['--headless', '--main-pack', 'out/export/index.pck', '--quit-after', '12']);
const raw = await fs.readFile(path.join(stage, 'index.wasm'));
if (hash(raw) !== 'fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0') throw new Error('Unexpected official single-thread runtime bytes');
await WebAssembly.compileStreaming(new Response(raw, {headers: {'Content-Type': 'application/wasm'}}));

const runtimeFiles = [];
for (const extension of ['js', 'wasm', 'audio.worklet.js', 'audio.position.worklet.js']) {
  const bytes = await fs.readFile(path.join(stage, `index.${extension}`));
  const name = `godot.${extension}` + (extension === 'wasm' ? '.gz' : '');
  const fileBytes = extension === 'wasm' ? gzipSync(bytes, {level: 9}) : bytes;
  await fs.writeFile(path.join(runtimeDirectory, name), fileBytes);
  runtimeFiles.push({name, bytes: fileBytes.length, sha256: hash(fileBytes), decodedBytes: bytes.length, decodedSHA256: hash(bytes)});
}
await fs.copyFile(path.join(root, 'web/third-party-licenses.txt'), path.join(runtimeDirectory, 'third-party-licenses.txt'));
const runtimeManifest = {version, source: 'official unmodified web_nothreads_release.zip', files: runtimeFiles};
await fs.writeFile(path.join(runtimeDirectory, 'runtime-manifest.json'), JSON.stringify(runtimeManifest, null, 2) + '\n');
const compressedEntry = runtimeFiles.find(entry => entry.name.endsWith('.wasm.gz'));
const runtimeSettings = {executable: './runtime/godot/4.7.2/godot', wasmBytes: raw.length, wasmSHA256: hash(raw), gzipSHA256: compressedEntry.sha256};
const gzip = await fs.readFile(path.join(runtimeDirectory, compressedEntry.name));
if (!gunzipSync(gzip).equals(raw)) throw new Error('Gzip round trip failed');
for (const transport of ['gzip-file', 'http-decoded', 'corrupt']) {
  const nativeFetch = async input => String(input).endsWith('.wasm.gz') ? new Response(transport === 'corrupt' ? Buffer.from('not the runtime') : transport === 'http-decoded' ? raw : gzip) : new Response('PASSTHROUGH');
  const scope = {fetch: nativeFetch, DecompressionStream, crypto: globalThis.crypto};
  const restore = installCompressedWasm(runtimeSettings, 'https://build.invalid/', scope);
  try {
    const response = await scope.fetch('https://build.invalid/runtime/godot/4.7.2/godot.wasm');
    if (transport === 'corrupt') throw new Error('Corrupt WASM was accepted');
    const copy = response.clone();
    await WebAssembly.compileStreaming(response);
    if (hash(Buffer.from(await copy.arrayBuffer())) !== hash(raw)) throw new Error('WASM transport changed bytes');
    if (await (await scope.fetch('https://build.invalid/other')).text() !== 'PASSTHROUGH') throw new Error('Unrelated fetch changed');
  } catch (error) {
    if (transport !== 'corrupt' || error.message !== 'Engine integrity check failed') throw error;
  } finally { restore(); }
  if (scope.fetch !== nativeFetch) throw new Error('Fetch not restored');
  console.log(`Compressed transport passed: ${transport}`);
}
// Exercise the actual official JS configuration without a browser: the CDN
// executable must determine WASM/worklet URLs while the PCK remains local.
const runtimeJS = await fs.readFile(path.join(runtimeDirectory, 'godot.js'), 'utf8');
const context = vm.createContext({console, URL, Response, WebAssembly});
vm.runInContext(runtimeJS + '\nglobalThis.BuildEngine = Engine;', context);
const probe = new context.BuildEngine({executable: 'https://engine.invalid/4.7.2/godot', mainPack: 'index.pck'});
const moduleConfig = probe.config.getModuleConfig(probe.config.executable, null);
for (const extension of ['wasm', 'audio.worklet.js', 'audio.position.worklet.js']) {
  if (moduleConfig.locateFile(`godot.test.${extension}`) !== `https://engine.invalid/4.7.2/godot.${extension}`) throw new Error('Official CDN URL routing failed');
}
if (probe.config.mainPack !== 'index.pck') throw new Error('PCK was moved to the engine CDN');

for (const name of await fs.readdir(stage)) {
  if (/^index\.(js|wasm|audio\..*\.js)$/.test(name)) continue;
  await fs.copyFile(path.join(stage, name), path.join(standalone, name));
}
async function svgText(text, color) {
  let x = 0, content = '';
  for (const char of text) {
    const glyph = await fs.readFile(path.join(root, 'assets/font', `U${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}.svg`), 'utf8');
    const box = glyph.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    content += `<g transform="translate(${x} 0)">${glyph.replace(/<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').replaceAll('#ffffff', color)}</g>`;
    x += box[2] + 3;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x - 3} 18" shape-rendering="crispEdges">${content}</svg>`;
}
await fs.writeFile(path.join(standalone, 'title.svg'), await svgText('なんでもキャノン', '#ffffff'));
await fs.writeFile(path.join(standalone, 'start.svg'), await svgText('START', '#152536'));
await fs.copyFile(path.join(root, 'previews/game-01-initial.png'), path.join(standalone, 'opening.png'));
await fs.copyFile(path.join(root, 'web/third-party-licenses.txt'), path.join(standalone, 'third-party-licenses.txt'));
await fs.copyFile(path.join(root, 'web/wasm-loader.mjs'), path.join(standalone, 'wasm-loader.mjs'));
await fs.writeFile(path.join(standalone, 'runtime.json'), JSON.stringify(runtimeSettings));
await fs.cp(path.join(root, 'out/runtime'), path.join(standalone, 'runtime'), {recursive: true});
const html = await fs.readFile(path.join(standalone, 'index.html'), 'utf8');
if (/\$GODOT_/.test(html)) throw new Error('Unexpanded Godot shell placeholder');
if (!html.includes("config.mainPack = 'index.pck'")) throw new Error('Missing separate local PCK path');

let remoteVerification = null;
if (mode === 'pages') {
  const publication = await publishRuntime(root);
  remoteVerification = await verifyRuntime(publication.baseURL, runtimeManifest);
  remoteVerification.commit = publication.commit;
  for (const name of await fs.readdir(standalone)) {
    if (name === 'runtime') continue;
    await fs.copyFile(path.join(standalone, name), path.join(dist, name));
  }
  await fs.writeFile(path.join(dist, 'runtime.json'), JSON.stringify({...runtimeSettings, executable: remoteVerification.baseURL + 'godot'}));
  await fs.writeFile(path.join(dist, '.nojekyll'), '');
  const pagesNames = await fs.readdir(dist);
  if (pagesNames.some(name => /\.wasm|\.part-|\.gz$/.test(name))) throw new Error('Engine leaked into Pages output');
}
const gameFiles = (await fs.readdir(standalone)).filter(name => name !== 'runtime');
const gameBytes = (await Promise.all(gameFiles.map(async name => (await fs.stat(path.join(standalone, name))).size))).reduce((a, b) => a + b, 0);
const report = {engine: version, renderer: 'Compatibility / WebGL 2', threads: false, sourcePatched: false, wasmBytes: raw.length, wasmSHA256: hash(raw), gzipBytes: gzip.length, compressedTransportChecks: 3, cdnProvider: 'Statically', gameBytes, wasmCompilation: 'passed', officialJSCDNRouting: 'passed', exportedPCKSmoke: 'passed', remoteVerification, browserTests: 'not run', pagesProduced: mode === 'pages', output: {standalone: 'out/standalone', runtime: 'out/runtime/godot/4.7.2', pages: mode === 'pages' ? 'dist' : null}};
await fs.writeFile(path.join(root, 'previews/web-build.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
