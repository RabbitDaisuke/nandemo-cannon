// Individually drawn 128-unit originals. Search tags are maintained separately.
// Empty spaces in handles and frames are also empty in their compound fixtures.
const ink='#101623',ivory='#f3edda',white='#f9f6e8',silver='#abc0c8',steel='#748c9d',shade='#435565';
const blue='#477eb2',blueLight='#83b6d4',blueDark='#2a496d',red='#c8594f',gold='#e9bc55',goldDark='#a87739',wood='#9d6744';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v}),circle=(...v)=>({circle:v});
const oct=(x,y,rx,ry)=>[[x-rx/2,y-ry],[x+rx/2,y-ry],[x+rx,y-ry/2],[x+rx,y+ry/2],[x+rx/2,y+ry],[x-rx/2,y+ry],[x-rx,y+ry/2],[x-rx,y-ry/2]];
const path=points=>'M'+points.map(p=>p.join(' ')).join('L')+'Z';
const O=(x,y,rx,ry,c)=>P(path(oct(x,y,rx,ry)),c);
const ring=(outer,inner,c)=>`<path d="${path(outer)} ${path(inner)}" fill="${c}" fill-rule="evenodd"/>`;
const ringShapes=(outer,inner)=>outer.map((p,i)=>poly(p,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i]));
const wheel=(x,y,r=12)=>O(x,y,r,r,ink)+O(x,y,r-4,r-4,shade)+O(x,y,4,4,silver)+R(x-4,y-5,3,3,ivory);
const edge=(x,y,w,h,c)=>R(x,y,w,h,ink)+R(x+4,y+4,w-8,h-8,c);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art,behavior='solid',extra={})=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior,extra});

// Palette's off-center thumb hole is a physical hole, not a painted spot.
const paletteOuter=oct(64,65,58,49),paletteHole=oct(91,77,10,14);
add('paint-palette','カラーパレット','wood',1.1,68,
 ringShapes(paletteOuter,paletteHole),
 ring(paletteOuter,paletteHole,ink)+ring(oct(64,65,53,44),oct(91,77,14,18),'#c7985c')+
 P('M39 25H87L108 45L103 49L84 31H41L20 51L16 47Z','#edc887')+
 P('M16 83L39 105H86L99 94L104 97L89 109H37L12 86Z','#8b603e')+
 O(39,44,12,10,ink)+O(39,43,8,6,red)+R(34,38,5,3,'#ee9a6a')+
 O(65,37,11,9,ink)+O(65,36,7,5,gold)+O(89,47,11,9,ink)+O(89,46,7,5,'#527fae')+
 O(29,67,11,10,ink)+O(29,66,7,6,'#72a27b')+O(48,86,12,9,ink)+O(48,85,8,5,ivory)+R(49,85,6,3,'#b9b7ad'));

add('calligraphy-brush','しゅうじのふで','wood',0.7,71,
 [poly([76,8],[90,14],[52,90],[39,84]),poly([39,79],[56,88],[38,112],[17,122],[23,100])],
 P('M76 8L90 14L52 90L39 84Z',ink)+P('M78 14L84 17L49 85L44 82Z',wood)+P('M79 15L82 17L47 82L44 81Z','#d4a16b')+
 P('M43 69L59 77L52 91L36 83Z',ink)+P('M44 75L53 79L49 86L40 82Z',silver)+
 P('M39 79L56 88L38 112L17 122L23 100Z',ink)+P('M39 86L48 90L35 107L24 114L29 100Z',ivory)+P('M29 101L40 103L34 112L17 122L23 107Z',ink)+R(76,19,3,6,'#f2d4a1'));


add('yellow-ink-bottle','インクボトル','glass',1.3,45,
 [rect(43,13,42,21),poly([29,46],[43,34],[85,34],[99,46],[99,110],[29,110])],
 edge(43,13,42,21,shade)+R(49,16,5,14,steel)+R(60,16,4,14,steel)+R(72,16,4,14,steel)+
 P('M29 46L43 34H85L99 46V110H29Z',ink)+P('M35 49L46 40H82L93 49V104H35Z','#d7aa3b')+
 P('M39 48L48 41H78L85 47H44V99H39Z','#f4d97b')+R(84,52,7,48,'#b8882e')+
 edge(44,61,40,29,ivory)+O(64,74,8,9,'#e6bb3c')+R(48,94,34,3,'#f4d477'), 'breakable');


