// Authored SVG collection: stages 36–39 and their restaurant/cafe objects.
// Run after the older content layers; checked-in SVG/data are the build inputs.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'','sharp'));}
const read=async name=>JSON.parse(await fs.readFile(path.join(root,`data/${name}.json`),'utf8'));
const write=async(name,value)=>fs.writeFile(path.join(root,`data/${name}.json`),JSON.stringify(value,null,2)+'\n');
const manifest=await read('objects-manifest'),catalog=await read('catalog'),physics=await read('physics'),colliders=await read('colliders'),stages=await read('stages'),maps=await read('maps-manifest'),ui=await read('ui-ja');
const ink='#101623',cream='#fff0cd',gold='#efbc59',red='#d95e65',blue='#5e91b6',mint='#86b99e',steel='#9db6bf',wood='#a9724c';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...r)=>({rect:r}),poly=(...p)=>({polygon:p});
const items=[];
const add=(id,name,kana,material,mass,width,fixtures,art,behavior='solid',extra={})=>items.push({id,name,kana,material,mass,width,fixtures,art,behavior,extra});
const water={waterUnits:8,releaseUnits:8,breakImpactSpeed:120,impactSpeed:120,minImpactEnergy:2,loadForceThreshold:5000,loadHoldSeconds:0.35};
// Per-object storage: the sponge holds one jug, the towel one balloon.
for(const [id,capacity] of [['sponge',24],['towel',12]]){
 physics.overrides[id]={...physics.overrides[id],capacity};
 manifest.items.find(item=>item.id===id).physics.capacity=capacity;
}
const glassBody=R(28,25,72,31,ink)+P('M36 56H92V122H36Z',ink)+R(32,29,64,22,'#b8d9db')+R(40,51,48,67,'#b8d9db')+R(36,29,52,5,'#f5f5df')+R(44,111,36,7,'#f5f5df');
const glassFixtures=[rect(28,25,72,31),rect(36,56,56,66)];
const straw=R(70,3,12,76,ink)+R(74,7,4,68,'#e77c87')+R(74,15,4,8,cream)+R(74,35,4,8,cream)+R(74,55,4,8,cream);
add('orange-juice','オレンジジュース','オレンジジュース','glass',1.8,42,[...glassFixtures,rect(70,3,12,76)],glassBody+R(36,47,56,13,'#ffd37b')+R(44,60,40,53,'#ed991b')+R(36,52,8,31,'#efac34')+R(84,52,8,47,'#f7c052')+R(40,62,4,15,'#fff0ad')+R(48,94,4,7,'#ffe798')+straw,'water_release',water);
add('lemonade-glass','レモネード','レモネード','glass',1.8,48,[...glassFixtures,rect(70,3,12,76),poly([24,21],[39,11],[54,21],[54,40],[24,40])],glassBody+R(40,54,48,58,'#e5c752')+R(44,63,8,15,'#fff3aa')+R(63,80,12,10,'#f5e698')+straw+P('M22 21L38 8L56 21V41H22Z',ink)+P('M26 23L38 14L52 23V37H26Z','#e8c948')+P('M29 25L38 18L49 25V34H29Z','#fff2a7')+R(36,20,4,15,'#e8c948'),'water_release',water);
add('water-glass','水グラス','みずグラス','glass',1.5,42,glassFixtures,glassBody+R(40,65,48,47,'#71b9d0')+R(40,65,48,5,'#d8f6ed')+R(45,78,5,23,'#d8f6ed')+R(61,89,12,4,'#a9dfdf'),'water_release',water);
const plate=P('M8 78H120V105L110 115H18L8 105Z',ink)+P('M14 83H114V103L106 109H22L14 103Z','#566574')+R(19,90,90,6,'#82939b');
add('ironplate-hamburg','鉄板ハンバーグ','てっぱんハンバーグ','metal',4.8,87,[rect(8,78,112,28),poly([21,60],[32,38],[73,32],[94,49],[99,78],[21,78])],plate+P('M18 63L30 37L52 29L80 34L99 53L100 81L88 94H34L18 81Z',ink)+P('M24 63L34 43L54 36L77 40L93 57L94 78L85 87H37L24 77Z','#8a4a32')+P('M29 60L40 45L63 40L81 46L92 61L84 70H39Z','#bb7950')+R(38,49,8,24,'#6a392b')+R(61,45,8,28,'#6a392b')+R(80,51,7,20,'#6a392b')+R(98,63,13,9,'#e3a83c')+R(101,74,14,10,'#92b46e'));
add('chicken-steak','チキンステーキ','チキンステーキ','food',2.7,81,[poly([12,53],[31,28],[65,22],[102,38],[119,66],[108,96],[76,111],[32,103],[12,82])],P('M12 53L31 28L65 22L102 38L119 66L108 96L76 111L32 103L12 82Z',ink)+P('M18 55L35 34L65 28L98 43L112 67L103 91L76 104L35 97L18 80Z','#c88343')+P('M24 56L41 38L67 34L93 47L103 67L91 78L61 77L37 86L23 73Z','#efbd72')+P('M31 53L38 46L76 88L67 93Z','#805038')+P('M54 36L62 36L97 73L91 81Z','#805038')+R(24,65,8,9,'#ffe1a0')+R(78,50,9,6,'#ffe1a0'));
add('bill-holder','会計札','かいけいふだ','plastic',1.2,45,[rect(24,12,80,112)],R(24,12,80,112,ink)+R(30,18,68,100,'#355d8f')+R(38,26,52,76,'#f4edd4')+R(49,20,30,12,'#b7bec0')+R(44,41,36,4,ink)+R(44,51,29,4,ink)+R(44,62,35,4,ink)+R(44,73,23,4,ink)+R(44,87,36,5,ink)+R(35,108,57,4,'#7194b2'));
add('cash-reader','現金読み取り機','げんきんよみとりき','appliance',6,78,[poly([12,46],[32,15],[100,15],[116,46],[116,118],[12,118])],P('M12 46L32 15H100L116 46V118H12Z',ink)+P('M19 48L36 22H96L109 48V110H19Z','#8caaae')+P('M32 31H94L103 49H24Z','#d4dfd3')+R(39,28,50,13,'#294d5a')+R(45,31,27,5,'#8cc6b2')+R(26,58,76,21,ink)+R(33,61,61,11,'#e1c684')+R(39,63,32,5,'#8f7b58')+R(26,90,46,12,'#465f70')+R(83,91,13,9,red));
add('oven','オーブン','オーブン','appliance',24,112,[rect(8,12,112,108)],R(8,12,112,108,ink)+R(15,19,98,94,'#b7c4c2')+R(20,25,88,22,'#6f8796')+R(28,30,12,12,ink)+R(86,30,12,12,ink)+R(49,29,27,12,'#263a4e')+R(54,32,16,5,'#99d1b4')+R(22,55,84,48,'#283b50')+R(29,65,70,30,'#647d85')+R(33,68,62,5,'#94afa9')+R(26,51,76,8,ink)+R(32,52,64,3,'#dce4d6')+R(18,114,16,9,ink)+R(94,114,16,9,ink));
add('parfait','パフェ','パフェ','glass',2,49,[poly([27,49],[101,49],[92,88],[72,101],[72,113],[94,113],[94,123],[34,123],[34,113],[56,113],[56,101],[36,88]),poly([25,46],[31,29],[45,17],[65,11],[88,25],[102,46])],P('M25 46L31 29L45 17L65 11L88 25L102 46V62L92 89L73 102V112H95V123H33V112H55V102L36 89L25 62Z',ink)+P('M31 52H96L87 85L68 97H60L41 85Z','#bbd9d6')+P('M36 59H92L87 72H40Z',pink())+P('M40 75H86L82 85L68 92H60L46 85Z','#d6a46c')+R(61,97,7,19,'#d6e6dc')+R(40,116,48,3,'#d6e6dc')+P('M30 46L36 30L48 23L65 18L83 29L96 46L89 55H39Z',cream)+R(43,33,9,9,'#f5d6a6')+R(68,29,8,9,'#f5d6a6')+P('M62 16L68 3H81L87 15L78 26H68Z',red));
function pink(){return '#d98492';}
add('counter','カウンター','カウンター','wood',22,140,[rect(4,18,120,22),rect(12,40,104,76)],R(4,18,120,22,ink)+R(10,23,108,11,'#deb884')+R(12,40,104,76,ink)+R(18,41,92,68,wood)+R(25,49,78,8,'#c49262')+R(28,66,3,35,'#714b3c')+R(63,66,3,35,'#714b3c')+R(98,66,3,35,'#714b3c')+R(20,104,88,6,'#684739'),'solid',{flowResponse:0});
add('coffee-beans','コーヒー豆','コーヒーまめ','paper',1.8,55,[poly([26,7],[99,7],[106,111],[96,122],[29,122],[20,111])],P('M26 7H99L106 111L96 122H29L20 111Z',ink)+P('M32 14H92L99 108L91 116H34L27 108Z','#b98a58')+R(34,20,54,9,'#76513c')+R(30,44,66,46,'#f0dfba')+P('M48 56L63 49L78 56L82 73L70 83L53 81L44 68Z','#704733')+P('M63 53L60 64L70 77L65 80L54 66L58 55Z','#d4b584')+R(39,99,48,7,'#76513c'));
add('coffee-pot','コーヒーポット','コーヒーポット','metal',3.4,66,[rect(19,30,65,88),rect(84,45,30,10),rect(104,55,10,38),rect(84,93,30,10),rect(39,16,25,14)],R(80,41,38,66,ink)+R(88,49,22,50,steel)+R(88,58,14,32,ink)+R(19,30,65,88,ink)+R(25,36,53,76,'#9dafb5')+R(31,42,9,62,'#edf1da')+R(44,44,13,63,'#c6d4ca')+R(69,37,8,71,'#627c8b')+P('M19 30L9 21L30 21L37 30Z',ink)+R(33,22,38,8,'#dbe3d1')+R(39,14,25,10,ink)+R(44,17,15,4,'#a4bfc0'));
add('menu','メニュー','メニュー','paper',1.6,55,[poly([17,18],[97,7],[113,112],[35,123])],P('M17 18L97 7L113 112L35 123Z',ink)+P('M24 24L91 15L105 106L40 115Z','#8e4e4d')+P('M33 32L84 25L94 91L44 98Z',cream)+R(44,39,34,6,'#714c45')+R(47,52,29,4,'#714c45')+R(49,63,31,4,'#714c45')+R(52,75,25,4,'#714c45')+R(49,103,40,4,gold));

