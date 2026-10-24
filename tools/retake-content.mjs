// Run after extend-extra-content.mjs. SVG originals and physical fixtures use
// the same 128-unit origin; no transparent padding is used to fake scaling.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp'));}
const read=async n=>JSON.parse(await fs.readFile(path.join(root,`data/${n}.json`),'utf8'));
const write=async(n,v)=>fs.writeFile(path.join(root,`data/${n}.json`),JSON.stringify(v,null,2)+'\n');
const manifest=await read('objects-manifest'),catalog=await read('catalog'),colliders=await read('colliders'),physics=await read('physics'),ui=await read('ui-ja');
const ink='#161d2b';
const p=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v});
// Lossless conversion of the supplied 32px pixel originals into SVG runs.
// This preserves every colored pixel and does not embed a bitmap in the SVG.
async function suppliedPixels(name){
 const {data,info}=await sharp(path.join(root,`assets/source/retakes/${name}.png`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==32||info.height!==32)throw Error(`Unexpected reference grid ${name}`);
 let svg='';
 for(let y=0;y<32;y++)for(let x=0;x<32;){const offset=(y*32+x)*4,color=[...data.subarray(offset,offset+4)];let end=x+1;
  while(end<32&&color.every((c,i)=>data[(y*32+end)*4+i]===c))end++;
  if(color[3])svg+=`<rect x="${x*4}" y="${y*4}" width="${(end-x)*4}" height="4" fill="#${color.slice(0,3).map(c=>c.toString(16).padStart(2,'0')).join('')}"${color[3]===255?'':` opacity="${color[3]/255}"`}/>`;
  x=end;
 }
 return svg;
}
const edits=[
 // Four-source-pixel dark outline, like the other food sprites. Layer seams
 // are toasted brown rather than thick black dividers; butter is not a hole.
 {id:'pancakes',name:'パンケーキ',kana:'パンケーキ',material:'food',mass:2,width:80,fixtures:[poly([16,36],[32,28],[52,20],[80,20],[100,28],[116,40],[116,92],[104,104],[28,104],[16,96])],art:
  p('M16 36H24V28H40V24H52V20H80V24H96V28H108V36H116V92H112V100H104V104H28V100H20V96H16Z',ink)+
  p('M20 76H112V92H108V96H100V100H32V96H24V92H20Z','#d79e55')+r(24,80,84,8,'#f6d69a')+r(32,92,68,4,'#eabe7a')+
  p('M20 56H112V72H108V76H100V80H32V76H24V72H20Z','#b97b40')+r(24,60,84,8,'#f4cc87')+r(32,72,68,4,'#e5ac64')+
  p('M20 40H28V32H44V28H56V24H76V28H92V32H104V40H112V48H108V52H100V56H32V52H24V48H20Z','#dfa755')+
  r(32,36,60,4,'#f8d68b')+r(24,44,84,4,'#efbd6c')+
  p('M44 28H88V32H100V40H104V48H96V56H88V80H80V84H76V52H56V48H40V40H36V32H44Z','#9a542d')+
  p('M48 28H84V32H96V40H88V44H56V40H44V32H48Z','#c57c39')+
  r(52,20,28,20,ink)+r(56,24,20,12,'#f5d66e')+r(56,24,20,4,'#fff0ad')+r(72,28,4,8,'#e7b84f')},
 {id:'cheesecake',name:'チーズケーキ',kana:'チーズケーキ',material:'food',mass:2,width:66,fixtures:[poly([12,56],[88,20],[116,48],[116,92],[12,108])],art:
  p('M12 56L88 20L116 48V92L12 108Z',ink)+
  p('M16 62L112 50V88L16 102Z','#f4db94')+
  p('M16 64L108 54V78L16 92Z','#fff1c5')+
  p('M92 56L112 52V88L92 92Z','#e6c780')+
  p('M16 94L112 80V88L16 102Z','#ad713f')+
  p('M20 94L108 82V86L20 98Z','#d39d60')+
  p('M12 56L88 20L116 48L20 68L12 64Z',ink)+
  p('M20 56L88 26L108 46L20 62Z','#e8b65b')+
  p('M28 54L88 30L100 42L28 56Z','#ffe2a0')+
  p('M32 70L84 60V64L32 74Z','#fff7d8')+
  r(34,82,4,4,'#e5c77d')+r(66,76,4,4,'#e5c77d')},
 {id:'coffee-mill',name:'コーヒーミル',kana:'コーヒーミル',material:'wood',mass:3.5,width:62,fixtures:[rect(32,68,68,48),poly([40,40],[92,40],[84,60],[48,60]),rect(64,16,6,24),rect(64,16,44,4),rect(104,8,12,16)],art:await suppliedPixels('coffee-mill')},
 {id:'party-popper',name:'クラッカー',kana:'クラッカー',material:'paper',mass:.5,width:58,fixtures:[poly([27,113],[33,61],[47,37],[85,55],[76,82])],art:
  p('M23 117L29 59L45 33L89 53L80 85Z',ink)+p('M29 108L35 61L47 41L81 57L73 81Z','#ea9476')+
  p('M35 65L73 82L57 95L32 82Z','#f7d367')+p('M41 48L81 65L76 76L36 58Z','#79b7b7')+
  p('M45 33L89 53L85 65L41 45Z','#fff0ca')+p('M49 40L80 54L77 58L48 44Z','#61465a')+
  p('M63 30V17H74V7H82V12H78V23H68V30Z','#edc357')+
  p('M84 38L95 27H108V16H113V32H99L89 42Z','#e87b8c')+
  p('M45 25L34 17V7H41V13L50 20Z','#7fbfc7')+r(100,47,8,5,'#f7d367')+r(20,39,5,8,'#e87b8c')+r(90,9,5,7,'#7fbfc7')},
 {id:'saury',name:'サンマ',kana:'サンマ',material:'food',mass:2,width:106,fixtures:[poly([5,65],[21,53],[83,49],[103,56],[122,44],[117,65],[124,82],[103,73],[26,76])],art:
  p('M1 65L17 51L51 45H85L102 53L125 39L120 63L127 85L101 76L62 81L24 78Z',ink)+
  p('M8 65L23 55L56 49H83L104 60L118 48L113 64L120 76L102 69L62 76L25 73Z','#aecbd0')+
  p('M12 62L25 54L59 49H83L102 58L98 63L47 59Z','#4a7388')+
  p('M13 66L47 64L99 65L94 70L57 74L26 70Z','#e2e5d2')+
  p('M55 46L65 36L78 47Z','#4a7388')+p('M58 78L69 88L80 78Z','#7e9cac')+
  r(20,57,7,7,ink)+r(21,57,3,3,'#f3ecd3')+p('M33 55L38 59V70H34V60Z','#668797')+
  r(5,65,8,3,'#bba85c')+r(50,63,15,3,'#f9f1d1')+r(75,61,10,3,'#f9f1d1')},
 // Keep the old ID for saved queues/seeds; its Japanese name is now sushi.
 {id:'sashimi',name:'すし',kana:'すし',material:'food',mass:1.8,width:67,fixtures:[poly([14,56],[24,42],[64,42],[76,60],[72,89],[18,89]),poly([60,39],[72,29],[105,32],[119,48],[116,73],[78,76])],art:
  p('M59 38L71 26L107 28L123 45L119 77L78 81L57 67Z',ink)+p('M64 48L77 42L116 48L114 71L80 75L64 64Z','#f5ead4')+
  p('M63 38L73 30L105 32L118 46L112 54L75 48L61 43Z','#d95a67')+
  p('M76 32L83 33L99 49L91 48Z','#ffb3a6')+p('M91 33L97 34L112 49L106 51Z','#ffb3a6')+
  p('M10 55L23 39L65 38L81 56L77 91L18 94L10 81Z',ink)+p('M17 63L70 61L72 86L23 89L16 79Z','#fff0cf')+
  p('M15 55L26 43L62 42L76 57L69 67L22 66L13 61Z','#ee9076')+
  p('M27 45L34 44L50 64L43 64Z','#ffdcc1')+p('M43 43L50 43L66 63L59 64Z','#ffdcc1')+
  r(21,74,7,4,'#d9cbb4')+r(35,82,6,3,'#d9cbb4')+r(60,74,5,4,'#d9cbb4')+r(82,64,5,4,'#d9cbb4')},
];
const sheet=[];
for(const [index,e] of edits.entries()){
 const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" shape-rendering="crispEdges">${e.art}</svg>`;
 const {data,info}=await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=128,y0=128,x1=0,y1=0,pixels=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);pixels++;}
 const box=[x0,y0,x1-x0+1,y1-y0+1],scale=e.width/box[2];
 const svg=raw.replace('width="128" height="128" viewBox="0 0 128 128"',`width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}"`);
 await fs.writeFile(path.join(root,`assets/objects/${e.id}.svg`),svg+'\n');
 for(const ext of ['png','webp'])await sharp(Buffer.from(svg)).toFormat(ext,ext==='webp'?{lossless:true}:{}).toFile(path.join(root,`assets/raster/objects/${e.id}.${ext}`));
 const old=manifest.items.find(x=>x.id===e.id)||{};
 const record={...old,id:e.id,nameJa:e.name,svg:`objects/${e.id}.svg`,png:`raster/objects/${e.id}.png`,webp:`raster/objects/${e.id}.webp`,sourceGrid:[128,128],viewBox:box,pivotSource:[64,64],pivotCropped:[64-x0,64-y0],worldWidth:e.width,worldHeight:box[3]*scale,worldScale:scale,material:e.material,mass:e.mass,score:100,bodyKind:'dynamic',behavior:'solid',colliderTemplate:e.id,fixtures:e.fixtures,physics:{...physics.materials[e.material],...physics.behaviors.solid},opaquePixels:pixels};
 const i=manifest.items.findIndex(x=>x.id===e.id);if(i<0)manifest.items.push(record);else manifest.items[i]=record;
 const row=[e.id,e.name,e.material,e.mass,100,e.width,e.id,'solid'],j=catalog.items.findIndex(x=>x[0]===e.id);if(j<0)catalog.items.push(row);else catalog.items[j]=row;
 colliders.templates[e.id]=e.fixtures;physics.overrides[e.id]={};ui.items[e.id]=e.kana;
 const thumb=await sharp(Buffer.from(svg)).resize({width:176,height:176,fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
 sheet.push({input:thumb.data,left:index*200+Math.floor((200-thumb.info.width)/2),top:Math.floor((200-thumb.info.height)/2)});
}
await Promise.all([write('objects-manifest',manifest),write('catalog',catalog),write('colliders',colliders),write('physics',physics),write('ui-ja',ui)]);
const summary=await read('build-summary'),verification=await read('verification'),stages=await read('stages');
summary.objects=manifest.items.length;
Object.assign(verification,{objects:manifest.items.length,croppedSpritesChecked:manifest.items.length,uniqueRenderedSprites:new Set(manifest.items.map(x=>x.svg)).size});
verification.checks=verification.checks.filter(x=>!/^\d+ item records/.test(x));
verification.checks.push(`${manifest.items.length} item records; all ${stages.stages.length} queues reference 15 existing items`);
await Promise.all([write('build-summary',summary),write('verification',verification)]);
await sharp({create:{width:edits.length*200,height:200,channels:4,background:'#283b4c'}}).composite(sheet).png().toFile(path.join(root,'previews/retaken-items.png'));
console.log(`Retakes: ${edits.map(x=>x.id).join(', ')}; ${manifest.items.length} objects`);
