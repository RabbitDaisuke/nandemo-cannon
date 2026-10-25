// Hand-authored 128-unit originals for the fire-station stage.
// Search tags and stage selection are maintained independently by the caller.
const ink='#101623',cream='#f4edcf',light='#d9e3dd',steel='#9cafb8',shade='#526a7c';
const red='#c85850',redLight='#eb9271',redDark='#893c43',teal='#528d8b',gold='#e9bc61';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v});
const oct=(x,y,rx,ry)=>[[x-rx/2,y-ry],[x+rx/2,y-ry],[x+rx,y-ry/2],[x+rx,y+ry/2],[x+rx/2,y+ry],[x-rx/2,y+ry],[x-rx,y+ry/2],[x-rx,y-ry/2]];
const pathOf=points=>'M'+points.map(p=>p.join(' ')).join('L')+'Z';
const O=(x,y,rx,ry,c)=>P(pathOf(oct(x,y,rx,ry)),c);
const ringArt=(outer,inner,c)=>`<path d="${pathOf(outer)} ${pathOf(inner)}" fill="${c}" fill-rule="evenodd"/>`;
const ringShapes=(outer,inner)=>outer.map((p,i)=>poly(p,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i]));
const wheel=(x,y)=>O(x,y,13,13,ink)+O(x,y,8,8,shade)+O(x,y,4,4,light)+R(x-5,y-6,4,3,cream);
const heart=(x,y,c)=>P(`M${x} ${y+4}L${x+4} ${y}H${x+10}L${x+16} ${y+6}L${x+22} ${y}H${x+28}L${x+32} ${y+4}V${y+12}L${x+16} ${y+27}L${x} ${y+12}Z`,c);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art,behavior='solid',extra={})=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior,extra});

add('ambulance','きゅうきゅうしゃ','metal',6.5,100,
 [poly([7,41],[16,31],[87,31],[101,42],[119,65],[123,83],[123,101],[7,101]),rect(44,21,33,10),{circle:[30,102,13]},{circle:[100,102,13]}],
 R(44,21,33,10,ink)+R(48,24,11,5,redLight)+R(62,24,11,5,red)+
 P('M7 41L16 31H87L101 42L119 65L123 83V101H7Z',ink)+
 P('M13 43L19 37H84L97 47L113 67L117 84V95H13Z','#d9ded2')+
 R(17,39,66,6,cream)+R(17,49,31,20,ink)+R(21,53,23,12,'#8bb8c1')+R(23,54,8,3,'#d8e8dd')+
 P('M77 46H90L106 65H77Z',ink)+P('M82 50H88L98 61H82Z','#95c1c8')+
 R(57,48,13,47,'#bdc9c4')+R(63,72,5,3,shade)+R(15,77,101,9,red)+R(15,78,101,3,redLight)+
 `<g transform="translate(52 47) scale(0.6)">${heart(0,0,teal)}</g>`+R(25,54,5,3,'#d0e5da')+R(15,89,99,5,'#b4c4c2')+
 R(113,69,7,10,gold)+R(8,69,5,9,redDark)+R(8,92,13,5,shade)+R(111,92,12,5,shade)+wheel(30,102)+wheel(100,102),
 'wheeled',{wheelFixtures:[2,3]});

add('mini-hospital','びょういん','stone',8.5,89,
 [rect(15,31,98,91),rect(37,8,54,23),rect(8,27,112,10)],
 R(15,31,98,91,ink)+R(21,37,86,79,'#ccd7cc')+R(25,42,78,5,cream)+
 R(37,8,54,23,ink)+R(42,12,44,15,'#e9e6cb')+`<g transform="translate(56 13) scale(0.5)">${heart(0,0,teal)}</g>`+
 R(8,27,112,10,ink)+R(13,30,102,4,'#81a4a7')+
 [29,73].map(x=>R(x,52,27,22,ink)+R(x+4,56,19,14,'#88b4c1')+R(x+5,56,5,14,'#c4dfd9')+R(x+4,63,19,3,'#d5e2d3')).join('')+
 R(27,81,29,25,ink)+R(32,85,19,17,'#88b4c1')+R(32,85,6,17,'#c4dfd9')+
 R(68,81,33,35,ink)+R(73,86,23,30,'#78a5b1')+R(83,86,3,30,'#d8dfc9')+R(78,98,3,6,shade)+R(88,98,3,6,shade)+
 R(21,110,39,6,'#91aaa6')+R(20,118,88,3,'#6e8a8e'));

