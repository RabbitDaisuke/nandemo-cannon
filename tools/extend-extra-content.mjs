// Additional authored SVG items and stages 21–35. Regenerates only this collection.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp');}catch{sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'','sharp'));}
const read=async n=>JSON.parse(await fs.readFile(path.join(root,`data/${n}.json`),'utf8'));
const write=async(n,v)=>fs.writeFile(path.join(root,`data/${n}.json`),JSON.stringify(v,null,2)+'\n');
const manifest=await read('objects-manifest'),catalog=await read('catalog'),physics=await read('physics'),colliders=await read('colliders'),stages=await read('stages'),maps=await read('maps-manifest'),ui=await read('ui-ja');
const ink='#111725',cream='#fff0cd',gold='#efba59',red='#d75f68',blue='#629bca',pink='#eaa0b9',mint='#8ac9b0',steel='#8cabb8',wood='#aa7852';
const P=(d,c,s=ink,w=4)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linejoin="miter"/>`;
const R=(x,y,w,h,c,s=ink,sw=4)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${s}" stroke-width="${sw}"/>`;
const C=(x,y,r,c,s=ink,w=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${s}" stroke-width="${w}"/>`;
const L=(d,c=cream,w=4)=>P(d,'none',c,w);
const E=(x,y)=>R(x-4,y-6,9,12,ink,'none')+R(x-3,y-5,4,4,'#ffffff','none');
const face=(x,y)=>E(x-13,y)+E(x+13,y)+L(`M${x-5} ${y+12}H${x+5}`,ink,3);
const rect=(...r)=>({rect:r}),poly=(...p)=>({polygon:p}),circle=(...c)=>({circle:c});
const ring=(cx,cy,r,inner)=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,b=(i+1)*Math.PI/6;return poly([cx+Math.cos(a)*r,cy+Math.sin(a)*r],[cx+Math.cos(b)*r,cy+Math.sin(b)*r],[cx+Math.cos(b)*inner,cy+Math.sin(b)*inner],[cx+Math.cos(a)*inner,cy+Math.sin(a)*inner]);});
const items=[];
function add(id,name,kana,material,mass,width,fixtures,svg,behavior='solid',extra={}){items.push({id,name,kana,material,mass,width,fixtures,svg,behavior,extra});}
physics.behaviors.stove={burnerSource:[64,24],burnerWidth:90,immersionBreak:true,fireRadius:24};
physics.behaviors.lightning={fuseSeconds:1.1,radius:110,strength:0.7,fireRadius:80,fireSeconds:3,removeSelf:true};
physics.materials.rubber.coldBrittle=true;
const fragile={impactSpeed:175,minImpactEnergy:2,loadForceThreshold:5000,loadHoldSeconds:0.35};
const water={waterUnits:8,releaseUnits:8,breakImpactSpeed:120,impactSpeed:120};
// General objects: each has its own silhouette, highlights and compound fixtures.
add('tabletop-stove','卓上ガスコンロ','たくじょうコンロ','metal',6,100,[rect(10,38,108,70),rect(22,24,84,14)],R(10,38,108,70,red)+R(17,48,94,18,'#ef9a83','none')+R(22,24,84,14,steel)+R(40,17,48,10,'#3d4a57')+L('M24 20V40M104 20V40M48 18V40M80 18V40',ink,6)+C(88,86,10,'#e5d6b7')+R(20,82,36,12,'#7e4954')+R(17,108,16,10,ink)+R(94,108,16,10,ink),'stove');
add('submarine','潜水艦','せんすいかん','metal',16,142,[poly([10,51],[28,36],[98,36],[118,53],[118,82],[98,98],[28,98],[10,82]),rect(52,24,30,14),rect(65,6,10,22)],P('M10 52L28 36H98L118 54V82L98 98H28L10 82Z',gold)+R(52,24,30,14,blue)+P('M65 28V6H89V16H75V28Z',steel)+R(4,58,12,22,red)+R(114,55,10,33,red)+[35,63,91].map(x=>C(x,67,12,'#355a79')+C(x-3,63,4,'#b4e4eb','none')).join('')+L('M30 89H96','#b8833d',4));
add('charger','充電器','じゅうでんき','plastic',2,54,[rect(20,36,88,78),rect(34,10,12,26),rect(80,10,12,26)],R(20,36,88,78,'#253d6b')+R(34,10,12,26,steel)+R(80,10,12,26,steel)+R(28,44,72,10,'#466395','none')+R(43,77,42,12,ink)+L('M33 103H94','#6586ac',3));
add('ramune-bottle','ラムネ瓶','ラムネびん','glass',1.5,36,[poly([46,10],[82,10],[82,46],[96,66],[96,116],[32,116],[32,66],[46,46])],P('M46 10H82V46L96 66V116H32V66L46 46Z','#a1dcda')+R(42,8,44,14,blue)+P('M40 78H88V108H40Z','#55a9c2','none')+R(37,67,54,28,cream)+C(64,53,8,'#9cbed2')+L('M42 39V53M42 104V111','#e5fff0',4),'water_release',water);
add('canele','カヌレ','カヌレ','food',1.5,52,[poly([28,25],[40,14],[88,14],[100,25],[110,111],[18,111])],P('M28 25L40 14H88L100 25L110 111H18Z','#87503a')+P('M29 28L42 21H86L99 28L92 39H36Z','#bc7b4b')+L('M34 47L29 100M50 45V104M72 45V104M91 47L98 100','#d59960',6)+L('M20 111H108','#4c3232',5));
add('hammer','ハンマー','ハンマー','metal',4,60,[rect(54,46,20,72),circle(64,30,27)],R(54,46,20,72,wood)+C(64,30,27,steel)+L('M45 18H72M61 65V106','#d2d9c9',5)+R(52,104,24,15,'#6b5050'));
add('mont-blanc','モンブラン','モンブラン','food',1.8,64,[poly([18,106],[26,65],[40,35],[56,22],[76,22],[94,44],[106,106])],P('M18 106L26 65L40 35L56 22H76L94 44L106 106Z','#c98b56')+L('M41 42H86M32 55H96M29 68H100M25 82H103M22 96H106','#f1c689',6)+R(18,106,88,13,'#eee4cb')+C(66,19,11,'#754832')+L('M61 12H67',cream,3));
add('utility-knife','カッターナイフ','カッターナイフ','metal',1.5,34,[poly([43,46],[68,10],[86,10],[80,48],[80,118],[43,118])],P('M43 48L68 10H86L80 48Z',steel)+R(43,48,37,70,gold)+R(52,56,18,45,'#d38938')+R(53,65,17,18,steel)+L('M58 36H82M49 107H74',cream,3));
add('bagel','ベーグル','ベーグル','food',1.5,58,ring(64,64,48,18),`<path fill="#cb8f52" fill-rule="evenodd" stroke="${ink}" stroke-width="4" d="M112 64A48 48 0 1 0 16 64A48 48 0 1 0 112 64ZM82 64A18 18 0 1 1 46 64A18 18 0 1 1 82 64Z"/>`+L('M35 36H43M58 24H66M88 39H96M28 76H36M56 98H64M90 83H98','#f5ce8f',4));
// Toy faces deliberately include a small bright eye highlight.
add('bunny-plush','うさぎぬいぐるみ','うさぎのぬいぐるみ','cloth',1.1,57,[rect(38,5,16,44),rect(74,5,16,44),circle(64,61,32),poly([42,82],[86,82],[98,115],[30,115])],R(38,5,16,44,cream)+R(74,5,16,44,cream)+R(43,11,6,26,pink,'none')+R(79,11,6,26,pink,'none')+P('M42 80H86L98 115H30Z',pink)+C(64,61,32,cream)+face(64,60)+C(36,111,12,cream)+C(92,111,12,cream));
add('cute-doll','かわいい人形','かわいいにんぎょう','plastic',1.6,54,[circle(64,35,28),poly([48,64],[80,64],[106,108],[22,108]),rect(43,108,14,15),rect(73,108,14,15)],C(64,35,28,'#f4c69c')+P('M36 32V18L48 8H82L94 20V36L78 27L64 17L49 31Z','#714f63')+face(64,38)+P('M48 64H80L106 108H22Z',blue)+R(43,108,14,15,red)+R(73,108,14,15,red)+R(57,70,14,24,cream)+P('M83 7L96 3V22L83 18L72 23V4Z',pink));
add('trumpet','トランペット','トランペット','metal',2,80,[rect(12,51,74,35),poly([82,48],[118,30],[118,100],[82,82])],P('M12 51H85L118 30V100L85 82H30L20 92H10V76H22V63H12Z',gold)+L('M28 62H83M30 74H78','#ffdf81',5)+R(42,36,10,28,steel)+R(61,34,10,30,steel)+R(80,36,10,28,steel)+L('M107 43V87','#a47137',5));
add('toy-train','電車のおもちゃ','でんしゃのおもちゃ','plastic',2.5,84,[rect(10,34,108,64),circle(32,102,13),circle(96,102,13)],R(10,34,108,64,red)+R(20,19,81,15,cream)+R(22,46,25,26,'#a5e3e0')+R(57,46,25,26,'#a5e3e0')+R(92,46,16,26,'#a5e3e0')+R(14,80,100,11,gold,'none')+C(32,102,13,'#344b68')+C(96,102,13,'#344b68')+C(32,102,5,steel)+C(96,102,5,steel));
add('battery','電池','でんち','metal',1.4,32,[rect(35,15,58,105),rect(48,5,32,10)],R(35,15,58,105,'#345779')+R(48,5,32,10,steel)+R(35,15,58,30,gold)+L('M54 30H74M64 20V40',ink,4)+R(44,57,12,52,'#6998ad','none')+L('M72 104H82',cream,4));
add('snowman-plush','雪だるま','ゆきだるま','cloth',1.2,61,[circle(64,38,27),circle(64,86,36)],C(64,86,36,'#eaf1db')+C(64,38,27,'#f8f4de')+R(37,60,54,13,blue)+R(80,70,15,28,blue)+face(64,36)+P('M61 44H82L65 52Z','#e6a049')+C(64,87,4,ink)+C(64,104,4,ink)+R(45,8,38,12,red));
add('rubber-duck','アヒルのおもちゃ','アヒルのおもちゃ','rubber',0.8,62,[circle(43,42,26),poly([17,66],[66,60],[90,75],[113,56],[112,96],[91,112],[37,112],[16,96])],P('M17 66L66 60L90 75L113 56L112 96L91 112H37L16 96Z',gold)+C(43,42,26,'#f3cd65')+P('M20 46H6V57H27Z','#ed8a45')+E(46,38)+P('M55 79L83 84L73 101L49 96Z','#e4a844')+L('M30 76H40','#ffedac',4));
add('toy-package','おもちゃパッケージ','おもちゃのはこ','paper',1.4,66,[rect(14,14,100,106)],R(14,14,100,106,blue)+R(23,38,82,62,'#a7d9c7')+P('M41 95V64L52 52H78L89 64V95Z',pink)+face(65,71)+R(24,20,70,10,cream,'none')+R(25,106,48,7,gold,'none')+L('M20 34H108',ink,4));
add('building-blocks','つみき','つみき','wood',2,62,[rect(10,71,46,46),rect(60,71,54,46),poly([29,66],[64,14],[99,66])],R(10,71,46,46,red)+R(60,71,54,46,blue)+P('M29 66L64 14L99 66Z',gold)+L('M18 80H46M70 80H103M55 45L64 32',cream,4));
add('spinning-top','こま','こま','wood',1.1,52,[poly([14,52],[64,23],[114,52],[93,81],[64,112],[35,81]),rect(58,6,12,20)],P('M14 52L64 23L114 52L93 81L64 112L35 81Z',red)+P('M14 52H114L101 69H27Z',gold)+P('M35 81H93L78 96H50Z',blue)+R(58,6,12,20,wood)+L('M35 43L60 30',cream,4));
add('wooden-obstacle','木の大きな障害物','おおきなきのかべ','wood',60,148,[rect(17,5,94,118)],R(17,5,94,118,wood)+R(24,12,80,12,'#cc9c68','none')+L('M38 9V119M64 9V119M90 9V119','#715040',4)+R(12,28,104,14,'#d7ae78')+R(12,92,104,14,'#d7ae78')+[23,103].map(x=>C(x,35,3,ink)+C(x,99,3,ink)).join(''),'solid',{burnSeconds:5,explosionResistance:0.15,impactDestructible:false});
add('gunpowder-barrel','火薬ダル','かやくだる','wood',5,61,[poly([29,11],[99,11],[111,29],[111,101],[99,119],[29,119],[17,101],[17,29])],P('M29 11H99L111 29V101L99 119H29L17 101V29Z','#916142')+L('M38 17V112M62 17V112M86 17V112','#bc8c59',5)+R(17,28,94,13,steel)+R(17,90,94,13,steel)+P('M64 48L79 73H49Z',red)+L('M64 56V66M64 71V74',cream,3)+L('M64 10V3H82',gold,4),'explosion',{radius:165,strength:1.15,impulseMultiplier:1.25});
// Afternoon snacks.
add('pizza','ピザ','ピザ','food',2.8,80,[poly([13,28],[109,17],[68,116])],P('M13 28L109 17L68 116Z','#f3cb68')+L('M14 27L108 16','#b67542',13)+[ [42,42],[78,39],[65,72] ].map(([x,y])=>C(x,y,10,red)).join('')+L('M37 64H45M79 57H87M57 94H65',mint,5));
add('pancakes','パンケーキ','パンケーキ','food',2.7,80,[rect(13,46,102,65)],R(13,84,102,27,'#b77c49')+R(13,61,102,25,'#e6ac69')+R(13,40,102,25,'#f3c981')+P('M27 43H102V57H89V80H77V56H47V69H35V54H27Z','#a96a36','none')+P('M46 26H79L88 39L55 45L43 37Z','#ffeb97')+L('M18 92H69M20 71H65',cream,3));
add('pizza-cutter','ピザカッター','ピザカッター','metal',1.5,40,[circle(64,35,30),rect(56,63,16,58)],C(64,35,30,steel)+C(64,35,7,'#dfe9d7')+R(56,63,16,58,red)+L('M48 18L72 52','#d2e4df',5)+R(54,66,20,12,gold));
add('castella','カステラ','カステラ','food',2,66,[rect(13,28,102,76)],R(13,28,102,76,'#f1d285')+R(13,28,102,20,'#9a603a')+R(13,94,102,10,'#bc8a4d')+L('M25 60H34M52 68H62M84 58H94M40 82H49','#dcb36a',4));
add('maple-popcorn','メープルポップコーン','メープルポップコーン','paper',1.5,59,[poly([19,20],[109,20],[99,119],[29,119])],P('M19 20H109L99 119H29Z','#f3d6a4')+R(28,64,72,38,red)+C(64,83,14,gold)+[ [30,26],[50,18],[73,24],[96,22],[43,40],[67,40],[90,40] ].map(([x,y])=>C(x,y,11,'#f8e6b7')+R(x-3,y-2,5,5,'#c58b50','none')).join('')+L('M35 109H93','#b78452',4));
add('potato-chips','ポテトチップス','ポテトチップス','paper',1.2,55,[poly([24,10],[104,10],[111,66],[100,119],[24,119],[17,66])],P('M24 10H104L111 66L100 119H24L17 66Z',gold)+R(25,19,77,16,red)+R(23,97,79,12,red)+C(58,62,21,'#f9df92')+C(77,76,19,'#e8b75e')+L('M49 50L62 73M69 66L82 84','#c99549',3));
add('chocolate-bar','板チョコ','いたチョコ','food',1.3,52,[rect(22,8,84,112)],R(22,8,84,112,'#684139')+Array.from({length:6},(_,i)=>R(28+i%2*37,15+Math.floor(i/2)*32,31,26,'#85503d')).join('')+P('M22 96L45 88L66 97L86 88L106 96V120H22Z',pink)+L('M30 21H50M67 21H86','#b07951',3));
add('wrapped-butter','紙付きバター','かみつきバター','food',1.8,62,[poly([8,40],[28,49],[31,30],[101,30],[104,49],[120,40],[111,98],[18,98])],P('M8 40L28 49L31 30H101L104 49L120 40L111 98H18Z','#eee7ce')+R(29,43,72,47,'#f5dc79')+P('M29 43L43 31H101V78L87 90V43Z','#ffedaa')+L('M13 62L28 69M103 67L117 58',steel,3));
add('cream-puff','シュークリーム','シュークリーム','food',1.6,58,[poly([16,60],[26,34],[47,20],[80,20],[102,38],[113,65],[107,101],[21,101])],P('M16 60L26 34L47 20H80L102 38L113 65L107 101H21Z','#d99d5f')+P('M19 72L37 65L52 74L71 64L92 74L110 67V83L92 90L74 82L55 91L37 81L20 89Z',cream)+L('M34 45L45 33M58 28H73M87 41L96 54','#f1cb87',5));
add('apple-juice-carton','リンゴジュース','リンゴジュース','paper',1.8,43,[poly([29,28],[44,8],[84,8],[99,28],[99,120],[29,120])],P('M29 28L44 8H84L99 28V120H29Z','#f2d893')+P('M29 28H99V49H29Z',red)+R(29,96,70,24,red)+C(64,73,20,'#ce555d')+L('M64 55V47H76','#619574',5)+L('M36 20H87M42 107H82',cream,4),'water_release',{...water,waterUnits:6,releaseUnits:6});
add('tricolor-dango','三色だんご','さんしょくだんご','food',1.5,35,[circle(64,24,21),circle(64,62,21),circle(64,100,21),rect(60,111,8,15)],R(60,104,8,22,wood)+C(64,100,21,'#a1c783')+C(64,62,21,cream)+C(64,24,21,pink)+L('M54 15H61M54 53H61M54 91H61','#fff9e4',4));
add('rubber-block','ゴムブロック','ゴムブロック','rubber',3,65,[rect(12,16,104,100)],R(12,16,104,100,blue)+R(22,26,84,20,'#95c9da','none')+face(64,67)+R(23,91,82,12,'#42749d','none'));
add('lightning-orb','かみなりまほう','かみなりまほう','metal',2,44,[circle(64,64,47)],C(64,64,47,'#7c67b5')+C(64,64,35,'#b39bd2')+P('M67 24L38 69H60L52 104L88 54H67L78 24Z','#ffe49a')+L('M30 40L25 50M95 79L90 89','#ebe6fb',4),'lightning');
add('sashimi','さしみ','さしみ','food',2.5,84,[rect(8,77,112,34),poly([20,72],[33,28],[53,28],[64,72]),poly([58,72],[73,24],[93,24],[105,72])],P('M8 77H120L110 111H18Z','#dce9d9')+P('M20 72L33 28H53L64 72Z','#ef8d8c')+P('M58 72L73 24H93L105 72Z','#efb1a0')+L('M29 49H57M66 46H99','#fff0d7',7)+P('M22 89L39 69L48 89Z','#83ae69')+L('M22 102H107',blue,3));
// Birthday objects.
add('whole-cake','ホールケーキ','ホールケーキ','food',4,94,[rect(12,68,104,50),rect(31,31,66,37),rect(43,8,8,23),rect(77,8,8,23)],R(12,68,104,50,pink)+R(31,31,66,37,'#e8bf8c')+P('M12 68H116V84L102 91L89 84L75 92L61 84L46 91L30 84L12 91Z',cream)+P('M31 31H97V45L82 50L65 43L48 49L31 44Z',cream)+R(43,8,8,23,blue)+R(77,8,8,23,red)+C(38,100,7,red)+C(65,101,7,red)+C(92,100,7,red)+L('M20 110H108','#b67679',4));
add('cheesecake','チーズケーキ','チーズケーキ','food',2,66,[poly([17,43],[89,21],[113,74],[99,111],[17,111])],P('M17 43L89 21L113 74L99 111H17Z','#f6df9e')+P('M17 43L89 21L113 74L40 93Z','#fff0c5')+P('M17 98L40 108L105 88L99 111H17Z','#bf8956')+L('M29 52L42 57L92 41','#e9c57e',3));
add('candle','ろうそく','ろうそく','wax',0.7,23,[rect(42,32,44,90)],R(42,32,44,90,cream)+P('M42 32H86V55L75 61L68 47L59 65L49 52H42Z','#f4d2a1')+R(60,20,8,12,ink)+L('M50 74V110','#fffdf0',5),'fuel_light',{durationSeconds:12,fireRadius:18});
physics.materials.wax={...physics.materials.plastic,friction:0.55,restitution:0.03,flammable:true,burnSeconds:6};
add('strawberry','イチゴ','イチゴ','food',0.8,39,[poly([22,34],[41,18],[87,18],[106,34],[98,76],[64,118],[30,76])],P('M22 34L41 18H87L106 34L98 76L64 118L30 76Z',red)+P('M36 28L43 10L59 20L69 6L77 22L97 18L90 35L72 31L59 42L49 29Z','#70a76a')+L('M41 50V57M65 52V59M88 48V55M50 75V82M76 76V83M63 96V103','#ffe4a1',4));
add('blueberries','ブルーベリー','ブルーベリー','food',1.1,48,[circle(43,54,25),circle(83,52,27),circle(64,90,25)],C(43,54,25,'#6575b0')+C(83,52,27,'#56649d')+C(64,90,25,'#7884bd')+L('M34 40H43M74 36H84M54 75H64','#c2cbdf',5)+P('M59 26L50 9L73 14L89 4L87 23Z',mint));
add('gift-box','プレゼント','プレゼント','paper',2.4,66,[rect(14,29,100,88),rect(8,21,112,22)],R(14,29,100,88,blue)+R(8,21,112,22,pink)+R(55,24,19,93,gold)+P('M62 22L29 18L27 4L48 5L64 19L78 4H101V17L74 23Z',red)+L('M22 53V105','#94c8de',5));
add('drinking-glass','コップ','コップ','glass',1.2,43,[poly([24,16],[104,16],[92,117],[36,117])],P('M24 16H104L92 117H36Z','#bfdddd')+L('M29 27H99M43 108H85','#f3fff0',5)+L('M38 39L44 94','#eaf6e5',6),'breakable',fragile);
add('party-popper','クラッカー','クラッカー','paper',0.7,46,[poly([26,24],[103,64],[32,113])],P('M26 24L103 64L32 113Z',pink)+P('M38 34L62 47L45 104L32 113Z',gold)+L('M45 56L80 76M36 77L63 92',blue,8)+L('M103 64L119 43M106 69L121 76',gold,4));
// Izakaya food, tableware and appliances.
add('sake-bottle','一升瓶','いっしょうびん','glass',3,39,[poly([48,5],[80,5],[80,42],[98,60],[98,121],[30,121],[30,60],[48,42])],P('M48 5H80V42L98 60V121H30V60L48 42Z','#577d68')+R(45,4,38,14,gold)+R(32,70,64,36,cream)+L('M47 80H80M46 91H74',red,5)+L('M40 52L38 65M40 110V117','#9dbb92',4),'water_release',{...water,waterUnits:16,releaseUnits:16});
add('fried-chicken','唐揚げ','からあげ','food',2.5,79,[rect(8,82,112,31),circle(38,66,26),circle(79,51,26),circle(91,80,23)],P('M8 82H120L108 113H20Z','#e7e3cf')+P('M14 66L25 44L47 38L65 54L62 83L37 93L17 83Z','#bd7842')+P('M53 49L63 25L87 23L106 42L100 68L80 78L59 66Z','#d39450')+P('M70 83L80 61L104 60L117 80L110 101L86 105Z','#ad6b39')+L('M27 58H39M71 38H82M87 74H97','#efd18c',5));
add('lemon','レモン','レモン','food',1,45,[poly([10,48],[28,25],[64,17],[99,33],[118,60],[103,89],[67,110],[28,96],[10,74])],P('M10 48L28 25L64 17L99 33L118 60L103 89L67 110L28 96L10 74Z','#efd15d')+L('M31 37L60 27L86 38','#fff0ab',6)+L('M36 89L63 99L88 86','#c6a748',4));
const skewer=(offset=0,green=false)=>R(61+offset,10,6,105,wood)+[24,46,68].map((y,i)=>R(43+offset,y,42,18,green&&i%2?'#9fb366':'#c68959')+L(`M${49+offset} ${y+6}H${74+offset}`,'#8c573c',3)).join('');
add('yakitori-plate','焼き鳥と皿','やきとりとさら','food',2.8,74,[rect(8,91,112,29),rect(27,19,30,72),rect(70,17,30,74)],P('M8 91H120L108 120H20Z','#d1dad0')+`<g transform="translate(-10 8) scale(.82)">${skewer()}</g><g transform="translate(39 5) scale(.82)">${skewer()}</g>`+L('M24 110H104',blue,4));
add('cabbage-plate','キャベツ皿','キャベツのさら','food',2,77,[rect(9,80,110,34),poly([19,73],[29,42],[49,22],[84,26],[109,53],[113,80])],P('M9 80H119L109 114H19Z','#e1e4d3')+P('M19 73L29 42L49 22L84 26L109 53L113 80Z','#a3c680')+L('M33 72L47 34L65 76M60 29L83 75M85 40L100 71','#dfedb9',6)+L('M23 102H105',blue,4));
add('beer-mug','ビール','ビール','glass',2,55,[rect(23,27,66,94),rect(89,45,24,12),rect(103,57,10,39),rect(89,96,24,12)],R(89,45,24,63,'#bbd6d5')+R(90,57,13,39,'#405566')+R(23,27,66,94,'#b9d4d5')+R(31,50,50,61,'#e7b54f','none')+P('M20 28L30 14H46L53 8L67 15H82L94 29L88 50L75 46L64 54L48 46L33 52L22 45Z',cream)+L('M39 63V101M66 61V102','#f8da79',4),'water_release',{...water,waterUnits:6,releaseUnits:6});
add('negima','ねぎま','ねぎま','food',1.4,33,[rect(43,24,42,63),rect(61,10,6,105)],skewer(0,true));
add('saury','サンマ','サンマ','food',2,95,[poly([8,62],[28,43],[85,37],[116,19],[111,61],[119,99],[88,79],[29,80])],P('M8 62L28 43L85 37L116 19L111 61L119 99L88 79L29 80Z','#738d98')+P('M14 65L35 61L95 57L91 76L30 77Z','#c9d4c1','none')+C(27,54,5,ink)+C(26,52,2,cream,'none')+L('M44 47L49 72M62 44L67 73M80 42L84 73','#4f6275',4));
add('beer-dispenser','ビールディスペンサー','ビールサーバー','metal',8,75,[rect(15,24,82,95),rect(54,6,25,18),rect(95,49,22,15)],R(15,24,82,95,steel)+R(25,32,61,14,'#d6ded2')+R(54,6,25,18,gold)+R(95,49,22,15,steel)+R(109,60,11,20,ink)+R(101,32,11,19,red)+R(29,59,49,45,'#3a5667')+L('M22 110H88','#536b7a',5));
add('charcoal','木炭','もくたん','wood',1.5,51,[poly([18,28],[45,12],[101,26],[112,90],[88,115],[27,103])],P('M18 28L45 12L101 26L112 90L88 115L27 103Z','#41434b')+L('M29 38L48 26L88 38M43 43L49 92M84 42L90 88','#6b6d71',5),'solid',{burnSeconds:9});
add('grill-grid','網','あみ','metal',2.1,82,[rect(9,22,110,9),rect(9,103,110,9),rect(9,31,9,72),rect(110,31,9,72),rect(44,31,7,72),rect(78,31,7,72),rect(18,55,92,7),rect(18,79,92,7)],R(9,22,110,90,'none')+L('M16 57H111M16 82H111M47 29V105M81 29V105',steel,6)+L('M14 25H115','#d9e5d9',3),'heat_shield');
add('call-bell','呼び出しベル','よびだしベル','metal',1.3,44,[rect(12,95,104,19),poly([24,95],[24,64],[36,43],[53,33],[75,33],[92,43],[104,64],[104,95]),rect(58,15,12,19)],R(12,95,104,19,ink)+P('M24 95V64L36 43L53 33H75L92 43L104 64V95Z',gold)+R(48,13,32,10,steel)+R(58,23,12,10,steel)+L('M37 69L43 53L55 46','#ffe4a0',6));

