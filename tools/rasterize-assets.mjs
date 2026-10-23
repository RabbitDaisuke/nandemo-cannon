// Rasterize authored SVG files for Godot import. No procedural artwork.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '', 'sharp')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fontOnly = args.includes('--font-only');
const previewIndex = args.indexOf('--font-preview');
const previewText = previewIndex >= 0 ? args[previewIndex + 1] : '';
if (previewIndex >= 0 && (!previewText || previewText.startsWith('--'))) throw new Error('--font-preview requires the text to render.');
const fontDir = path.join(root, 'assets/font');
const coverage = JSON.parse(await fs.readFile(path.join(fontDir, 'coverage.json'), 'utf8'));
const filenames = (await fs.readdir(fontDir)).filter(name => /^U[0-9A-F]{4,6}\.svg$/.test(name)).sort();
const glyphs = new Map();
for (const filename of filenames) {
  const codepoint = Number.parseInt(filename.slice(1, -4), 16);
  if (codepoint > 0x10ffff || (codepoint >= 0xd800 && codepoint <= 0xdfff)) throw new Error(`Invalid glyph codepoint: ${filename}`);
  const source = await fs.readFile(path.join(fontDir, filename), 'utf8');
  const svg = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>\s*$/);
  const box = svg?.[1].match(/\bviewBox="([^"]+)"/)?.[1].trim().split(/\s+/).map(Number);
  if (!box || box.length !== 4 || box.some(value => !Number.isFinite(value)) || box[0] !== 0 || box[1] !== 0 || box[2] <= 0 || box[2] > 16 || box[3] !== 16) {
    throw new Error(`Glyph must have a 0 0 width 16 viewBox, width 1..16: ${filename}`);
  }
  const character = String.fromCodePoint(codepoint);
  if (glyphs.has(character)) throw new Error(`Duplicate glyph: ${filename}`);
  glyphs.set(character, {codepoint, width: box[2], inner: svg[2], filename});
}
// Keep authored coverage order, so adding a glyph never moves an existing cell.
const chars = [...coverage.chars];
if (new Set(chars).size !== chars.length) throw new Error('Duplicate character in font coverage.');
for (const character of chars) if (!glyphs.has(character)) throw new Error(`Missing covered glyph: ${character}`);
for (const character of glyphs.keys()) if (!chars.includes(character)) chars.push(character);
const columns = 16, cell = 20, width = columns * cell, height = Math.ceil(chars.length / columns) * cell;
const atlasParts = [], fontChars = [];
for (const [index, character] of chars.entries()) {
  const glyph = glyphs.get(character), x = index % columns * cell, y = Math.floor(index / columns) * cell;
  atlasParts.push(`<g transform="translate(${x + 2} ${y + 2})">${glyph.inner}</g>`);
  fontChars.push(`char id=${glyph.codepoint} x=${x + 1} y=${y + 1} width=${glyph.width + 2} height=18 xoffset=-1 yoffset=0 xadvance=${glyph.width + 1} page=0 chnl=15`);
}
const atlas = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" shape-rendering="crispEdges">${atlasParts.join('')}</svg>`;
const font = [
  'info face="Fuhotoki Hand Pixel" size=16 bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=0 aa=1 padding=0,0,0,0 spacing=1,1',
  `common lineHeight=20 base=16 scaleW=${width} scaleH=${height} pages=1 packed=0`,
  'page id=0 file="atlas.png"', `chars count=${chars.length}`, ...fontChars, ''
].join('\n');
await fs.writeFile(path.join(fontDir, 'atlas.svg'), atlas);
await sharp(Buffer.from(atlas)).png().toFile(path.join(fontDir, 'atlas.png'));
await fs.writeFile(path.join(fontDir, 'fuhotoki-pixel.fnt'), font);
await fs.writeFile(path.join(fontDir, 'coverage.json'), JSON.stringify({...coverage, chars: chars.join(''), count: chars.length}, null, 2) + '\n');
if (previewText) {
  let cursor = 0;
  const parts = [...previewText].map(character => {
    const glyph = glyphs.get(character);
    if (!glyph) throw new Error(`Missing preview glyph: ${character}`);
    const part = `<g transform="translate(${cursor} 0)">${glyph.inner}</g>`;
    cursor += glyph.width + 1;
    return part;
  });
  const previewWidth = cursor * 4 + 32;
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="${previewWidth}" height="112" viewBox="0 0 ${previewWidth} 112" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#111c2e"/><g transform="translate(16 24) scale(4)">${parts.join('')}</g></svg>`;
  await fs.writeFile(path.join(fontDir, 'title-preview.svg'), preview);
  await sharp(Buffer.from(preview)).png().toFile(path.join(fontDir, 'title-preview.png'));
  console.log(`Font preview: assets/font/title-preview.png (${previewText})`);
}
let mapCount = 0;
if (!fontOnly) {
  for (const name of (await fs.readdir(path.join(root, 'assets/maps'))).filter(name => name.endsWith('.svg'))) {
    const source = path.join(root, 'assets/maps', name);
    await sharp(await fs.readFile(source)).png().toFile(source.replace(/\.svg$/, '.png'));
    mapCount++;
  }
}
console.log(`Rebuilt ${chars.length} authored SVG glyphs into the BMFont atlas; rasterized ${mapCount} maps.`);
