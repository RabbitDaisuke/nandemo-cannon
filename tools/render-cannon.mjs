import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES??'','sharp'));}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const decode=buffer=>new TextDecoder('utf-8',{fatal:true}).decode(buffer);
const read=async file=>decode(await fs.readFile(path.join(root,file)));
const inner=svg=>svg.replace(/^\s*<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const parts={};
for(const id of ['base','barrel','trunnion','base-highlight','barrel-highlight'])parts[id]=inner(await read(`assets/cannon/${id}.svg`));
const glyphs={};
const label=async(text,x,y,scale=2)=>{
  let content='',cursor=x;
  for(const char of text){
    const key='U'+char.codePointAt(0).toString(16).toUpperCase().padStart(4,'0');
    if(!(key in glyphs))glyphs[key]=inner(await read(`assets/font/${key}.svg`));
    content+=`<g transform="translate(${cursor} ${y}) scale(${scale})">${glyphs[key]}</g>`;
    cursor+=9*scale;
  }
  return content;
};
const cannon=(angle,highlight=false)=>[
  highlight?`<g transform="translate(-51 -78)">${parts['base-highlight']}</g>`:'',
  `<g transform="translate(-51 -78)">${parts.base}</g>`,
  `<g transform="translate(0 -55) rotate(${angle})">`,
  highlight?`<g transform="translate(-104 -25)">${parts['barrel-highlight']}</g>`:'',
  `<g transform="translate(-104 -25)">${parts.barrel}</g></g>`,
  `<g transform="translate(-13 -68)">${parts.trunnion}</g>`
].join('');
const wrap=(body,viewBox,width,height)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" fill="none" shape-rendering="crispEdges">${body}</svg>`;
const output=path.join(root,'previews');
await fs.mkdir(output,{recursive:true});
const angles=[15,35,75];
let sheet='<path fill="#173143" d="M0 0H1640V760H0Z"/>';
sheet+=await label('CANNON / INDEPENDENT BARREL',36,30,3);
for(let index=0;index<angles.length;index++){
  const angle=angles[index],x=24+index*540;
  sheet+=`<path fill="#25475b" d="M${x} 100H${x+512}V650H${x}Z"/><path fill="#b99865" d="M${x} 552H${x+512}V650H${x}Z"/><path fill="#080c12" d="M${x} 548H${x+512}V554H${x}Z"/>`;
  sheet+=await label(`${angle}°`,x+24,122,3);
  if(index===1)sheet+=await label('HOVER',x+330,124,2);
  sheet+=`<g transform="translate(${x+240} 549) scale(2)">${cannon(angle,index===1)}</g>`;
  const rad=angle*Math.PI/180;
  const mx=x+240-Math.cos(rad)*208,my=549-110-Math.sin(rad)*208;
  sheet+=`<path fill="#78e4e2" d="M${mx-3} ${my-3}H${mx+3}V${my+3}H${mx-3}Z"/>`;
  sheet+=await label('FIXED PIVOT',x+24,594,2);
}
sheet+=await label('DRAG: UP - ANGLE / LEFT - POWER',36,690,2);
const sheetSVG=wrap(sheet,'0 0 1640 760',1640,760);
await fs.writeFile(path.join(output,'cannon-angles.svg'),sheetSVG);
await sharp(Buffer.from(sheetSVG)).png().toFile(path.join(output,'cannon-angles.png'));
for(const angle of angles){
  const body=cannon(angle);
  const vx=-130,vy=-175,vw=240,vh=180;
  const raw=wrap(body,`${vx} ${vy} ${vw} ${vh}`,vw,vh);
  const {data,info}=await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=-1,y1=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const box=[vx+x0-1,vy+y0-1,x1-x0+3,y1-y0+3];
  const svg=wrap(body,box.join(' '),720,Math.round(720*box[3]/box[2]));
  await fs.writeFile(path.join(output,`cannon-${angle}.svg`),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(output,`cannon-${angle}.png`));
}
console.log('Rendered separate cannon parts at 15°, 35°, 75°; original SVG paths retained.');
