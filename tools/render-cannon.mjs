// Node visual review of exact WebP components, not a browser capture.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES??'','sharp'));}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'previews');
await fs.mkdir(output,{recursive:true});
const parts={};
for(const variant of ['a','b']) {
  parts[variant]={};
  for(const part of ['base','barrel','trunnion']) parts[variant][part]=(await sharp(path.join(root,`assets/cannon/${variant}-${part}.webp`)).png().toBuffer()).toString('base64');
}
const img=(data,x,y,w,h)=>`<image href="data:image/png;base64,${data}" x="${x}" y="${y}" width="${w}" height="${h}" style="image-rendering:pixelated"/>`;
const cannon=(variant,angle)=>img(parts[variant].base,-51,-78,150,78)+`<g transform="translate(0 -55) rotate(${angle})">${img(parts[variant].barrel,-104,-25,144,50)}</g>`+img(parts[variant].trunnion,-13,-68,26,26);
const wrap=(body,w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#244459"/>${body}</svg>`;
const label=(text,x,y)=>`<text x="${x}" y="${y}" font-family="monospace" font-weight="bold" font-size="24" fill="#fff0c8">${text}</text>`;
let candidates='';
for(const [i,variant]of ['a','b'].entries()) {
  const x=i*600;
  candidates+=`<rect x="${x+16}" y="70" width="568" height="370" fill="#87aeb6"/><rect x="${x+16}" y="360" width="568" height="80" fill="#d5bb83"/>`;
  candidates+=label(`DESIGN ${variant.toUpperCase()}${variant==='b'?' / SELECTED':''}`,x+26,44);
  candidates+=`<g transform="translate(${x+270} 360) scale(2)">${cannon(variant,35)}</g>`;
}
await sharp(Buffer.from(wrap(candidates,1200,460))).png().toFile(path.join(output,'cannon-candidates.png'));
let angles='';
for(const [i,angle] of [15,35,75].entries()) {
  const x=i*480;
  angles+=`<rect x="${x+12}" y="60" width="456" height="370" fill="#87aeb6"/><rect x="${x+12}" y="350" width="456" height="80" fill="#d5bb83"/>`;
  angles+=label(`${angle} DEGREES / FIXED CARRIAGE`,x+18,38);
  angles+=`<g transform="translate(${x+232} 350) scale(2)">${cannon('b',angle)}</g>`;
}
await sharp(Buffer.from(wrap(angles,1440,450))).png().toFile(path.join(output,'cannon-angles.png'));
console.log('Compared two cannon candidates and selected B at 15/35/75 degrees using imported WebP parts.');
