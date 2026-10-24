// Authored SVG originals and data for stages 16–20. No browser or image model.
// Idempotent: preserves all previous item records and updates only this collection.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '', 'sharp')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async name => JSON.parse(await fs.readFile(path.join(root, 'data', `${name}.json`), 'utf8'));
const write = async (name, value) => fs.writeFile(path.join(root, 'data', `${name}.json`), JSON.stringify(value, null, 2) + '\n');
const catalog = await read('catalog'), physics = await read('physics'), colliders = await read('colliders');
const manifest = await read('objects-manifest'), stages = await read('stages'), maps = await read('maps-manifest');
const ink = '#101521', cream = '#fff0c1', gold = '#e8b456', red = '#c94d4c', pale = '#d5e5df', steel = '#839ca8';
const P = (d, fill, stroke = ink, sw = 4) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"/>`;
const R = (x,y,w,h,c,s=ink,sw=4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${s}" stroke-width="${sw}"/>`;
const C = (x,y,r,c,s=ink,sw=4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${s}" stroke-width="${sw}"/>`;
const L = (d,c=cream,sw=4) => P(d,'none',c,sw);
const rect = (...r) => ({rect:r}), poly = (...p) => ({polygon:p}), circle = (...c) => ({circle:c});
const ring = (outer,inner) => outer.map((p,i)=>poly(p,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i]));
const entries = [];
function item(group,id,name,material,mass,width,fixtures,svg,behavior='solid',extra={}) {
  entries.push({group,id,name,material,mass,width,fixtures,svg,behavior,extra});
}
physics.materials.food = {friction:0.62,restitution:0.1,flammable:true,explosionResistance:0.12,burnSeconds:3.5,flowResponse:1.15};
physics.behaviors.firework = {fuseSeconds:2.2,radius:125,strength:0.65,fireRadius:80,fireSeconds:1.4,trigger:'launch fuse; physical impacts do not detonate',removeSelf:true};
// Food and tools: the silhouettes, highlights and collision pieces are authored here.
item('12-restaurant','hamburger','ハンバーガー','food',2,66,[rect(14,42,100,70),poly([16,42],[28,24],[44,16],[84,16],[100,24],[112,42])],
 P('M14 48V40L26 26L44 16H84L102 26L114 40V48Z',gold)+R(14,92,100,20,gold)+R(10,76,108,16,'#754330')+P('M10 64L22 56L36 62L52 56L68 62L84 56L100 62L118 56V72L102 78L84 72L68 80L50 74L32 78L10 72Z','#6e9f59')+R(12,48,104,12,red)+P('M16 76H112L86 94L58 82L36 94Z','#f6cc63')+L('M34 30H40M56 24H62M78 30H84M94 38H100',cream,3));
item('12-restaurant','steak','ステーキ','food',3,68,[poly([16,42],[36,24],[86,20],[108,38],[114,76],[96,104],[42,112],[16,94],[8,66])],
 P('M16 42L36 24L86 20L108 38L114 76L96 104L42 112L16 94L8 66Z','#9b4f46')+P('M24 44L40 32L82 30L98 42L104 74L88 94L44 102L24 88L18 64Z','#c87865')+L('M32 42L78 92M52 34L94 76M22 64L54 102','#653c38',6)+P('M80 42H92V52H84V70H72V58H64V48H80Z','#ead8b8')+R(45,48,22,18,'#f5d77b'));
item('12-restaurant','watermelon','スイカ','food',5,62,[circle(64,66,48)],
 P('M40 16H88L112 40V88L88 114H40L16 90V40Z','#6eaa62')+P('M46 16H58L46 42V88L56 114H44L32 90V40ZM72 16H84L98 40V90L84 114H72L84 86V44Z','#315c42','none')+L('M22 44V82M108 48V78','#b9cc72',5)+P('M58 16V8H74V16','#5d854c'));
item('12-restaurant','cheese-wedge','チーズ','food',1.5,60,[poly([16,50],[70,18],[116,60],[116,106],[16,106])],
 P('M16 50L70 18L116 60V106H16Z','#e7b746')+P('M16 50L70 18L116 60H44Z','#ffdc76')+L('M44 60V106','#ad7834')+C(67,82,9,'#b77c37','none')+C(99,74,5,'#b77c37','none')+C(95,98,7,'#b77c37','none')+C(63,42,5,'#d4a449','none'));
item('12-restaurant','bread-slice','食パン','food',1,54,[poly([26,56],[16,44],[16,26],[30,14],[98,14],[112,28],[112,44],[100,56],[100,114],[26,114])],
 P('M26 56L16 44V26L30 14H98L112 28V44L100 56V114H26Z','#bb7a43')+P('M36 50L26 40V30L36 24H92L102 32V40L90 50V104H36Z',cream)+R(46,40,6,6,'#e5d2a0','none')+R(70,70,6,6,'#e5d2a0','none')+L('M44 90H50M78 46H84','#e0c58d',3));
item('12-restaurant','rice-bowl','白米','food',2,56,[poly([14,66],[24,42],[44,24],[80,24],[104,42],[116,68],[108,94],[84,108],[42,108],[20,94])],
 P('M14 66L24 42L44 24H80L104 42L116 68L108 94L84 108H42L20 94Z','#e7e4c9')+P('M22 62L30 44L48 32H78L98 46L106 68L96 88L80 96H44L28 86Z','#fff6da','none')+L('M36 46H44M52 36H60M76 42H84M90 56H98M28 66H36M44 60V68M60 54H68M72 66H80M92 78H100M38 84H46M56 80H64M70 92H78M46 98H54','#c9cfb6',3));
item('12-restaurant','apple','リンゴ','food',1.2,48,[poly([34,30],[52,26],[64,32],[78,26],[98,34],[110,56],[104,94],[84,116],[64,110],[42,116],[24,94],[18,58])],
 P('M34 30L52 26L64 32L78 26L98 34L110 56L104 94L84 116L64 110L42 116L24 94L18 58Z',red)+P('M72 34H94L102 56L96 90L80 106H68Z','#9c3647','none')+L('M34 52V78','#f59574',7)+P('M60 30V12H70V32','#805a39')+P('M70 20L84 8H102L92 22H74Z','#6ea35d'));
item('12-restaurant','ice-cream-cup','カップアイスと付属スプーン','ice',2,56,[poly([16,50],[104,50],[92,116],[28,116]),circle(44,42,25),circle(78,42,25),poly([92,58],[100,10],[108,10],[106,24],[100,60])],
 P('M92 66L100 10H110L106 30L100 66Z',pale)+C(44,42,25,'#fff2cc')+C(78,42,25,'#eab6b0')+R(14,52,92,12,'#edddc6')+P('M20 64H100L90 116H30Z','#6d9cb9')+P('M36 68H48L42 110H34ZM76 68H88L82 110H74Z','#a5d2d8','none')+R(48,78,26,22,cream)+L('M54 88H68','#cc6652',5),'ice_mass',{meltToWaterUnits:3,coldRadius:18});
item('12-restaurant','steak-knife','ステーキナイフ','metal',1.7,32,[poly([54,8],[78,8],[78,76],[66,88],[54,88]),rect(50,84,30,36)],
 P('M54 8H78V76L66 88H54Z',pale)+P('M70 12H78V76L68 86H64Z',steel,'none')+L('M56 20H64M56 32H64M56 44H64M56 56H64','#7292a3',3)+R(50,84,30,36,'#785044')+C(65,96,3,gold,'none')+C(65,110,3,gold,'none'));
item('12-restaurant','fork','フォーク','metal',1,36,[rect(32,10,8,40),rect(50,10,8,40),rect(68,10,8,40),rect(86,10,8,40),rect(32,46,62,12),poly([48,58],[78,58],[70,80],[70,120],[56,120],[56,80])],
 P('M32 10H40V46H50V10H58V46H68V10H76V46H86V10H94V54L78 66L70 80V120H56V80L48 66L32 54Z',steel)+L('M60 74V112M36 14V42M72 14V42',pale,3));
item('12-restaurant','crossed-chopsticks','少し縦にクロスした割りばし','wood',0.5,34,[poly([34,10],[46,8],[88,118],[82,120]),poly([82,8],[94,10],[46,120],[40,118])],
 P('M34 10L46 8L88 118L82 120Z','#d6af74')+P('M82 8L94 10L46 120L40 118Z','#edd3a0')+L('M86 18L50 104','#fff0bf',3));
item('12-restaurant','lunch-pick','お子様ランチピック','wood',0.3,42,[rect(28,10,8,112),poly([36,12],[108,12],[96,34],[108,54],[36,54])],
 R(28,10,8,112,'#cfb486')+P('M36 12H108L96 34L108 54H36Z',cream)+C(66,33,13,red,'none')+L('M30 62V112','#f4ddae',3));
item('12-restaurant','fried-shrimp','エビフライ','food',1.5,62,[poly([18,72],[30,50],[78,30],[94,38],[100,58],[90,76],[38,100],[18,94]),poly([92,40],[104,12],[116,14],[112,44],[122,52],[114,66],[94,60])],
 P('M92 40L104 12L116 14L112 44L122 52L114 66L94 60Z','#d47757')+P('M18 72L30 50L78 30L94 38L100 58L90 76L38 100L18 94Z','#d7a34b')+L('M30 70L38 62M48 70L54 60M64 52L74 48M72 70L80 62','#f8d17a',7)+L('M28 88L44 82M84 42L90 50','#a86835',4));
item('12-restaurant','donut','ドーナツ','food',1,52,ring([[38,14],[90,14],[114,38],[114,90],[90,114],[38,114],[14,90],[14,38]],[[54,42],[74,42],[86,54],[86,74],[74,86],[54,86],[42,74],[42,54]]),
 `<path d="M38 14H90L114 38V90L90 114H38L14 90V38ZM54 42H74L86 54V74L74 86H54L42 74V54Z" fill="#c18b52" fill-rule="evenodd" stroke="${ink}" stroke-width="4"/>`+`<path d="M40 20H88L108 40V84L86 106H40L20 86V40ZM54 42H74L86 54V74L74 86H54L42 74V54Z" fill="#b86b87" fill-rule="evenodd" stroke="${ink}" stroke-width="3"/>`+L('M38 30L44 36M80 28L84 34M24 54H32M94 50H102M30 84L38 90M60 98H70M92 84L96 78','#ffe6aa',4));
item('12-restaurant','fried-egg','目玉焼き','food',1,60,[poly([16,44],[32,32],[48,36],[60,22],[82,26],[90,42],[108,46],[116,66],[108,86],[86,92],[68,108],[44,104],[34,90],[16,84],[8,64])],
 P('M16 44L32 32L48 36L60 22L82 26L90 42L108 46L116 66L108 86L86 92L68 108L44 104L34 90L16 84L8 64Z','#ece5c3')+P('M24 48L38 44L50 48L66 34L78 38L80 52L100 56L106 72L96 80L78 82L66 96L46 92L40 80L22 76L18 62Z','#fff8dc','none')+C(66,65,24,'#f0b53d')+L('M56 50H68M50 58V64','#ffdc6c',5));
// Garage: hollow and slender shapes use compound fixtures, not a single box.
item('13-garage','steering-wheel','ハンドル','rubber',4,60,[circle(64,64,48)],
 C(64,64,48,'#293b47')+C(64,64,34,'#566d78')+C(64,64,28,'#a3b9bb')+P('M20 58H108V70H74V108H54V70H20Z','#465966')+R(48,50,32,28,'#728c9a')+L('M34 30L46 22M82 22L94 30','#839ba5',5));
item('13-garage','engine-block','エンジン','metal',21,86,[rect(20,32,88,68),rect(10,54,18,38),rect(38,12,54,20),rect(32,100,62,16)],
 R(38,12,54,20,'#a3b7b8')+R(20,32,88,68,'#6d8592')+R(10,54,18,38,'#4d6273')+R(32,100,62,16,'#455c6f')+R(32,44,64,38,'#b3c4bd')+L('M42 48V78M58 48V78M74 48V78M90 48V78','#4c6576',5)+C(48,98,12,'#344854')+C(48,98,5,gold,'none')+R(108,42,12,38,'#b38c59')+L('M26 88H90','#d0dad0',4));
item('13-garage','car-battery','バッテリー','metal',10,62,[rect(16,30,96,86),rect(28,16,20,14),rect(80,16,20,14)],
 R(16,30,96,86,'#354955')+R(16,30,96,18,'#617d8b')+R(28,16,20,14,red)+R(80,16,20,14,'#839ca7')+R(28,62,72,40,'#e3c475')+L('M34 80H52M43 71V89M78 80H94','#3a4e5e',5)+R(22,52,6,54,'#7c949c','none'));
item('13-garage','electric-drill','電動ドリル','metal',4,64,[rect(14,24,72,40),rect(86,34,36,16),poly([36,64],[66,64],[58,100],[70,100],[70,116],[22,116],[22,100],[30,100])],
 R(14,24,72,40,'#cfac48')+R(82,30,20,28,'#536d7b')+R(102,36,20,14,pale)+P('M36 64H66L58 100H70V116H22V100H30Z','#d1ab4e')+R(22,100,48,16,'#334958')+R(42,66,16,18,'#354b5c')+L('M22 36H38M22 46H38','#f6da84',4)+L('M64 32V54M72 32V54','#6e633d',3));
item('13-garage','muffler','マフラー','metal',8,76,[rect(8,50,28,18),rect(34,30,58,64),rect(90,52,30,18)],
 R(8,50,28,18,'#68818d')+R(90,52,30,18,'#6e8996')+P('M44 30H82L94 42V82L82 94H44L32 82V42Z','#a2b3b0')+L('M44 38V84M82 38V84','#d5ded0',5)+L('M52 44V80M62 44V80M72 44V80','#748e98',3)+R(110,54,10,14,'#243b4b'));
item('13-garage','impact-wrench','インパクトレンチ','metal',5,60,[rect(16,20,70,44),rect(86,32,32,18),poly([38,64],[72,64],[68,118],[32,118])],
 R(16,20,70,44,'#538c9c')+R(86,30,24,24,'#a2b8bc')+R(108,34,12,16,'#425968')+P('M38 64H72L68 118H32Z','#377080')+R(34,98,34,20,'#2b4351')+R(54,66,18,18,'#233947')+L('M24 30H48M24 42H48','#99c4bc',5)+C(70,42,8,'#355463'));
item('13-garage','car-jack','ジャッキ','metal',7,64,[rect(12,106,104,14),rect(36,12,56,14),poly([20,68],[52,30],[62,38],[34,68],[62,96],[52,104]),poly([108,68],[76,30],[66,38],[94,68],[66,96],[76,104]),rect(8,62,112,10)],
 R(12,106,104,14,'#576d79')+R(36,12,56,14,'#4b6472')+P('M20 68L52 30L62 38L34 68L62 96L52 104Z','#b5c7bd')+P('M108 68L76 30L66 38L94 68L66 96L76 104Z','#8ea8b1')+R(8,62,112,10,'#d9c086')+L('M24 64V70M34 64V70M44 64V70M84 64V70M94 64V70','#726448',2));
item('13-garage','car-door','車のドア','metal',13,76,[rect(12,62,104,56),rect(12,12,12,50),rect(24,12,62,12),poly([86,12],[98,12],[116,62],[104,62])],
 P('M12 12H98L116 62V118H12Z','#b65250')+P('M26 26H86L100 60H26Z','#b5d4d1')+P('M30 30H72L38 54H30Z','#e6eed4','none')+R(12,62,104,16,'#d1715e')+R(76,82,24,8,'#d1d6c3')+L('M24 108H104','#743b43',6)+L('M20 20V110','#ed9876',4));
item('13-garage','passenger-seat','助手席','cloth',12,72,[rect(60,10,36,26),poly([48,36],[104,36],[96,90],[88,108],[16,108],[10,88],[42,76]),rect(22,108,72,12)],
 R(60,10,36,26,'#859995')+P('M48 36H104L96 90L88 108H16L10 88L42 76Z','#697c83')+P('M58 44H94L86 80H50Z','#a5b5a6')+P('M22 88H84V100H22Z','#a7b9ab')+R(22,108,72,12,'#334d60')+L('M58 54H90M54 66H88','#718b8d',4));
item('13-garage','traffic-cone','三角コーン','plastic',2,58,[poly([56,10],[72,10],[104,104],[24,104]),rect(12,104,104,16)],
 P('M56 10H72L104 104H24Z','#df7446')+P('M46 40H82L88 58H40ZM34 80H94L100 98H28Z',cream,'none')+R(12,104,104,16,'#ab533d')+L('M59 16L34 96','#f9b46b',4));
item('13-garage','work-helmet','ヘルメット','plastic',2,60,[poly([12,84],[22,84],[22,50],[38,26],[60,16],[86,22],[104,46],[108,84],[118,84],[118,102],[12,102])],
 P('M12 84H22V50L38 26L60 16L86 22L104 46L108 84H118V102H12Z','#e4be54')+P('M62 18H74V84H62Z','#f8df80','none')+L('M32 48V78M98 54V78','#a47a36',5)+R(12,84,106,18,'#c3913f')+R(46,56,38,20,cream)+L('M55 66H75M65 58V74','#6f8c65',4));
// Festival queue: exactly the requested fifteen categories, including three fireworks.
item('14-festival','firework-shell','打上花火玉','paper',3,46,[circle(64,66,42),rect(58,12,10,20)],
 C(64,66,42,'#bd5a5f')+P('M26 44H102V58H26ZM24 78H104V90H24Z','#eac76c','none')+R(54,44,20,46,'#eddda1')+L('M64 24V12H78V6','#a6a384',5)+P('M64 50L68 60L80 64L68 68L64 80L60 68L48 64L60 60Z',red,'none'),'firework',{fuseSeconds:2.4,radius:132,strength:0.6,fireRadius:80,fireSeconds:1.4});
item('14-festival','firework-rocket','ロケット花火','paper',1.5,38,[rect(42,34,44,58),poly([42,34],[64,8],[86,34]),rect(60,92,8,30)],
 R(60,92,8,30,'#c3a476')+R(42,34,44,58,'#548fae')+P('M40 34L64 8L88 34Z',red)+P('M44 38H84V48L44 68V58L84 38ZM44 78L84 58V70L44 90Z',cream,'none')+L('M44 88L30 98V108','#b6a26f',4),'firework',{fuseSeconds:1.8,radius:112,strength:0.55,fireRadius:70,fireSeconds:1.2});
item('14-festival','firework-fountain','噴出花火','paper',3,44,[poly([42,18],[86,18],[108,116],[20,116])],
 P('M42 18H86L108 116H20Z','#698f80')+P('M44 24H84L90 52H38Z','#e3c36c')+P('M30 84H98L102 100H26Z','#d4d89e','none')+P('M64 58L70 70L84 74L72 82L76 98L64 90L50 98L54 82L42 74L58 70Z','#e8b454')+L('M64 18V8H76','#c6b18b',5),'firework',{fuseSeconds:3.0,radius:108,strength:0.45,fireRadius:96,fireSeconds:2.0});
item('14-festival','candy-apple','りんご飴','food',1.2,38,[circle(64,42,30),rect(60,72,8,50)],
 R(60,70,8,52,'#d7ba87')+P('M44 12H84L98 30V54L82 74H46L30 56V32Z','#bc4056')+P('M44 20H60V28H46V44H38V30Z','#ffd6bc','none')+P('M78 20H84L92 32V50L78 66H66V58L82 46Z','#7e354f','none'));
item('14-festival','cotton-candy','綿菓子','food',0.6,48,[circle(46,42,25),circle(78,42,25),circle(64,67,27),rect(60,88,8,34)],
 R(60,86,8,36,'#cdb78a')+P('M22 42L30 22L46 16L62 24L78 14L98 24L110 48L102 68L86 78L78 94H50L40 80L22 68Z','#d998b0')+P('M32 38L40 28H54L62 36L80 26H92L100 44L90 52L98 62L82 70L74 84H54L48 70L32 62Z','#f2bfcd','none')+L('M42 42H54M72 54H88','#ffe2d5',5));
item('14-festival','chocolate-banana','チョコバナナ','food',1,38,[poly([50,12],[74,12],[88,28],[88,74],[76,96],[52,96],[40,82],[40,34]),rect(60,94,8,28)],
 R(60,92,8,30,'#d8bd88')+P('M50 12H74L88 28V74L76 96H52L40 82V34Z','#6b4440')+P('M48 32L56 20H68L78 30V70L68 86H54L48 76Z','#8b5750','none')+L('M54 32H62M70 44V52M50 66H58M66 76H74','#edc56b',4)+L('M68 26V34M54 48H62M72 60V68','#cde0aa',3));
item('14-festival','grilled-corn','焼きとうもろこし','food',1.5,42,[poly([44,12],[84,12],[98,28],[98,90],[84,108],[44,108],[30,90],[30,28]),rect(60,108,8,16)],
 R(60,106,8,18,'#ceb68a')+P('M44 12H84L98 28V90L84 108H44L30 90V28Z','#d7a741')+P('M44 20H80L90 30V86L78 98H46L38 86V30Z','#f4c75c','none')+L('M48 24V94M62 20V98M76 24V94M38 36H90M38 50H90M38 64H90M38 78H90','#bd8536',3)+L('M42 42H52M68 58H82M46 82H62','#6f4a35',4));
item('14-festival','takoyaki-tray','たこ焼き','food',2,66,[poly([8,48],[120,48],[108,104],[20,104]),circle(36,42,20),circle(64,42,20),circle(92,42,20)],
 P('M8 48H120L108 104H20Z','#cfb892')+C(36,42,20,'#b87941')+C(64,42,20,'#ca8e4e')+C(92,42,20,'#b87941')+P('M16 66H112L104 94H24Z','#e8cda5')+L('M22 38L36 46L48 36M50 40L64 48L78 38M80 38L94 46L108 36','#624337',6)+L('M26 30H38M56 32H66M84 30H94',cream,4)+L('M30 34H34M64 28H68M96 38H100','#5b8251',3));
item('14-festival','yakisoba','焼きそば','food',2.5,70,[poly([8,42],[120,42],[110,106],[18,106])],
 P('M8 42H120L110 106H18Z','#e7d1ac')+P('M16 48L28 30H96L114 50V80H16Z','#93613c')+L('M22 44H44L50 56H76L86 40H102M20 64H40L48 48H66L74 70H108M24 78H50L58 62H88L98 78','#d6a35e',5)+P('M34 38H46V50H34ZM78 52H92V64H78Z','#7f9b55','none')+L('M58 36L68 44M96 64L104 70',red,5)+P('M14 82H114L108 102H20Z','#efe0bd'));
item('14-festival','frankfurter','フランクフルト','food',1.5,34,[poly([48,10],[80,10],[90,24],[90,86],[80,102],[48,102],[38,86],[38,24]),rect(60,100,8,24)],
 R(60,100,8,24,'#cfb488')+P('M48 10H80L90 24V86L80 102H48L38 86V24Z','#bd634c')+L('M48 28L76 40L48 54L76 66L48 80L74 92','#edbf59',6)+L('M80 26V80','#813b39',4));
item('14-festival','shaved-ice','かき氷','ice',2,52,[poly([22,70],[106,70],[92,112],[36,112]),poly([14,70],[24,52],[30,38],[44,28],[56,12],[72,12],[86,28],[100,38],[106,54],[116,70])],
 P('M14 70L24 52L30 38L44 28L56 12H72L86 28L100 38L106 54L116 70Z','#d7ece6')+P('M40 32L56 12H72L86 28L96 34L90 50H76L68 62L56 50H44Z','#ca6987','none')+P('M22 70H106L92 112H36Z','#658fa9')+L('M36 80H94M42 96H88','#e7e6ca',6)+R(48,112,32,8,'#456980'),'ice_mass',{meltToWaterUnits:4,coldRadius:24});
item('14-festival','water-yoyo','水ヨーヨー','water_shell',1,42,[circle(64,70,38),rect(58,22,12,12)],
 L('M64 24V10H88V18','#d2c394',3)+R(58,22,12,12,'#7d6db0')+C(64,70,38,'#a785c1')+P('M30 56H98V66H30ZM30 82H98V92H30Z','#6e93b9','none')+C(51,49,8,'#f5dcaa','none')+C(82,76,7,'#e1a4ba','none')+L('M40 42L34 54','#e7e2d0',4),'water_release',{waterUnits:6,breakImpactSpeed:70});
item('14-festival','fish-scoop','金魚すくいのポイ','paper',0.4,48,[circle(64,40,30),rect(58,70,12,52)],
 R(58,68,12,54,'#bc696c')+C(64,40,30,'#d88783')+C(64,40,23,'#eee4c8')+L('M50 28H74M44 40H82M52 52H74','#c9cbb0',2)+L('M62 78V114','#e8b5a2',3),'breakable',{impactSpeed:120,minImpactEnergy:0.2,loadForceThreshold:1000,loadHoldSeconds:0.3});
item('14-festival','festival-mask','お祭りのお面','plastic',1.3,46,[poly([22,14],[48,28],[80,28],[106,14],[102,78],[86,106],[64,120],[42,106],[26,78])],
 P('M22 14L48 28H80L106 14L102 78L86 106L64 120L42 106L26 78Z','#eee7cf')+P('M28 24L44 36L30 54ZM100 24L84 36L98 54Z',red,'none')+P('M34 56L54 62L46 70L34 66ZM94 56L74 62L82 70L94 66Z','#35465a')+P('M64 72L74 84L64 92L54 84Z',red)+L('M44 98L64 106L84 98',red,4)+L('M34 80L46 84M94 80L82 84','#d17c70',4));

await fs.mkdir(path.join(root,'assets/raster/objects'),{recursive:true});
for (const e of entries) {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" shape-rendering="crispEdges">${e.svg}</svg>`;
  const {data,info} = await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let minX=128,minY=128,maxX=-1,maxY=-1,opaquePixels=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);opaquePixels++;}
  if(maxX<0)throw new Error(`Empty artwork: ${e.id}`);
  minX=Math.max(0,minX-1); minY=Math.max(0,minY-1); maxX=Math.min(127,maxX+1); maxY=Math.min(127,maxY+1);
  const vb=[minX,minY,maxX-minX+1,maxY-minY+1],scale=e.width/vb[2];
  const svg=raw.replace('width="128" height="128" viewBox="0 0 128 128"',`width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(' ')}"`);
  await fs.writeFile(path.join(root,`assets/objects/${e.id}.svg`),svg+'\n');
  await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/raster/objects/${e.id}.png`));
  await sharp(Buffer.from(svg)).webp({lossless:true}).toFile(path.join(root,`assets/raster/objects/${e.id}.webp`));
  const score=['firework','water_release'].includes(e.behavior)?0:100;
  const values=[e.id,e.name,e.material,e.mass,score,e.width,e.id,e.behavior];
  const index=catalog.items.findIndex(i=>i[0]===e.id);if(index<0)catalog.items.push(values);else catalog.items[index]=values;
  colliders.templates[e.id]=e.fixtures;
  physics.overrides[e.id]=e.extra;
  const record={id:e.id,nameJa:e.name,svg:`objects/${e.id}.svg`,png:`raster/objects/${e.id}.png`,webp:`raster/objects/${e.id}.webp`,sourceGrid:[128,128],viewBox:vb,pivotSource:[64,64],pivotCropped:[64-minX,64-minY],worldWidth:e.width,worldHeight:vb[3]*scale,worldScale:scale,material:e.material,mass:e.mass,score,bodyKind:'dynamic',behavior:e.behavior,colliderTemplate:e.id,fixtures:e.fixtures,physics:{...physics.materials[e.material],...physics.behaviors[e.behavior],...e.extra},opaquePixels};
  const ri=manifest.items.findIndex(i=>i.id===e.id);if(ri<0)manifest.items.push(record);else manifest.items[ri]=record;
}
for(const group of new Set(entries.map(e=>e.group)))await fs.writeFile(path.join(root,`assets/source/${group}.svg`),`<svg xmlns="http://www.w3.org/2000/svg">\n${entries.filter(e=>e.group===group).map(e=>`<symbol id="${e.id}" viewBox="0 0 128 128">${e.svg}</symbol>`).join('\n')}\n</svg>\n`);

const ice = structuredClone(stages.stages.find(s=>s.iceFloor||s.map==='16-ice-floor'||s.map==='18-ice-floor'));
if(!ice)throw new Error('Original ice stage is required');
ice.id=18;ice.map='18-ice-floor';ice.iceFloor=true;ice.displayNameASCII='ICE FLOOR';ice.assignment='implementation-assumption: preserve original ice stage at 18; latest user did not specify stage18';
ice.lesson='ICE IS SLIPPERY. ONLY THE BOOT SOLES ADD GRIP.';
const standard=(id,name,map,queue,terrain,cannon,scoreZone,lesson)=>({id,nameJa:name,displayNameASCII:map.replace(/^\d+-/,'').replaceAll('-',' ').toUpperCase(),map,status:'specified',gravity:980,cannon,scoreZone,terrain,queue,preplaced:[],lesson});
const restaurant=standard(16,'レストラン 凹んだ皿','16-restaurant',entries.filter(e=>e.group==='12-restaurant').map(e=>e.id),[
  rect(0,478,960,62),poly([80,382],[110,382],[150,438],[510,438],[550,382],[580,382],[530,462],[130,462]),rect(230,462,200,16)
],[810,478],[80,70,500,394],'STACK FOOD INSIDE THE PLATE. THE MIDDLE IS HOLLOW.');
restaurant.notes=['The plate is a real concave collision polygon; its open interior is not filled by a bounding box.','15 food/tool throws; the spoon belongs to the ice-cream cup body.'];
const garage=standard(17,'ガレージ','17-garage',['tire','steering-wheel','engine-block','car-battery','electric-drill','muffler','impact-wrench','car-jack','car-door','passenger-seat','traffic-cone','work-helmet','metal-drum','bucket','fire-extinguisher'],[
 rect(0,452,960,88),rect(90,390,430,24),rect(110,414,32,38),rect(468,414,32,38)
],[810,452],[80,70,450,384],'HEAVY PARTS HIT HARD. USE THE LIFT AS A PLATFORM.');
const festival=standard(19,'祭り 花火と紅白の台','19-festival',['firework-shell','firework-rocket','firework-fountain','candy-apple','cotton-candy','chocolate-banana','grilled-corn','takoyaki-tray','yakisoba','frankfurter','shaved-ice','water-yoyo','fish-scoop','festival-mask','lantern'],[
 rect(0,452,960,88),rect(84,386,470,66)
],[810,452],[70,70,500,384],'FIREWORKS BOUNCE FIRST, THEN BURST WHEN THEIR FUSE ENDS.');
festival.surfaceZones=[{rect:[84,382,470,12],flammable:true,burnSeconds:3}];
const laboratory=standard(20,'なんでも実験室','20-laboratory',['water-jug','flamethrower','bomb','ice-block','firework-rocket','water-yoyo','campfire','freeze-sprayer','gas-canister','umbrella','grip-boots','car-jack','water-balloon','fried-egg','refrigerator'],[
 rect(0,452,190,88),rect(190,510,290,30),rect(480,452,480,88),rect(92,360,150,22),rect(92,382,22,70),rect(220,382,22,70),rect(520,408,130,18)
],[810,452],[68,70,600,440],'WATER, FIRE, ICE AND BLASTS. TRY THEIR INTERACTIONS.');
laboratory.water=[{rect:[198,462,274,48],type:'flow',direction:[1,0],speed:42,volumeCap:72}];
laboratory.sources=[{position:[360,425],rateUnitsPerSecond:1,maxUnits:18}];
laboratory.surfaceZones=[{rect:[520,402,130,18],initialState:'burning',burnSeconds:5,reignite:false},{rect:[0,446,190,12],state:'ice',friction:0.025,permanent:true}];
laboratory.preplaced=[{id:'log',x:565,groundY:408,scoring:false},{id:'ice-block',x:144,groundY:360,scoring:false}];
for(const stage of [restaurant,garage,ice,festival,laboratory])stages.stages[stage.id-1]=stage;
stages.status='Godot 4.7.2: 20 playable stages, 15 throws each. Stage18 ice-floor reassignment is an implementation assumption; browser playtesting pending.';

const svgMap=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" fill="none" shape-rendering="crispEdges">${body}</svg>\n`;
const restaurantArt=R(0,0,960,540,'#d6bb9b','none')+R(0,0,960,100,'#593d4b','none')+R(0,100,960,260,'#e5d2ad','none')+R(50,126,150,166,'#6d9396')+R(226,126,150,166,'#6d9396')+L('M125 126V292M50 208H200M300 126V292M226 208H376','#e9dfb5',8)+R(600,150,290,144,'#8c6660')+L('M620 176H864M620 210H864M620 244H864','#b9997d',5)+R(0,360,960,180,'#986546','none')+R(0,478,960,62,'#654d47','none')+L('M0 482H960','#d5a879',8)+R(230,462,200,16,'#a0b5b4','#314a58',4)+P('M80 382H110L150 438H510L550 382H580L530 462H130Z','#b6c7c0','#314a58',6)+P('M110 382L150 438H510L550 382H536L500 426H160L124 382Z','#eff0d4','none')+L('M146 450H514','#829f9f',5)+R(720,358,176,14,'#d0a170')+R(738,372,18,106,'#6d4d43')+R(860,372,18,106,'#6d4d43');
const garageArt=R(0,0,960,540,'#283b4d','none')+R(42,76,520,300,'#596f79')+L('M48 96H556M48 126H556M48 156H556M48 186H556M48 216H556M48 246H556M48 276H556M48 306H556M48 336H556','#344c5e',6)+R(600,80,292,280,'#8a765d')+L('M620 110H868M620 150H868M620 190H868M620 230H868M620 270H868M620 310H868','#655e52',5)+R(0,452,960,88,'#617078','none')+R(90,390,430,24,'#d4ab4d')+R(110,414,32,38,'#7b4742')+R(468,414,32,38,'#7b4742')+L('M104 396L116 408M150 396L162 408M196 396L208 408M242 396L254 408M288 396L300 408M334 396L346 408M380 396L392 408M426 396L438 408M472 396L484 408','#554e3b',7)+R(64,42,420,16,'#dbe3c4')+R(650,378,220,28,'#405869')+R(670,406,18,46,'#253e50')+R(830,406,18,46,'#253e50')+L('M0 486H960M0 522H960M180 452V540M480 452V540M780 452V540','#475e6b',3);
const festivalArt=R(0,0,960,540,'#263751','none')+R(0,290,960,250,'#42566a','none')+L('M0 92L240 126L480 102L720 130L960 94','#dbc59b',4)+[80,240,400,560,720,880].map((x,i)=>R(x-15,108+(i%2)*20,30,42,i%2?cream:red)+L(`M${x-10} ${116+(i%2)*20}H${x+10}M${x-10} ${142+(i%2)*20}H${x+10}`,'#7c4e4f',3)).join('')+R(40,254,236,100,'#7d665d')+P('M24 254L78 208H242L292 254Z',red)+R(648,254,260,110,'#806a5c')+P('M632 254L686 208H874L926 254Z','#c6ad63')+R(0,452,960,88,'#6b776b','none')+R(84,386,470,66,cream)+[84,164,244,324,404,484].map(x=>R(x,386,38,66,red,'none')).join('')+R(80,378,478,12,'#b2925c')+L('M0 472H960','#87907a',4);
const laboratoryArt=R(0,0,960,540,'#1e3549','none')+R(22,66,916,300,'#526e7a')+L('M32 86H928M32 126H928M32 166H928M32 206H928M32 246H928M32 286H928M32 326H928M120 76V356M280 76V356M440 76V356M600 76V356M760 76V356','#395564',3)+R(664,104,212,166,'#203c50')+R(680,120,180,114,'#76b5b1')+L('M690 190H720L738 158L756 208L776 142L794 190H846','#d6e8ad',5)+C(704,250,7,red)+C(738,250,7,gold)+C(772,250,7,'#86c9b5')+R(0,452,190,88,'#759ba7','none')+R(190,510,290,30,'#485b6a','none')+R(480,452,480,88,'#6b858e','none')+L('M0 452H190M480 452H960','#bfd6cb',8)+R(92,360,150,22,'#c5d2bf')+R(92,382,22,70,'#4c6272')+R(220,382,22,70,'#4c6272')+R(520,408,130,18,'#b1b8a8')+L('M210 510V470H462V510','#90afbd',5)+L('M326 78V390H360V422','#b2c4b8',14)+R(350,414,22,12,'#d4d4b4')+P('M20 450H170L152 460H42Z','#d9eeea','none');
const artById={'16-restaurant':restaurantArt,'17-garage':garageArt,'19-festival':festivalArt,'20-laboratory':laboratoryArt};
for(const [id,body] of Object.entries(artById))await fs.writeFile(path.join(root,`assets/maps/${id}.svg`),svgMap(body));
const oldIce=path.join(root,'assets/maps/16-ice-floor.svg'), newIce=path.join(root,'assets/maps/18-ice-floor.svg');
try{await fs.copyFile(oldIce,newIce);}catch(error){if(error.code!=='ENOENT')throw error;await fs.access(newIce);}
// Superseded previews are no longer selected maps. Keep the original source sheet as history.
for(const id of ['16-ice-floor','17-hollow-dais-candidate','18-subway-candidate','19-aqueduct-candidate','20-ruined-castle-candidate'])for(const ext of ['svg','png','svg.import','png.import'])await fs.rm(path.join(root,`assets/maps/${id}.${ext}`),{force:true});
maps.sourceAliases={};maps.maps=stages.stages.map(s=>({id:s.map,stage:s.id,nameJa:s.nameJa,status:s.status,svg:`maps/${s.map}.svg`,worldSize:[960,540],terrain:s.terrain,backgroundCollision:false,...(s.assignment?{assignment:s.assignment}:{})}));
await Promise.all([write('catalog',catalog),write('physics',physics),write('colliders',colliders),write('objects-manifest',manifest),write('stages',stages),write('maps-manifest',maps)]);
const known=new Set(manifest.items.map(e=>e.id));
for(const s of stages.stages){if(!Array.isArray(s.queue)||s.queue.length<15||s.queue.some(id=>!known.has(id))||(s.queue.length>15&&new Set(s.queue).size<15))throw new Error(`Invalid stage queue ${s.id}`);}
const summary=await read('build-summary');Object.assign(summary,{objects:manifest.items.length,maps:20,specifiedStages:19,playableStages:20,stage18Assignment:'implementation assumption: retained ice floor'});await write('build-summary',summary);
const verification=await read('verification');
Object.assign(verification,{objects:manifest.items.length,maps:20,stagesWith15Shots:20,croppedSpritesChecked:manifest.items.length,uniqueRenderedSprites:manifest.items.length});
verification.checks=verification.checks.filter(s=>!s.includes('117')&&!s.includes('16 specified')&&!s.includes('Stage 16 has permanent')&&!s.includes('authored object SVG records')&&!s.startsWith('40 new SVG')&&!s.startsWith('Stage 18 retains')&&!s.startsWith('Stage 16 plate'));
verification.checks.push(`${manifest.items.length} authored object SVG records; all 20 queues reference 15 existing items`,'40 new SVG silhouettes cropped from alpha bounds, with compound collision fixtures','Stage 18 retains permanent ice and sole-grip boots; numbering is an implementation assumption','Stage 16 plate uses an open concave terrain polygon; timed fireworks are physical bodies');
await write('verification',verification);
// Dedicated Node visual review sheets; these do not compete with gameplay previews.
await fs.mkdir(path.join(root,'previews'),{recursive:true});
const itemImages=[];
for(const [index,e] of entries.entries()){
  const image=await sharp(path.join(root,`assets/raster/objects/${e.id}.png`)).resize({width:104,height:104,fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
  itemImages.push({input:image.data,left:index%8*128+Math.round((128-image.info.width)/2),top:Math.floor(index/8)*128+Math.round((128-image.info.height)/2)});
}
await sharp({create:{width:1024,height:Math.ceil(entries.length/8)*128,channels:4,background:'#243449'}}).composite(itemImages).png().toFile(path.join(root,'previews/stage-content-items.png'));
const mapImages=[];
for(const [index,id] of Object.keys(artById).entries())mapImages.push({input:await sharp(await fs.readFile(path.join(root,`assets/maps/${id}.svg`))).resize(480,270,{kernel:'nearest'}).png().toBuffer(),left:index%2*480,top:Math.floor(index/2)*270});
await sharp({create:{width:960,height:540,channels:4,background:'#243449'}}).composite(mapImages).png().toFile(path.join(root,'previews/stage-content-maps.png'));
console.log(`Authored ${entries.length} new SVG items; ${manifest.items.length} total items, 20 maps and 20 fifteen-shot queues.`);
// Preserve later user feedback when regenerating the original stage collection.
await import('./apply-feedback-content.mjs');
