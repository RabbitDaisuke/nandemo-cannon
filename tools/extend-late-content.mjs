// Authored SVG collection: stages 36–41 and their restaurant/cafe/office/village objects.
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

// Office objects are individually drawn silhouettes, with matching physical pieces.
// Search tags are deliberately authored separately in item-search-index.json.
const officeItemIds=['shredder','banknote','ten-yen-coin','paper-bag','nori-bento','homemade-bento','paper-cup','monitor'];
add('shredder','シュレッダー','シュレッダー','appliance',11,69,
 [rect(17,29,94,24),poly([22,53],[106,53],[99,120],[29,120]),rect(43,7,45,22)],
 R(43,7,45,34,ink)+R(48,12,35,23,'#f5ebd3')+R(54,17,23,3,'#88949b')+R(54,24,18,3,'#88949b')+
 R(17,29,94,24,ink)+R(22,34,84,14,'#667d8e')+R(31,38,61,6,ink)+R(98,37,5,5,'#a2d2ad')+
 P('M22 53H106L99 120H29Z',ink)+P('M28 53H100L94 114H34Z','#aebfc2')+R(38,64,52,38,ink)+R(43,69,42,28,'#34495a')+
 [48,58,70,79].map((x,i)=>R(x,74+i%2*8,4,15,'#ded8bd')).join('')+R(37,108,53,4,'#758d9b'));
add('banknote','銀行券','ぎんこうけん','paper',0.35,68,[rect(5,31,118,65)],
 R(5,31,118,65,ink)+R(10,36,108,55,'#a5b99c')+R(14,40,100,47,'#e3dfb4')+R(18,44,92,39,'#8caa91')+
 R(22,48,50,31,'#c9d2a7')+R(27,53,38,5,'#668e7e')+R(27,64,29,4,'#668e7e')+R(27,72,40,3,'#668e7e')+
 P('M83 47H99L105 53V72L99 79H83L77 72V53Z','#d6d9ad')+R(86,50,12,8,'#6f8f7b')+R(83,58,15,11,'#b2b68e')+P('M80 77L84 69H98L103 77Z','#6f8f7b')+R(15,38,6,3,'#f4e9be')+R(102,85,10,3,'#f4e9be'));
const coinEdge=[[43,9],[85,9],[107,31],[119,52],[119,77],[99,105],[77,119],[49,119],[21,100],[9,77],[9,50],[23,27]];
add('ten-yen-coin','10円玉','10えんだま','metal',1.1,29,[poly(...coinEdge)],
 P('M'+coinEdge.map(p=>p.join(' ')).join('L')+'Z',ink)+P('M45 15H82L101 35L112 54V75L95 99L75 112H51L27 95L16 75V52L28 32Z','#9e633e')+
 P('M47 21H80L97 38L106 56V73L91 94L74 105H53L33 91L23 73V54L33 37Z','#d9a365')+P('M48 29H77L92 43L99 58V70L86 88L72 98H55L40 86L30 71V57L39 42Z','#b97d48')+
 R(39,44,6,6,'#f5cf8b')+R(45,38,7,45,'#f5cf8b')+R(38,80,21,6,'#f5cf8b')+R(68,39,20,7,'#f5cf8b')+R(63,46,7,33,'#f5cf8b')+R(86,46,7,33,'#f5cf8b')+R(68,79,20,7,'#f5cf8b'));
add('paper-bag','紙ぶくろ','かみぶくろ','paper',0.8,60,
 [poly([19,40],[109,40],[117,121],[11,121]),rect(35,11,14,29),rect(42,5,43,12),rect(78,11,14,29)],
 R(35,11,7,36,ink)+R(42,5,43,7,ink)+R(85,11,7,36,ink)+R(42,12,7,28,'#b98d58')+R(49,12,29,5,'#b98d58')+R(78,12,7,28,'#b98d58')+
 P('M19 40H109L117 121H11Z',ink)+P('M25 46H103L110 115H18Z','#be8c55')+P('M25 46H90L94 115H18Z','#dfb575')+P('M93 50L103 46L110 115H97Z','#9e7048')+
 R(33,64,46,23,'#efe0ae')+R(42,70,29,5,'#96734f')+R(47,79,19,3,'#96734f')+R(27,105,57,4,'#edc98c'));
