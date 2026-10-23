// Reproducible cropping, pixel sampling and lossless WebP conversion.
// Artwork is generated with the built-in image tool; no network/API calls in CI.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '', 'sharp')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = path.join(root, 'assets/generated');
const sourcePaths = process.argv.slice(2);
await fs.mkdir(generated, {recursive:true});
// Optional three input files: cannon sheet, glyph sheet, logo. Preserve originals.
if (sourcePaths[0] === '--kana') {
  if (sourcePaths.length !== 3) throw new Error('Expected hiragana and katakana source paths.');
  for (const [i,name] of ['hiragana-sheet','katakana-sheet'].entries()) await sharp(sourcePaths[i+1]).webp({lossless:true,quality:100,effort:6}).toFile(path.join(generated,`${name}.webp`));
} else if (sourcePaths[0] === '--corrections') {
  await sharp(sourcePaths[1]).webp({lossless:true,quality:100,effort:6}).toFile(path.join(generated,'kana-corrections.webp'));
} else if (sourcePaths.length) {
  if (sourcePaths.length !== 3) throw new Error('Expected cannon, font, logo source paths.');
  for (const [i, name] of ['cannon-sheet','font-sheet','logo-source'].entries()) {
    await sharp(sourcePaths[i]).webp({lossless:true,quality:100,effort:6}).toFile(path.join(generated, `${name}.webp`));
  }
}
const webp = image => image.webp({lossless:true,quality:100,effort:6});
async function cut(file, rectangle) {
  let pipeline = sharp(file).ensureAlpha();
  if (rectangle) pipeline = pipeline.extract(rectangle);
  const {data,info} = await pipeline.raw().toBuffer({resolveWithObject:true});
  let left=info.width,top=info.height,right=-1,bottom=-1;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    const offset=(y*info.width+x)*4;
    data[offset+3]=data[offset+3]>=128?255:0;
    if(data[offset+3]) { left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y); }
    else data.fill(0,offset,offset+4);
  }
  if(right<left) throw new Error(`No sprite pixels: ${file}`);
  const bounds={left,top,width:right-left+1,height:bottom-top+1};
  return {image:sharp(data,{raw:info}).extract(bounds),bounds};
}
const cannonDir=path.join(root,'assets/cannon');
await fs.mkdir(cannonDir,{recursive:true});
const sizes={barrel:[144,50],base:[150,78],trunnion:[26,26]};
const cells={
  a:{barrel:[10,145,680,285],base:[690,170,640,320],trunnion:[1340,230,185,170]},
  b:{barrel:[10,550,680,310],base:[690,570,650,355],trunnion:[1340,650,185,190]}
};
const crops={};
for(const [variant,parts] of Object.entries(cells)) {
  crops[variant]={};
  for(const [part,[left,top,width,height]] of Object.entries(parts)) {
    const {image,bounds}=await cut(path.join(generated,'cannon-sheet.webp'),{left,top,width,height});
    const pixels=await webp(image.resize(...sizes[part],{fit:'fill',kernel:'nearest'})).toBuffer();
    await fs.writeFile(path.join(cannonDir,`${variant}-${part}.webp`),pixels);
    // Candidate B: broader muzzle and strong round wheels read at game scale.
    if(variant==='b') await fs.writeFile(path.join(cannonDir,`${part}.webp`),pixels);
    crops[variant][part]={source:[left+bounds.left,top+bounds.top,bounds.width,bounds.height],logicalSize:sizes[part]};
  }
}
await fs.writeFile(path.join(cannonDir,'generated-parts.json'),JSON.stringify({selected:'b',pivot:[104,25],muzzle:[0,25],groundPivot:[0,-55],candidates:crops},null,2)+'\n');
const logo=await cut(path.join(generated,'logo-source.webp'));
await fs.mkdir(path.join(root,'assets/ui'),{recursive:true});
await webp(logo.image.resize({width:768,kernel:'nearest'})).toFile(path.join(root,'assets/ui/logo.webp'));