// Shrink the approved title logo and convert its exact colored pixels to SVG.
// No handwritten sign, checkerboard, margin scaling or external image reference.
const title=await sharp(path.join(root,'assets/ui/logo.webp')).resize(120,29,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let logo='';
for(let y=0;y<title.info.height;y++)for(let x=0;x<title.info.width;){const at=(y*title.info.width+x)*4,color=[...title.data.subarray(at,at+4)];let end=x+1;while(end<title.info.width&&color.every((v,i)=>title.data[(y*title.info.width+end)*4+i]===v))end++;if(color[3])logo+=`<rect x="${x+4}" y="${y+48}" width="${end-x}" height="1" fill="#${color.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')}" opacity="${color[3]/255}"/>`;x=end;}
add('game-logo','なんでもキャノンのロゴ','なんでもキャノンのロゴ','plastic',1.5,108,[rect(5,52,115,23)],logo);

const sheet=[];
for(const [index,e]of items.entries()){
 const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" shape-rendering="crispEdges">${e.art}</svg>`;
 const {data,info}=await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=128,y0=128,x1=-1,y1=-1,pixels=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);pixels++;}
 const box=[x0,y0,x1-x0+1,y1-y0+1],scale=e.width/box[2];
 const svg=raw.replace('width="128" height="128" viewBox="0 0 128 128"',`width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}"`);
 await fs.writeFile(path.join(root,`assets/objects/${e.id}.svg`),svg+'\n');
 for(const ext of ['png','webp'])await sharp(Buffer.from(svg)).toFormat(ext,ext==='webp'?{lossless:true}:{}).toFile(path.join(root,`assets/raster/objects/${e.id}.${ext}`));
 const score=e.behavior==='water_release'?0:100;
 const record={id:e.id,nameJa:e.name,svg:`objects/${e.id}.svg`,png:`raster/objects/${e.id}.png`,webp:`raster/objects/${e.id}.webp`,sourceGrid:[128,128],viewBox:box,pivotSource:[64,64],pivotCropped:[64-x0,64-y0],worldWidth:e.width,worldHeight:box[3]*scale,worldScale:scale,material:e.material,mass:e.mass,score,bodyKind:'dynamic',behavior:e.behavior,colliderTemplate:e.id,fixtures:e.fixtures,physics:{...physics.materials[e.material],...physics.behaviors[e.behavior],...e.extra},opaquePixels:pixels};
 const i=manifest.items.findIndex(x=>x.id===e.id);if(i<0)manifest.items.push(record);else manifest.items[i]=record;
 const row=[e.id,e.name,e.material,e.mass,score,e.width,e.id,e.behavior],j=catalog.items.findIndex(x=>x[0]===e.id);if(j<0)catalog.items.push(row);else catalog.items[j]=row;
 colliders.templates[e.id]=e.fixtures;physics.overrides[e.id]=e.extra;ui.items[e.id]=e.kana;
 const thumb=await sharp(Buffer.from(svg)).resize({width:176,height:160,fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
 sheet.push({input:thumb.data,left:index%7*200+Math.floor((200-thumb.info.width)/2),top:Math.floor(index/7)*190+Math.floor((180-thumb.info.height)/2)});
}
const stage=(id,name,map,queue,terrain,cannon=[810,450],zone=[65,80,540,370])=>({id,nameJa:name,map,status:'specified',gravity:980,cannon,scoreZone:zone,scoreGroundY:zone[1]+zone[3],terrain,queue,preplaced:[]});
const pool=['flamethrower','barrel','gunpowder-barrel','metal-drum','wooden-crate','water-jug','water-balloon','refrigerator','tire','plank','coffee-mill','rubber-duck','sand-bucket','umbrella','bomb'];
const random=stage(36,'ランダムはっしゃほう','36-random-cannon',pool,[rect(0,450,960,90),rect(100,390,460,24)]);
random.queueSlots=Array.from({length:15},()=>({count:1,candidates:pool}));
random.cannonControls={powerMode:'random',minPower:0.15,maxPower:1.0,trajectoryFraction:0.5};
const restaurant=stage(37,'レストラン2','37-restaurant-two',['call-bell','lemonade-glass','water-glass','coffee-mill','orange-juice','ironplate-hamburg','rice-bowl','sashimi','chicken-steak','bill-holder','cash-reader','frying-pan','oven','fork','crossed-chopsticks'],[rect(90,380,520,24),rect(90,340,14,40),rect(596,340,14,40),rect(114,404,28,136),rect(558,404,28,136),rect(720,410,220,24),rect(744,434,24,106),rect(892,434,24,106)],[820,410],[90,80,520,300]);
restaurant.abyss=[[0,525,960,100]];
restaurant.preplaced=[{id:'call-bell',x:545,groundY:380,scoring:false}];
const beach=stage(38,'ビーチ','38-beach',['sand-bucket','shovel','water-yoyo','lifebuoy','umbrella','watermelon','rubber-duck','water-balloon','submarine','barrel','towel','sponge','freeze-sprayer','flamethrower','soccer-ball'],[rect(0,450,600,90),poly([600,450],[700,410],[960,410],[960,540],[600,540])],[810,410],[50,80,550,370]);
beach.selectAnyCatalogItem=true;
beach.water=[{rect:[50,375,450,75],direction:[0,0],speed:0,type:'pool',finite:true}];
const cafe=stage(39,'喫茶店','39-cafe',['coffee-mill','parfait','counter','chair','low-table','coffee-beans','coffee-pot','water-glass','menu','call-bell','teapot','pancakes','cheesecake','lemonade-glass','canele'],[rect(0,450,960,90),rect(75,385,530,24),rect(100,409,25,41),rect(555,409,25,41)]);
const additions=[random,restaurant,beach,cafe];
const lessons=['なんでもキャノンが ぼうそう！？ なげるものと つよさが ランダムになっちゃった！？','テーブルのうえに つみあげよう。そとは ならく！','ものを じゆうにえらべる ビーチ。さいしょから みずがいっぱい。','コーヒーのどうぐと おやつを カウンターにのせよう。'];
for(const [i,s]of additions.entries()){s.lesson=lessons[i];stages.stages[s.id-1]=s;ui.stages[s.id-1]=['ランダムはっしゃほう','レストラン2','ビーチ','きっさてん'][i];ui.lessons[s.id-1]=s.lesson;}
stages.status=`Godot 4.7.2: ${stages.stages.length} authored stages, 15 throws each; current checks are in previews/*-checks.json.`;
const terrainArt=(s,c)=>s.terrain.map(t=>t.rect?R(...t.rect,ink)+R(t.rect[0]+3,t.rect[1]+3,t.rect[2]-6,t.rect[3]-3,c):P('M'+t.polygon.map(p=>p.join(' ')).join('L')+'Z',c)).join('');
const window=(x,y,w,h)=>R(x,y,w,h,ink)+R(x+7,y+7,w-14,h-14,'#83bbca')+R(x+w/2-4,y+7,8,h-14,cream)+R(x+7,y+h/2-4,w-14,8,cream);
const tableLines=(x,y,w)=>R(x+5,y+4,w-10,5,'#e4bf83')+R(x+7,y+15,w-14,3,'#684638');
const artwork={};
artwork[36]=R(0,0,960,540,'#28344e')+R(0,90,960,220,'#465269')+R(38,116,527,156,ink)+R(46,124,511,140,'#6b8795')+[80,180,280,380,480].map((x,i)=>R(x,155,55,60,[red,gold,blue,mint,red][i])+R(x+8,164,39,8,cream)+R(x+23,225,9,20,'#aabfc1')).join('')+R(657,135,224,150,'#765666')+R(671,149,196,120,'#d1a779')+R(702,173,50,70,'#b9625b')+R(782,173,50,70,'#678f9a')+terrainArt(random,'#9a7960')+tableLines(100,390,460);
artwork[37]=R(0,0,960,540,'#dcc5a5')+R(0,84,960,32,'#8e5e4a')+window(125,130,270,153)+R(502,134,125,155,'#865c4b')+R(512,144,105,135,'#3f564e')+[170,192,214,236].map(y=>R(530,y,66,4,'#d9ddba')).join('')+R(700,134,165,118,'#b88e67')+R(715,149,135,88,'#ead9b4')+R(0,470,960,70,'#322d35')+terrainArt(restaurant,'#b18055')+tableLines(90,380,520)+tableLines(720,410,220)+R(93,343,8,34,'#e4bf83')+R(599,343,8,34,'#e4bf83');
// Foreground water is drawn by LiquidField, so an absorbed pool exposes sand.
artwork[38]=R(0,0,960,540,'#9bd7df')+R(0,244,960,132,'#4c9eaf')+R(0,281,960,10,'#79c4cd')+R(0,331,960,8,'#87d0d4')+P('M0 355L240 367L430 352L610 364L780 350L960 360V540H0Z','#e1c68a')+P('M689 260L710 211L728 134L743 138L730 221L709 264Z','#876448')+P('M734 142L683 113L639 122L680 90L725 114L726 81L759 63L751 114L789 94L840 115L784 119L753 140L791 167L817 205L770 179Z','#4b9172')+terrainArt(beach,'#d9b97b')+R(80,434,24,4,'#edd49b')+R(270,422,18,4,'#c9a46a')+R(673,462,28,5,'#edd49b')+R(726,486,36,5,'#edd49b');
artwork[39]=R(0,0,960,540,'#9b785c')+R(0,93,960,32,'#493d39')+window(82,139,259,145)+R(405,143,194,146,'#463f38')+R(416,154,172,124,'#5a6852')+[178,203,228,252].map(y=>R(437,y,125,4,'#e4dfb9')).join('')+R(657,142,238,18,'#503c36')+R(657,230,238,18,'#503c36')+[680,736,792,848].map(x=>R(x,172,33,44,'#cfba88')+R(x+4,179,25,24,'#8a6346')).join('')+R(0,313,960,137,'#72533f')+R(0,325,960,6,'#c3a077')+terrainArt(cafe,'#b18359')+tableLines(75,385,530)+[100,250,400,550,700,850].map(x=>P(`M${x} 450L${x+70} 540H${x+74}L${x+4} 450Z`,'#77543e')).join('');
const mapSheet=[];
for(const [i,s]of additions.entries()){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${artwork[s.id]}</svg>\n`;
 await fs.writeFile(path.join(root,`assets/maps/${s.map}.svg`),svg);
 await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${s.map}.png`));
 mapSheet.push({input:await sharp(Buffer.from(svg)).resize(480,270,{kernel:'nearest'}).png().toBuffer(),left:i%2*480,top:Math.floor(i/2)*270});
}
maps.maps=stages.stages.map(s=>({id:s.map,stage:s.id,nameJa:s.nameJa,status:s.status,svg:`maps/${s.map}.svg`,worldSize:[960,540],terrain:s.terrain,backgroundCollision:false,...(s.assignment?{assignment:s.assignment}:{})}));
const ids=new Set(manifest.items.map(x=>x.id));
for(const s of stages.stages)if(s.queue?.length!==15||s.queue.some(id=>!ids.has(id)))throw Error(`Invalid queue ${s.id}`);
await Promise.all([write('objects-manifest',manifest),write('catalog',catalog),write('physics',physics),write('colliders',colliders),write('stages',stages),write('maps-manifest',maps),write('ui-ja',ui)]);
const summary=await read('build-summary');Object.assign(summary,{objects:manifest.items.length,maps:stages.stages.length,specifiedStages:stages.stages.length-1,playableStages:stages.stages.length});await write('build-summary',summary);
const verification=await read('verification');Object.assign(verification,{objects:manifest.items.length,maps:stages.stages.length,stagesWith15Shots:stages.stages.length,croppedSpritesChecked:manifest.items.length,uniqueRenderedSprites:new Set(manifest.items.map(x=>x.svg)).size});verification.checks=verification.checks.filter(x=>!/^\d+ item records/.test(x)&&!/^\d+ maps have/.test(x));verification.checks.push(`${manifest.items.length} item records; all ${stages.stages.length} queues reference 15 existing items`,`${stages.stages.length} maps have static terrain data`);await write('verification',verification);
await sharp({create:{width:1400,height:380,channels:4,background:'#283b4c'}}).composite(sheet).png().toFile(path.join(root,'previews/late-items.png'));
await sharp({create:{width:960,height:540,channels:4,background:'#283b4c'}}).composite(mapSheet).png().toFile(path.join(root,'previews/late-maps.png'));
console.log(JSON.stringify({items:items.map(x=>x.id),objects:manifest.items.length,stages:stages.stages.length}));