add('paper-plate','かみざら','paper',0.35,60,
 [poly(...oct(64,69,58,31))],
 O(64,69,58,31,ink)+O(64,67,53,26,'#e9e4cf')+O(64,67,41,19,'#aebbb9')+O(64,65,37,16,white)+
 P('M13 64L30 46H98L115 64H110L96 51H32L18 66Z',white)+
 P('M18 78L39 94H89L110 78L106 74L87 88H41L23 75Z','#b6c3c2')+
 [27,38,89,100].map((x,i)=>R(x,i<2?53:77,3,7,'#c3cbbf')).join('')+R(45,54,39,3,'#e0e6d4'));


add('microscope','けんびきょう','metal',4.5,75,
 [poly([13,107],[84,94],[115,103],[115,119],[13,119]),poly([81,36],[100,31],[113,47],[111,88],[91,110],[70,104],[88,84],[94,51]),poly([46,9],[64,17],[43,64],[25,55]),poly([18,72],[77,63],[84,75],[25,86]),poly([48,39],[90,38],[92,49],[43,51])],
 P('M81 36L100 31L113 47L111 88L91 110L70 104L88 84L94 51Z',ink)+P('M86 41L98 37L107 49L105 85L89 103L80 102L93 86L100 50Z',ivory)+
 P('M48 39L90 38L92 49L43 51Z',ink)+P('M49 43L86 42L87 45L47 47Z',steel)+
 P('M46 9L64 17L43 64L25 55Z',ink)+P('M47 16L56 20L38 57L32 54Z',silver)+P('M46 14L53 17L50 23L43 20Z',white)+
 P('M42 5L64 15L59 25L37 15Z',ink)+P('M42 9L59 17L56 20L41 14Z',shade)+
 P('M18 72L77 63L84 75L25 86Z',ink)+P('M24 74L74 68L76 72L27 80Z',steel)+R(33,72,23,4,blueLight)+
 O(99,60,12,12,ink)+O(99,60,7,7,shade)+O(99,60,3,3,silver)+
 P('M13 107L84 94L115 103V119H13Z',ink)+P('M20 109L83 100L109 107V113H20Z',ivory)+R(23,114,81,3,steel)+
 O(58,94,13,7,ink)+O(58,92,8,4,silver));

const matchBoxArt=P('M14 69L80 54L113 70V111L47 125L14 108Z',ink)+P('M20 72L78 60L103 71L47 84Z',ivory)+
 P('M20 80L43 91V117L20 104Z','#8c5b48')+P('M49 90L107 77V106L49 119Z',red)+P('M54 92L101 82V88L54 99Z','#e49b6a')+
 P('M59 102L93 95V102L59 109Z',ivory)+P('M26 87L38 93V112L26 106Z','#473947')+
 [90,96,102].map(y=>R(28,y,7,2,'#b68c69')).join('')+
 P('M42 38L50 35L67 79L59 82Z',ink)+P('M45 40L48 39L63 77L60 78Z','#e9bf78')+O(45,35,7,9,red)+
 P('M77 31L84 33L73 77L66 75Z',ink)+P('M79 37L81 38L70 73L68 73Z','#edc68b')+O(81,30,7,8,red);
add('burning-matchbox','マッチばこ','paper',0.65,54,
 [poly([14,69],[80,54],[113,70],[113,111],[47,125],[14,108]),poly([39,30],[48,29],[67,79],[59,82]),poly([76,25],[87,28],[73,77],[66,75])],
 matchBoxArt,'fuel_light',{durationSeconds:4,fireRadius:27,depletedSprite:'objects/burning-matchbox-depleted.svg'});
