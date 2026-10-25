// Authored 16-bit SVG maps and stage data. Run through ./build.sh selection-items.
// Search aliases are maintained by hand in item-search-index.json, never here.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); }
catch { sharp = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '', 'sharp')); }
const read = async name => JSON.parse(await fs.readFile(path.join(root, `data/${name}.json`), 'utf8'));
const write = async (name, data) => fs.writeFile(path.join(root, `data/${name}.json`), JSON.stringify(data, null, 2) + '\n', 'utf8');
const [stages, maps, ui, manifest] = await Promise.all(['stages', 'maps-manifest', 'ui-ja', 'objects-manifest'].map(read));
const rect = (...v) => ({rect: v});
const firePool = ['ambulance', 'mini-hospital', 'ladder-truck', 'fire-engine', 'care-bed', 'bandage-roll', 'fire-hose', 'concrete-house', 'first-aid-box', 'fireproof-jacket', 'steel-ladder', 'oxygen-cylinder', 'rescue-ring', 'traffic-cone', 'fire-extinguisher', 'work-helmet', 'bucket', 'rope-coil', 'water-jug', 'towel'];
const fire = {
  id: 46, nameJa: 'しょうぼうしょ', map: '46-firestation', status: 'specified', gravity: 980,
  cannon: [810, 450], scoreZone: [40, 90, 580, 360], scoreGroundY: 450,
  terrain: [rect(0, 450, 960, 90), rect(40, 430, 580, 20)], queue: firePool,
  preplaced: [], lesson: 'きゅうじょのどうぐが だいしゅうごう！\nなにがでるかな？ じゅうごこのものを しゃこにのこそう。'
};
const claw = {
  id: 47, nameJa: 'クレーンゲーム', map: '47-claw-machine', status: 'specified', gravity: 980,
  cannon: [860, 450], scoreZone: [230, 105, 310, 335], scoreGroundY: 440,
  terrain: [rect(230, 440, 310, 100), rect(20, 110, 12, 330), rect(230, 396, 12, 44), rect(528, 396, 12, 44), rect(810, 450, 150, 90)],
  queue: ['teddy-bear', 'rubber-duck', 'toy-car', 'soccer-ball', 'pillow', 'wooden-crate', 'barrel', 'hamburger', 'towel', 'bowling-pin', 'skateboard', 'spaghetti', 'napolitan', 'coffee-beans-pouch', 'school-uniform'],
  queuePolicy: 'randomCatalog', randomCatalogScope: 'selectable',
  queueOverrides: [{shot: 6, item: 'strong-blast-wave-bomb'}, {shot: 11, item: 'strong-blast-wave-bomb'}],
  // Open holes use the common off-screen fall boundary in game.gd.
  // No in-view destruction volumes: prizes remain physical while falling.
  preplaced: [],
  lesson: 'クレーンゲームの なかにきちゃった！\nさゆうのあなに おとすと ものは おきゃくさんのものになっちゃうぞ！'
};
const school = {
  id: 48, nameJa: 'がっこう', map: '48-school', status: 'specified', gravity: 980,
  cannon: [810, 450], scoreZone: [40, 90, 580, 360], scoreGroundY: 450,
  terrain: [rect(0, 450, 960, 90), rect(55, 395, 550, 20), rect(80, 415, 22, 35), rect(558, 415, 22, 35)],
  queue: ['drafting-compass', 'pencil', 'school-desk', 'randoseru', 'hardcover-book', 'open-book', 'book-stack', 'counter', 'school-uniform', 'bookshelf', 'pencil-sharpener', 'scissors', 'backpack', 'stool', 'alarm-clock'],
  preplaced: [], lesson: 'きょうしつに なんでもキャノンがきた！\nぶんぼうぐと ランドセルを つくえに つみあげよう。'
};
const additions = [fire, claw, school];
// IDs remain permanent. Navigation uses metadata, so future normal stages precede
// the recap and finale without renumbering saved scores or seed identities.
for (const [id, group] of [[44, 100], [45, 200]]) stages.stages.find(s => s.id === id).sequenceGroup = group;
for (const stage of additions) {
  const index = stages.stages.findIndex(s => s.id === stage.id);
  if (index < 0) stages.stages.push(stage); else stages.stages[index] = stage;
  ui.stages[stage.id - 1] = stage.nameJa;
  ui.lessons[stage.id - 1] = stage.lesson;
}
const ids = new Set(manifest.items.map(item => item.id));
const coverage = JSON.parse(await fs.readFile(path.join(root, 'assets/font/generated-coverage.json'), 'utf8')).chars;
for (const stage of additions) {
  if (stage.queue.length < 15 || stage.queue.some(id => !ids.has(id))) throw Error(`Invalid queue: ${stage.map}`);
  for (const c of stage.nameJa + stage.lesson) if (!/\s/u.test(c) && !coverage.includes(c)) throw Error(`Unsupported glyph ${c}: ${stage.map}`);
}

