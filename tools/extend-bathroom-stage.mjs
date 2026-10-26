// Authored tiled bathroom; static water is drawn by LiquidField, never baked here.
// Entry point: ./build.sh selection-items. Search tags are maintained separately.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp; try {sharp=require('sharp');} catch {sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'','sharp'));}
const read=async name=>JSON.parse(await fs.readFile(path.join(root,`data/${name}.json`),'utf8'));
const [stages,ui,manifest]=await Promise.all(['stages','ui-ja','objects-manifest'].map(read));
const candidates=['yellow-washbowl','wooden-washbowl','shower-head','mini-bathtub','rubber-duck','shampoo-bottle','shampoo-hat','soap','water-heater-panel','water-heater','ventilation-fan','sliding-window','bath-hose','bath-mat','towel','toothbrush','toothpaste','bath-stool'];
const seat=(x,y)=>({polygon:[[x,y],[x+12,y-12],[x+76,y-12],[x+88,y],[x+88,y+12],[x,y+12]]});
const stage={
 id:51,nameJa:'おふろば',map:'51-bathroom',status:'specified',gravity:980,
 cannon:[810,450],scoreZone:[30,125,610,365],scoreGroundY:450,
 terrain:[
  {rect:[0,500,960,40]}, {rect:[0,100,18,400]}, {rect:[18,450,12,50]},
  {rect:[30,390,24,110]}, {rect:[54,486,240,14]}, {rect:[294,390,24,110]},
  {rect:[318,450,312,50],slipFactor:1.3}, {rect:[630,450,330,50]},
  seat(366,414), {rect:[376,426,14,24]}, {rect:[430,426,14,24]},
  seat(520,394), {rect:[530,406,14,44]}, {rect:[584,406,14,44]}
 ],
 // Twenty authored entries; the two sponges are guaranteed, not a weight hint.
 queue:[...candidates.slice(0,14),'sponge','sponge',...candidates.slice(14)],
 queueSlots:[{candidates,count:13},{candidates:['sponge']},{candidates:['sponge']}],
 shuffleQueue:true,preplaced:[],
 water:[{rect:[54,418,240,68],direction:[0,0],speed:0,type:'pool',finite:true}],
 lesson:'おふろばは ツルツル！ でこぼこの ゆかに きをつけよう。\nスポンジふたつで みずをすいとって つみあげよう！'
};
const ids=new Set(manifest.items.map(item=>item.id));
if(stage.queue.some(id=>!ids.has(id))) throw Error('Unknown bathroom item');
const coverage=JSON.parse(await fs.readFile(path.join(root,'assets/font/generated-coverage.json'),'utf8')).chars;
for(const c of stage.nameJa+stage.lesson) if(!/\s/u.test(c)&&!coverage.includes(c)) throw Error(`Unsupported map glyph ${c}`);
const index=stages.stages.findIndex(s=>s.id===stage.id);
if(index<0) stages.stages.push(stage); else stages.stages[index]=stage;
ui.stages[stage.id-1]=stage.nameJa; ui.lessons[stage.id-1]=stage.lesson;

const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const E=(d,c)=>`<path d="${d}" fill="${c}" stroke="#172b35" stroke-width="4" stroke-linejoin="miter"/>`;
const ink='#172b35',edge='#637f89',tile='#d3e1d6',cream='#f1e8cf',shadow='#9cb8b4';
let art=R(0,0,960,540,'#c7dad4')+R(18,100,942,350,'#d5e4d7');
// Quiet tile grout stays behind objects and the scoring frame.
for(const y of [120,170,220,270,320,370,420]) art+=R(18,y,942,2,'#b2cac4')+R(18,y+2,942,1,'#e5ebda');
for(const x of [48,118,188,258,328,398,468,538,608,678,748,818,888]) art+=R(x,102,2,348,'#b2cac4');
art+=R(18,113,942,7,'#94b8b1')+R(18,116,942,2,'#bbd3c5');
// Frosted window, two mirrors, a restrained shower rail and mixer.
art+=R(60,151,237,132,'#89a8aa')+R(66,157,225,120,'#f0e8cf')+R(73,164,211,106,'#afcfcc')+
 P('M76 164H95L176 270H157Z','#c5dcd0')+P('M223 164H237L284 224V245Z','#c5dcd0')+
 R(175,164,6,106,'#f0e8cf')+R(73,214,211,5,'#f0e8cf')+R(54,279,249,7,'#7b999b')+R(58,279,241,3,'#e6dec4');
for(const x of [366,520]) art+=R(x+4,175,82,132,'#87a4a7')+R(x+8,179,74,124,'#e3e9d6')+R(x+14,185,62,112,'#aac9ce')+
 P(`M${x+17} 185H${x+29}L${x+76} 250V268Z`,'#c9ded6')+P(`M${x+17} 245L${x+52} 297H${x+43}L${x+17} 260Z`,'#c9ded6')+
 R(x+5,309,80,7,'#7f9e9e')+R(x+8,309,74,3,'#dfdfc6');
art+=R(663,170,7,182,'#7b999d')+R(664,173,2,173,'#dbe7dc')+
 P('M664 176V162L674 151H697V158H677L670 165V176Z','#79969a')+
 P('M687 157L699 147L716 157L711 166Z','#6c8d93')+P('M690 157L699 151L711 157L708 161Z','#d1e0d4')+
 P('M666 342H692V353H666Z','#78969a')+R(669,344,19,4,'#d0e0d5')+R(676,334,5,9,'#a0b8b6')+
 P('M691 348H708V395L700 404H688L678 393V367H682V392L690 400H698L704 393V352H691Z','#9eb6b4');