const bentoShape=[poly([15,30],[113,30],[122,41],[116,108],[105,119],[22,119],[10,108],[5,41])];
add('nori-bento','のり弁当','のりべんとう','plastic',2.4,78,bentoShape,
 P('M15 30H113L122 41L116 108L105 119H22L10 108L5 41Z',ink)+P('M17 36H110L116 44L110 105L102 113H26L16 103L11 44Z','#3f4b54')+
 P('M22 41H106L110 47L105 100L99 107H28L22 99L17 48Z','#f3e9ce')+P('M26 61H86L91 99H29Z','#223b32')+
 R(31,65,14,4,'#4c6650')+R(53,71,23,4,'#4c6650')+R(36,87,36,4,'#365645')+
 P('M26 43H83L90 49L83 64H27L21 56Z','#9b612e')+P('M29 44H80L84 50L78 57H27Z','#e8b85c')+R(32,47,7,5,'#f7d88a')+R(54,50,9,4,'#c18c3a')+
 P('M89 68L96 61L105 67L104 78L95 84L87 78Z','#ccad57')+R(91,69,8,6,'#f7d67e')+R(89,88,13,8,'#d79d49')+R(93,91,6,3,'#f3cb6e')+R(15,111,93,4,'#71838b'));
add('homemade-bento','てづくり弁当','てづくりべんとう','plastic',2.4,76,bentoShape,
 P('M15 30H113L122 41L116 108L105 119H22L10 108L5 41Z',ink)+P('M18 36H109L116 44L110 104L102 112H25L16 104L11 44Z','#d77971')+
 P('M23 42H105L110 48L104 99L98 105H30L22 98L18 48Z','#f3c7a4')+P('M25 46H63V100H31L27 95L22 50Z','#fff1d3')+R(32,53,9,4,'#e0d4b5')+R(46,76,10,4,'#e0d4b5')+R(34,92,9,4,'#e0d4b5')+
 P('M38 64L46 59L54 65L53 74L45 79L37 73Z','#ba5159')+R(40,64,7,4,'#ef9b82')+R(63,44,5,58,'#a75c59')+
 R(75,49,26,19,'#ba8b3b')+R(77,50,21,12,'#f3d879')+R(80,53,5,5,'#fff0a3')+R(92,53,4,7,'#e4b958')+
 P('M72 79L77 72H87L92 79V89L86 95H77L71 90Z','#6c9a5e')+R(77,77,6,7,'#a8c77c')+R(94,76,9,17,'#b85952')+R(95,78,5,7,'#df8c70')+R(18,108,87,5,'#edaaa0'));
add('paper-cup','紙コップ','かみコップ','paper',0.45,37,
 [poly([23,24],[105,24],[90,120],[38,120])],
 P('M23 24H105L90 120H38Z',ink)+P('M29 30H99L85 114H43Z','#e9e4d1')+P('M29 30H45L53 114H43Z','#fff3d8')+P('M85 30H99L85 114H76Z','#c1c3b8')+
 P('M34 58H94L90 82H38Z','#7699a9')+R(48,63,30,4,'#c9dbe0')+R(51,73,24,4,'#c9dbe0')+R(23,24,82,10,ink)+R(29,28,70,3,'#fff4dd'));
add('monitor','モニター','モニター','appliance',6,88,
 [rect(4,12,120,76),rect(54,88,20,24),rect(31,112,66,12)],
 R(4,12,120,76,ink)+R(10,18,108,64,'#4e6575')+R(15,23,98,51,ink)+R(20,28,88,41,'#76b8c2')+
 P('M20 61L43 41L59 51L78 34L108 58V69H20Z','#bad8cd')+R(83,31,15,3,'#d9efe0')+R(94,78,5,3,'#a2d6ae')+
 R(54,88,20,24,ink)+R(59,88,10,24,'#869fa7')+R(31,112,66,12,ink)+R(37,115,54,5,'#6f8794'));

