// Hand-authored 128-unit school props. Search aliases belong to the manual index.
// Every object is a single ordinary rigid body; open spaces stay collision-free.
const ink='#101623',light='#dce3da',steel='#9badb4',shade='#536875';
const wood='#ba8751',woodLight='#e3b772',woodDark='#8d5c39';
const red='#ad5051',redLight='#d87966',redDark='#723640',gold='#d2ae65';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v});
const oct=(x,y,rx,ry)=>[[x-rx/2,y-ry],[x+rx/2,y-ry],[x+rx,y-ry/2],[x+rx,y+ry/2],[x+rx/2,y+ry],[x-rx/2,y+ry],[x-rx,y+ry/2],[x-rx,y-ry/2]];
const pathOf=points=>'M'+points.map(point=>point.join(' ')).join('L')+'Z';
const O=(x,y,rx,ry,c)=>P(pathOf(oct(x,y,rx,ry)),c);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art)=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior:'solid',extra:{}});

// A drafting compass, distinct from the existing magnetic navigation compass.
// The steel needle and short pencil terminate the two open, fixed-angle legs.
const compassLeft=[[54,34],[65,40],[34,106],[23,103]];
const compassRight=[[65,40],[75,34],[105,101],[94,107]];
const compassNeedle=[[23,99],[35,104],[22,124],[17,124]];
const compassPencil=[[91,94],[102,89],[112,111],[104,116]];
const compassLead=[[104,116],[112,111],[115,123],[111,125]];
add('drafting-compass','コンパス','metal',1.1,57,
 [poly(...compassLeft),poly(...compassRight),poly(...compassNeedle),poly(...compassPencil),poly(...compassLead),poly(...oct(64,34,13,13)),rect(57,6,14,17),rect(60,20,8,9)],
 P(pathOf(compassLeft),ink)+P('M55 41L59 43L31 100L27 99Z',steel)+P('M54 45L57 46L30 99L28 98Z',light)+
 P(pathOf(compassRight),ink)+P('M70 42L73 40L100 99L97 100Z',steel)+P('M71 44L73 43L97 95L95 96Z',light)+
 P(pathOf(compassNeedle),ink)+P('M25 106L29 108L21 121L20 121Z',light)+
 P(pathOf(compassPencil),ink)+P('M96 96L100 94L107 109L104 111Z','#d0a65a')+P('M99 96L101 95L107 108L105 109Z','#edc978')+
 P(pathOf(compassLead),ink)+P('M106 115L110 113L112 120L110 121Z','#d7c29a')+
 R(60,20,8,9,ink)+R(57,6,14,17,ink)+R(61,9,6,11,'#537f89')+R(62,10,2,9,'#93b7bb')+
 O(64,34,13,13,ink)+O(64,34,9,9,steel)+O(64,34,5,5,shade)+R(60,32,8,3,light)+R(60,27,5,2,'#f1edcf'));

// Long hexagonal yellow pencil, with a visible wooden point and graphite tip.
const pencilBody=[[36,83],[84,17],[102,31],[54,97]];
const pencilPoint=[[36,83],[54,97],[21,121],[17,118]];
const pencilCap=[[84,17],[92,6],[110,20],[102,31]];
add('pencil','えんぴつ','wood',0.45,70,
 [poly(...pencilBody),poly(...pencilPoint),poly(...pencilCap)],
 P(pathOf(pencilBody),ink)+P('M40 83L85 23L97 32L52 91Z','#c69040')+
 P('M41 81L85 22L89 25L45 85Z','#f2ca69')+P('M46 85L90 26L94 29L50 89Z','#dbab4f')+
 P('M51 89L95 30L98 32L54 92Z','#9e7139')+
 P(pathOf(pencilPoint),ink)+P('M37 89L48 97L25 114L22 112Z','#d7b783')+P('M37 90L42 94L24 112Z','#f0d4a0')+
 P('M22 110L28 115L21 121L17 118Z',ink)+P('M22 113L25 116L21 118L20 117Z','#52636c')+
 P(pathOf(pencilCap),ink)+P('M89 17L93 11L104 20L100 25Z','#527c67')+P('M91 15L94 12L101 18L99 21Z','#8aa58a')+
 P('M84 20L88 16L103 27L100 31Z',ink)+P('M87 20L89 18L100 26L98 28Z',gold)+
 P('M58 62L60 59L71 44L73 46L62 61L60 64Z','#775b35'));