// Distant control panel and folded towels use subdued closed cabinet faces.
art+=E('M761 176H859L869 186V247L859 257H761Z','#9cb3b1')+
 E('M751 186H859V257H751Z','#ced9c8')+E('M751 186L761 176H859V186Z','#e9e9d0')+
 R(764,199,54,23,'#8da6a4')+R(769,204,44,13,'#b8c9b4')+R(826,201,15,7,'#b4c5b0')+
 R(826,214,15,7,'#b4c5b0')+R(764,234,76,3,'#a0b9b0')+
 R(765,329,109,38,'#b1b7a6')+R(770,333,99,11,'#dcd6b6')+R(770,348,99,11,'#d0c4a9')+
 R(776,335,3,7,'#c2b696')+R(861,335,3,7,'#c2b696')+R(764,367,112,5,'#829e9a');
// Actual floor and tub walls have their visible outlines exactly on collision bounds.
art+=R(18,450,942,90,ink)+R(20,454,940,86,'#a4bcb6')+R(318,454,312,46,'#a8ced0')+
 R(320,454,308,5,'#d3e4dd')+R(634,454,326,5,'#d3e0cf');
for(const y of [476,505]) art+=R(20,y,940,2,'#7f9e9e');
for(const x of [80,170,260,350,440,530,620,710,800,890]) art+=P(`M${x} 454L${x+(x-480)*.13} 540H${x+(x-480)*.13+2}L${x+2} 454Z`,'#7f9e9e');
// Gloss streaks identify the moderately slippery floor, without baked-in water.
art+=P('M332 461H359L349 464H327Z','#d9eae3')+P('M469 464H494L488 467H463Z','#d9eae3')+P('M602 460H619L612 463H598Z','#d9eae3');
// Recessed bathtub: dry enamel until LiquidField paints the finite water over it.
art+=R(54,390,240,96,'#adc6bc')+R(58,394,232,88,'#d6e3cb')+R(62,398,224,80,'#c6dbca')+
 R(54,480,240,6,'#9eb9ae')+R(30,390,24,110,ink)+R(34,394,16,102,tile)+R(34,394,16,6,cream)+
 R(294,390,24,110,ink)+R(298,394,16,102,tile)+R(298,394,16,6,cream)+
 R(54,486,240,14,ink)+R(54,490,240,6,'#9fb9ae')+
 R(30,500,288,4,ink)+R(34,504,280,5,'#c6d6c2')+
 R(35,418,14,2,'#97b2ae')+R(35,454,14,2,'#97b2ae')+R(299,418,14,2,'#97b2ae')+R(299,454,14,2,'#97b2ae');
// A muted tap belongs to the rear wall; it is not a hidden terrain obstacle.
art+=R(136,350,60,9,'#8ca9a7')+R(141,352,50,3,'#dae4d5')+R(146,340,9,11,'#96b1ad')+R(178,340,9,11,'#96b1ad')+
 R(158,358,10,21,'#8aa7a5')+R(160,359,3,16,'#dbe5d8')+R(158,375,27,6,'#8aa7a5')+R(180,375,6,10,'#8aa7a5');
// The stool-shaped fixed steps are closed solids with open spaces between legs.
for(const [x,y] of [[366,414],[520,394]]) {
 art+=R(x+10,y+12,14,450-y-12,ink)+R(x+14,y+14,6,450-y-16,'#9bb5ac')+
  R(x+64,y+12,14,450-y-12,ink)+R(x+68,y+14,6,450-y-16,'#779d99')+
  P(`M${x} ${y}L${x+12} ${y-12}H${x+76}L${x+88} ${y}V${y+12}H${x}Z`,ink)+
  P(`M${x+4} ${y}L${x+14} ${y-8}H${x+74}L${x+84} ${y}Z`,cream)+
  R(x+4,y+2,80,6,'#aec6b6')+R(x+64,y+2,20,6,'#8caeaa');
}
art+=R(0,100,18,400,ink)+R(4,104,10,392,'#a6bfb3')+R(12,104,2,392,'#e6e6cc');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${art}</svg>\n`;
await fs.writeFile(path.join(root,`assets/maps/${stage.map}.svg`),svg,'utf8');
await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${stage.map}.png`));
await sharp(Buffer.from(svg)).png().toFile(path.join(root,'previews/bathroom-placed.png'));
const shapes=stage.terrain.map(t=>t.rect?R(...t.rect,'#50f0aa'):`<polygon points="${t.polygon.map(p=>p.join(',')).join(' ')}"/>`).join('');
const overlay=`<svg width="960" height="540"><g fill="#50f0aa" fill-opacity=".2" stroke="#50f0aa" stroke-width="2">${shapes}</g></svg>`;
await sharp(Buffer.from(svg)).composite([{input:Buffer.from(overlay),left:0,top:0}]).png().toFile(path.join(root,'previews/bathroom-colliders.png'));
for(const [name,data] of [['stages',stages],['ui-ja',ui]]) await fs.writeFile(path.join(root,`data/${name}.json`),JSON.stringify(data,null,2)+'\n','utf8');
console.log('Bathroom: twenty candidates, fifteen throws including two sponges, finite tub and local 1.3 slip factor.');