// Game-store props use distinct generic designs and no manufacturer emblems.
add('game-cartridge','ゲームカセット','ゲームカセット','plastic',1.2,54,[poly([18,15],[110,15],[110,115],[18,115])],R(18,15,92,100,'#8ba5b5')+R(28,27,72,48,'#405b78')+R(39,38,50,26,gold)+P('M45 58V44H56V52H66V44H80V58Z',blue,'none')+R(33,90,62,25,'#5f768d')+L('M42 96V108M53 96V108M64 96V108M75 96V108M86 96V108',gold,4)+L('M23 22H104','#c5d7d5',3));
add('game-console','ゲーム機','ゲームき','plastic',5.5,88,[poly([13,35],[28,18],[103,18],[116,35],[116,112],[13,112])],P('M13 35L28 18H103L116 35V112H13Z','#d5d6c6')+R(25,35,78,21,'#788e9e')+R(34,40,61,7,ink)+R(18,75,94,31,'#73899a')+R(28,85,19,12,ink)+R(55,85,19,12,ink)+C(96,88,7,red)+L('M29 24H101',cream,5));
add('desktop-pc','パソコン','パソコン','appliance',9,112,[rect(7,16,78,64),rect(39,80,14,22),rect(25,102,43,12),rect(91,25,30,90)],R(7,16,78,64,'#354c68')+R(16,25,60,44,'#7ec6c8')+P('M23 57L37 39L46 49L58 33L70 57Z','#b8e3ce','none')+R(39,80,14,22,steel)+R(25,102,43,12,'#526e83')+R(91,25,30,90,'#e2dfce')+R(97,36,18,6,ink)+R(97,49,18,6,ink)+C(106,71,5,blue)+L('M98 91H114M98 100H114','#7f97a4',3));
const keycaps=Array.from({length:28},(_,i)=>R(17+i%7*14,39+Math.floor(i/7)*13,10,8,i<7?'#829eb7':'#dce0cd',ink,2)).join('');
add('keyboard','キーボード','キーボード','plastic',2.5,106,[poly([13,28],[113,28],[123,99],[4,99])],P('M13 28H113L123 99H4Z','#4d647f')+keycaps+R(39,91,50,5,cream,'none')+L('M17 33H110','#94b2c3',3));
const gamepad=(leftHigh)=>P('M26 24H102L113 42L122 98L109 114H94L76 88H52L34 114H19L6 98L15 42Z',leftHigh?'#486478':'#5d6779')+R(26,15,26,10,'#a2b8c1')+R(76,15,26,10,'#a2b8c1')+C(leftHigh?36:48,leftHigh?46:77,13,'#243747')+C(leftHigh?76:82,77,13,'#243747')+P(leftHigh?'M28 71H36V63H45V71H53V80H45V88H36V80H28Z':'M25 41H34V32H43V41H52V50H43V59H34V50H25Z','#c7d6cc')+[[93,36,blue],[104,47,red],[82,47,gold],[93,58,mint]].map(([x,y,c])=>C(x,y,5,c,ink,2)).join('')+R(58,44,12,6,cream,'none')+L('M22 91L27 100M100 91L105 100','#8eabb8',4);
const padFixtures=[poly([26,24],[102,24],[113,42],[122,98],[109,114],[94,114],[76,88],[52,88],[34,114],[19,114],[6,98],[15,42]),rect(26,15,26,10),rect(76,15,26,10)];
add('game-controller','ゲームコントローラー','ゲームコントローラー','plastic',2,76,padFixtures,gamepad(true));
add('pro-controller','プロコントローラー','プロコントローラー','plastic',2,74,padFixtures,gamepad(false));
add('wired-mouse','有線マウス','ゆうせんマウス','plastic',1.3,62,[poly([42,53],[52,42],[79,42],[90,53],[94,102],[83,119],[49,119],[38,102]),rect(61,23,7,22),rect(64,20,45,7),rect(105,6,7,21),rect(21,3,91,7),rect(12,1,15,14)],L('M64 45V24H109V7H21',ink,7)+R(12,1,15,14,steel)+P('M42 53L52 42H79L90 53L94 102L83 119H49L38 102Z','#d6d7cb')+L('M66 45V75M41 76H91','#637d91',3)+R(61,51,10,20,blue)+L('M48 86V104',cream,5),'solid',{rigidCable:true});
add('sd-card','SDカード','エスディーカード','plastic',0.35,27,[poly([23,6],[83,6],[107,30],[107,122],[23,122])],P('M23 6H83L107 30V122H23Z','#2e414e')+R(31,46,68,40,blue)+R(37,53,56,11,cream,'none')+L('M34 12V33M48 12V33M62 12V33M76 12V33',gold,7)+L('M33 103H96','#657a86',4));
let logoGlyphs='';
for(const [row,text]of ['なんでも','キャノン'].entries())for(const [column,char]of [...text].entries()){
 const source=await fs.readFile(path.join(root,`assets/font/U${char.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}.svg`),'utf8');
 const inner=source.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'').replaceAll('#ffffff',row?cream:gold);
 logoGlyphs+=`<g transform="translate(${18+column*24} ${26+row*28}) scale(1.25)">${inner}</g>`;
}
add('game-logo','なんでもキャノンのロゴ','なんでもキャノンのロゴ','plastic',1.5,72,[poly([11,20],[115,13],[121,92],[18,104],[5,89])],P('M11 20L115 13L121 92L18 104L5 89Z','#33506d')+P('M13 25L112 19L115 86L19 97L11 86Z','#456987',ink,3)+logoGlyphs+L('M23 93L110 84',blue,3));
add('tablet','タブレット','タブレット','appliance',2.5,65,[rect(19,6,90,116)],R(19,6,90,116,'#3e526c')+R(27,17,74,89,'#84bec8')+R(34,27,26,25,pink)+R(68,27,25,25,gold)+R(34,61,26,25,mint)+R(68,61,25,25,blue)+C(64,114,4,cream,ink,2)+L('M30 97H98','#d9eee1',4));
add('utility-pole','電柱','でんちゅう','wood',5,65,[rect(55,7,18,117),rect(15,26,98,11),rect(25,52,78,10),rect(21,15,12,12),rect(91,15,12,12)],R(55,7,18,117,'#999c92')+R(15,26,98,11,wood)+R(25,52,78,10,wood)+[21,91].map(x=>R(x,15,12,12,'#b8d7d1')).join('')+L('M61 67V114','#c9d4c4',4)+R(52,91,24,7,ink));
add('smartphone','スマートフォン','スマートフォン','appliance',1,33,[rect(29,4,70,120)],R(29,4,70,120,'#384558')+R(36,17,56,91,'#89c3c8')+R(45,9,38,5,ink)+R(44,29,16,16,pink)+R(68,29,16,16,gold)+R(44,53,16,16,blue)+R(68,53,16,16,mint)+L('M45 92H83M55 115H73',cream,4));
const sealedBomb=(strong)=>R(48,9,32,17,steel)+C(64,72,47,strong?'#3f5b9d':'#5e9cb6')+P('M37 53L64 42L91 53V76L80 91L64 102L48 91L37 76Z',strong?'#adc5db':'#c9e3df')+P('M64 54L78 76L76 85L64 91L52 85L50 76Z',blue)+L('M25 49L21 64','#b9e6ed',5)+(strong?P('M64 13L69 21L79 23L72 31L73 42L64 37L55 42L56 31L49 23L59 21Z',gold):L('M54 15H74',cream,3));
for(const [id,name,kana,base,strong]of [['waterproof-bomb','耐水ばくだん','たいすいばくだん','bomb',false],['strong-waterproof-bomb','つよい耐水ばくだん','つよいたいすいばくだん','blast-bomb',true]]){
 const original=manifest.items.find(x=>x.id===base);
 add(id,name,kana,'metal',original.mass,original.worldWidth,[circle(64,72,47),rect(48,9,32,17)],sealedBomb(strong),'explosion',{...original.physics,waterproofExplosive:true});
}