items.at(-1).depletedArt=matchBoxArt+O(45,35,7,9,ink)+O(45,34,3,5,shade)+O(81,30,7,8,ink)+O(81,29,3,4,shade);

// Blade and table are separate collision pieces; no invisible fill between legs.
add('table-saw','テーブルソー','appliance',9,91,
 [rect(8,60,112,17),rect(19,77,14,45),rect(95,77,14,45),rect(32,79,63,22),circle(67,55,26)],
 O(67,55,26,26,ink)+O(67,55,21,21,silver)+O(67,55,16,16,steel)+O(67,55,5,5,ink)+
 [0,1,2,3,4,5,6,7].map(i=>`<g transform="translate(67 55) rotate(${i*45})">${R(-3,-28,6,8,ink)+R(-1,-25,3,5,ivory)}</g>`).join('')+
 edge(19,77,14,45,blueDark)+edge(95,77,14,45,blueDark)+edge(32,79,63,22,blue)+edge(8,60,112,17,silver)+
 R(13,63,101,4,ivory)+R(50,60,35,4,shade)+R(39,84,19,11,ink)+R(43,87,5,5,red)+R(51,87,4,5,'#77b686')+
 R(72,84,17,3,blueLight)+R(72,91,17,3,blueDark));

add('sewing-machine','ミシン','appliance',6.2,81,
 [rect(9,104,112,18),rect(87,30,29,74),rect(31,29,64,23),rect(24,42,23,36),rect(32,78,5,25),circle(114,53,11),rect(74,14,16,15)],
 edge(74,14,16,15,red)+R(78,18,8,3,'#eda17c')+R(81,8,4,9,ink)+
 P('M31 29H106L116 40V108H87V53H47V78H24V42Z',ink)+P('M34 35H103L110 43V102H93V47H41V72H30V44Z',ivory)+
 R(38,37,62,5,white)+R(101,48,8,50,'#c4d0c9')+R(32,78,5,25,steel)+R(29,100,16,4,ink)+
 O(114,53,11,11,ink)+O(115,53,6,6,silver)+R(111,50,7,3,ivory)+
 edge(9,104,112,18,ivory)+R(15,108,84,4,white)+R(33,109,25,6,steel)+R(100,111,12,5,blue)+
 O(101,78,6,6,shade)+O(101,78,2,2,silver)+R(33,54,5,6,shade));

add('three-d-printer','スリーディープリンター','appliance',8,86,
 [rect(9,25,14,93),rect(105,25,14,93),rect(9,25,110,14),rect(9,104,110,18),rect(23,56,82,9),rect(50,63,24,19),rect(23,91,82,10),rect(57,80,6,10),circle(64,15,14)],
 O(64,15,14,14,ink)+O(64,15,9,9,'#db8e63')+O(64,15,4,4,ink)+R(75,14,5,12,ink)+
 edge(9,25,110,14,shade)+edge(9,25,14,93,shade)+edge(105,25,14,93,shade)+R(13,33,4,70,silver)+R(109,33,4,70,silver)+
 edge(23,56,82,9,steel)+edge(50,63,24,19,blue)+R(57,80,6,10,gold)+edge(23,91,82,10,steel)+
 P('M68 87L77 81L88 85V92H68Z',blueLight)+R(71,86,14,3,blue)+edge(9,104,110,18,shade)+
 R(16,108,27,8,blueLight)+R(19,110,14,3,'#c7eddf')+R(100,110,8,7,red)+R(52,108,39,3,steel));

