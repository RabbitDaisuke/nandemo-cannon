// Compile the individually authored SVG originals; never infer search tags.
// Entry point: ./build.sh selection-items. Ordinary builds use checked-in data.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {items as food} from './selection-food.mjs';
import {items as tools} from './selection-tools.mjs';
import {items as misc} from './misc-expansion-items.mjs';
import {items as firestation} from './firestation-items.mjs';
import {items as school} from './school-items.mjs';
import {items as dailyFood} from './daily-food-items.mjs';
import {items as dailyTools} from './daily-tools-items.mjs';
import {items as oct26Food} from './oct26-food-items.mjs';
import {items as oct26Tools} from './oct26-tool-items.mjs';
import {items as oct26Retakes} from './oct26-retake-items.mjs';
import {items as playground} from './playground-items.mjs';
import {items as breakroom} from './breakroom-items.mjs';
import {items as bathroom} from './bathroom-items.mjs';
import {items as evening} from './evening-items.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); }
catch { sharp = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '', 'sharp')); }
const read = async name => new TextDecoder('utf-8', {fatal: true}).decode(await fs.readFile(path.join(root, name)));
const json = async name => JSON.parse(await read(`data/${name}.json`));
const [manifest, catalog, physics, colliders, ui] = await Promise.all(['objects-manifest', 'catalog', 'physics', 'colliders', 'ui-ja'].map(json));
const groups = [['food', food], ['tools', tools], ['misc', misc], ['firestation', firestation], ['school', school], ['daily-food', dailyFood], ['daily-tools', dailyTools], ['oct26-food', oct26Food], ['oct26-tools', oct26Tools], ['oct26-retakes', oct26Retakes]];
groups.push(['playground', playground]);
groups.push(['breakroom', breakroom]);
groups.push(['bathroom', bathroom]);
groups.push(['evening', evening]);
const entries = groups.flatMap(([, items]) => items);
if (new Set(entries.map(item => item.id)).size !== entries.length) throw Error('Duplicate selection item ID');
const coverage = JSON.parse(await read('assets/font/generated-coverage.json')).chars;
const sprites = new Map();
for (const item of entries) {
  if (!/^[ぁ-ゖァ-ヺー]+$/u.test(item.name) || item.name !== item.kana || [...item.name].some(c => !coverage.includes(c))) {
    throw Error(`Selection names must use supported kana: ${item.id}`);
  }
  if (!physics.materials[item.material] || !physics.behaviors[item.behavior] || !item.fixtures.length) throw Error(`Invalid physics: ${item.id}`);
  const old = manifest.items.find(record => record.id === item.id);
  if (old && !old.selectionOnly) throw Error(`Cannot overwrite an existing stage item: ${item.id}`);
  const grid = item.grid ?? 128, pivot = item.pivot ?? [grid / 2, grid / 2];
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="${grid}" height="${grid}" viewBox="0 0 ${grid} ${grid}" shape-rendering="crispEdges">${item.art}</svg>`;
  const {data, info} = await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let x0 = grid, y0 = grid, x1 = -1, y1 = -1, pixels = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (!data[(y * info.width + x) * 4 + 3]) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); pixels++;
  }
  if (!pixels) throw Error(`Empty art: ${item.id}`);
  const box = [x0, y0, x1 - x0 + 1, y1 - y0 + 1], scale = item.width / box[2];
  const svg = raw.replace(`width="${grid}" height="${grid}" viewBox="0 0 ${grid} ${grid}"`, `width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}"`);
  await fs.writeFile(path.join(root, `assets/objects/${item.id}.svg`), svg + '\n', 'utf8');
  for (const ext of ['png', 'webp']) await sharp(Buffer.from(svg)).toFormat(ext, ext === 'webp' ? {lossless: true} : {}).toFile(path.join(root, `assets/raster/objects/${item.id}.${ext}`));
  if (item.depletedArt) {
    // Keep the original canvas and pivot when swapping the exhausted texture.
    const depleted = svg.replace(item.art, item.depletedArt);
    await fs.writeFile(path.join(root, `assets/objects/${item.id}-depleted.svg`), depleted + '\n', 'utf8');
  }
  const score = ['explosion', 'water_release'].includes(item.behavior) ? 0 : 100;
  const record = {
    id: item.id, nameJa: item.name, svg: `objects/${item.id}.svg`, png: `raster/objects/${item.id}.png`, webp: `raster/objects/${item.id}.webp`,
    sourceGrid: [grid, grid], viewBox: box, pivotSource: pivot, pivotCropped: [pivot[0] - x0, pivot[1] - y0],
    worldWidth: item.width, worldHeight: box[3] * scale, worldScale: scale,
    material: item.material, mass: item.mass, score, bodyKind: 'dynamic', behavior: item.behavior,
    colliderTemplate: item.id, fixtures: item.fixtures,
    physics: {...physics.materials[item.material], ...physics.behaviors[item.behavior], ...item.extra},
    opaquePixels: pixels, selectionOnly: true
  };
  const at = manifest.items.findIndex(value => value.id === item.id);
  if (at < 0) manifest.items.push(record); else manifest.items[at] = record;
  const row = [item.id, item.name, item.material, item.mass, score, item.width, item.id, item.behavior];
  const rowAt = catalog.items.findIndex(value => value[0] === item.id);
  if (rowAt < 0) catalog.items.push(row); else catalog.items[rowAt] = row;
  colliders.templates[item.id] = item.fixtures;
  physics.overrides[item.id] = {...item.extra};
  ui.items[item.id] = item.kana;
  sprites.set(item.id, {svg, box});
}
for (const [name, value] of Object.entries({'objects-manifest': manifest, catalog, physics, colliders, 'ui-ja': ui})) {
  await fs.writeFile(path.join(root, `data/${name}.json`), JSON.stringify(value, null, 2) + '\n', 'utf8');
}