const truckLadder=[rect(5,16,103,7),rect(5,34,103,7),...[14,35,56,77,98].map(x=>rect(x,23,5,11))];
add('ladder-truck','はしごしゃ','metal',8.5,105,
 [poly([5,58],[79,58],[87,43],[112,43],[123,64],[123,100],[5,100]),{circle:[28,102,13]},{circle:[100,102,13]},...truckLadder,rect(34,41,18,17),rect(57,44,18,14)],
 truckLadder.map(f=>R(...f.rect,ink)).join('')+R(9,18,95,3,light)+R(9,36,95,3,steel)+
 [14,35,56,77,98].map(x=>R(x+1,23,3,11,'#b6c9cd')).join('')+
 R(34,41,18,17,ink)+R(39,43,8,15,shade)+R(57,44,18,14,ink)+R(62,48,8,10,shade)+
 P('M5 58H79L87 43H112L123 64V100H5Z',ink)+P('M11 64H82L91 49H109L117 66V94H11Z',red)+
 R(12,65,64,6,redLight)+R(16,75,54,16,ink)+R(20,78,46,10,'#879ca4')+R(22,81,42,2,'#b7c9c9')+R(22,86,42,2,'#657d8d')+
 P('M89 52H108L115 64H84Z',ink)+P('M91 56H105L109 61H88Z','#9cc7cb')+R(83,69,31,4,redLight)+R(87,78,8,3,ink)+
 R(76,73,4,21,redDark)+R(12,94,105,5,shade)+R(117,76,5,10,gold)+wheel(28,102)+wheel(100,102),
 'wheeled',{wheelFixtures:[1,2]});

add('fire-engine','しょうぼうしゃ','metal',8,103,
 [poly([4,35],[77,35],[77,54],[86,34],[112,34],[124,56],[124,100],[4,100]),rect(86,24,26,10),{circle:[29,102,13]},{circle:[101,102,13]}],
 R(86,24,26,10,ink)+R(90,27,8,4,redLight)+R(101,27,7,4,red)+
 P('M4 35H77V54L86 34H112L124 56V100H4Z',ink)+P('M10 41H71V60H81L90 40H108L118 58V94H10Z',red)+
 R(14,43,53,6,redLight)+R(15,54,50,31,ink)+R(20,59,40,21,'#718c9d')+[61,67,73].map(y=>R(22,y,36,3,'#b8c7c5')).join('')+
 P('M90 43H106L115 57H84Z',ink)+P('M92 47H104L109 53H88Z','#9bc6cb')+R(85,64,29,4,redLight)+R(86,74,8,4,ink)+
 O(47,74,11,11,ink)+O(47,74,7,7,'#d9cda9')+O(47,74,3,3,shade)+R(15,88,55,4,gold)+
 R(74,64,5,30,redDark)+R(115,69,6,10,gold)+R(6,94,116,5,shade)+wheel(29,102)+wheel(101,102),
 'wheeled',{wheelFixtures:[2,3]});