// Village pieces share ordinary throwable dimensions and base scores. They are
// miniature terrain/buildings, never fixed landscape or excluded catalog entries.
const villageItemIds=['forest','wooden-house','concrete-house','farm-plot','carrot','car','mini-mountain','truck','house-door','road-segment','supermarket','charred-log'];
const pine=(x,y,w,h)=>{
 const cx=x+w/2;
 return R(cx-5,y+h-13,10,21,ink)+R(cx-2,y+h-11,4,15,'#996c43')+
 P(`M${cx} ${y}L${x+w} ${y+h-13}H${x}Z`,ink)+
 P(`M${cx} ${y+10}L${x+w-9} ${y+h-19}H${x+9}Z`,'#3b7354')+
 P(`M${cx} ${y+10}L${cx+2} ${y+h-19}H${x+9}Z`,'#6b9d64')+
 R(cx-8,y+h-32,16,4,'#8cb477');
};
add('forest','森林','しんりん','plant',4.6,80,
 [poly([24,26],[48,105],[0,105]),rect(19,105,10,21),poly([64,3],[93,105],[35,105]),rect(59,105,10,21),poly([103,21],[127,105],[79,105]),rect(98,105,10,21)],
 pine(0,26,48,92)+pine(79,21,48,97)+pine(35,3,58,115),'solid',{burnSeconds:5});
const cottageShape=[rect(18,54,92,66),poly([4,58],[64,9],[124,58])];
add('wooden-house','木造の家','もくぞうのいえ','wood',6.5,88,cottageShape,
 R(18,54,92,66,ink)+R(24,59,80,55,'#cc9963')+[67,81,95,109].map(y=>R(25,y,78,3,'#a4754d')).join('')+
 P('M4 58L64 9L124 58Z',ink)+P('M16 52L64 17L112 52Z','#a65344')+P('M27 48L64 22L98 48Z','#d88561')+
 R(32,69,25,25,ink)+R(37,74,15,15,'#9bd5d3')+R(43,74,3,15,'#f1e6bd')+
 R(72,72,24,42,ink)+R(77,77,14,37,'#73563f')+R(79,94,4,4,gold)+R(21,115,86,4,'#715440'));
add('concrete-house','鉄筋コンクリートの家','コンクリートのいえ','stone',12,96,
 [rect(12,25,104,96),rect(6,16,116,12)],
 R(12,25,104,96,ink)+R(18,30,92,85,'#b1bbb1')+R(6,16,116,12,ink)+R(12,20,104,5,'#d7d8c3')+
 R(22,35,84,5,'#dce0ca')+R(22,69,84,4,'#8d9b98')+
 [28,73].map(x=>R(x,44,27,21,ink)+R(x+5,49,17,11,'#75aeba')+R(x+6,49,5,11,'#b8d7d1')).join('')+
 R(27,81,26,25,ink)+R(32,86,16,15,'#75aeba')+R(76,80,24,35,ink)+R(81,85,14,30,'#526e7d')+R(82,98,3,3,gold),'solid',{flammable:false,explosionResistance:0.65});
add('farm-plot','畑','はたけ','plant',3.8,90,
 [poly([8,71],[107,71],[122,91],[111,117],[14,117],[3,95]),rect(20,46,22,31),rect(15,51,14,12),rect(53,34,23,40),rect(47,31,14,15),rect(68,38,15,14),rect(87,47,22,29),rect(100,44,13,13)],
 P('M8 71H107L122 91L111 117H14L3 95Z',ink)+P('M14 77H103L114 93L105 110H20L11 94Z','#79563a')+
 [25,54,83].map(x=>P(`M${x} 79L${x+15} 79L${x+28} 102H${x+13}Z`,'#ba8b55')).join('')+
 R(20,46,22,31,ink)+R(25,51,12,21,'#5c8d53')+R(15,51,14,12,ink)+R(19,55,10,4,'#8fb96c')+
 R(53,34,23,40,ink)+R(59,39,11,30,'#65964e')+R(47,31,14,15,ink)+R(51,35,10,6,'#a0c475')+R(68,38,15,14,ink)+R(69,43,9,4,'#8ab66b')+
 R(87,47,22,29,ink)+R(92,52,12,19,'#5f9458')+R(100,44,13,13,ink)+R(101,48,8,5,'#a2c778'));