// Review images use the game's real bitmap font and render the authored SVGs.
// The companion collider sheets expose holes and thin protrusions for review.
const fields = line => Object.fromEntries([...line.matchAll(/(\w+)=(-?[\d.]+)/g)].map(match => [match[1], Number(match[2])]));
const fnt = (await read('assets/font/arcade-generated.fnt')).split('\n');
const fontSize = fields(fnt.find(line => line.startsWith('info '))).size;
const glyphs = new Map(fnt.filter(line => line.startsWith('char ')).map(line => {const g = fields(line); return [g.id, g];}));
const atlasName = fnt.find(line => line.startsWith('page ')).match(/file="([^"]+)"/)[1];
const atlasPath = path.join(root, 'assets/font', atlasName);
const glyphCache = new Map();
async function textOverlays(value, x, y, width) {
  const fontWidth = [...value].reduce((sum, c) => sum + glyphs.get(c.codePointAt(0)).xadvance, 0);
  const size = Math.min(14, width * fontSize / fontWidth), scale = size / fontSize;
  let cursor = x + (width - fontWidth * scale) / 2;
  const parts = [];
  for (const c of value) {
    const g = glyphs.get(c.codePointAt(0)), key = `${c}:${size}`;
    if (g.width && g.height) {
      if (!glyphCache.has(key)) glyphCache.set(key, await sharp(atlasPath).extract({left: g.x, top: g.y, width: g.width, height: g.height})
        .resize(Math.max(1, Math.round(g.width * scale)), Math.max(1, Math.round(g.height * scale)), {kernel: 'nearest'}).tint('#f7e9ba').png().toBuffer());
      parts.push({input: glyphCache.get(key), left: Math.round(cursor + g.xoffset * scale), top: Math.round(y + g.yoffset * scale)});
    }
    cursor += g.xadvance * scale;
  }
  return parts;
}
function fixtureArt(fixture) {
  if (fixture.rect) {const [x, y, width, height] = fixture.rect; return `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`;}
  if (fixture.circle) {const [cx, cy, r] = fixture.circle; return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;}
  return `<polygon points="${fixture.polygon.map(p => p.join(',')).join(' ')}"/>`;
}
await fs.mkdir(path.join(root, 'previews'), {recursive: true});
const retakeIds = ['bench-grinder', 'blood-pressure-monitor', 'mini-soccer-goal', 'baseball-bat', 'fishing-rod-tip', 'boxed-butter', 'gratin', 'bread-loaf', 'telescope', 'oscilloscope', 'roasted-sweet-potato', 'robot-vacuum'];
const reviewGroups = [...groups, ['retakes', retakeIds.map(id => entries.find(item => item.id === id)).filter(Boolean)], ['optics-printer', ['telescope', 'white-printer', 'pancake-pair', 'blood-pressure-monitor', 'care-bed'].map(id => entries.find(item => item.id === id))]];
reviewGroups.push(['rescue-retakes', ['randoseru', 'bandage-roll', 'ambulance', 'fire-engine', 'ladder-truck'].map(id => entries.find(item => item.id === id))]);
reviewGroups.push(['playground-retakes', ['microscope', 'red-hair-comb'].map(id => entries.find(item => item.id === id))]);
for (const [group, items] of reviewGroups) for (const collision of [false, true]) {
  const columns = Math.min(6, items.length), cellWidth = 200, cellHeight = 200, layers = [];
  for (const [index, item] of items.entries()) {
    const cellX = index % columns * cellWidth, cellY = Math.floor(index / columns) * cellHeight;
    const {svg} = sprites.get(item.id);
    const source = collision ? svg.replace('</svg>', `<g fill="#49e9ba" fill-opacity="0.3" stroke="#ffcb56" stroke-width="1.3">${item.fixtures.map(fixtureArt).join('')}</g></svg>`) : svg;
    const thumbnail = await sharp(Buffer.from(source)).resize({width: 170, height: 158, fit: 'inside', kernel: 'nearest'}).png().toBuffer({resolveWithObject: true});
    layers.push({input: thumbnail.data, left: cellX + Math.floor((cellWidth - thumbnail.info.width) / 2), top: cellY + 4 + Math.floor((160 - thumbnail.info.height) / 2)});
    layers.push(...await textOverlays(item.kana, cellX + 6, cellY + 175, cellWidth - 12));
  }
  await sharp({create: {width: columns * cellWidth, height: Math.ceil(items.length / columns) * cellHeight, channels: 4, background: '#25364c'}})
    .composite(layers).png().toFile(path.join(root, `previews/selection-${group}${collision ? '-colliders' : ''}.png`));
}
console.log(`Authored selection-only additions: ${entries.length}; catalog total: ${manifest.items.length}. Search tags were not read or changed.`);
