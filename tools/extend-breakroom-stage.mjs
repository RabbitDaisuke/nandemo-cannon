// Authored office lounge. Item search vocabulary is maintained separately by hand.
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
 id:50,nameJa:'きゅうけいじょ',map:'50-breakroom',status:'specified',gravity:980,
 cannon:[810,450],scoreZone:[35,100,590,350],scoreGroundY:450,
 terrain:[{rect:[0,450,960,90]},{rect:[0,100,18,350]}],
 queue:['bench-seat','vending-machine','sofa','takeaway-coffee','paper-cup','homemade-bento','nori-bento','bottled-coffee','suit-jacket','necktie','smartphone','tablet','bed','refrigerator','washing-machine','flat-tv','microwave','fan','desk','coffee-maker'],
 preplaced:[],
 lesson:'オフィスの きゅうけいじょで ひとやすみ！\nにじゅっしゅるいから じゅうごこ！ おべんとうも かぐも つみあげよう。'
};
const ids=new Set(manifest.items.map(item=>item.id));
if(stage.queue.length<15||stage.queue.some(id=>!ids.has(id))) throw Error('Invalid breakroom queue');
const coverage=JSON.parse(await fs.readFile(path.join(root,'assets/font/generated-coverage.json'),'utf8')).chars;
for(const c of stage.nameJa+stage.lesson) if(!/\s/u.test(c)&&!coverage.includes(c)) throw Error(`Unsupported map glyph ${c}`);
const index=stages.stages.findIndex(s=>s.id===stage.id);
if(index<0) stages.stages.push(stage); else stages.stages[index]=stage;
ui.stages[stage.id-1]=stage.nameJa;
ui.lessons[stage.id-1]=stage.lesson;

const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const ink='#364750',cream='#e7e2cb',shadow='#778d8b',wood='#b68e65';
// Muted furnishings stay on the back wall. Only the floor and left wall collide.
let art=R(0,0,960,540,cream)+R(0,88,960,20,'#cbd1bf')+R(0,108,960,6,'#91a89e')+
 R(18,116,942,266,'#dddcc9')+R(18,376,942,74,'#bcc5b4')+R(18,376,942,7,'#a1b3a5');
// A wide recessed window, a subdued city silhouette and repeated mullions.
art+=R(66,145,358,166,shadow)+R(72,151,346,154,'#f0e9cd')+R(79,158,332,140,'#aacbd0')+
 R(83,235,42,63,'#95aeb5')+R(132,211,51,87,'#91aab3')+R(191,243,37,55,'#9bb7b7')+
 R(236,202,56,96,'#91adb6')+R(300,227,49,71,'#a0b8b8')+R(357,215,50,83,'#8fa9b1')+
 [94,144,158,248,264,312,324,369,386].map((x,i)=>R(x,251-(i%3)*13,5,9,'#c2d1c7')+R(x,274,5,9,'#c2d1c7')).join('')+
 P('M80 158H104L187 298H163Z','#bfd8d4')+P('M270 158H284L367 298H353Z','#bfd8d4')+
 R(185,158,7,140,'#e5dfc5')+R(299,158,7,140,'#e5dfc5')+R(79,220,332,6,'#e5dfc5')+
 R(59,307,372,9,wood)+R(64,307,361,3,'#dbc098');
// Clock and notice board have deliberately quiet contrast behind the score area.
art+=P('M470 145H499L512 158V187L499 200H470L457 187V158Z',shadow)+
 P('M472 151H497L506 160V185L497 194H472L463 185V160Z','#f1e9cf')+
 R(483,156,3,5,'#9fa99d')+R(483,186,3,5,'#9fa99d')+R(467,170,5,3,'#9fa99d')+R(498,170,5,3,'#9fa99d')+
 R(483,161,3,14,'#6f8587')+R(485,171,12,3,'#6f8587')+
 R(449,224,92,96,wood)+R(454,229,82,86,'#b5ae85')+R(463,238,57,55,'#e8dec0')+
 R(469,247,43,3,'#a1aa99')+R(469,257,31,3,'#a1aa99')+R(469,267,38,3,'#a1aa99')+R(486,235,5,5,'#ba8d74');