add('carrot','ニンジン','ニンジン','food',1.0,35,
 [poly([33,35],[89,35],[91,53],[64,121],[36,60]),rect(47,8,12,31),rect(66,3,12,35),rect(80,15,14,26)],
 R(47,8,12,31,ink)+R(51,12,4,23,'#80ad63')+R(66,3,12,35,ink)+R(70,7,4,26,'#94bb6c')+R(80,15,14,26,ink)+R(84,19,6,17,'#5e945d')+
 P('M33 35H89L91 53L64 121L36 60Z',ink)+P('M40 41H83L84 53L64 107L43 58Z','#db863e')+P('M40 41H58L65 98L43 58Z','#f3b154')+
 R(57,51,22,4,'#a85b35')+R(47,65,14,4,'#a85b35')+R(60,79,12,4,'#a85b35'));
const wheel=(x,y)=>P(`M${x-9} ${y-13}H${x+9}L${x+14} ${y-8}V${y+8}L${x+9} ${y+13}H${x-9}L${x-14} ${y+8}V${y-8}Z`,ink)+R(x-7,y-7,14,14,'#7a8b93')+R(x-3,y-3,6,6,'#d3d9c9');
add('car','くるま','くるま','metal',5.2,86,
 [poly([6,65],[24,60],[39,34],[83,34],[103,60],[122,67],[122,98],[6,98]),{circle:[32,98,14]},{circle:[97,98,14]}],
 P('M6 65L24 60L39 34H83L103 60L122 67V98H6Z',ink)+P('M12 69L29 65L43 40H80L99 65L116 71V91H12Z','#d26a5c')+
 P('M43 43H58V62H33Z','#afdad6')+P('M65 43H78L92 62H65Z','#83b9c2')+R(15,74,98,5,'#ef9b7b')+R(68,70,11,4,ink)+R(10,85,15,6,'#efdc98')+R(111,78,7,9,'#fff0bd')+
 wheel(32,98)+wheel(97,98),'wheeled',{wheelFixtures:[1,2]});
add('mini-mountain','山','やま','stone',11,106,
 [poly([5,113],[18,88],[42,52],[63,8],[85,46],[110,83],[123,113])],
 P('M5 113L18 88L42 52L63 8L85 46L110 83L123 113Z',ink)+P('M15 107L27 87L47 55L63 21L80 50L103 86L113 107Z','#718868')+
 P('M63 21L80 50L103 86L113 107H66Z','#435f54')+P('M47 55L63 21L80 50L72 47L64 58L57 47Z','#e5e5ce')+
 P('M22 94L43 70L53 79L36 103H18Z','#94a171')+R(75,84,13,5,'#678675')+R(52,99,11,4,'#b7ad7c'));
add('truck','トラック','トラック','metal',7.5,104,
 [rect(4,26,71,67),poly([75,45],[101,45],[123,70],[123,94],[75,94]),{circle:[28,98,14]},{circle:[101,98,14]}],
 R(4,26,71,67,ink)+R(10,32,59,54,'#c8cbb7')+R(14,37,51,7,'#e9e6ce')+[24,43,62].map(x=>R(x,48,3,33,'#929e99')).join('')+
 P('M75 45H101L123 70V94H75Z',ink)+P('M81 51H98L117 73V88H81Z','#558bb0')+P('M85 55H96L108 70H85Z','#b7ded7')+
 R(83,76,10,4,ink)+R(114,77,6,9,'#f9e3a3')+R(10,88,108,7,'#485967')+wheel(28,98)+wheel(101,98),'wheeled',{wheelFixtures:[2,3]});