const coverage=JSON.parse(await fs.readFile(path.join(root,'assets/font/coverage.json'),'utf8'));
const originalChars=[...coverage.chars];
if(originalChars.length!==85 || originalChars[0]!==' ') throw new Error('Original atlas mapping must be reviewed when coverage changes.');
const glyphImages=new Map();
for(const [i,char] of originalChars.slice(1).entries()) {
  const sourceRect={left:20+(i%12)*134,top:18+Math.floor(i/12)*132,width:134,height:132};
  const {image,bounds}=await cut(path.join(generated,'font-sheet.webp'),sourceRect);
  const scale=32/116,w=Math.max(1,Math.round(bounds.width*scale)),h=Math.max(1,Math.round(bounds.height*scale));
  const pixels=await image.resize(w,h,{fit:'fill',kernel:'nearest'}).png().toBuffer();
  glyphImages.set(char,{pixels,w,h,top:Math.round(bounds.top*scale),advance:Math.max(8,w+2)});
}
// Locate the empty gutters of a generated regular grid, preserving exact cell order.
async function addSheet(name,characters,cols,rows,normalizeHeight=false) {
  const file=path.join(generated,name),{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const xs=new Array(info.width).fill(0),ys=new Array(info.height).fill(0);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=128){xs[x]++;ys[y]++;}
  function boundaries(values,count){
    const out=[0],step=values.length/count;
    for(let k=1;k<count;k++){
      const center=k*step;let best=Math.round(center),minimum=Infinity;
      for(let i=Math.floor(center-step*.22);i<=Math.ceil(center+step*.22);i++)if(values[i]<minimum || (values[i]===minimum&&Math.abs(i-center)<Math.abs(best-center))){minimum=values[i];best=i;}
      out.push(best);
    }
    return [...out,values.length];
  }
  const xb=boundaries(xs,cols),yb=boundaries(ys,rows);
  for(let row=0;row<rows;row++){
    const parts=[];
    for(let col=0;col<cols;col++){
      const char=characters[row*cols+col];if(!char)continue;
      const piece=await cut(file,{left:xb[col],top:yb[row],width:xb[col+1]-xb[col],height:yb[row+1]-yb[row]});
      parts.push({...piece,char});
    }
    const baseline=Math.max(...parts.map(p=>p.bounds.top+p.bounds.height));
    const scale=normalizeHeight ? 32/Math.max(...parts.map(p=>p.bounds.height)) : 32/116;
    for(const {char,image,bounds}of parts){
      const w=Math.max(1,Math.round(bounds.width*scale)),h=Math.max(1,Math.round(bounds.height*scale));
      const pixels=await image.resize(w,h,{fit:'fill',kernel:'nearest'}).png().toBuffer();
      glyphImages.set(char,{pixels,w,h,top:34-Math.round((baseline-bounds.top)*scale),advance:Math.max(8,w+2)});
    }
  }
}
const hiragana=Array.from({length:86},(_,i)=>String.fromCodePoint(0x3041+i)).join('')+'ゝゞ';
const katakana=Array.from({length:90},(_,i)=>String.fromCodePoint(0x30a1+i)).join('')+'ー。、！？「';
await addSheet('hiragana-sheet.webp',[...hiragana],11,8);
await addSheet('katakana-sheet.webp',[...katakana],12,8);
// Obsolete voiced katakana are not used by the Japanese UI; keep only reviewed forms.
for(const char of 'ヷヸヹヺ') glyphImages.delete(char);
await addSheet('kana-corrections.webp',[...'ゐゑゔゕゖヲヰヱ'],8,1,true);
const chars=[' ',...glyphImages.keys()],cell=44,columns=16,atlasWidth=columns*cell,atlasHeight=Math.ceil(chars.length/columns)*cell;
const composites=[],entries=['char id=32 x=0 y=0 width=0 height=0 xoffset=0 yoffset=0 xadvance=12 page=0 chnl=15'];
for(const [i,char] of chars.slice(1).entries()){
  const g=glyphImages.get(char),x=((i+1)%columns)*cell+2,y=Math.floor((i+1)/columns)*cell+2;
  if(g.w>cell-4 || g.h>cell-4)throw new Error(`Glyph cell overflow: ${char} ${g.w}x${g.h}`);
  composites.push({input:g.pixels,left:x,top:y});
  entries.push(`char id=${char.codePointAt(0)} x=${x} y=${y} width=${g.w} height=${g.h} xoffset=0 yoffset=${g.top} xadvance=${g.advance} page=0 chnl=15`);
}
await fs.writeFile(path.join(root,'assets/font/generated-coverage.json'),JSON.stringify({chars:chars.join(''),count:chars.length,hiraganaComplete:true,hiraganaRange:'U+3041..U+3096 plus iteration marks'},null,2)+'\n');
await webp(sharp({create:{width:atlasWidth,height:atlasHeight,channels:4,background:'#00000000'}}).composite(composites)).toFile(path.join(root,'assets/font/arcade-atlas.webp'));
const fnt=[
  'info face="Nandemo Generated Arcade" size=32 bold=1 italic=0 charset="" unicode=1 stretchH=100 smooth=0 aa=1 padding=0,0,0,0 spacing=1,1',
  `common lineHeight=40 base=32 scaleW=${atlasWidth} scaleH=${atlasHeight} pages=1 packed=0`,
  'page id=0 file="arcade-atlas.webp"',`chars count=${chars.length}`,...entries,''
].join('\n');
await fs.writeFile(path.join(root,'assets/font/arcade-generated.fnt'),fnt);
let cursor=0;
const startParts=[...'はじめる'].map(char=>{const g=glyphImages.get(char);const part={input:g.pixels,left:cursor,top:Math.max(0,g.top)};cursor+=g.advance;return part;});
await webp(sharp({create:{width:cursor,height:40,channels:4,background:'#00000000'}}).composite(startParts)).toFile(path.join(root,'assets/ui/start.webp'));
const summaryPath=path.join(root,'data/build-summary.json');
const summary=JSON.parse(await fs.readFile(summaryPath,'utf8'));
summary.fontGlyphs=chars.length;
summary.originalArtwork='SVG objects/maps; image-generated cannon, logo and Japanese bitmap font';
await fs.writeFile(summaryPath,JSON.stringify(summary,null,2)+'\n');
console.log(`Prepared two separated cannon designs (B selected), logo and ${chars.length}-character lossless WebP font.`);