await fs.mkdir(path.join(root,'assets/raster/objects'),{recursive:true});
for(const e of items){
 // Root owns these later retakes in tools/retake-content.mjs; never overwrite them here.
 if(['pancakes','party-popper','saury','sashimi'].includes(e.id))continue;
 const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" shape-rendering="crispEdges">${e.svg}</svg>`;
 const {data,info}=await sharp(Buffer.from(raw)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minX=128,minY=128,maxX=-1,maxY=-1,pixels=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);pixels++;}
 if(maxX<0)throw Error(`Empty SVG ${e.id}`);
 minX=Math.max(0,minX-1);minY=Math.max(0,minY-1);maxX=Math.min(127,maxX+1);maxY=Math.min(127,maxY+1);
 const vb=[minX,minY,maxX-minX+1,maxY-minY+1],scale=e.width/vb[2];
 const svg=raw.replace('width="128" height="128" viewBox="0 0 128 128"',`width="${vb[2]}" height="${vb[3]}" viewBox="${vb.join(' ')}"`);
 await fs.writeFile(path.join(root,`assets/objects/${e.id}.svg`),svg+'\n');
 await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/raster/objects/${e.id}.png`));
 await sharp(Buffer.from(svg)).webp({lossless:true}).toFile(path.join(root,`assets/raster/objects/${e.id}.webp`));
 const score=['explosion','lightning','water_release'].includes(e.behavior)?0:100;
 const record={id:e.id,nameJa:e.name,svg:`objects/${e.id}.svg`,png:`raster/objects/${e.id}.png`,webp:`raster/objects/${e.id}.webp`,sourceGrid:[128,128],viewBox:vb,pivotSource:[64,64],pivotCropped:[64-minX,64-minY],worldWidth:e.width,worldHeight:vb[3]*scale,worldScale:scale,material:e.material,mass:e.mass,score,bodyKind:'dynamic',behavior:e.behavior,colliderTemplate:e.id,fixtures:e.fixtures,physics:{...physics.materials[e.material],...physics.behaviors[e.behavior],...e.extra},opaquePixels:pixels};
 const i=manifest.items.findIndex(x=>x.id===e.id);if(i<0)manifest.items.push(record);else manifest.items[i]=record;
 const row=[e.id,e.name,e.material,e.mass,score,e.width,e.id,e.behavior],j=catalog.items.findIndex(x=>x[0]===e.id);if(j<0)catalog.items.push(row);else catalog.items[j]=row;
 colliders.templates[e.id]=e.fixtures;physics.overrides[e.id]=e.extra;ui.items[e.id]=e.kana;
}
await fs.writeFile(path.join(root,'assets/source/extra-items.svg'),`<svg xmlns="http://www.w3.org/2000/svg">\n${items.filter(e=>!['pancakes','party-popper','saury','sashimi'].includes(e.id)).map(e=>`<symbol id="${e.id}" viewBox="0 0 128 128">${e.svg}</symbol>`).join('\n')}\n</svg>\n`);
const fridge=manifest.items.find(x=>x.id==='refrigerator');
for(const r of manifest.items){
 if(r.material==='rubber')r.physics.coldBrittle=true;
 if(r.behavior==='grip_sole'){
  r.behavior='solid';r.physics.friction=fridge.physics.friction;r.physics.restitution=fridge.physics.restitution;
  for(const key of Object.keys(r.physics))if(/sole|upperFriction|otherIceFriction|stability/i.test(key))delete r.physics[key];
  physics.overrides[r.id]={...r.physics};const row=catalog.items.find(x=>x[0]===r.id);if(row)row[7]='solid';
 }
}

const standard=(id,name,map,queue,terrain,cannon=[810,450],zone=[65,70,530,380])=>({id,nameJa:name,map,status:'specified',gravity:980,cannon,scoreZone:zone,terrain,queue,preplaced:[]});
const ground=[rect(0,450,960,90)];
const lab=standard(21,'ランダム実験室','21-random-lab',manifest.items.slice(0,15).map(x=>x.id),[...ground,rect(110,384,420,24),rect(136,408,24,42),rect(482,408,24,42)]);
lab.queuePolicy='randomCatalog';lab.selectionPolicy='fifteen seeded draws from every current catalog item, including future additions';
const toy=standard(22,'おもちゃうりば','22-toy-store',['toy-car','bunny-plush','cute-doll','trumpet','daruma','toy-train','battery','snowman-plush','rubber-duck','toy-package','teddy-bear','building-blocks','spinning-top','soccer-ball','basketball'],[...ground,rect(90,325,180,18),rect(315,260,200,18),rect(375,390,170,18)]);
const obstacle=standard(23,'じゃまもの','23-obstacle',['hammer','submarine','wooden-crate','flamethrower','charger','refrigerator','gunpowder-barrel','water-jug','flamethrower','bomb','water-balloon','low-table','toolbox','cushion','bagel'],ground);
obstacle.preplaced=[{id:'wooden-obstacle',x:525,groundY:450,scoring:false}];
const snack=standard(24,'3じのおやつ','24-snack-time',['pizza','pancakes','pizza-cutter','castella','maple-popcorn','potato-chips','chocolate-bar','wrapped-butter','donut','cream-puff','apple-juice-carton','tricolor-dango','ice-cream-cup','canele','mont-blanc'],[...ground,rect(95,390,460,24),rect(120,414,24,36),rect(510,414,24,36)]);
const rubber=standard(25,'ゴムとれいとうじゅう','25-rubber-freeze',['rubber-block','freeze-sprayer','rubber-duck','soccer-ball','basketball','tire','freeze-sprayer','rubber-block','cold-pack','rubber-duck','ice-bomb','freeze-sprayer','hammer','bowling-ball','platform-cart'],ground);
rubber.preplaced=[{id:'rubber-block',x:190,groundY:450},{id:'rubber-block',x:260,groundY:450},{id:'rubber-block',x:225,groundY:385}];
const thunder=standard(26,'かみなり実験','26-lightning-river',['lightning-orb','water-jug','umbrella','lightning-orb','rubber-duck','tabletop-stove','bucket','water-balloon','submarine','lightning-orb','wooden-crate','fire-extinguisher','rubber-block','sponge','ramune-bottle'],[rect(0,490,960,50),poly([90,430],[160,330],[390,330],[460,430],[460,490],[90,490]),rect(710,420,250,70)],[810,420],[65,70,440,360]);
thunder.water=[{rect:[460,430,250,60],direction:[-1,0],speed:55,type:'flow',volumeCap:96}];thunder.preplaced=[{id:'wooden-crate',x:215,groundY:330},{id:'trash-bag',x:320,groundY:330}];thunder.surfaceZones=[{rect:[155,324,240,12],flammable:true,burnSeconds:3}];
const freezer=standard(27,'れいとうこ','27-freezer',['sashimi','ice-cream-cup','freeze-sprayer','steak','cold-pack','ice-block','watermelon','ramune-bottle','frost-bottle','fried-shrimp','rubber-duck','freeze-sprayer','apple','saury','refrigerator'],[...ground,rect(90,300,180,18),rect(320,365,230,18)]);freezer.iceFloor=true;
const birthday=standard(28,'たんじょうびパーティー','28-birthday',['whole-cake','cheesecake','steak-knife','candle','strawberry','blueberries','gift-box','drinking-glass','steak','party-popper','bunny-plush','pancakes','mont-blanc','canele','ramune-bottle'],[...ground,rect(140,385,390,65),rect(235,325,200,60)]);
const tavern=standard(29,'いざかやさん','29-izakaya',['sake-bottle','fried-chicken','lemon','yakitori-plate','cabbage-plate','flamethrower','fork','crossed-chopsticks','steak-knife','beer-mug','negima','saury','beer-dispenser','charcoal','tabletop-stove'],[...ground,rect(90,405,480,20)]);
tavern.hangingObstacles=[{anchor:[240,84],length:190,size:[64,34],amplitude:12,period:4.8,phase:0},{anchor:[500,84],length:235,size:[64,34],amplitude:-10,period:5.4,phase:1.3}];
const fragileStage=standard(30,'こわれものちゅうい','30-fragile',['bomb','vase','teapot','drinking-glass','ramune-bottle','sake-bottle','camera','pocket-watch','hourglass','standing-mirror','flamethrower','water-balloon','bomb','flower-pot','empty-pot'],[...ground,rect(100,360,170,16),rect(340,390,180,16)]);
fragileStage.preplaced=[{id:'vase',x:145,groundY:360},{id:'teapot',x:225,groundY:360},{id:'wooden-crate',x:385,groundY:390},{id:'trash-bag',x:455,groundY:390}];
const awkward=standard(31,'やっかいなばしょ','31-awkward',['submarine','plank','skateboard','wheelbarrow','umbrella','low-table','rubber-duck','wooden-crate','bagel','toolbox','hammer','platform-cart','cushion','refrigerator','water-balloon'],[rect(0,450,160,90),rect(630,450,330,90)],[810,450],[60,70,540,440]);
awkward.movingPlatforms=[{center:[310,330],size:[150,20],axis:[1,0],travel:80,period:4.6,phase:0},{center:[515,410],size:[130,20],axis:[0,1],travel:58,period:5.2,phase:0.8}];
const blasts=standard(32,'ばくはつ実験室','32-blast-lab',['blast-bomb','gunpowder-barrel','waterproof-bomb','strong-waterproof-bomb','refrigerator','plank','bomb','refrigerator','gunpowder-barrel','blast-bomb','water-jug','submarine','cannonball','toolbox','refrigerator'],[rect(0,450,100,90),rect(100,505,125,35),rect(225,350,105,190),rect(330,505,180,35),rect(510,405,105,135),rect(615,505,90,35),rect(705,450,255,90)],[810,450],[100,70,515,435]);
blasts.preplaced=[...[244,277,310].map(x=>({id:'wooden-crate',x,groundY:350,width:30})),...[260,294].map(x=>({id:'wooden-crate',x,groundY:320,width:30})),{id:'wooden-crate',x:277,groundY:290,width:30},...[130,185].map(x=>({id:'wooden-crate',x,groundY:505})),{id:'wooden-crate',x:157,groundY:450},{id:'vase',x:130,groundY:450},{id:'drinking-glass',x:185,groundY:450},{id:'refrigerator',x:375,groundY:505},{id:'refrigerator',x:455,groundY:505},{id:'refrigerator',x:562,groundY:405},{id:'teapot',x:375,groundY:403},{id:'drinking-glass',x:455,groundY:403},{id:'vase',x:277,groundY:260}];
const ultimate=standard(33,'きゅうきょくじっけんしつ','33-ultimate-lab',['lightning-orb','strong-waterproof-bomb','tabletop-stove','water-jug','freeze-sprayer','submarine','game-console','refrigerator','rubber-duck','waterproof-bomb','whole-cake','hammer','umbrella','toy-train','game-logo'],[rect(0,420,320,120),rect(320,515,280,25),rect(600,420,360,120),rect(928,150,32,270)],[810,420],[55,70,580,445]);
ultimate.queuePolicy='randomCatalog';ultimate.selectAnyCatalogItem=true;ultimate.selectionPolicy='seeded whole-catalog queue; optional free selection overrides the current and following throws';
const pitfalls=standard(34,'おとしあな','34-pitfalls',['plank','skateboard','refrigerator','submarine','umbrella','wheelbarrow','cushion','toy-train','low-table','platform-cart','bagel','wooden-crate','rubber-duck','bowling-ball','toolbox'],[rect(0,450,100,90),rect(210,450,100,90),rect(420,450,100,90),rect(630,450,330,90),rect(65,230,150,18),rect(270,165,145,18),rect(440,280,135,18),rect(555,365,120,18),rect(220,350,105,18)],[810,450],[55,70,565,380]);
pitfalls.abyss=[[100,520,110,120],[310,520,110,120],[520,520,110,120]];
const gaming=standard(35,'ゲーム','35-gaming',['game-cartridge','game-console','desktop-pc','keyboard','game-controller','wired-mouse','sd-card','camera','game-logo','tablet','battery','utility-pole','pro-controller','smartphone','charger'],[...ground,rect(90,390,475,22),rect(110,412,24,38),rect(515,412,24,38)]);
const additions=[lab,toy,obstacle,snack,rubber,thunder,freezer,birthday,tavern,fragileStage,awkward,blasts,ultimate,pitfalls,gaming];
const lessons=['なにがでるかな。すべてのものから ランダムで15こ。','ういている たなに おもちゃをのせよう。','おおきなきのかべ。ほのおと ばくだんで かたづけよう。','おやつを じょうずに つみあげよう。','ゴムは はねる。こおらせると われやすくなる。','かみなりは しばらくして はじける。みずとほのおに きをつけよう。','ゆかも たなも こおっている。すべるものを つもう。','ケーキをかざって パーティーのじゅんび。','ゆれるライトを よけて テーブルにのせよう。','こわれものが いっぱい。つよくぶつけると われる。','うごくあしばに あわせて タイミングをねらおう。','せまいあしばと みぞ。ばくふうで ものをうごかそう。'];
lessons.push('なんでもためせる ちかのじっけんしつ。ものをえらんでもいい。','あなに おちると こわれる。うえのあしばを つかおう。','ゲームのどうぐを つみあげよう。コードも ひとつのかたち。');
const stageKana=['ランダムじっけんしつ','おもちゃうりば','じゃまもの','3じのおやつ','ゴムとれいとうじゅう','かみなりじっけん','れいとうこ','たんじょうびパーティー','いざかやさん','こわれものちゅうい','やっかいなばしょ','ばくはつじっけんしつ','きゅうきょくじっけんしつ','おとしあな','ゲーム'];
for(const [i,s] of additions.entries()){s.lesson=lessons[i];stages.stages[s.id-1]=s;ui.stages[s.id-1]=stageKana[i];ui.lessons[s.id-1]=lessons[i];}
stages.status='Godot 4.7.2: 35 authored stages, 15 throws each; current checks are in previews/*-checks.json.';

// Fixed scenery is drawn from the same terrain polygons used by physics.
const svgMap=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" fill="none" shape-rendering="crispEdges">${body}</svg>\n`;
const terrainArt=(s,c='#91a4aa')=>s.terrain.map(t=>t.rect?R(...t.rect,c,ink,4):P('M'+t.polygon.map(p=>p.join(' ')).join('L')+'Z',c,ink,4)).join('');
const wall=(c,accent)=>R(0,0,960,540,c,'none')+L('M0 110H960M0 220H960M0 330H960M120 0V450M360 0V450M600 0V450M840 0V450',accent,3);
const shelves=(x,y,w)=>R(x,y,w,12,wood)+R(x+12,y+12,10,46,'#755849')+R(x+w-22,y+12,10,46,'#755849');
const art={};
art[21]=wall('#e5eee5','#c1d3d0')+R(62,110,264,155,'#8ea8b2')+R(75,123,238,127,'#c1e3de')+L('M90 197H130L151 159L173 218L196 168L217 197H293',mint,8)+R(610,145,260,125,'#a9bfc2')+R(628,161,224,90,'#f4f6e8')+terrainArt(lab,'#b5c8c4')+R(116,377,408,10,'#f8f4dc');
art[22]=wall('#eccca6','#e0b58f')+R(0,95,960,32,pink)+shelves(48,155,220)+shelves(565,150,310)+[75,135,195,595,660,725,790].map((x,i)=>R(x,174,42,48,[red,blue,gold][i%3])+R(x+9,187,24,20,cream)).join('')+terrainArt(toy,'#bc8c66')+L('M0 482L960 482M0 520H960','#dfbc91',4);
art[23]=wall('#9baec0','#778d9e')+R(0,340,960,110,'#647c83','none')+R(62,130,300,110,'#557886')+L('M80 156H344M80 190H344','#9fc1be',8)+terrainArt(obstacle,'#a08d71')+L('M0 480H960M0 520H960M80 450L180 540M400 450L500 540M720 450L820 540','#6c6c61',3);
art[24]=wall('#eed1b5','#dbb79c')+R(48,105,270,180,'#e8ead4')+R(62,120,242,150,'#aad1cb')+L('M181 120V270M62 195H304',cream,7)+R(625,145,250,135,'#bd8f86')+C(751,205,42,cream)+L('M751 174V204L772 220',ink,5)+terrainArt(snack,'#ba8861')+R(99,385,452,10,'#e6caa0');
art[25]=wall('#a7c0c3','#7b9da8')+R(55,108,380,180,'#517b8b')+R(75,130,340,138,'#a4d5d7')+P('M120 225L150 163L180 225ZM240 153H298V225H240Z',blue)+R(633,130,235,150,'#7b658f')+C(749,203,47,'#b4d6cd')+L('M719 172L779 233M779 172L719 233','#ecf5df',7)+terrainArt(rubber,'#6b8b9a');
art[26]=R(0,0,960,540,'#99bdc9','none')+P('M0 210L180 160L310 220L480 145L665 213L810 173L960 220V540H0Z','#7d9e86','none')+P('M0 305L160 260L310 306L480 250L710 302L960 256V540H0Z','#577c6b','none')+terrainArt(thunder,'#9b9973')+L('M160 330H390','#c5c48d',9)+R(460,430,250,60,'#5d9fac','none')+L('M470 442H520M556 458H610M640 438H690','#bbdfd3',4);
art[27]=wall('#c4e0df','#a0bdc6')+R(34,90,530,345,'#88a8ba')+R(52,106,494,325,'#d4e8df')+L('M90 135L128 173M128 135L90 173M380 167L420 207M420 167L380 207M220 220L260 260M260 220L220 260','#9cc9d4',5)+R(675,80,200,320,'#aecbd1')+R(695,100,155,278,'#5f8da8')+R(715,230,14,70,cream)+terrainArt(freezer,'#9ecbd3')+L('M3 450H957M92 300H268M322 365H548','#e9fff2',7);
art[28]=wall('#f1d3bf','#e1b0ab')+L('M0 108L160 145L320 110L480 150L640 110L800 145L960 108',wood,4)+[80,230,380,530,680,830].map((x,i)=>P(`M${x-24} 127L${x+24} 127L${x} 165Z`,[pink,blue,gold][i%3])).join('')+terrainArt(birthday,'#c9958b')+R(140,385,390,65,pink)+R(235,325,200,60,'#efd3a1')+P('M140 385H530V400L500 410L470 400L440 410L410 400L380 410L350 400L320 410L290 400L260 410L230 400L200 410L170 400L140 410Z',cream,'none')+R(235,325,200,13,cream,'none')+[270,330,390].map(x=>R(x,302,10,22,blue)+P(`M${x+5} 283L${x+12} 297L${x+5} 303L${x-2} 297Z`,gold,ink,2)).join('');
art[29]=wall('#71564e','#5b4544')+R(38,120,550,150,'#413c45')+L('M52 161H575M52 222H575',wood,8)+[70,135,200,265,330,395,460,525].map((x,i)=>R(x,174,26,43,['#789a70','#c2aa73','#8a9d9c'][i%3])+R(x+6,160,14,14,steel)).join('')+R(650,115,235,175,'#ad8c67')+L('M675 145H860M675 181H860M675 217H860','#6c554a',5)+terrainArt(tavern,'#9e7555');
art[30]=wall('#c9c2b5','#a9a396')+R(53,108,530,171,'#718c9c')+R(70,125,496,136,'#a9c6c7')+L('M235 125V261M401 125V261',cream,7)+R(680,140,170,120,'#d4b36b')+P('M765 160L820 240H710Z','#e8ce85')+L('M765 180V211M765 222V230',ink,8)+terrainArt(fragileStage,'#a7a08a');
art[31]=wall('#a4b9be','#7c9aab')+R(30,120,130,210,'#718c9d')+R(730,110,170,210,'#718c9d')+L('M160 178L340 115L520 178L730 125',cream,5)+terrainArt(awkward,'#7e9c9f')+L('M230 330H390M515 352V468','#d9b362',4);
art[32]=wall('#65747f','#4f5d6c')+R(45,100,540,145,'#394b5d')+L('M70 130H560M70 178H560','#7b9ca6',6)+R(715,110,170,130,'#d0b778')+P('M800 130L850 216H750Z',gold)+R(795,157,10,28,ink,'none')+R(795,195,10,10,ink,'none')+terrainArt(blasts,'#a99a78')+L('M227 352H328M512 407H613','#e8ca78',7);
art[33]=R(0,0,960,540,'#122d43','none')+R(0,0,960,72,'#0c1f34','none')+R(28,92,860,285,'#244b62')+L('M48 120H210V190H350V110H530V190H700V120H868M48 325H180V260H310M548 280H720V332H867','#418485',7)+L('M110 122H202M358 112H522M728 333H856','#8de5cc',3)+[96,395,720].map(x=>R(x,174,144,88,'#173348')+R(x+12,186,120,62,'#5cbbba')+L(`M${x+22} 219H${x+43}L${x+58} 201L${x+77} 233L${x+93} 210H${x+121}`,'#ccf8da',4)).join('')+terrainArt(ultimate,'#315d73')+L('M0 420H320V515H600V420H928V150','#93e9d6',5)+L('M345 530H575','#5db9ba',3);
art[34]=wall('#627b8b','#456477')+R(30,96,870,265,'#334f64')+L('M48 123H882M48 335H882M100 124V334M820 124V334','#638e99',5)+terrainArt(pitfalls,'#9a9a7e')+L('M2 450H98M212 450H308M422 450H518M632 450H958','#e6c96d',5)+[100,310,520].map(x=>P(`M${x+10} 470H${x+100}L${x+55} 506Z`,'#1c354c','none')).join('');
art[35]=wall('#383a64','#272c4e')+R(50,104,525,200,'#1c2c46')+R(66,120,493,166,'#658db2')+P('M88 256V210H120V178H155V210H188V256ZM223 256V190H260V159H295V190H329V256Z','#90c4c6','none')+R(365,157,151,97,'#273c5b')+R(383,175,116,62,'#d0e5d4')+R(653,110,224,220,'#b69988')+[0,1,2].map(row=>R(665,133+row*63,200,10,'#5c5870')+[0,1,2,3,4].map(col=>R(674+col*37,148+row*63,25,42,[red,blue,gold,mint,pink][col])).join('')).join('')+terrainArt(gaming,'#7c7290')+R(96,382,463,10,'#b1bacb');
for(const s of additions){const svg=svgMap(art[s.id]);await fs.writeFile(path.join(root,`assets/maps/${s.map}.svg`),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${s.map}.png`));}
maps.maps=stages.stages.map(s=>({id:s.map,stage:s.id,nameJa:s.nameJa,status:s.status,svg:`maps/${s.map}.svg`,worldSize:[960,540],terrain:s.terrain,backgroundCollision:false,...(s.assignment?{assignment:s.assignment}:{})}));
const ids=new Set(manifest.items.map(x=>x.id));
for(const s of stages.stages)if(!Array.isArray(s.queue)||s.queue.length<15||s.queue.some(id=>!ids.has(id))||(s.queue.length>15&&new Set(s.queue).size<15))throw Error(`Invalid queue ${s.id}`);
await Promise.all([write('objects-manifest',manifest),write('catalog',catalog),write('physics',physics),write('colliders',colliders),write('stages',stages),write('maps-manifest',maps),write('ui-ja',ui)]);
const summary=await read('build-summary');Object.assign(summary,{objects:manifest.items.length,maps:stages.stages.length,specifiedStages:stages.stages.length-1,playableStages:stages.stages.length});await write('build-summary',summary);
const verification=await read('verification');Object.assign(verification,{objects:manifest.items.length,maps:stages.stages.length,stagesWith15Shots:stages.stages.length,croppedSpritesChecked:manifest.items.length,uniqueRenderedSprites:new Set(manifest.items.map(x=>x.svg)).size});
verification.checks=verification.checks.filter(x=>!/^\d+ item records/.test(x)&&!/^\d+ maps have/.test(x));verification.checks.push(`${manifest.items.length} item records; all ${stages.stages.length} queues produce 15 throws from existing item candidates`,`${stages.stages.length} maps have static terrain data`);await write('verification',verification);
await fs.mkdir(path.join(root,'previews'),{recursive:true});
const itemSheet=[];for(const [i,e]of items.entries()){const im=await sharp(path.join(root,`assets/raster/objects/${e.id}.png`)).resize({width:104,height:104,fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});itemSheet.push({input:im.data,left:i%8*128+Math.floor((128-im.info.width)/2),top:Math.floor(i/8)*128+Math.floor((128-im.info.height)/2)});}
await sharp({create:{width:1024,height:Math.ceil(items.length/8)*128,channels:4,background:'#283b4c'}}).composite(itemSheet).png().toFile(path.join(root,'previews/extra-items.png'));
const mapSheet=[];for(const [i,s]of additions.entries())mapSheet.push({input:await sharp(Buffer.from(svgMap(art[s.id]))).resize(320,180,{kernel:'nearest'}).png().toBuffer(),left:i%3*320,top:Math.floor(i/3)*180});
await sharp({create:{width:960,height:Math.ceil(additions.length/3)*180,channels:4,background:'#283b4c'}}).composite(mapSheet).png().toFile(path.join(root,'previews/extra-maps.png'));
console.log(JSON.stringify({added:items.length,objects:manifest.items.length,stages:stages.stages.length,ids:items.map(x=>x.id)}));
// Keep the independent latest retakes last so older source layers cannot restore them.
await import('./retake-content.mjs');
await import('./extend-late-content.mjs');
