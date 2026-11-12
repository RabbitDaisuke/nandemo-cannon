// Authored electronics store. Reuses existing item IDs and the common queue sampler.
// Entry point: ./build.sh selection-items; the final map pass refreshes manifests.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp; try {sharp=require('sharp');} catch {sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'','sharp'));}
const read=async name=>JSON.parse(await fs.readFile(path.join(root,`data/${name}.json`),'utf8'));
const [stages,ui,manifest]=await Promise.all(['stages','ui-ja','objects-manifest'].map(read));
const stage={
 id:52,nameJa:'かでんりょうはんてん',map:'52-electronics-store',status:'specified',sequenceGroup:0,gravity:980,
 cannon:[810,450],scoreZone:[20,125,610,325],scoreGroundY:450,
 terrain:[
  {rect:[0,450,960,90]}, {rect:[0,110,20,340]},
  {rect:[20,270,240,18]}, {rect:[20,374,170,18]},
  {polygon:[[260,270],[420,390],[420,408],[260,288]]},
  {rect:[420,390,190,60]}
 ],
 // Oversized queues already draw fifteen distinct kinds in seeded random order.
 // Repeated washing-machine in the request is one kind, not an extra weight.
 queue:[
  'desktop-pc','keyboard','wired-mouse','monitor','tablet','smartphone',
  'game-console','game-cartridge','pro-controller','game-controller','sd-card','usb-drive',
  'gift-box','toy-train','trumpet','cute-doll','toy-package','rubber-duck','toy-car',
  'refrigerator','washing-machine','crt-tv','flat-tv','microwave','toaster','rice-cooker',
  'vacuum','fan','heater','alarm-clock','camera','pocket-watch','impact-wrench','charger',
  'oven','cash-reader','shredder','pc-cable','electric-screwdriver','sewing-machine',
  'water-heater','water-heater-panel','bathroom-scale','chicken-roaster',
  'white-printer','robot-vacuum','air-conditioner','coffee-maker','desk-telephone','audio-interface'
 ],
 preplaced:[],
 lesson:'かでんも おもちゃも だいしゅうごう！\nたなと スロープをつかって つみあげよう！'
};
const ids=new Set(manifest.items.map(item=>item.id));
if(stage.queue.some(id=>!ids.has(id))) throw Error('Unknown electronics-store item');
const coverage=JSON.parse(await fs.readFile(path.join(root,'assets/font/generated-coverage.json'),'utf8')).chars;
for(const c of stage.nameJa+stage.lesson) if(!/\s/u.test(c)&&!coverage.includes(c)) throw Error(`Unsupported map glyph ${c}`);
const index=stages.stages.findIndex(s=>s.id===stage.id);
if(index<0) stages.stages.push(stage); else stages.stages[index]=stage;
ui.stages[stage.id-1]=stage.nameJa;
ui.lessons[stage.id-1]=stage.lesson;

const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const ink='#203548',white='#eee8d6',blue='#397a91',red='#b96559';
// Pale back-wall product displays are scenery. Dark-edged shelves below collide.
let art=R(0,0,960,540,'#d4dcd5')+R(20,110,940,340,'#cbd8d3')+
 R(20,110,940,12,'#8eabae')+R(20,122,940,4,'#b7c9c2')+
 R(20,126,940,6,'#e8e8d4')+R(20,414,940,36,'#a4b8b6');
// Ceiling light strips and recessed display bays give the shop its wide floor.
for(const x of [76,366,656]) art+=R(x,65,222,13,'#a6bab8')+R(x+6,68,210,6,'#f2eed9');
art+=R(43,153,246,271,'#b9ccc7')+R(49,159,234,257,'#d1ded1');
for(const y of [178,210,242,274,306,338,370,402]) for(const x of [65,97,129,161,193,225,257]) art+=R(x,y,2,3,'#b3c6bd');
// Three muted television displays, with matching stands and price cards.
for(const [i,x] of [326,524,722].entries()) {
 art+=R(x,154,178,135,'#b3c8c5')+R(x+5,159,168,125,'#d5dfd1')+
  R(x+12,173,154,88,'#819f9f')+R(x+17,178,144,77,'#abc5c4')+
  P(`M${x+18} 229L${x+52} 206L${x+86} 224L${x+124} 195L${x+160} 222V254H${x+18}Z`,'#98b9b6')+
  P(`M${x+25} 180H${x+39}L${x+99} 253H${x+85}Z`,'#c3d6cb')+
  R(x+80,261,17,10,'#91aba6')+R(x+57,271,65,4,'#91aba6')+
  R(x+18,278,47,11,'#dbd9bd')+R(x+21,281,17,3,'#ae8d78')+
  R(x+42,281,18,3,'#a5b7a7')+R(x+7,165,30,3,['#a3bbae','#b5bba3','#a5b9bf'][i]);
}
// Distant appliance aisle: closed tops/fronts/right sides, not hollow cabinets.
for(const [x,w] of [[674,70],[766,63],[848,70]]) {
 art+=P(`M${x+9} 309H${x+w}L${x+w+9} 318V415L${x+w} 424H${x+9}Z`,'#92aaa7')+
  R(x,318,w,106,'#c3d0c2')+P(`M${x} 318L${x+9} 309H${x+w}V318Z`,'#e0e3cd')+
  R(x+6,324,w-12,45,'#cfdbca')+R(x+6,372,w-12,45,'#b9cbbb')+
  R(x+7,368,w-14,3,'#9bb5ab')+R(x+w-15,335,4,20,'#93aca3')+
  R(x+w-15,383,4,18,'#93aca3')+R(x+9,329,24,6,'#e4dbbd');
}
// Rear checkout desk stays pale and behind the cannon, with no hidden collider.
art+=R(610,346,42,44,'#9eb9b2')+R(615,351,32,29,'#c7d7c7')+
 R(625,389,14,8,'#a1b7aa')+R(605,396,61,8,'#a6b8aa');