const ferrisOuter=oct(64,48,43,42),ferrisInner=oct(64,48,35,34);
const ferrisArms=[poly([60,47],[66,47],[90,119],[79,119]),poly([60,47],[66,47],[49,119],[38,119]),rect(12,117,104,8)];
const ferrisSpokes=[rect(61.5,10,5,77),poly([25.8,30.2],[28.2,25.8],[102.2,64.8],[99.8,69.2]),poly([25.8,64.8],[28.2,69.2],[102.2,30.2],[99.8,25.8])];
const ferrisCabins=[[64,7],[101,27],[102,64],[64,88],[26,65],[27,27]];
add('mini-ferris-wheel','かんらんしゃ','metal',4.5,91,
 [...ringShapes(ferrisOuter,ferrisInner),...ferrisArms,...ferrisSpokes,...ferrisCabins.map(([x,y])=>rect(x-10,y-2,20,16))],
 ring(ferrisOuter,ferrisInner,ink)+ring(oct(64,48,40,39),oct(64,48,38,37),silver)+
 `<path d="M64 10V87M27 28L101 67M27 67L101 28" fill="none" stroke="${shade}" stroke-width="5"/>`+
 ferrisArms.map(f=>f.rect?R(...f.rect,ink):P(path(f.polygon),ink)).join('')+
 P('M61 55L66 55L86 118H81Z',red)+P('M61 55H65L46 118H42Z',red)+R(17,120,94,3,silver)+O(64,48,9,9,ink)+O(64,48,5,5,gold)+
 ferrisCabins.map(([x,y],i)=>edge(x-10,y-2,20,16,[red,blue,gold][i%3])+R(x-5,y+2,10,4,ivory)).join(''));

add('manhole-cover','マンホール','metal',12,71,
 [poly(...oct(64,66,59,38))],
 O(64,66,59,38,ink)+O(64,63,54,32,steel)+O(64,63,46,26,ink)+O(64,63,42,23,'#697e88')+
 P('M14 73L38 96H90L114 73L111 68L88 90H40L17 68Z',shade)+
 [38,50,62,74,86].map((y,i)=>P(`M${i===0||i===4?45:29} ${y}H${i===0||i===4?83:99}V${y+3}H${i===0||i===4?45:29}Z`,shade)).join('')+
 [39,51,63,75,87].map(x=>R(x,44,3,38,silver)).join('')+R(22,59,9,5,ink)+R(97,59,9,5,ink)+R(44,34,39,3,silver));

add('stopwatch','ストップウォッチ','metal',1.2,48,
 [poly(...oct(64,74,43,45)),rect(51,10,26,20),poly([92,30],[104,23],[111,35],[100,42])],
 edge(51,10,26,20,steel)+R(55,14,18,4,ivory)+P('M92 30L104 23L111 35L100 42Z',ink)+P('M98 31L103 29L106 34L101 37Z',silver)+
 O(64,74,43,45,ink)+O(64,73,38,40,silver)+O(64,73,31,33,ink)+O(64,73,27,29,ivory)+
 R(62,46,4,8,ink)+R(62,92,4,8,ink)+R(38,71,8,4,ink)+R(82,71,8,4,ink)+
 R(62,57,4,19,shade)+P('M63 72L80 59L83 62L67 77Z',red)+O(64,74,5,5,ink)+O(64,74,2,2,gold)+
 R(57,86,14,5,steel)+P('M35 48L42 40H83L89 47L86 49L81 44H44L38 51Z',white));

add('pizza-oven','ピザがま','stone',9,88,
 [rect(5,101,118,21),poly([9,100],[9,53],[24,29],[42,19],[85,19],[106,30],[119,53],[119,100],[98,100],[98,66],[84,51],[44,51],[30,66],[30,100]),rect(47,4,34,16)],
 edge(47,4,34,16,'#ae6950')+P('M9 100V53L24 29L42 19H85L106 30L119 53V100H98V66L84 51H44L30 66V100Z',ink)+
 P('M15 95V55L29 34L44 25H83L102 35L113 55V95H104V63L87 45H41L24 63V95Z','#be7652')+
 P('M19 49L30 33L46 25H83L101 35L110 49H103L98 40L80 31H46L34 39L28 49Z','#e6ab74')+
 `<path d="M31 34L41 46M51 25V45M78 25V45M101 35L88 48M16 58H27M101 58H113M15 79H25M103 79H113" stroke="#805342" stroke-width="4" fill="none"/>`+
 edge(5,101,118,21,steel)+R(11,105,106,5,silver)+R(18,115,94,3,shade));

