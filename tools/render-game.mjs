import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES??'','sharp'));}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async name=>new TextDecoder('utf-8',{fatal:true}).decode(await fs.readFile(path.join(root,name)));
const files=new Map();
async function asset(name){
  name=name.replace(/^res:\/\//,'');
  if(files.has(name))return files.get(name);
  const source=await read(name);
  const viewBox=source.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
  const width=Number(source.match(/\bwidth="([\d.]+)"/)?.[1]??viewBox[2]);
  const height=Number(source.match(/\bheight="([\d.]+)"/)?.[1]??viewBox[3]);
  const content=source.replace(/^\s*<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
  const item={viewBox,width,height,content};files.set(name,item);return item;
}
function nested(item,x,y,width,height){return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${item.viewBox.join(' ')}" preserveAspectRatio="none" fill="none">${item.content}</svg>`;}
const fontAdvances=new Map();
for(const line of (await read('assets/font/fuhotoki-pixel.fnt')).split('\n')){
  const id=line.match(/^char id=(\d+)/),advance=line.match(/xadvance=(\d+)/);
  if(id&&advance)fontAdvances.set(Number(id[1]),Number(advance[1]));
}
async function text(value,rect,size=16,color='#fff0c8',align=0,outline=0,outlineColor='#081421'){
  const scale=size/16,width=[...value].reduce((sum,char)=>sum+(fontAdvances.get(char.codePointAt(0))??9)*scale,0);
  const x=rect[0]+(align===1?(rect[2]-width)/2:align===2?rect[2]-width:0),y=rect[1]+scale;
  let paths='',cursor=0;
  for(const char of value){
    const key='U'+char.codePointAt(0).toString(16).toUpperCase().padStart(4,'0');
    const glyph=await asset(`assets/font/${key}.svg`);
    paths+=`<g transform="translate(${cursor} 0)">${glyph.content.replace(/ color="#ffffff"/g,'')}</g>`;
    cursor+=fontAdvances.get(char.codePointAt(0))??glyph.width+1;
  }
  let output='';
  if(outline>0){
    const expanded=paths.replace(/stroke-width="([\d.]+)"/g,(_,w)=>`stroke-width="${Number(w)+2*outline/scale}"`);
    output+=`<g color="${outlineColor}" transform="translate(${x} ${y}) scale(${scale})">${expanded}</g>`;
  }
  return output+`<g color="${color}" transform="translate(${x} ${y}) scale(${scale})">${paths}</g>`;
}
function rectangle(rect,color,stroke='',strokeWidth=0){return `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}" fill="${color}"${stroke?` stroke="${stroke}" stroke-width="${strokeWidth}"`:''}/>`;}
async function fitTexture(file,rect){
  if(!file.endsWith('.svg'))return '';
  const image=await asset(file),scale=Math.min(rect[2]/image.width,rect[3]/image.height);
  return nested(image,rect[0]+(rect[2]-image.width*scale)/2,rect[1]+(rect[3]-image.height*scale)/2,image.width*scale,image.height*scale);
}
async function cannon(snapshot){
  const ground=snapshot.cannon,angle=snapshot.angle,recoil=snapshot.recoil??0;
  const base=await asset('assets/cannon/base.svg'),barrel=await asset('assets/cannon/barrel.svg'),cap=await asset('assets/cannon/trunnion.svg');
  return `<g transform="translate(${ground[0]} ${ground[1]})">${nested(base,-51,-78,150,78)}<g transform="translate(0 -55) rotate(${angle})">${nested(barrel,-104+recoil,-25,144,50)}</g>${nested(cap,-13,-68,26,26)}</g>`;
}
async function render(snapshot){
  let output=nested(await asset(`assets/maps/${snapshot.map}.svg`),0,0,960,540);
  if(snapshot.playable){
    const r=snapshot.scoreZone;
    output+=rectangle(r,'#19f2e60b');
    output+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" stroke="#44f4e9" stroke-width="3" stroke-dasharray="10 8" fill="none"/>`;
  }
  for(const point of snapshot.trajectory??[])output+=rectangle([point[0]-2,point[1]-2,4,4],`rgba(255,235,166,${point[2]})`);
  output+=await cannon(snapshot);
  for(const actor of snapshot.actors){
    const sprite=await asset(actor.texture),p=actor.visualPosition,scale=actor.visualScale;
    output+=`<g transform="translate(${actor.x} ${actor.y}) rotate(${actor.rotation*180/Math.PI})"><g transform="translate(${p[0]} ${p[1]}) scale(${scale[0]} ${scale[1]})">${nested(sprite,0,0,sprite.width,sprite.height)}</g></g>`;
  }
  const wave=await asset(`assets/effects/water-flow-${Math.floor(snapshot.elapsed*6)%2}.svg`),ice=await asset('assets/effects/ice-tile.svg');
  for(const region of snapshot.waterRegions??[]){
    output+=rectangle(region,'#2ea1cc7a');
    for(let x=region[0];x<region[0]+region[2];x+=32)output+=nested(wave,x,region[1]-4,Math.min(32,region[0]+region[2]-x),22);
  }
  for(const cell of snapshot.waterCells??[]){
    const h=Math.min(1,Math.max(0.08,cell.amount))*16;
    output+=cell.frozen>0?nested(ice,cell.x,cell.y,16,16):nested(wave,cell.x,cell.y+16-h,16,h);
  }
  const drop=await asset('assets/ui/water-drop.svg');
  for(const p of snapshot.droplets??[])output+=nested(drop,p[0]-3,p[1]-4,6,8);
  const fire=await asset(`assets/effects/fire-${Math.floor(snapshot.elapsed*12)%6}.svg`);
  for(const p of snapshot.firePatches??[])output+=nested(fire,p.x-24,p.y-48,48,52);
  for(const actor of snapshot.actors)if(actor.burning||(actor.fuel>0&&['campfire','fuel_light'].includes(actor.record.behavior))){
    const w=Math.min(92,Math.max(30,actor.record.worldWidth*0.9));
    output+=nested(fire,actor.x-w/2,actor.y-w,w,w);
  }
  for(const c of snapshot.controls){
    const r=c.rect;
    if(c.type==='label')output+=await text(c.text,r,c.fontSize,'#'+c.color,c.align,c.outlineSize,'#'+c.outline);
    else if(c.type==='button'){
      output+=rectangle(r,'#193346','#080f18',2);
      output+=await text(c.text,[r[0],r[1]+(r[3]-c.fontSize*1.25)/2,r[2],c.fontSize*1.25],c.fontSize,c.disabled?'#668091':'#f7e9ba',1);
    }else if(c.type==='texture')output+=await fitTexture(c.texture,r);
    else if(c.type==='slider'){
      const f=(c.value-c.minimum)/(c.maximum-c.minimum),cy=r[1]+r[3]/2;
      output+=rectangle([r[0],cy-3,r[2],6],'#1b3040','#080f18',2);
      output+=rectangle([r[0],cy-2,r[2]*f,4],'#d5a650');
      output+=rectangle([r[0]+r[2]*f-5,cy-8,10,16],'#f5d077','#080f18',2);
    }else if(c.type==='rect')output+=rectangle(r,'#'+c.color);
    else if(c.type==='panel')output+=rectangle(r,'#142c3e','#080f18',4);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 960 540" fill="none" shape-rendering="crispEdges">${output}</svg>`;
}
const names=['01-initial','01-after-five','04-alley','16-ice'];
for(const name of names){
  const snapshot=JSON.parse(await read(`previews/game-state-${name}.json`));
  const svg=await render(snapshot);
  await fs.writeFile(path.join(root,`previews/game-${name}.svg`),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(root,`previews/game-${name}.png`));
}
await fs.writeFile(path.join(root,'previews/game-preview-info.json'),JSON.stringify({source:'Godot 4.7.2 headless debug_snapshot from real physics and gameplay',renderer:'Node.js sharp: SVG sprites and custom SVG glyphs composed at recorded positions',browserUsed:false,engineFramebuffer:false,files:names.map(n=>`game-${n}.png`)},null,2));
console.log('Rendered 4 game-state previews from real Godot physics snapshots, not browser screenshots.');
