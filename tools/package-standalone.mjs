// Entry: ./build.sh standalone, after bundle or the two Actions artifacts merge.
// Work on a separate copy: the ad-free Pages build retains its mirror routing.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {BGM_TRACKS} from '../web/bgmer-player.mjs';
import {writeRuntimeLicenses} from './runtime-licenses.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'out/standalone');
const target = path.join(root, 'out/portal');
const runtimePath = 'runtime/godot/4.7.2';
const archive = path.join(root, 'out/packages/nandemo-cannon-standalone-4.7.2.zip');
const partial = archive.replace(/\.zip$/, '.partial.zip');
const inputHint = process.env.STANDALONE_INPUT_HINT ?? '1';
if (!['0', '1'].includes(inputHint)) throw Error('STANDALONE_INPUT_HINT must be 0 or 1');
const hash = data => createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(await fs.readFile(path.join(source, runtimePath, 'runtime-manifest.json'), 'utf8'));
const settings = JSON.parse(await fs.readFile(path.join(source, 'runtime.json'), 'utf8'));
const runtimeFiles = new Map();
for (const entry of manifest.files) {
  const bytes = await fs.readFile(path.join(source, runtimePath, entry.name));
  if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) throw Error(`Incomplete merged runtime: ${entry.name}`);
  runtimeFiles.set(entry.name, bytes);
}
const wasm = gunzipSync(runtimeFiles.get('godot.wasm.gz'));
if (wasm.length !== settings.wasmBytes || hash(wasm) !== settings.wasmSHA256 || hash(runtimeFiles.get('godot.wasm.gz')) !== settings.gzipSHA256) {
  throw Error('Game and runtime artifacts use different engine bytes');
}
await fs.rm(target, {recursive:true, force:true});
await fs.cp(source, target, {recursive:true, filter:name => !['.gdignore', 'runtime', 'wasm-loader.mjs'].includes(path.basename(name))});
await fs.mkdir(path.join(target, runtimePath), {recursive:true});
// Both hosts can serve ordinary WASM. Do not require a special gzip MIME type,
// Content-Encoding header, decompression API, or external archive download.
await fs.writeFile(path.join(target, runtimePath, 'godot.wasm'), wasm);
for (const name of ['godot.js', 'godot.audio.worklet.js', 'godot.audio.position.worklet.js']) {
  await fs.writeFile(path.join(target, runtimePath, name), runtimeFiles.get(name));
}
await fs.writeFile(path.join(target, 'runtime.json'), JSON.stringify({
  executable:`./${runtimePath}/godot`, wasmBytes:wasm.length, wasmSHA256:hash(wasm)
}) + '\n');
await writeRuntimeLicenses(root, target);
for (const name of ['LICENSE', 'licenses/otologic.txt', 'licenses/bgmer.txt']) {
  const original = await fs.readFile(path.join(root, name === 'LICENSE' ? name : `web/${name}`));
  if (!original.equals(await fs.readFile(path.join(target, name)))) throw Error(`License was changed or omitted: ${name}`);
}
for (const track of BGM_TRACKS) {
  const local = track.url.replace(/^\.\//, '');
  if (!(await fs.readFile(path.join(root, 'web', local))).equals(await fs.readFile(path.join(target, local)))) {
    throw Error(`Missing bundled music: ${track.id}`);
  }
}
let html = await fs.readFile(path.join(target, 'index.html'), 'utf8');
function replaceOnce(before, after) {
  if (html.split(before).length !== 2) throw Error(`Export shell changed; cannot safely create standalone: ${before}`);
  html = html.replace(before, after);
}
replaceOnce("import {installCompressedWasm} from './wasm-loader.mjs';\n", '');
replaceOnce('let restore = () => {};\n', '');
replaceOnce('    restore = installCompressedWasm(runtime, document.baseURI);\n', '');
replaceOnce('  } finally { restore(); }', '  }');
replaceOnce('const bgm = installBGM(window);', 'const bgm = installBGM(window, {mirrorBase: null});');
// Embedded CDN URLs are not public game pages. share.js resolves PLiCy's game
// ID locally; other upload hosts fall back to the established public game URL.
replaceOnce('installResultSharing();', "installResultSharing(window, {gameURL: 'https://rabbitdaisuke.github.io/nandemo-cannon/'});");
// Use universally served JavaScript extensions on upload hosts.
for (const name of ['share', 'bgmer-player', 'input-hint', 'progress-store']) {
  replaceOnce(`'./${name}.mjs'`, `'./${name}.js'`);
  await fs.rename(path.join(target, `${name}.mjs`), path.join(target, `${name}.js`));
}
const hintPath = path.join(target, 'input-hint.js');
const hintSource = await fs.readFile(hintPath, 'utf8');
const hintFlag = 'export const STANDALONE_INPUT_HINT = false;';
if (hintSource.split(hintFlag).length !== 2) throw Error('Input hint source flag changed');
await fs.writeFile(hintPath, hintSource.replace(hintFlag, `export const STANDALONE_INPUT_HINT = ${inputHint === '1'};`));
await fs.writeFile(path.join(target, 'index.html'), html);
await fs.mkdir(path.dirname(archive), {recursive:true});
await fs.rm(partial, {force:true});
execFileSync('zip', ['-9', '-X', '-q', '-r', partial, '.'], {cwd:target});
execFileSync('unzip', ['-tq', partial], {stdio:'inherit'});
await fs.rename(partial, archive);
console.log(`Standalone ZIP: ${path.relative(root, archive)} (${(await fs.stat(archive)).size} bytes)`);
