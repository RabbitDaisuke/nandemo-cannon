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
  if(!name.endsWith('.svg')){
    const buffer=await sharp(path.join(root,name)).png().toBuffer(),info=await sharp(buffer).metadata();
    const item={viewBox:[0,0,info.width,info.height],width:info.width,height:info.height,content:`<image href="data:image/png;base64,${buffer.toString('base64')}" width="${info.width}" height="${info.height}" style="image-rendering:pixelated"/>`};
    files.set(name,item);return item;
  }
  const source=await read(name);
  const viewBox=source.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
  const width=Number(source.match(/\bwidth="([\d.]+)"/)?.[1]??viewBox[2]);
  const height=Number(source.match(/\bheight="([\d.]+)"/)?.[1]??viewBox[3]);
  const content=source.replace(/^\s*<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
  const item={viewBox,width,height,content};files.set(name,item);return item;
}
function nested(item,x,y,width,height){return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${item.viewBox.join(' ')}" preserveAspectRatio="none" fill="none">${item.content}</svg>`;}
let font,definitions=[];
const colorFilters=new Map();
async function loadFont(name){
  name=name.replace(/^res:\/\//,'');
  const lines=(await read(name)).split('\n'),glyphs=new Map();
  const fields=line=>Object.fromEntries([...line.matchAll(/(\w+)=(-?[\d.]+)/g)].map(m=>[m[1],Number(m[2])]));
  for(const line of lines)if(line.startsWith('char ')){const glyph=fields(line);glyphs.set(glyph.id,glyph);}
  const info=fields(lines.find(l=>l.startsWith('info ')));
  const page=lines.find(l=>l.startsWith('page ')).match(/file="([^"]+)"/)[1];
  const atlas=await asset(path.posix.join(path.posix.dirname(name),page));
  definitions.push(`<g id="font-atlas">${atlas.content}</g>`);
  return {size:info.size,lineHeight:fields(lines.find(l=>l.startsWith('common '))).lineHeight,glyphs};
}
function colorFilter(color){
  if(colorFilters.has(color))return colorFilters.get(color);
  const id=`ink-${colorFilters.size}`,hex=color.replace('#','');
  const values=[0,2,4,6].map((offset,index)=>index===3&&hex.length<8?1:parseInt(hex.slice(offset,offset+2),16)/255);
  definitions.push(`<filter id="${id}" color-interpolation-filters="sRGB"><feComponentTransfer>${['R','G','B','A'].map((c,i)=>`<feFunc${c} type="linear" slope="${values[i]}"/>`).join('')}</feComponentTransfer></filter>`);
  colorFilters.set(color,id);return id;
}
async function text(value,rect,size=16,color='#fff0c8',align=0,outline=0,outlineColor='#081421'){
  if(value.includes('\n')){
    let output='';
    for(const [index,line] of value.split('\n').entries())output+=await text(line,[rect[0],rect[1]+index*font.lineHeight*size/font.size,rect[2],rect[3]],size,color,align,outline,outlineColor);
    return output;
  }
  const scale=size/font.size,width=[...value].reduce((sum,char)=>sum+(font.glyphs.get(char.codePointAt(0))?.xadvance??12)*scale,0);
  const x=rect[0]+(align===1?(rect[2]-width)/2:align===2?rect[2]-width:0),y=rect[1];
  let paths='',cursor=0;
  for(const char of value){
    const glyph=font.glyphs.get(char.codePointAt(0));
    if(!glyph)throw new Error(`Font has no glyph ${JSON.stringify(char)} in ${JSON.stringify(value)}`);
    if(glyph.width&&glyph.height)paths+=`<svg x="${x+(cursor+glyph.xoffset)*scale}" y="${y+glyph.yoffset*scale}" width="${glyph.width*scale}" height="${glyph.height*scale}" viewBox="${glyph.x} ${glyph.y} ${glyph.width} ${glyph.height}"><use href="#font-atlas"/></svg>`;
    cursor+=glyph.xadvance;
  }
  return `<g filter="url(#${colorFilter(color)})">${paths}</g>`;
}
function rectangle(rect,color,stroke='',strokeWidth=0){return `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}" fill="${color}"${stroke?` stroke="${stroke}" stroke-width="${strokeWidth}"`:''}/>`;}
async function fitTexture(file,rect){
  const image=await asset(file),scale=Math.min(rect[2]/image.width,rect[3]/image.height);
  return nested(image,rect[0]+(rect[2]-image.width*scale)/2,rect[1]+(rect[3]-image.height*scale)/2,image.width*scale,image.height*scale);
}
async function cannon(snapshot){
  if(snapshot.cannonVisuals){
    let output='';
    for(const part of snapshot.cannonVisuals){
      const item=await asset(part.texture);
      output+=`<g transform="translate(${part.position.join(' ')}) rotate(${part.rotation*180/Math.PI}) scale(${part.scale.join(' ')})">${nested(item,0,0,item.width,item.height)}</g>`;
    }
    if(snapshot.cannonSelected){
      definitions.push('<filter id="cannon-outline" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="2" result="expanded"/><feComposite in="expanded" in2="SourceAlpha" operator="out" result="edge"/><feFlood flood-color="#ffd452"/><feComposite in2="edge" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
      return `<g filter="url(#cannon-outline)">${output}</g>`;
    }
    return output;
  }
  const ground=snapshot.cannon,angle=snapshot.angle,recoil=snapshot.recoil??0;
  const base=await asset('assets/cannon/base.svg'),barrel=await asset('assets/cannon/barrel.svg'),cap=await asset('assets/cannon/trunnion.svg');
  return `<g transform="translate(${ground[0]} ${ground[1]})">${nested(base,-51,-78,150,78)}<g transform="translate(0 -55) rotate(${angle})">${nested(barrel,-104+recoil,-25,144,50)}</g>${nested(cap,-13,-68,26,26)}</g>`;
}
async function render(snapshot){
  definitions=[];colorFilters.clear();
  font=await loadFont(snapshot.font??'assets/font/fuhotoki-pixel.fnt');
  let output=nested(await asset(`assets/maps/${snapshot.map}.png`),0,0,960,540);
  for(const body of snapshot.movingTerrain??[]){
    const item=await asset(`assets/effects/${body.hanging?'pendant-lamp':'moving-platform'}.svg`),[w,h]=body.size;
    const cable=body.hanging?`<path d="M0 ${-body.length}V${-h/2}" stroke="#182733" stroke-width="4"/>`:'';
    output+=`<g transform="translate(${body.position.join(' ')}) rotate(${body.rotation*180/Math.PI})">${cable}${nested(item,-w/2,-h/2,w,h)}</g>`;
  }
  if(snapshot.playable){
    const r=snapshot.scoreZone;
    const points=snapshot.scoreMarker??[[r[0]+18,r[1]+r[3]-14],[r[0]+r[2]-18,r[1]+r[3]-14],[r[0]+r[2],r[1]+r[3]+8],[r[0],r[1]+r[3]+8]];
    output+=`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="#19f2e624" stroke="#44f4e9" stroke-width="3" stroke-dasharray="10 8"/>`;
  }
  for(const point of snapshot.trajectory??[]){
    const alpha=Math.round(point[2]*255).toString(16).padStart(2,'0');
    output+=rectangle([point[0]-4,point[1]-4,8,8],`#060a14${alpha}`);
    output+=rectangle([point[0]-2,point[1]-2,4,4],`#${(point[3]??'ff67db').slice(0,6)}${alpha}`);
  }
  for(const points of snapshot.tutorialArrows??[])output+=`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="#ffd36c" stroke="#080d14" stroke-width="3"/>`;
  output+=await cannon(snapshot);
  for(const actor of snapshot.actors){
    const sprite=await asset(actor.texture),p=actor.visualPosition,scale=actor.visualScale;
    output+=`<g transform="translate(${actor.x} ${actor.y}) rotate(${actor.rotation*180/Math.PI})"><g transform="translate(${p[0]} ${p[1]}) scale(${scale[0]} ${scale[1]})">${nested(sprite,0,0,sprite.width,sprite.height)}</g></g>`;
  }
  const wave=await asset(`assets/effects/water-flow-${Math.floor(snapshot.elapsed*6)%2}.svg`),ice=await asset('assets/effects/ice-tile.svg');
  for(const region of snapshot.waterRegions??[]){
    if(region[2]<=0||region[3]<=0)continue;
    output+=rectangle(region,'#2ea1cc7a');
    for(let x=region[0];x<region[0]+region[2];x+=32)output+=nested(wave,x,region[1]-4,Math.min(32,region[0]+region[2]-x),22);
  }
  for(const cell of snapshot.waterCells??[]){
    const h=Math.min(1,Math.max(0,cell.amount))*16;
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
  if(snapshot.loadedItem?.texture){
    const loaded=snapshot.loadedItem,item=await asset(loaded.texture),w=item.width*loaded.scale[0],h=item.height*loaded.scale[1];
    output+=nested(item,loaded.position[0]-w/2,loaded.position[1]-h/2,w,h);
  }
  for(const c of snapshot.controls){
    const r=c.rect;
    if(c.type==='label')output+=await text(c.text,r,c.fontSize,'#'+c.color,c.align,c.outlineSize,'#'+c.outline);
    else if(c.type==='button'){
      output+=rectangle(r,'#'+(c.background??'193346'),'#'+(c.border??'080f18'),2);
      output+=await text(c.text,[r[0],r[1]+(r[3]-c.fontSize*1.25)/2,r[2],c.fontSize*1.25],c.fontSize,c.disabled?'#668091':'#f7e9ba',1);
    }else if(c.type==='line_edit'){
      output+=rectangle(r,'#0e2232',c.focused?'#ffd36c':'#668091',2);
      const clip=`input-${definitions.length}`;
      definitions.push(`<clipPath id="${clip}">${rectangle([r[0]+6,r[1]+2,r[2]-(c.clearEnabled&&c.text?30:12),r[3]-4],'#fff')}</clipPath>`);
      output+=`<g clip-path="url(#${clip})">${await text(c.text||c.placeholder,[r[0]+7,r[1]+(r[3]-c.fontSize*1.25)/2,r[2]-14,r[3]],c.fontSize,c.text?'#f7e9ba':'#a5b8c2')}</g>`;
      if(c.clearEnabled&&c.text){const x=r[0]+r[2]-14,y=r[1]+r[3]/2;output+=`<path d="M${x-3} ${y-3}L${x+3} ${y+3}M${x+3} ${y-3}L${x-3} ${y+3}" stroke="#a5b8c2" stroke-width="2"/>`;}
    }else if(c.type==='texture')output+=await fitTexture(c.texture,r);
    else if(c.type==='slider'){
      const f=(c.value-c.minimum)/(c.maximum-c.minimum),cy=r[1]+r[3]/2;
      const knobX=r[0]+8+(r[2]-16)*f;
      output+=rectangle([r[0],cy-5,r[2],10],'#273944','#080d14',3);
      output+=rectangle([r[0],cy-5,knobX-r[0],10],c.editable===false?'#668091':'#e8af45','#080d14',3);
      output+=rectangle([knobX-8,cy-13,16,26],'#080d14');
      output+=rectangle([knobX-5,cy-10,10,20],c.editable===false?'#668091':'#ffe09a');
    }else if(c.type==='rect')output+=rectangle(r,'#'+c.color);
    else if(c.type==='panel')output+=rectangle(r,'#142c3e','#080f18',4);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 960 540" fill="none" shape-rendering="crispEdges"><defs>${definitions.join('')}</defs>${output}</svg>`;
}
const names=['01-initial','01-after-five','04-alley','18-ice','01-final-score','01-result','catalog-search','catalog-search-history'];
const stages=JSON.parse(await read('data/stages.json')).stages;
for(let page=1;page<=Math.ceil(stages.length/15);page++)names.push(`maps-page-${page}`);
for(const stage of stages)if(stage.id>=21)names.push(stage.map);
for(const name of names){
  const snapshot=JSON.parse(await read(`previews/game-state-${name}.json`));
  const svg=await render(snapshot);
  await sharp(Buffer.from(svg)).png().toFile(path.join(root,`previews/game-${name}.png`));
}
const extraStages=stages.filter(stage=>stage.id>=21);
await sharp({create:{width:1440,height:Math.ceil(extraStages.length/3)*270,channels:4,background:'#080f18'}}).composite(await Promise.all(extraStages.map(async(stage,index)=>({input:await sharp(path.join(root,`previews/game-${stage.map}.png`)).resize(480,270,{kernel:'nearest'}).png().toBuffer(),left:(index%3)*480,top:Math.floor(index/3)*270})))).png().toFile(path.join(root,'previews/extra-game-stages.png'));
await fs.writeFile(path.join(root,'previews/game-preview-info.json'),JSON.stringify({source:'Godot 4.7.2 headless debug_snapshot from real physics and gameplay',renderer:'Node.js sharp: actual sprite assets and custom FNT glyph atlas composed at recorded positions',browserUsed:false,engineFramebuffer:false,files:[...names.map(n=>`game-${n}.png`),'extra-game-stages.png']},null,2));
console.log(`Rendered ${names.length} game-state previews from real Godot physics snapshots, not browser screenshots or captured JPEGs.`);