// Low upholstered bench on the distant wall, with the visible feet meeting it.
art+=R(76,338,329,71,'#8c9f96')+R(83,344,315,59,'#aab8a4')+
 R(89,350,148,41,'#b6c2ac')+R(243,350,148,41,'#b6c2ac')+
 P('M83 392H398L411 402V417H71V402Z','#81978f')+P('M85 396H395L402 402H78Z','#c2cbb4')+
 R(81,414,9,16,'#7c8d83')+R(391,414,9,16,'#7c8d83');
// kitchenette with a sealed worktop, cupboard handles, tiled backsplash and kettle.
art+=R(578,180,330,78,'#b8c5b9')+R(581,183,324,72,'#ced3bf');
for(const x of [620,662,704,746,788,830,872]) art+=R(x,183,2,72,'#b0bfae');
art+=R(581,216,324,2,'#b0bfae')+R(575,325,340,105,'#849994')+
 R(581,334,328,90,'#bac3ad')+R(687,334,3,90,'#8b9f92')+R(798,334,3,90,'#8b9f92')+
 R(665,350,4,23,'#6c8584')+R(705,350,4,23,'#6c8584')+R(817,350,4,23,'#6c8584')+
 P('M575 319H902L917 325V334H575Z','#637b7c')+P('M579 321H901L909 325H579Z','#d8d6bc')+
 R(597,284,47,35,'#a3b3a3')+P('M599 280L608 271H636L644 281V310H599Z','#8fa39d')+
 R(605,281,32,24,'#bbc8b6')+R(610,267,24,6,'#708b88')+R(641,280,12,6,'#819b93')+R(649,285,5,18,'#819b93')+R(641,302,12,5,'#819b93')+
 R(677,270,64,49,'#8a9e98')+R(682,275,54,36,'#bac6b4')+R(689,279,34,23,'#5d7b7c')+
 R(728,281,4,4,'#d7c48f')+R(728,290,4,8,'#9bab9b')+
 P('M765 307H800L795 319H770Z','#d6d3b8')+R(769,309,26,3,'#f0e3bf')+
 R(833,282,40,37,'#a6b3a1')+R(839,288,28,25,'#d0d4b8')+
 P('M846 283L837 270L840 256L849 270L853 247L863 254L859 274L871 265L878 271L861 286Z','#96ab8b');
// Ground is flush with the physics floor. Tile perspective converges at the wall.
art+=R(18,432,942,18,'#91a599')+R(18,442,942,8,'#7b938b')+
 R(0,450,960,90,ink)+R(18,454,942,86,'#b3b8a6')+R(18,454,942,5,'#d4d3b7');
for(const y of [480,515]) art+=R(18,y,942,2,'#919f94');
for(const x of [65,200,335,470,605,740,875]) art+=P(`M${x} 459L${x+(x-480)*.16} 540H${x+(x-480)*.16+2}L${x+2} 459Z`,'#919f94');
art+=R(0,100,18,350,ink)+R(3,104,12,342,'#a5b7a7')+R(12,105,3,336,'#ccd1b9');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${art}</svg>\n`;
await fs.writeFile(path.join(root,`assets/maps/${stage.map}.svg`),svg,'utf8');
await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${stage.map}.png`));
await sharp(Buffer.from(svg)).png().toFile(path.join(root,'previews/breakroom-placed.png'));
const overlay=`<svg width="960" height="540"><g fill="#50f0aa" fill-opacity=".2" stroke="#50f0aa" stroke-width="2">${stage.terrain.map(t=>R(...t.rect,'#50f0aa')).join('')}</g></svg>`;
await sharp(Buffer.from(svg)).composite([{input:Buffer.from(overlay),left:0,top:0}]).png().toFile(path.join(root,'previews/breakroom-colliders.png'));
for(const [name,data] of [['stages',stages],['ui-ja',ui]]) await fs.writeFile(path.join(root,`data/${name}.json`),JSON.stringify(data,null,2)+'\n','utf8');
console.log('Breakroom: twenty candidates, fifteen random throws, solid office floor.');