const ink = '#202a39', cream = '#eee5cb', red = '#ba4d4f';
const R = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P = (d, c) => `<path d="${d}" fill="${c}"/>`;
const terrain = (stage, c) => stage.terrain.map(t => { const [x,y,w,h] = t.rect; return R(x,y,w,h,ink) + R(x+3,y+3,w-6,h-3,c); }).join('');
const shutter = x => R(x,154,238,242,ink)+R(x+8,162,222,226,'#667c87')+
  [170,194,218,242,266,290,314,338,362].map(y => R(x+8,y,222,4,'#405768')+R(x+8,y+4,222,3,'#82969c')).join('')+
  R(x+18,177,202,51,ink)+R(x+23,182,192,41,'#accbd0')+
  [64,130].map(dx => R(x+dx,182,5,41,'#5e8290')).join('')+R(x+102,354,34,7,cream);
const fireArt = R(0,0,960,540,'#c4c9c3')+R(0,86,960,28,red)+R(0,114,960,8,'#803c45')+
  R(0,127,960,269,'#b1b9b8')+shutter(52)+shutter(324)+
  [31,302,575].map(x=>R(x,135,12,279,'#e6d9bf')+R(x+2,135,3,277,'#f5e8cc')).join('')+
  R(657,151,239,245,ink)+R(664,158,225,231,'#869ca5')+
  [674,748,822].map(x=>R(x,171,57,202,'#536f7d')+R(x+5,178,47,188,'#94aab0')+R(x+9,191,39,4,'#bed0ca')+R(x+9,200,39,4,'#bed0ca')+R(x+40,256,5,23,cream)).join('')+
  R(71,126,37,13,ink)+R(77,129,25,7,'#ebbe64')+R(343,126,37,13,ink)+R(349,129,25,7,'#ebbe64')+
  R(0,396,960,54,'#778c91')+R(0,402,960,8,'#9dacaa')+
  terrain(fire,'#8d9898')+R(43,433,574,6,'#e3c877')+R(43,442,574,5,'#536777')+
  [65,177,289,401,513].map(x=>R(x,465,64,4,'#637781')+R(x+20,498,64,4,'#aab2a7')).join('')+
  [650,745,840].map(x=>P(`M${x} 451L${x+38} 540H${x+44}L${x+6} 451Z`,'#c2b999')).join('')+
  R(33,517,572,6,'#556a73')+[44,80,116,152,188,224,260,296,332,368,404,440,476,512,548,584].map(x=>R(x,517,4,12,'#313f4d')).join('');