add('house-door','家のドア','いえのドア','wood',2.7,44,[rect(28,5,72,119)],
 R(28,5,72,119,ink)+R(34,11,60,107,'#936747')+R(39,16,50,48,'#d2b17c')+R(44,21,40,38,'#83b9be')+R(61,21,5,38,'#f1e2b7')+
 R(39,76,50,34,'#6f4d3c')+R(44,81,40,24,'#a77d52')+R(81,68,9,6,ink)+R(82,69,6,3,gold));
add('road-segment','舗装道路','ほそうどうろ','stone',6.5,100,
 [poly([15,45],[113,45],[124,91],[4,91])],
 P('M15 45H113L124 91H4Z',ink)+P('M20 51H108L116 85H12Z','#6d7c85')+P('M23 52H105L112 80H16Z','#485965')+
 R(20,72,18,4,'#e8e2bd')+R(53,72,21,4,'#e8e2bd')+R(90,72,18,4,'#e8e2bd')+R(22,54,82,3,'#9aa9aa')+R(18,86,90,2,'#a0aaa2'));
add('supermarket','スーパー','スーパー','stone',10,106,
 [rect(9,29,110,89),rect(21,8,86,21)],
 R(9,29,110,89,ink)+R(15,35,98,77,'#dfd2a1')+R(21,8,86,21,ink)+R(27,14,74,10,'#83a66c')+R(35,17,18,4,'#f0e6b9')+R(62,17,30,4,'#f0e6b9')+
 R(15,38,98,20,'#d97860')+[17,43,69,95].map(x=>R(x,39,12,18,'#f8e5b6')).join('')+R(19,64,38,38,ink)+R(24,69,28,28,'#7caeb5')+
 R(64,64,43,48,ink)+R(69,69,33,43,'#8dbdc0')+R(83,69,5,43,'#d9dcc0')+R(78,88,4,5,'#496671')+R(90,88,4,5,'#496671')+
 R(28,89,8,6,'#89a75d')+R(39,86,9,9,'#e2ac58'),'solid',{explosionResistance:0.5});