add('stone-fountain','ふんすい','stone',7.8,86,
 [poly([8,73],[120,73],[105,102],[23,102]),rect(52,36,24,37),poly([32,26],[96,26],[85,42],[43,42]),rect(57,10,14,16),rect(46,102,36,15),rect(30,117,68,9)],
 edge(57,10,14,16,silver)+P('M32 26H96L85 42H43Z',ink)+P('M39 30H89L82 37H46Z',silver)+R(43,29,42,4,'#73c2d3')+
 edge(52,36,24,37,steel)+R(57,43,5,27,ivory)+P('M8 73H120L105 102H23Z',ink)+P('M15 78H113L102 96H27Z',silver)+
 P('M16 77H112L105 84H24Z','#71bfd0')+R(29,89,70,4,ivory)+edge(46,102,36,15,steel)+edge(30,117,68,9,silver),
 'solid',{waterSource:{position:[64,6],rateUnitsPerSecond:2,maxUnits:16,speed:160}});

const combTeeth=Array.from({length:11},(_,i)=>rect(13+i*9,47,5,38-(i%3)*4));
add('red-hair-comb','あかいくし','plastic',0.45,66,
 [rect(8,28,112,21),...combTeeth],
 edge(8,28,112,21,red)+R(15,32,97,5,'#ee9773')+combTeeth.map(f=>R(...f.rect,ink)+R(f.rect[0]+1,f.rect[1],2,f.rect[3]-4,red)).join('')+
 R(17,40,90,3,'#983c45'));


add('mini-excavator','ミニショベル','metal',8,105,
 [poly([9,90],[72,90],[82,103],[72,118],[9,118],[2,104]),rect(13,58,57,33),poly([20,27],[53,27],[63,42],[63,58],[20,58]),poly([63,48],[79,15],[89,15],[112,56],[104,64],[82,30],[73,54]),poly([102,54],[114,54],[125,82],[113,90],[100,82])],
 P('M63 48L79 15H89L112 56L104 64L82 30L73 54Z',ink)+P('M69 47L82 21H86L107 56L105 58L82 27L71 49Z',gold)+
 P('M102 54H114L125 82L113 90L100 82Z',ink)+P('M107 59H111L119 79L112 84L106 79Z',steel)+P('M101 79L109 85L121 79L123 83L113 89L101 83Z',silver)+
 P('M20 27H53L63 42V64H20Z',ink)+P('M26 33H50L57 44V58H26Z',gold)+P('M30 35H48L53 44V52H30Z',ink)+P('M34 39H46L48 44V48H34Z',blueLight)+
 edge(13,58,57,33,gold)+R(19,62,43,6,'#f9dc85')+R(20,75,19,8,goldDark)+R(45,74,17,3,ink)+R(45,81,17,3,ink)+
 P('M9 90H72L82 103L72 118H9L2 104Z',ink)+P('M12 96H69L75 104L69 112H12L8 104Z',shade)+
 [19,40,61].map(x=>O(x,104,7,7,ink)+O(x,104,3,3,steel)).join('')+R(19,93,45,3,silver)+R(19,114,45,2,steel)+O(82,24,5,5,steel));

add('solar-panel','ソーラーパネル','metal',3.5,85,
 [poly([30,13],[119,28],[99,102],[8,85]),poly([61,95],[71,97],[77,118],[65,118])],
 P('M61 95L71 97L77 118H65Z',ink)+P('M65 98L68 99L72 114H68Z',steel)+
 P('M30 13L119 28L99 102L8 85Z',ink)+P('M33 19L112 32L95 95L15 81Z',silver)+P('M37 25L106 37L91 89L22 77Z',blueDark)+
 `<path d="M36 43L100 54M30 61L95 72M52 29L38 79M70 32L56 82M88 35L74 85" stroke="#7eaac9" stroke-width="3" fill="none"/>`+
 P('M40 28L49 30L45 42L36 40Z','#426f9d')+P('M75 52L84 54L80 66L71 64Z','#426f9d')+
 P('M29 67L39 69L36 77L26 75Z','#426f9d')+P('M55 70L65 72L62 80L52 78Z','#426f9d')+
 R(32,22,4,3,white)+R(100,35,4,3,white)+R(21,77,4,3,white)+R(88,90,4,3,white));