// The roll has an elliptical front and a long, diagonally receding cylindrical
// side. Side geometry stops at the front rim, keeping its center genuinely open.
const bandageOuter=oct(40,74,32,39),bandageInner=oct(40,74,10,16);
const bandageSide=[[24,35],[64,13],[96,13],[112,32.5],[112,71.5],[96,91],[56,113],[72,93.5],[72,54.5],[56,35]];
add('bandage-roll','ほうたい','cloth',0.8,54,
 [poly(...bandageSide),...ringShapes(bandageOuter,bandageInner)],
 P(pathOf(bandageSide),ink)+P('M36 33L65 18H94L107 35V69L92 87L65 102L77 93V54L60 34Z','#bbc7b8')+
 P('M37 32L66 17H94L103 29L73 46L60 34Z',cream)+P('M76 49L106 33V49L77 65Z','#e3e3ca')+
 P('M77 66L107 50V69L94 85L73 97L77 91Z','#9bafa6')+
 P('M64 26L70 23L100 23L102 27H71L68 29Z','#d2d8bd')+
 P('M80 43L85 40L87 43L82 46Z','#9fb5a8')+P('M92 36L97 33L99 36L94 39Z','#9fb5a8')+
 P('M80 58L85 55L87 58L82 61Z','#a0b4a7')+P('M93 51L98 48L100 51L95 54Z','#a0b4a7')+
 P('M80 75L85 72L87 75L82 78Z','#d4ddc5')+P('M94 68L99 65L101 68L96 71Z','#d4ddc5')+
 ringArt(bandageOuter,bandageInner,ink)+ringArt(oct(40,74,27,34),oct(40,74,13,20),'#e7e5cd')+
 ringArt(oct(40,74,23,29),oct(40,74,20,25),'#afc0b3')+
 P('M28 42H51L57 48L55 52L49 47H30L23 57L19 55Z',cream)+
 P('M18 76H22V88L31 99H49L57 87L60 89L51 105H29L18 91Z','#cad5bf')+
 P('M26 63L33 53H47L54 63L51 65L45 58H35L30 66Z','#849d94')+
 P('M30 82L35 90H45L50 82L53 85L47 95H33L27 86Z','#d6dac0'));

const hoseOuter=oct(57,62,49,48),hoseInner=oct(57,62,17,17);
add('fire-hose','しょうぼうホース','cloth',2.5,77,
 [...ringShapes(hoseOuter,hoseInner),poly([80,91],[98,91],[111,105],[125,105],[125,120],[104,120]),rect(113,101,14,23)],
 P('M80 91H98L111 105H125V120H104Z',ink)+P('M89 96H96L109 111H119V115H108Z','#e3dfc8')+P('M94 97L109 111H115V114H108L91 98Z',red)+
 ringArt(hoseOuter,hoseInner,ink)+ringArt(oct(57,62,43,42),oct(57,62,21,21),cream)+
 ringArt(oct(57,62,34,33),oct(57,62,30,29),'#a7bcb7')+
 P('M36 25H78L90 37L87 40L76 29H38L26 41L23 38Z',red)+
 P('M22 49H27V78L38 91H76L88 78V49H92V80L78 96H36L22 80Z',red)+
 ringArt(oct(57,62,26,26),oct(57,62,23,23),'#d97b65')+
 R(113,101,14,23,ink)+R(117,106,6,13,steel)+R(118,106,4,3,light));

add('first-aid-box','きゅうきゅうボックス','plastic',2.3,69,
 [rect(12,35,104,86),rect(41,10,8,25),rect(79,10,8,25),rect(41,6,46,8)],
 R(41,10,8,25,ink)+R(79,10,8,25,ink)+R(41,6,46,8,ink)+R(44,14,3,21,steel)+R(81,14,3,21,steel)+R(46,9,36,3,light)+
 R(12,35,104,86,ink)+R(18,41,92,74,'#d9dfd1')+R(22,45,84,8,cream)+R(18,58,92,7,'#91b2ad')+
 R(22,106,84,8,'#a7bab3')+R(30,53,12,17,ink)+R(34,57,4,9,gold)+R(86,53,12,17,ink)+R(90,57,4,9,gold)+
 heart(48,73,teal)+R(52,77,6,4,'#acd2bc')+R(22,82,8,17,'#edf0da')+R(100,74,6,28,'#bccac0'));