add('charred-log','燃えた丸太','もえたまるた','wood',1.8,72,
 [poly([8,57],[25,43],[108,43],[121,56],[115,85],[24,90],[8,77])],
 P('M8 57L25 43H108L121 56L115 85L24 90L8 77Z',ink)+P('M15 59L29 49H104L114 58L109 79L27 83L15 74Z','#4e4945')+
 P('M92 53L104 49L114 58L109 79L95 81L87 70Z','#77726a')+P('M97 58L104 56L108 62L105 73L98 75L94 68Z','#353941')+
 R(26,57,48,5,'#797168')+R(32,72,43,4,'#262c35')+P('M48 49L57 49L53 62L61 70L55 82H47L51 71L44 63Z','#222a32'),'solid',{flammable:false,burnSeconds:null,explosionResistance:0.12});

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
const office=stage(40,'オフィス','40-office',['shredder','banknote','ten-yen-coin','paper-bag','blast-bomb','nori-bento','keyboard','flamethrower','homemade-bento','paper-cup','blast-bomb','monitor','desktop-pc','wired-mouse','paper-bag'],[rect(0,450,960,90),rect(65,395,560,20),rect(85,415,24,35),rect(580,415,24,35)],[810,450],[55,80,580,370]);
office.preplaced=[{id:'desktop-pc',x:145,groundY:395,scoring:true},{id:'keyboard',x:295,groundY:395,scoring:true},{id:'wired-mouse',x:415,groundY:395,scoring:true},{id:'monitor',x:535,groundY:395,scoring:true}];
const villagePool=[...villageItemIds,'rice-bowl','charcoal','flamethrower','campfire','tabletop-stove','blast-bomb','lightning-orb','wooden-crate','water-jug','fire-extinguisher'];
const village=stage(41,'ひとざと','41-village',villagePool,[rect(0,450,960,90)],[810,450],[35,80,605,370]);
village.shuffleQueue=true;
village.preplaced=[...[76,142,208,460,526,592].map(x=>({id:'forest',x,groundY:450,width:62,scoring:true})),{id:'wooden-house',x:287,groundY:450,width:82,scoring:true},{id:'wooden-house',x:377,groundY:450,width:82,scoring:true}];
const additions=[random,restaurant,beach,cafe,office,village];
const lessons=['なんでもキャノンが ぼうそう！？ なげるものと つよさが ランダムになっちゃった！？','テーブルのうえに つみあげよう。そとは ならく！','ものを じゆうにえらべる ビーチ。さいしょから みずがいっぱい。','コーヒーのどうぐと おやつを カウンターにのせよう。','さいしょのパソコンも とくてん！ ばくだんと ほのおに きをつけよう。','へいわな ひとざとに キャノンがきた！？ もりと いえを わくにのこそう！'];
for(const [i,s]of additions.entries()){s.lesson=lessons[i];stages.stages[s.id-1]=s;ui.stages[s.id-1]=['ランダムはっしゃほう','レストラン2','ビーチ','きっさてん','オフィス','ひとざと'][i];ui.lessons[s.id-1]=s.lesson;}
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
// Desks are static terrain. The computer, keyboard, mouse and monitor are real
// preplaced actors, not painted into this background, and can earn/lose points.
artwork[40]=R(0,0,960,540,'#b9c7c4')+R(0,89,960,26,'#758e9b')+R(0,115,960,7,'#dae1d3')+
 [104,406,711].map(x=>R(x,92,154,14,ink)+R(x+5,96,144,6,'#f3efd2')).join('')+
 window(76,144,270,133)+window(377,144,238,133)+
 [88,389].map(x=>[162,181,200,219,238,257].map(y=>R(x,y,246-(x===389?32:0),3,'#7a9da7')).join('')).join('')+
 R(675,163,210,236,'#536e80')+R(681,169,198,224,'#839ba5')+
 [177,245,313].map(y=>R(690,y,180,60,'#c0ccc5')+R(700,y+8,160,3,'#e0e6d8')+R(759,y+20,45,7,'#5c7483')+R(769,y+32,23,8,'#e3ddbe')).join('')+
 R(0,290,646,105,'#94a9ad')+R(0,290,646,7,'#6b8694')+R(30,315,595,8,'#d0d9cf')+
 terrainArt(office,'#82959d')+R(68,398,554,6,'#dfd5b8')+R(70,408,550,4,'#506777')+
 [80,250,420,590,760,930].map(x=>P(`M${x} 450L${x+48} 540H${x+51}L${x+3} 450Z`,'#637a89')).join('')+R(0,481,960,3,'#637a89')+R(0,520,960,3,'#637a89');
// Only distant hills and fields belong to the background. The foreground forest
// and houses are spawned dynamic actors, leaving real gaps between their shapes.
artwork[41]=R(0,0,960,540,'#b4d7d2')+R(0,0,960,118,'#bcded7')+
 R(72,158,105,13,'#ecedcc')+R(95,145,56,13,'#ecedcc')+R(651,139,119,14,'#ecedcc')+R(676,126,65,13,'#ecedcc')+
 P('M0 280L100 244L175 267L265 209L363 255L457 226L566 271L683 216L805 251L900 215L960 246V364H0Z','#87af8b')+
 P('M0 317L130 289L267 310L413 277L557 318L699 279L847 307L960 288V395H0Z','#659778')+
 R(0,343,960,107,'#a8b46b')+P('M0 363L260 343L309 401L0 419Z','#c9bc75')+
 [0,38,76,114,152,190,228].map(x=>P(`M${x} 363L${x+11} 362L${x+45} 410L${x+34} 411Z`,'#8c9c59')).join('')+
 P('M415 348L636 343L689 395L444 402Z','#bb9b62')+
 [450,490,530,570,610].map(x=>P(`M${x} 350L${x+8} 350L${x+34} 393L${x+24} 394Z`,'#7d9255')).join('')+
 P('M728 333L774 333L926 450H810Z','#d1bf8f')+P('M739 333H748L862 450H846Z','#e4d7aa')+
 terrainArt(village,'#967651')+R(0,450,960,10,'#557b48')+R(0,460,960,6,'#91a365')+
 [26,129,238,363,486,617,744,873].map((x,i)=>R(x,480+i%2*21,23,5,'#c4a474')+R(x+42,512-i%2*12,10,4,'#6d5b47')).join('');