add('mini-forklift','フォークリフト','metal',8.5,98,
 [rect(17,69,65,30),rect(67,21,9,48),rect(29,21,8,48),rect(24,15,57,9),rect(88,16,10,91),rect(87,101,39,9),rect(76,66,12,17),circle(28,105,14),circle(72,105,14)],
 edge(67,21,9,48,steel)+edge(29,21,8,48,steel)+edge(24,15,57,9,gold)+edge(88,16,10,91,steel)+R(91,22,3,68,silver)+
 edge(87,101,39,9,steel)+edge(76,66,12,17,steel)+R(77,69,6,4,silver)+
 P('M43 53H52V70H38V63H43Z',ink)+R(45,56,4,8,shade)+P('M62 52L68 49L71 53L65 57Z',ink)+R(64,55,4,14,steel)+
 edge(17,69,65,30,gold)+R(23,73,53,6,'#f5d277')+R(22,85,16,8,goldDark)+R(42,84,31,3,goldDark)+
 R(18,59,16,11,ink)+R(21,62,10,5,red)+wheel(28,105,14)+wheel(72,105,14),
 'wheeled',{wheelFixtures:[7,8]});

add('offertory-box','さいせんばこ','wood',4.5,85,
 [poly([7,36],[95,21],[121,38],[121,102],[34,119],[7,98])],
 P('M7 36L95 21L121 38V102L34 119L7 98Z',ink)+P('M14 39L94 27L112 39L34 53Z','#c58e50')+
 P('M14 47L29 58V109L14 95Z','#805337')+P('M36 59L115 45V97L36 112Z','#ab7443')+
 [0,1,2,3,4].map(i=>P(`M${22+i*14} ${38-i*2}L${29+i*14} ${37-i*2}L${43+i*14} ${47-i*2}L${36+i*14} ${49-i*2}Z`,ink)).join('')+
 P('M44 64L106 53V89L44 101Z',ink)+P('M49 68L101 59V85L49 95Z','#d5a966')+
 P('M60 70L83 66V70L74 72V75L84 73V77L74 79V85L68 86V80L59 82V78L68 76V73L60 74Z','#5a3d31')+
 P('M42 105L109 93V97L42 110Z','#6d4834')+R(18,65,4,24,'#bf8c59'));

add('winners-podium','ひょうしょうだい','wood',5,94,
 [rect(7,72,37,46),rect(44,34,41,84),rect(85,85,36,33)],
 edge(7,72,37,46,blue)+edge(44,34,41,84,'#cca24d')+edge(85,85,36,33,red)+
 R(12,76,27,5,blueLight)+R(49,38,31,6,'#f0d081')+R(90,89,26,5,'#ed9a77')+
 P('M56 61H68V95H75V101H54V95H61V69H56Z',ivory)+
 P('M17 88H32V99H23V104H32V109H17V95H26V93H17Z',ivory)+
 P('M94 98H110V112H94V108H105V106H98V102H105V101H94Z',ivory)+
 R(12,112,27,3,blueDark)+R(50,111,29,3,goldDark)+R(91,113,24,2,'#8c4145'));




add('numeric-keypad','テンキー','plastic',1.1,55,
 [poly([24,9],[100,9],[115,109],[105,121],[12,121],[12,108])],
 P('M24 9H100L115 109L105 121H12V108Z',ink)+P('M29 15H95L108 107H19Z','#bec7c5')+P('M19 111H108L102 116H19Z',shade)+
 [27,46,65,84].map((y,row)=>[31,54,77].map((x,col)=>{const dx=(x-54)*row*0.035;return edge(x+dx,y,18,15,shade)+R(x+dx+5,y+4,6,2,silver)+(row<3?R(x+dx+9,y+6,2,5,silver):'');}).join('')).join('')+
 R(34,18,54,4,ivory));