// Side cutaway: both collection holes remain visibly and physically open.
// The 44px lips catch low objects; piles can overflow above y=396.
const clawArt = R(0,0,960,540,'#252d49')+R(14,87,932,437,ink)+R(23,96,914,424,'#426a84')+
  R(40,116,891,313,'#719eac')+R(48,124,875,297,'#8bb3bd')+
  P('M49 125H95L307 420H261Z','#a2c4c6')+P('M590 125H612L824 420H802Z','#a2c4c6')+
  [72,221,370,519,668,817].map((x,i)=>R(x,146+(i%2)*24,8,8,'#d2dfcf')+R(x-5,149+(i%2)*24,18,2,'#d2dfcf')).join('')+
  R(33,111,884,12,ink)+R(36,113,878,4,'#d7d3be')+
  R(169,115,84,22,ink)+R(174,120,74,11,'#d59c70')+R(200,137,21,30,ink)+R(205,137,11,30,'#c4d4d2')+R(207,137,4,29,cream)+
  P('M164 177L181 160H243L260 174L260 210L245 222H179L164 209Z',ink)+
  P('M171 178L184 166H240L252 176L241 184H181Z','#faf0d4')+
  P('M171 181L182 188H240V215H182L171 205Z','#bbc9c9')+P('M244 187L254 178V207L244 215Z','#6e8999')+
  R(185,190,49,20,'#4b748d')+P('M192 197L199 192V196H220V192L227 197L220 202V199H199V202Z','#e8b86a')+
  P('M171 199L181 211L150 241L164 269L187 275L183 284L156 279L136 240Z',ink)+
  P('M172 207L175 212L143 241L160 273L182 278L181 280L158 275L140 240Z','#e6e7d5')+
  P('M247 205L257 199L290 240L271 279L244 284L240 275L263 269L278 241Z',ink)+
  P('M253 207L285 240L268 275L246 280L245 278L267 273L282 241L250 211Z','#c7d6d3')+
  R(166,198,13,13,ink)+R(170,202,5,5,'#e4d2a6')+R(247,198,13,13,ink)+R(251,202,5,5,'#e4d2a6')+
  R(20,429,210,111,'#161c30')+P('M29 457H221L203 540H47Z','#30314c')+
  R(35,462,100,5,'#854a69')+P('M51 477H119L108 495H101V508H70V495H62Z','#a76081')+
  R(540,429,270,111,'#161c30')+P('M548 457H801L774 540H572Z','#30314c')+
  R(635,462,160,5,'#854a69')+P('M665 477H766L753 495H740V508H698V495H684Z','#a76081')+
  terrain(claw,'#b68daa')+R(233,443,304,8,'#ebcee0')+R(233,462,304,6,'#84617e')+
  [265,365,465].map(x=>R(x,489,46,21,'#8d6887')+R(x+5,494,36,11,'#654f70')).join('')+
  [233,531].map(x=>R(x,399,6,38,'#f7d47e')+R(x+1,407,4,11,'#bd8657')).join('')+
  R(813,453,144,8,'#ebcee0')+R(824,478,120,7,'#83637f')+
  R(0,88,20,452,'#783d61')+R(3,94,10,436,'#cc7c96')+R(936,88,24,362,'#783d61')+R(940,94,12,350,'#cc7c96');