add('fireproof-jacket','ぼうかさぎょうふく','cloth',2.8,68,
 [poly([32,27],[96,27],[94,120],[34,120]),poly([32,27],[13,38],[5,90],[25,95],[34,62]),poly([96,27],[115,38],[123,90],[103,95],[94,62]),poly([48,20],[53,10],[75,10],[80,20],[80,29],[48,29])],
 P('M48 20L53 10H75L80 20L96 27L115 38L123 90L103 95L94 62V120H34V62L25 95L5 90L13 38L32 27Z',ink)+
 P('M35 33L19 43L12 85L21 88L31 57L40 43V114H88V43L97 57L107 88L116 85L109 43L93 33L78 26H50Z','#b69a59')+
 P('M40 35H58V109H45V43Z','#d8bd76')+P('M70 34H87V111H70Z','#937949')+
 R(59,28,10,86,ink)+R(62,33,4,75,'#6a6960')+
 P('M52 15H74L76 24L65 35L50 25Z','#555f60')+P('M55 16H70L64 27Z','#879991')+
 R(40,57,48,9,cream)+R(40,59,48,4,'#e1c455')+R(40,92,48,9,cream)+R(40,94,48,4,'#e1c455')+
 P('M14 70L28 74L26 82L13 78Z',cream)+P('M100 74L114 70L115 78L102 82Z',cream)+
 R(45,74,11,13,'#8e784c')+R(72,74,11,13,'#796842')+R(47,75,8,3,'#e6c782')+R(73,75,8,3,'#d3b978'),
 'solid',{flammable:false,burnSeconds:null});

const ladderRungs=[28,48,68,88,108];
add('steel-ladder','てつのはしご','metal',4.5,54,
 [rect(23,7,11,116),rect(94,7,11,116),...ladderRungs.map(y=>rect(34,y,60,8))],
 R(23,7,11,116,ink)+R(94,7,11,116,ink)+R(27,11,4,108,steel)+R(98,11,4,108,steel)+
 R(27,11,2,108,light)+R(98,11,2,108,light)+
 ladderRungs.map(y=>R(34,y,60,8,ink)+R(34,y+2,60,3,steel)+R(38,y+2,52,2,light)).join('')+
 R(23,115,11,8,shade)+R(94,115,11,8,shade),
 'solid',{flammable:false});

add('oxygen-cylinder','さんそボンベ','metal',5.8,42,
 [poly([34,43],[44,29],[84,29],[94,43],[94,111],[84,123],[44,123],[34,111]),rect(54,15,20,14),rect(49,7,30,10)],
 R(54,15,20,14,ink)+R(58,18,12,12,gold)+R(49,7,30,10,ink)+R(54,10,20,4,'#8aadb2')+
 P('M34 43L44 29H84L94 43V111L84 123H44L34 111Z',ink)+P('M40 45L47 35H81L88 45V108L81 117H47L40 108Z','#90aebc')+
 P('M47 35H80L87 44H41Z','#b6ccc9')+R(45,48,9,59,'#dde7d7')+R(58,47,17,65,'#a8c5cb')+R(79,47,8,63,'#698f9f')+
 R(40,50,48,14,teal)+R(45,53,38,4,'#89b5a3')+R(53,76,23,24,'#e8e5c9')+R(58,81,13,3,shade)+R(58,88,10,3,shade)+
 R(44,111,40,5,'#638492')+R(49,119,30,3,shade));

const rescueOuter=oct(64,64,56,56),rescueInner=oct(64,64,30,30);
add('rescue-ring','きゅうじょううきわ','rubber',1.7,67,
 ringShapes(rescueOuter,rescueInner),
 ringArt(rescueOuter,rescueInner,ink)+ringArt(oct(64,64,50,50),oct(64,64,35,35),red)+
 P('M41 15H87L100 28L96 32L85 21H43L32 32L28 28Z',redLight)+
 P('M17 79L29 98L43 109H85L100 95L108 79L113 82L103 101L88 114H40L25 103L12 83Z',redDark)+
 R(53,14,22,15,cream)+R(55,17,18,4,'#fffae2')+R(53,99,22,15,cream)+R(55,100,18,4,'#fff8dd')+
 R(14,53,15,22,cream)+R(17,55,4,18,'#fffae2')+R(99,53,15,22,cream)+R(100,55,4,18,'#fffae2'),
 'buoyant');