const mapSheet=[];
for(const [i,s]of additions.entries()){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" shape-rendering="crispEdges">${artwork[s.id]}</svg>\n`;
 await fs.writeFile(path.join(root,`assets/maps/${s.map}.svg`),svg);
 await sharp(Buffer.from(svg)).png().toFile(path.join(root,`assets/maps/${s.map}.png`));
 mapSheet.push({input:await sharp(Buffer.from(svg)).resize(480,270,{kernel:'nearest'}).png().toBuffer(),left:i%2*480,top:Math.floor(i/2)*270});
}
maps.maps=stages.stages.map(s=>({id:s.map,stage:s.id,nameJa:s.nameJa,status:s.status,svg:`maps/${s.map}.svg`,worldSize:[960,540],terrain:s.terrain,backgroundCollision:false,...(s.assignment?{assignment:s.assignment}:{})}));
const ids=new Set(manifest.items.map(x=>x.id));
for(const s of stages.stages)if(!Array.isArray(s.queue)||s.queue.length<15||(s.queue.length>15&&new Set(s.queue).size<15)||s.queue.some(id=>!ids.has(id)))throw Error(`Invalid queue ${s.id}`);
await Promise.all([write('objects-manifest',manifest),write('catalog',catalog),write('physics',physics),write('colliders',colliders),write('stages',stages),write('maps-manifest',maps),write('ui-ja',ui)]);
const summary=await read('build-summary');Object.assign(summary,{objects:manifest.items.length,maps:stages.stages.length,specifiedStages:stages.stages.length-1,playableStages:stages.stages.length});await write('build-summary',summary);
const verification=await read('verification');Object.assign(verification,{objects:manifest.items.length,maps:stages.stages.length,stagesWith15Shots:stages.stages.length,croppedSpritesChecked:manifest.items.length,uniqueRenderedSprites:new Set(manifest.items.map(x=>x.svg)).size});verification.checks=verification.checks.filter(x=>!/^\d+ item records/.test(x)&&!/^\d+ maps have/.test(x));verification.checks.push(`${manifest.items.length} item records; all ${stages.stages.length} queues provide 15 throws from existing items`,`${stages.stages.length} maps have static terrain data`);await write('verification',verification);
await sharp({create:{width:1400,height:Math.ceil(items.length/7)*190,channels:4,background:'#283b4c'}}).composite(sheet).png().toFile(path.join(root,'previews/late-items.png'));
await sharp({create:{width:960,height:Math.ceil(additions.length/2)*270,channels:4,background:'#283b4c'}}).composite(mapSheet).png().toFile(path.join(root,'previews/late-maps.png'));
const officeSheet=await Promise.all(officeItemIds.map(async(id,i)=>{
 const thumb=await sharp(path.join(root,`assets/raster/objects/${id}.png`)).resize({width:176,height:160,fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
 return {input:thumb.data,left:i%4*200+Math.floor((200-thumb.info.width)/2),top:Math.floor(i/4)*190+Math.floor((180-thumb.info.height)/2)};
}));
await sharp({create:{width:800,height:380,channels:4,background:'#283b4c'}}).composite(officeSheet).png().toFile(path.join(root,'previews/office-items.png'));
const villageSheet=await Promise.all(villageItemIds.map(async(id,i)=>{
 const thumb=await sharp(path.join(root,`assets/raster/objects/${id}.png`)).resize({width:176,height:160,fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
 return {input:thumb.data,left:i%4*200+Math.floor((200-thumb.info.width)/2),top:Math.floor(i/4)*190+Math.floor((180-thumb.info.height)/2)};
}));
await sharp({create:{width:800,height:570,channels:4,background:'#283b4c'}}).composite(villageSheet).png().toFile(path.join(root,'previews/village-items.png'));
console.log(JSON.stringify({items:items.map(x=>x.id),objects:manifest.items.length,stages:stages.stages.length}));
