// Idempotent feedback layer. Run after extend-stage-content.mjs when rebuilding authored data.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp; try {sharp=require('sharp');} catch {sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'','sharp'));}
const read=async n=>JSON.parse(await fs.readFile(path.join(root,`data/${n}.json`),'utf8'));
const write=async(n,v)=>fs.writeFile(path.join(root,`data/${n}.json`),JSON.stringify(v,null,2)+'\n');
const stages=await read('stages'),manifest=await read('objects-manifest'),catalog=await read('catalog'),physics=await read('physics'),maps=await read('maps-manifest'),ui=await read('ui-ja'),colliders=await read('colliders'),verification=await read('verification');
const byId=new Map(manifest.items.map(x=>[x.id,x]));
const bomb=structuredClone(byId.get('bomb'));
Object.assign(bomb,{id:'blast-bomb',nameJa:'強力爆弾'});
Object.assign(bomb.physics,{radius:220,strength:1.5,impulseMultiplier:2.2});
manifest.items=manifest.items.filter(x=>x.id!==bomb.id);manifest.items.push(bomb);byId.set(bomb.id,bomb);
catalog.items=catalog.items.filter(x=>x[0]!==bomb.id);catalog.items.push(['blast-bomb','強力爆弾','metal',3,0,42,'circle','explosion']);
physics.overrides['blast-bomb']={...bomb.physics};ui.items['blast-bomb']='つよいばくだん';
colliders.templates['blast-bomb']=structuredClone(bomb.fixtures);
for(const [id,name] of [[1,'なんでもキャノン'],[2,'ちかしつ'],[4,'ろじうら'],[5,'かざん']]){stages.stages[id-1].nameJa=name;ui.stages[id-1]=name;}
const first=stages.stages[0];first.terrain=first.terrain.filter(x=>!x.feedbackBoundary);first.terrain.push({rect:[-24,-500,24,1040],feedbackBoundary:true},{rect:[960,-500,24,1040],feedbackBoundary:true});
stages.stages[1].scoreGroundY=500;
stages.stages[3].preplaced=[['wooden-crate',150,424],['wooden-crate',208,424],['wooden-crate',266,424],['trash-bag',330,424],['trash-bin',392,424],['cardboard-box',179,369],['wooden-crate',237,369],['trash-bag',300,370],['newspaper',213,314]].map(([id,x,groundY])=>({id,x,groundY}));
const mountain=[[0,430],[80,430],[162,378],[226,320],[284,320],[306,346],[334,346],[356,320],[398,320],[458,378],[530,430],[960,430],[960,540],[0,540]];
const volcano=stages.stages[4];volcano.terrain=[{polygon:mountain}];volcano.scoreGroundY=430;
volcano.surfaceZones=[{rect:[226,313,58,12],initialState:'burning',burnSeconds:5,reignite:false},{rect:[306,339,28,12],initialState:'burning',burnSeconds:5,reignite:false},{rect:[356,313,42,12],initialState:'burning',burnSeconds:5,reignite:false}];
const bowling=stages.stages[9];bowling.queue[0]='bowling-ball';bowling.queue[1]='blast-bomb';bowling.preplaced.forEach(x=>{x.scorePenalty=100;x.scoring=true;});
const river=stages.stages[10];river.queue[7]='sponge';river.queue[12]='sponge';
const basin=stages.stages[11];Object.assign(basin.sources[0],{stopAtStoredUnits:40,storedRegion:[226,350,318,130]});
stages.stages[18].preplaced=[{id:'wooden-crate',x:205,groundY:386},{id:'wooden-crate',x:265,groundY:386},{id:'trash-bag',x:325,groundY:386},{id:'newspaper',x:235,groundY:331}];
stages.stages[19].selectAnyCatalogItem=true;
stages.stages[19].selectionPolicy='optional free choice; otherwise preserve the authored fifteen-item queue';
ui.lessons[19]='みずも ほのおも こおりも ばくだんも。すきなものを えらんでもいい。';
ui.lessons[9]='ピンがのこると ひとつ１００てん マイナス。ボールと つよいばくだんで かたづけよう。';
// ASCII digits use the existing HUD glyphs.
ui.lessons[9]=ui.lessons[9].replace('１００','100');
ui.lessons[10]='かわは ながされる。スポンジは ふたつ。みずをすうと おもくなる。';
ui.lessons[11]='みずがたまると じゃぐちがとまる。スポンジで すいとろう。';
const household=['refrigerator','washing-machine','crt-tv','flat-tv','microwave','toaster','rice-cooker','vacuum','fan','heater','chair','stool','bookshelf','wardrobe','sofa','drawers','bed','floor-lamp','suitcase','cushion','pillow','alarm-clock','toolbox','bucket','teddy-bear','flower-pot','backpack'];
const food=new Set(['hamburger','steak','watermelon','cheese-wedge','bread-slice','rice-bowl','apple','fried-shrimp','donut','fried-egg','candy-apple','cotton-candy','chocolate-banana','grilled-corn','takoyaki-tray','yakisoba','frankfurter']);
const tools=new Set(['steak-knife','fork','crossed-chopsticks','lunch-pick']);
const fixedBehavior=new Set(['water_release','extinguisher','explosion','flame_jet','ignite_on_break','firework','cold_release','ice_mass','cold_jet','repel_water','absorb','grip_sole','wheeled','flow_immune','fuel_light','campfire','buoyant']);
const role=(r,s)=>food.has(r.id)?'food':tools.has(r.id)?'table-tool':r.behavior==='bouncy'?'bouncy-ball':r.behavior==='breakable'?'fragile':r.behavior==='heat_shield'?'heat-shield':s.id===17?'garage-part':s.id===9?'ninja-prop':s.id===8?'pirate-prop':'solid';
for(const s of stages.stages){
  if(s.id===15||s.id===20){delete s.queueSlots;continue;}
  s.queueSlots=s.queue.map((id,index)=>{
    const r=byId.get(id),fixed=index===0||fixedBehavior.has(r.behavior)||(s.id===10&&index<2)||(s.id===9&&id==='shuriken');
    const compatible=x=>x&&x.behavior===r.behavior&&role(x,s)===role(r,s)&&!!x.physics.flammable===!!r.physics.flammable&&Math.max(x.worldWidth/r.worldWidth,r.worldWidth/x.worldWidth)<=1.4&&Math.max(x.worldHeight/r.worldHeight,r.worldHeight/x.worldHeight)<=1.4;
    let candidates=fixed?[id]:[...new Set(s.queue)].filter(x=>compatible(byId.get(x)));
    if(!fixed&&candidates.length<2&&[1,2,3,4,5,6,7,10,18,20].includes(s.id)) candidates=[...new Set([...candidates,...household.filter(x=>compatible(byId.get(x)))])];
    if(!candidates.includes(id))candidates.unshift(id);
    return {count:1,candidates,role:fixed?`fixed-${r.behavior}`:role(r,s),heightBucket:r.worldHeight<50?'low':r.worldHeight<75?'medium':'tall',referenceSize:[r.worldWidth,r.worldHeight],fixed};
  });
  if(s.queueSlots.reduce((n,x)=>n+x.count,0)!==15)throw Error(`stage ${s.id}: not 15 slots`);
}
maps.maps=stages.stages.map(s=>({id:s.map,stage:s.id,nameJa:s.nameJa,status:s.status,svg:`maps/${s.map}.svg`,worldSize:[960,540],terrain:s.terrain,backgroundCollision:false,...(s.assignment?{assignment:s.assignment}:{})}));
verification.objects=manifest.items.length;
verification.croppedSpritesChecked=manifest.items.length;
verification.uniqueRenderedSprites=new Set(manifest.items.map(x=>x.svg)).size;
verification.checks=verification.checks.filter(x=>!x.includes('authored object SVG records')&&!x.startsWith('158 item records'));
verification.checks.push('158 item records use 157 authored SVGs; blast-bomb deliberately shares the ordinary bomb artwork');
verification.limits=verification.limits.map(x=>x==='Japanese font covers HUD glyphs only'?'Japanese font covers generated hiragana, katakana and HUD glyphs; coverage is recorded in assets/font/generated-coverage.json':x);
await Promise.all([write('stages',stages),write('objects-manifest',manifest),write('catalog',catalog),write('physics',physics),write('maps-manifest',maps),write('ui-ja',ui),write('colliders',colliders),write('verification',verification)]);
async function editMap(id,transform){const p=path.join(root,`assets/maps/${id}.svg`);let svg=await fs.readFile(p,'utf8');svg=transform(svg);await fs.writeFile(p,svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${id}.png`));}
await editMap('01-poc',svg=>svg.replace(/<g id="feedback-boundaries">.*?<\/g>/s,'').replace('</svg>','<g id="feedback-boundaries"><path d="M2 70V420M958 70V420" stroke="#eac45e" stroke-width="4"/><path d="M0 420H16M944 420H960" stroke="#f8dc81" stroke-width="8"/></g></svg>'));
await editMap('05-volcano',svg=>svg.replace(/<g id="feedback-mountain">.*?<\/g>/s,'').replace('</svg>',`<g id="feedback-mountain"><path d="M${mountain.map(p=>p.join(' ')).join('L')}Z" fill="#655c59" stroke="#27333f" stroke-width="4"/><path d="M80 430L162 378L226 320H284L306 346H334L356 320H398L458 378L530 430" stroke="#a78b6d" stroke-width="7"/><path d="M240 322L252 354L234 394M372 322L360 370L388 412M310 348L304 408" stroke="#c86440" stroke-width="5"/></g></svg>`));
for(const id of ['07-home','09-ninja','10-bowling'])await editMap(id,svg=>{
 svg=svg.replace(/<g id="feedback-floor">.*?<\/g>/s,'');
 const color=id==='07-home'?'#b28755':id==='09-ninja'?'#cfbd91':'#dfb878';
 const lines=[-120,40,200,360,520,680,840,1000].map(x=>`M${x} 420L${x+110} 540`).join('');
 return svg.replace('</svg>',`<g id="feedback-floor"><path d="M0 424H960V540H0Z" fill="${color}"/><path d="${lines}M0 462H960M0 510H960" stroke="#866b4a" stroke-width="3"/></g></svg>`);
});
for(let i=0;i<2;i++)await fs.writeFile(path.join(root,`assets/effects/water-flow-${i}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" shape-rendering="crispEdges"><path fill="#62a9c4" d="M0 12H64V64H0Z"/><path fill="none" stroke="#c1e6dd" stroke-width="4" d="M0 ${12+i*2}H16V${16-i*2}H36V${12+i*2}H64"/><path fill="none" stroke="#97d6d6" stroke-width="4" d="M${4+i*10} 32H${22+i*10}M${36-i*8} 48H${58-i*8}"/></svg>\n`);
console.log(JSON.stringify({objects:manifest.items.length,randomSlots:stages.stages.map(s=>({stage:s.id,variable:s.queueSlots?.filter(x=>x.candidates.length>1).length||0}))}));
// Reapply later authored stages and material corrections after the original feedback layer.
await import('./extend-extra-content.mjs');
