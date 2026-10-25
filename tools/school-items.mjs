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

// Three-quarter box construction from the supplied sketch: the top, narrow
// left gusset and broad sloping flap have separate planes and stitched edges.
// Shoulder loops and the raised handle remain real open collision spaces.
const bagLeft=[[31,43],[18,39],[8,49],[3,69],[6,96],[16,112],[30,117],[33,105],[22,102],[16,92],[13,69],[17,54],[23,50],[31,55]];
const bagRight=[[102,27],[116,34],[126,56],[127,91],[123,112],[108,123],[102,116],[116,104],[121,89],[120,60],[112,41],[100,37]];
const bagHandle=[[43,33],[41,18],[45,9],[63,2],[72,5],[78,13],[78,18],[72,21],[70,13],[65,10],[50,16],[49,30]];
const bagTop=[[28,38],[75,14],[108,33],[62,54]];
const bagFront=[[62,54],[108,33],[118,104],[68,124]];
const bagSide=[[28,38],[62,54],[68,124],[31,111]];
add('randoseru','ランドセル','cloth',2.4,71,
 [poly(...bagLeft),poly(...bagRight),poly(...bagHandle),poly(...bagTop),poly(...bagFront),poly(...bagSide)],
 P(pathOf(bagLeft),ink)+P('M27 45L19 44L12 51L7 70L10 95L19 108L27 111L28 108L20 106L12 93L9 69L14 52L23 46L28 50Z',redDark)+
 P('M12 53L14 53L10 70L13 93L21 105L19 106L10 94L7 70Z',redLight)+
 P(pathOf(bagRight),ink)+P('M107 32L113 38L123 58L125 90L121 109L109 119L106 116L118 106L123 89L122 59L115 39L104 35Z',redDark)+
 P('M121 49L124 58L126 89L123 105L122 103L124 88L122 58L119 48Z',redLight)+
 P(pathOf(bagHandle),ink)+P('M45 26L45 18L49 12L63 6L69 9L74 15L74 17L72 17L68 11L64 8L48 15L47 27Z',redDark)+
 P('M48 12L63 6L68 8L67 10L63 8L49 14Z',redLight)+
 P(pathOf(bagSide),ink)+P('M33 46L57 57L63 116L36 107Z',redDark)+
 P('M35 49L40 51L43 101L38 103Z','#a65757')+P('M42 54L54 59L57 97L45 92Z','#89434b')+
 P('M35 94L59 104L60 110L36 101Z',ink)+P('M38 96L56 104V106L38 99Z',redLight)+
 P('M44 64L50 66L51 79L45 77Z',ink)+P('M46 67L48 68L49 75L47 74Z',steel)+
 P(pathOf(bagFront),ink)+P('M68 58L104 41L112 101L72 117Z',redDark)+
 P('M69 61L104 44L110 88L104 100L80 111L73 107Z',ink)+
 P('M71 60L103 45L108 87L101 97L81 107L76 103Z',red)+
 P('M72 60L102 46L103 51L77 63L80 98L77 101Z',redLight)+
 P('M102 56L104 55L108 86L101 96L98 97L104 86Z','#7f3945')+
 P('M81 109L103 98L107 100L82 112Z','#cf7364')+P('M86 95L95 91L97 108L88 112Z',ink)+
 P('M89 97L93 95L94 105L91 107Z',gold)+P('M90 98L92 97L93 101L91 102Z','#eed08e')+
 P(pathOf(bagTop),ink)+P('M38 37L75 20L99 33L62 49Z',redLight)+
 P('M43 36L75 23L91 31L61 43Z','#d99078')+P('M62 43L91 31L99 34L63 49Z',red)+
 P('M43 34L73 21L78 23L47 37Z','#f0ad86')+P('M61 48L99 32L102 34L64 52Z',redDark));