const tonOuter=oct(64,24,19,18),tonInner=oct(64,24,10,9);
add('one-ton-weight','いちトンおもり','metal',28,73,
 [poly([27,38],[101,38],[120,117],[8,117]),...ringShapes(tonOuter,tonInner)],
 ring(tonOuter,tonInner,ink)+ring(oct(64,24,15,14),oct(64,24,12,11),steel)+
 P('M27 38H101L120 117H8Z',ink)+P('M32 44H96L113 111H15Z','#3c4148')+P('M32 44H96L100 56H28Z','#626a70')+
 P('M17 106H110L113 111H15Z','#272d38')+
 P('M34 68H47V94H53V100H32V94H39V75H34Z',ivory)+P('M60 68H89V75H78V100H71V75H60Z',ivory)+
 R(28,58,4,41,'#687078')+R(99,83,4,15,'#242d37'));


const potHandles=[rect(4,57,24,8),rect(4,57,8,25),rect(4,74,24,8),rect(100,57,24,8),rect(116,57,8,25),rect(100,74,24,8)];
add('lidded-saucepan','ふたつきなべ','metal',4.4,78,
 [...potHandles,poly([22,42],[106,42],[104,104],[91,115],[37,115],[24,104]),poly([20,43],[30,32],[98,32],[108,43]),rect(53,21,23,12)],
 potHandles.map(f=>R(...f.rect,ink)).join('')+R(8,60,16,3,steel)+R(104,60,16,3,steel)+
 P('M22 42H106L104 104L91 115H37L24 104Z',ink)+P('M28 48H100L98 101L88 109H40L30 101Z',silver)+
 P('M33 50H42V101L47 108H40L34 101Z',white)+P('M88 50H99L97 100L88 108H77L87 101Z',steel)+
 P('M20 43L30 32H98L108 43Z',ink)+P('M28 39L33 35H94L101 39Z',shade)+edge(53,21,23,12,shade)+R(58,24,13,3,steel)+R(30,44,68,4,ivory));

const fuelHose=[rect(98,43,10,61),rect(108,96,14,10),rect(114,41,8,58),poly([106,26],[121,30],[121,51],[112,51],[112,36],[105,34])];
add('fuel-meter','きゅうゆメーター','metal',7.5,75,
 [rect(16,11,80,100),rect(8,111,96,13),...fuelHose],
 fuelHose.map(f=>f.rect?R(...f.rect,ink):P(path(f.polygon),ink)).join('')+R(101,47,4,51,shade)+R(106,99,12,4,shade)+R(117,47,3,51,shade)+
 P('M109 30L117 32V46H114V34L109 33Z',gold)+
 edge(16,11,80,100,ivory)+R(22,17,68,7,white)+edge(26,30,60,31,shade)+R(31,35,50,20,'#b5cbb1')+
 [37,51,65].map(x=>P(`M${x} 39H${x+9}V51H${x}ZM${x+3} 42V48H${x+6}V42Z`,shade)).join('')+
 R(26,68,60,28,red)+R(32,73,48,6,'#ec9877')+R(32,84,24,6,'#934346')+R(67,84,12,6,gold)+edge(8,111,96,13,shade)+R(16,115,80,4,steel));

add('insect-spray','むしよけスプレー','metal',1.1,43,
 [poly([35,38],[44,28],[83,28],[93,38],[93,112],[84,121],[44,121],[35,112]),rect(49,11,30,17)],
 edge(49,11,30,17,ivory)+R(51,15,8,6,shade)+R(46,21,38,8,ink)+R(50,23,30,3,silver)+
 P('M35 38L44 28H83L93 38V112L84 121H44L35 112Z',ink)+P('M41 40L47 34H80L87 40V109L81 115H47L41 109Z','#8eae68')+
 R(45,43,7,62,'#c5d48e')+R(80,43,6,64,'#627d53')+edge(48,53,31,37,ivory)+
 O(64,71,6,9,shade)+R(62,60,4,5,shade)+P('M54 63L74 80L72 83L52 66Z',red)+
 R(49,98,29,4,ivory)+R(50,106,27,3,shade),
 'extinguisher',{emissionAnchor:[49,18],durationSeconds:4,range:130,leavesWater:false});