// Ground line is exactly y=450. Tile joints recede toward the rear wall.
art+=R(20,450,940,90,ink)+R(20,454,940,86,'#b0bcb6')+R(20,454,940,5,'#e0dfca');
for(const y of [481,518]) art+=R(20,y,940,2,'#91a7a5');
for(const x of [76,194,312,430,548,666,784,902]) art+=P(`M${x} 459L${x+(x-480)*.18} 540H${x+(x-480)*.18+2}L${x+2} 459Z`,'#91a7a5');
// Cantilever shelves are anchored to the solid left wall. Their bays stay open.
for(const [x,y,w,h] of [[20,270,240,18],[20,374,170,18]]) {
 art+=R(x,y,w,h,ink)+R(x,y+3,w-3,4,white)+R(x,y+7,w-3,h-10,blue)+
  R(x+13,y+9,33,4,'#efc686')+R(x+51,y+9,21,4,'#b8d3cc')+
  R(x+w-28,y+7,23,h-10,'#2d617a');
}
// A fixed loading ramp links the upper shelf to a low showroom island.
// Its underside is a real open passage, not a filled triangular collider.
art+=P('M260 270L420 390V408L260 288Z',ink)+
 P('M260 274L417 392V396L260 278Z','#e2d9b9')+
 P('M260 281L417 399V403L260 285Z','#658c98');
for(let n=1;n<10;n++) {
 const x=260+n*16,y=270+n*12;
 art+=P(`M${x} ${y+4}L${x+3} ${y+6}V${y+10}L${x} ${y+8}Z`,'#8a9f9b');
}
// Closed display pedestal, with its top edge shared by the static body.
art+=R(420,390,190,60,ink)+R(423,393,184,6,white)+R(423,399,184,47,'#b8c9c3')+
 R(423,399,184,9,red)+R(429,401,42,5,'#f1d6a7')+R(478,401,27,5,'#dcccb2')+
 R(595,408,12,38,'#8ba8ad')+R(428,440,167,6,'#7896a0')+
 R(433,418,148,3,'#d8ded0')+R(433,426,112,3,'#a8bdb7');
// Left wall remains physical across the full height of the playing area.
art+=R(0,110,20,340,ink)+R(3,113,13,337,'#7799a4')+R(13,113,3,337,'#bbd3cf');
for(const y of [194,298,402]) art+=R(6,y,4,4,'#c8d6c8');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${art}</svg>\n`;
await fs.writeFile(path.join(root,`assets/maps/${stage.map}.svg`),svg,'utf8');
await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${stage.map}.png`));
const shapes=stage.terrain.map(t=>t.rect?R(...t.rect,'#50f0aa'):`<polygon points="${t.polygon.map(p=>p.join(',')).join(' ')}"/>`).join('');
const overlay=`<svg width="960" height="540"><g fill="#50f0aa" fill-opacity=".2" stroke="#50f0aa" stroke-width="2">${shapes}</g></svg>`;
await sharp(Buffer.from(svg)).composite([{input:Buffer.from(overlay),left:0,top:0}]).png().toFile(path.join(root,'previews/electronics-store-colliders.png'));
for(const [name,data] of [['stages',stages],['ui-ja',ui]]) await fs.writeFile(path.join(root,`data/${name}.json`),JSON.stringify(data,null,2)+'\n','utf8');
console.log(`Electronics store: ${stage.queue.length} existing candidates, fifteen random throws, shelves and an open ramp.`);