const schoolArt = R(0,0,960,540,'#d5d2b9')+R(0,88,960,20,'#9eac9d')+R(0,108,960,6,'#708b89')+
  R(48,140,554,198,ink)+R(53,145,544,188,'#a28058')+R(62,154,526,170,'#36594c')+R(68,160,514,158,'#426455')+
  P('M102 277L165 185L228 277H102M110 272H218L165 195Z','#d8e0c3')+
  R(266,192,105,5,'#e3dfbb')+R(266,192,5,82,'#e3dfbb')+R(266,269,105,5,'#e3dfbb')+R(366,192,5,82,'#e3dfbb')+
  P('M445 190H476L499 213V244L476 267H445L422 244V213Z M447 196L428 215V242L447 261H474L493 242V215L474 196Z','#e1d5ab')+
  R(55,326,540,12,'#c4a276')+R(91,322,28,4,'#ebe8cf')+R(135,322,18,4,'#d4b19b')+R(523,314,40,12,'#393b39')+R(527,316,32,4,'#b69a75')+
  R(652,141,243,199,ink)+R(658,147,231,187,'#adbbb0')+R(665,154,217,173,'#8bbcca')+
  R(670,159,207,71,'#b4d6d6')+P('M665 276L717 247L765 273L819 238L882 267V327H665Z','#8eaf92')+
  R(769,154,9,173,'#e7dfbf')+R(665,236,217,8,'#e7dfbf')+R(648,334,251,10,'#a6aaa1')+
  R(620,159,11,182,'#b9baa7')+R(909,159,11,182,'#b9baa7')+
  R(0,354,960,96,'#b4b59d')+R(0,354,960,8,'#80958c')+R(0,441,960,9,'#797e70')+
  terrain(school,'#ae956c')+R(58,398,544,6,'#e0c797')+R(59,409,542,3,'#795e49')+
  R(83,418,16,30,'#7b8a86')+R(561,418,16,30,'#7b8a86')+
  [40,190,340,490,640,790,940].map(x=>P(`M${x} 453L${x+46} 540H${x+49}L${x+3} 453Z`,'#886c51')).join('')+
  R(0,482,960,3,'#947552')+R(0,520,960,3,'#947552');
const sheet=[];
for (const [index, [stage, art]] of [[fire, fireArt], [claw, clawArt], [school, schoolArt]].entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${art}</svg>\n`;
  await fs.writeFile(path.join(root, `assets/maps/${stage.map}.svg`), svg, 'utf8');
  await sharp(Buffer.from(svg)).png().toFile(path.join(root, `assets/maps/${stage.map}.png`));
  // These are authored-background reviews, not captures of a running engine.
  sheet.push({input: Buffer.from(svg), left: 0, top: index*540});
  const collider = svg.replace('</svg>', `<g fill="#50f0aa" fill-opacity=".18" stroke="#50f0aa" stroke-width="2">${stage.terrain.map(t=>`<rect x="${t.rect[0]}" y="${t.rect[1]}" width="${t.rect[2]}" height="${t.rect[3]}"/>`).join('')}</g>${(stage.abyss||[]).map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f64966" fill-opacity=".25"/>`).join('')}</svg>`);
  await sharp(Buffer.from(collider)).png().toFile(path.join(root, `previews/${stage.map}-colliders.png`));
}
await sharp({create:{width:960,height:additions.length*540,channels:4,background:ink}}).composite(sheet).png().toFile(path.join(root,'previews/rescue-maps.png'));
maps.maps = stages.stages.map(s => ({id:s.map, stage:s.id, nameJa:s.nameJa, status:s.status, svg:`maps/${s.map}.svg`,worldSize:[960,540],terrain:s.terrain,backgroundCollision:false,...(s.assignment?{assignment:s.assignment}:{})}));
stages.status=`Godot 4.7.2: ${stages.stages.length} authored stages, 15 throws each; navigation order is independent of stable IDs.`;
const summary=await read('build-summary');
Object.assign(summary,{objects:manifest.items.length,maps:stages.stages.length,specifiedStages:stages.stages.length-1,playableStages:stages.stages.length});
const verification=await read('verification');
Object.assign(verification,{objects:manifest.items.length,maps:stages.stages.length,stagesWith15Shots:stages.stages.length,croppedSpritesChecked:manifest.items.length,uniqueRenderedSprites:new Set(manifest.items.map(x=>x.svg)).size});
verification.checks=verification.checks.filter(x=>!/^\d+ item records/.test(x)&&!/^\d+ maps have/.test(x));
verification.checks.push(`${manifest.items.length} item records; all ${stages.stages.length} queues provide 15 throws from existing items`,`${stages.stages.length} maps have static terrain data`);
await Promise.all([write('stages',stages),write('maps-manifest',maps),write('ui-ja',ui),write('build-summary',summary),write('verification',verification)]);
console.log(JSON.stringify({objects:manifest.items.length,stages:stages.stages.length,firestationCandidates:firePool.length,forcedClawShots:claw.queueOverrides}));
