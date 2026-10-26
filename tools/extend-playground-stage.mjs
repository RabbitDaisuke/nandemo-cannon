// Authored indoor map. Rendering reviews reconstruct stage data in Node, not a browser.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp; try {sharp=require('sharp');} catch {sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'','sharp'));}
const read=async name=>JSON.parse(await fs.readFile(path.join(root,`data/${name}.json`),'utf8'));
const [stages,ui,manifest]=await Promise.all(['stages','ui-ja','objects-manifest'].map(read));
const stage={
 id:49,nameJa:'あそびば ほいくえん',map:'49-playground',status:'specified',gravity:980,
 cannon:[810,450],scoreZone:[28,100,592,350],scoreGroundY:450,
 terrain:[{rect:[0,450,960,90]},{rect:[0,100,18,350]}],
 queue:['building-blocks','teddy-bear','jump-rope','school-desk','stool','horizontal-bar','bunny-plush','sliding-window','sandbox-box','toy-car','rubber-duck','soccer-ball','snowman-plush','pillow','trampoline'],
 preplaced:[{id:'trampoline',x:330,groundY:450}],
 lesson:'ほいくえんの あそびばにきた！\nつよくあたると トランポリンでぴょーん！ じゅうごこのモノをのこそう。'
};
const ids=new Set(manifest.items.map(item=>item.id));
if(stage.queue.length!==15||stage.queue.some(id=>!ids.has(id))) throw Error('Invalid playground queue');
const coverage=JSON.parse(await fs.readFile(path.join(root,'assets/font/generated-coverage.json'),'utf8')).chars;
for(const c of stage.nameJa+stage.lesson) if(!/\s/u.test(c)&&!coverage.includes(c)) throw Error(`Unsupported map glyph ${c}`);
const index=stages.stages.findIndex(s=>s.id===stage.id);
if(index<0) stages.stages.push(stage); else stages.stages[index]=stage;
ui.stages[stage.id-1]=stage.nameJa; ui.lessons[stage.id-1]=stage.lesson;
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const ink='#354953',wood='#ba9873';
const window=x=>R(x,145,186,164,'#8d9d90')+R(x+6,151,174,152,'#f1e3bb')+R(x+12,157,162,140,'#a5ccce')+
 P(`M${x+12} 258L${x+48} 228L${x+89} 253L${x+132} 221L${x+174} 250V297H${x+12}Z`,'#a7bba2')+
 P(`M${x+13} 158H${x+42}L${x+118} 297H${x+89}Z`,'#cce2d5')+R(x+88,157,8,140,'#efe2bc')+
 R(x+12,218,162,7,'#efe2bc')+R(x-4,304,194,10,wood);
let art=R(0,0,960,540,'#e6dbc0')+R(0,87,960,17,'#b9c4ac')+R(0,104,960,5,'#9aaf9d')+
 window(64)+window(291)+
 R(547,147,128,140,'#c1a481')+R(553,153,116,128,'#f2dfb0')+
 P('M565 256L585 215L605 256Z','#a3b9a0')+P('M598 256L625 199L653 256Z','#a4c3b2')+
 P('M574 173H588V179H594V193H588V199H574V193H568V179H574Z','#e2b66e')+
 R(726,147,163,273,'#a08e79')+R(733,154,149,259,'#d6bd94')+R(740,161,135,251,'#e4cda6')+
 R(754,177,107,126,'#97b7b7')+R(759,182,97,116,'#c0d4c7')+R(745,322,11,27,'#b18c65')+R(748,327,5,17,'#e7d8b5')+
 R(18,339,942,103,'#c2c8aa')+R(18,339,942,7,'#97ae9c')+R(18,431,942,19,'#a58969');
// Low cubbies and toys sit in the background plane; only the floor and left wall collide.
art+=R(62,352,560,77,'#a58b6b')+R(68,358,548,63,'#d5bc92');
for(let i=0;i<6;i++){
 const x=75+i*90;
 art+=R(x,365,80,49,'#9c9d82')+R(x+4,369,72,40,'#afad8d');
 const c=['#bc9982','#a2b5a6','#b9b68b'][i%3];
 art+=P(`M${x+9} 383H${x+70}L${x+65} 408H${x+14}Z`,c)+R(x+29,388,22,5,'#d7cbaa');
}
art+=R(0,100,18,350,ink)+R(3,103,12,341,'#9eae9a')+R(12,104,3,337,'#ced0ac')+
 R(0,450,960,90,ink)+R(18,453,942,87,'#c8a57c')+R(18,453,942,6,'#eed2a2');
for(const y of [481,512]) art+=R(18,y,942,2,'#b18c69');
for(const x of [80,230,380,530,680,830]) art+=P(`M${x} 459L${x-22} 540H${x-20}L${x+2} 459Z`,'#b18c69');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${art}</svg>\n`;
await fs.writeFile(path.join(root,`assets/maps/${stage.map}.svg`),svg,'utf8');
await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${stage.map}.png`));
const layers=[];
for(const entry of stage.preplaced){
 const item=manifest.items.find(i=>i.id===entry.id),s=item.worldScale;
 const sprite=await sharp(path.join(root,'assets',item.svg)).resize({width:Math.round(item.worldWidth),kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
 layers.push({input:sprite.data,left:Math.round(entry.x+(item.viewBox[0]-item.pivotSource[0])*s),top:Math.round(entry.groundY-sprite.info.height)});
}
await sharp(Buffer.from(svg)).composite(layers).png().toFile(path.join(root,'previews/playground-placed.png'));
const overlay=`<svg width="960" height="540"><g fill="#50f0aa" fill-opacity=".2" stroke="#50f0aa" stroke-width="2">${stage.terrain.map(t=>R(...t.rect,'#50f0aa')).join('')}</g></svg>`;
await sharp(Buffer.from(svg)).composite([...layers,{input:Buffer.from(overlay),left:0,top:0}]).png().toFile(path.join(root,'previews/playground-colliders.png'));
for(const [name,data] of [['stages',stages],['ui-ja',ui]]) await fs.writeFile(path.join(root,`data/${name}.json`),JSON.stringify(data,null,2)+'\n','utf8');
console.log('Playground: 15 throws, moving trampoline, solid left wall.');