// Open storage shelf and steel legs. Neither the shelf mouth nor the space
// beneath the desk is replaced with a solid bounding box.
const deskTop=[[5,26],[17,16],[111,16],[123,26],[123,41],[5,41]];
add('school-desk','がっこうのつくえ','wood',6.5,100,
 [poly(...deskTop),rect(18,41,10,30),rect(101,41,10,30),rect(18,63,93,9),rect(21,72,11,43),rect(97,72,11,43),rect(15,113,29,10),rect(85,113,29,10)],
 R(18,41,10,30,ink)+R(101,41,10,30,ink)+R(22,43,3,20,steel)+R(104,43,4,20,steel)+
 R(18,63,93,9,ink)+R(23,66,83,3,steel)+R(27,65,73,2,light)+
 R(21,72,11,43,ink)+R(97,72,11,43,ink)+R(25,72,4,41,steel)+R(101,72,4,41,steel)+
 R(25,73,2,38,light)+R(101,73,2,38,light)+R(15,113,29,10,ink)+R(85,113,29,10,ink)+
 R(19,115,21,4,shade)+R(89,115,21,4,shade)+R(23,115,14,2,steel)+R(93,115,14,2,steel)+
 P(pathOf(deskTop),ink)+P('M18 21H109L115 26H12Z',woodLight)+R(10,27,108,9,wood)+
 R(10,27,108,3,'#edc581')+R(10,36,108,2,woodDark)+R(18,22,40,2,'#f4d395')+
 R(77,24,24,2,'#b78b52')+R(18,32,18,2,'#d4a064')+R(93,31,18,2,woodDark));

// A boxy leather school backpack with an arched flap, side gusset, clasp and
// separate shoulder straps. Both visible strap interiors are empty geometry.
const bagLeft=[[35,30],[20,27],[8,39],[5,57],[7,91],[17,106],[35,110],[38,99],[23,95],[18,85],[16,58],[18,45],[25,39],[35,43]];
const bagRight=[[104,35],[114,32],[122,42],[125,56],[124,93],[117,108],[105,112],[105,100],[110,98],[115,89],[116,57],[114,48],[110,45],[104,48]];
const bagFront=[[35,30],[87,30],[96,40],[96,119],[35,119]];
const bagSide=[[87,30],[106,39],[106,108],[96,119],[96,40]];
add('randoseru','ランドセル','cloth',2.4,71,
 [poly(...bagLeft),poly(...bagRight),poly(...bagFront),poly(...bagSide),rect(51,7,30,7),rect(51,14,7,16),rect(74,14,7,16)],
 P(pathOf(bagLeft),ink)+P('M31 33L21 32L12 41L9 58L11 90L20 102L32 105L33 102L21 99L14 86L12 58L14 43L24 35L32 38Z',redDark)+
 P('M13 43L15 42L12 58L14 86L20 97L18 96L11 88L9 58Z',redLight)+
 P(pathOf(bagRight),ink)+P('M108 38L113 37L118 44L121 57L120 92L114 104L109 106V103L113 101L119 90L120 57L117 45L111 40L108 42Z',redDark)+
 R(51,7,30,7,ink)+R(51,14,7,16,ink)+R(74,14,7,16,ink)+R(56,10,20,2,redLight)+R(54,14,2,16,red)+R(77,14,2,16,red)+
 P(pathOf(bagSide),ink)+P('M94 36L102 41V106L100 109V42Z',redDark)+P('M99 45L102 46V77L99 79Z','#94515a')+
 P(pathOf(bagFront),ink)+P('M40 35H85L91 42V114H40Z',red)+R(43,91,45,20,'#91414a')+
 P('M40 35H85L91 42V77L84 88H47L40 79Z',redDark)+P('M43 38H83L88 44V75L82 83H49L43 76Z',red)+
 P('M43 38H82L86 42H48V73L43 70Z',redLight)+P('M83 47H87V74L81 81H76L82 74Z','#813842')+
 R(44,91,3,17,redLight)+R(50,107,31,2,'#bd6060')+R(58,78,14,23,ink)+R(61,81,8,16,gold)+
 R(63,83,4,4,'#f0d490')+R(62,90,6,5,'#80714d')+R(101,85,4,10,ink)+R(102,87,2,5,steel));
