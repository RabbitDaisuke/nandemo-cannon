// Hand-authored SVG originals. Search vocabulary is edited separately.
const ink='#151d2c',white='#f3f2df',silver='#b0c4c5',steel='#6c8996',dark='#354d61';
const red='#d96658',blue='#4a95b2',yellow='#ecc76d',wood='#c08a56';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v});
const path=p=>'M'+p.map(v=>v.join(' ')).join('L')+'Z';
const oct=(x,y,r)=>[[x-r/2,y-r],[x+r/2,y-r],[x+r,y-r/2],[x+r,y+r/2],[x+r/2,y+r],[x-r/2,y+r],[x-r,y+r/2],[x-r,y-r/2]];
const O=(x,y,r,c)=>P(path(oct(x,y,r)),c);
const box=(x,y,w,h,c)=>R(x,y,w,h,ink)+R(x+3,y+3,w-6,h-6,c);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art,extra={})=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior:'solid',extra});

add('air-conditioner','エアコン','appliance',6,105,
 [poly([7,41],[104,33],[122,44],[122,76],[109,87],[15,87],[7,77])],
 P('M7 41L104 33L122 44V76L109 87H15L7 77Z',ink)+
 // The top and front share a filled shell; their seam is not an open black gap.
 P('M11 44L103 37L118 46V74L107 83H18L11 75Z','#dae2d8')+
 P('M11 44L103 37L118 46L108 51H19Z',white)+
 P('M108 51L118 46V74L110 81Z','#9aafba')+
 P('M19 50H108L118 45V47L109 53H19Z','#b7c6c2')+
 R(17,58,87,3,white)+R(88,65,8,3,'#80b695')+
 P('M16 73H108V81H21Z',dark)+P('M22 75H104L99 78H25Z',steel)+R(26,80,75,3,silver)+
 [34,54,74,94].map(x=>R(x,74,2,7,ink)).join('')+R(30,83,68,2,white));

add('outdoor-ac-unit','しつがいき','appliance',12,94,
 [poly([8,30],[99,21],[122,34],[122,105],[31,115],[8,100]),rect(18,102,12,19),rect(98,105,13,16)],
 box(18,102,12,19,steel)+box(98,105,13,16,steel)+
 P('M8 30L99 21L122 34V105L31 115L8 100Z',ink)+
 P('M14 32L98 26L114 34L33 43Z',white)+P('M14 39L28 48V107L14 97Z',steel)+P('M34 48L116 39V100L34 109Z','#d4ddd4')+
 P('M38 50L112 43V47L38 54Z',white)+R(98,54,13,38,'#9fb2b3')+
 [58,65,72,79,86].map(y=>R(100,y,9,3,dark)).join('')+
 O(64,77,27,ink)+O(64,77,23,silver)+O(64,77,19,dark)+
 P('M62 74L51 59L60 57L69 66L69 74L83 69L84 79L75 85L67 81L60 96L51 91L52 80Z',steel)+O(64,77,6,ink)+O(64,77,3,silver)+
 [46,53,60,67,74,81].map(x=>R(x,60+Math.abs(64-x)*.22,2,34-Math.abs(64-x)*.45,'#b6c6c5')).join('')+
 R(44,68,40,2,'#c8d3c9')+R(42,77,44,2,'#c8d3c9')+R(46,86,36,2,'#c8d3c9')+
 R(102,96,9,4,white)+R(18,50,6,35,dark)+R(20,52,2,30,silver));

// Only the upper fabric fixture launches contacts. Legs and underside are solid.
add('trampoline','トランポリン','metal',14,162,
 [poly([4,48],[19,38],[109,38],[124,48],[124,64],[4,64]),rect(15,64,9,32),rect(104,64,9,32),rect(12,94,16,6),rect(100,94,16,6)],
 box(15,61,9,35,steel)+box(104,61,9,35,steel)+R(17,65,3,25,white)+R(106,65,3,25,white)+
 R(12,94,16,6,ink)+R(100,94,16,6,ink)+
 P('M4 48L19 38H109L124 48V64H4Z',ink)+P('M11 48L22 42H106L117 48V54H11Z',blue)+
 P('M22 47L30 44H98L106 47V53L99 56H29L22 53Z',ink)+P('M29 48L34 47H94L99 49V52H29Z',dark)+
 [38,49,60,71,82,93].map(x=>R(x,48,2,5,steel)).join('')+
 R(12,57,104,4,blue)+R(16,57,96,2,'#94cfc8')+
 [14,109].map(x=>R(x,48,6,2,silver)+R(x+1,51,5,2,white)).join(''),
 {springSurface:{fixture:0,minImpactSpeed:130,restitution:2.3,maxSpeed:1300,normalMinDot:.75},restitution:0,friction:.8});

add('horizontal-bar','てつぼう','metal',5,105,
 [rect(9,18,111,9),rect(17,27,9,86),rect(104,27,9,86),rect(4,111,35,9),rect(91,111,33,9)],
 box(17,27,9,86,red)+box(104,27,9,86,red)+box(4,111,35,9,dark)+box(91,111,33,9,dark)+
 R(9,18,111,9,ink)+R(12,21,105,3,silver)+R(20,32,3,70,'#e78c68')+R(107,32,3,70,'#e78c68')+
 R(8,114,27,2,steel)+R(95,114,25,2,steel)+R(14,19,100,2,white));

// Coiled for storage and tied across the middle. Visible loop holes stay empty.
const ropeOuter=[[35,16],[52,16],[65,30],[72,51],[66,75],[53,89],[36,86],[25,70],[22,46],[26,27]];
const ropeInner=[[38,23],[49,23],[58,34],[64,52],[59,70],[50,81],[40,79],[32,66],[30,47],[33,30]];
const ropeLoops=[0,18].map(dx=>({outer:ropeOuter.map(([x,y])=>[x+dx,y]),inner:ropeInner.map(([x,y])=>[x+dx,y])}));
const ropeFixtures=ropeLoops.flatMap(({outer,inner})=>outer.map((p,i)=>poly(p,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i])));
const ropeRing=(outer,inner,color)=>`<path d="${path(outer)} ${path(inner)}" fill="${color}" fill-rule="evenodd"/>`;
add('jump-rope','なわとび','rubber',.7,70,
 [...ropeFixtures,poly([25,48],[83,42],[91,49],[85,61],[30,66],[23,58]),
  poly([50,59],[56,62],[45,92],[39,102],[33,98],[39,88]),poly([65,60],[72,57],[82,83],[96,94],[91,101],[76,88]),
  poly([25,93],[39,97],[31,126],[17,122]),poly([87,93],[100,87],[113,115],[100,121])],
 ropeLoops.map(({outer,inner})=>ropeRing(outer,inner,ink)+
  `<path d="M${outer.map((p,i)=>[(p[0]+inner[i][0])/2,(p[1]+inner[i][1])/2]).map(p=>p.join(' ')).join('L')}Z" fill="none" stroke="#c8ad71" stroke-width="3"/>`).join('')+
 P('M50 59L56 62L45 92L39 102L33 98L39 88Z',ink)+P('M51 64L53 65L42 91L37 98L36 97L41 89Z','#e3cc8e')+
 P('M65 60L72 57L82 83L96 94L91 101L76 88Z',ink)+P('M69 64L71 63L80 85L92 96L91 98L78 86Z','#d2b77b')+
 P('M25 48L83 42L91 49L85 61L30 66L23 58Z',ink)+P('M29 52L82 47L86 50L81 56L30 61L27 57Z','#b8955c')+
 P('M30 53L81 48L83 50L31 57Z','#efdba1')+P('M48 44L58 43L70 58L63 66L53 59Z',ink)+
 P('M53 47H56L65 58L62 61L56 56Z','#e2c78b')+P('M48 60L59 50L64 53L53 64Z',ink)+P('M51 60L59 54L60 55L53 61Z','#f0dba0')+
 P('M25 93L39 97L31 126L17 122Z',ink)+P('M28 98L34 100L28 121L22 119Z',red)+P('M28 99L30 100L25 116L23 116Z','#efa17a')+
 P('M87 93L100 87L113 115L100 121Z',ink)+P('M93 96L98 93L107 113L102 116Z',red)+P('M94 96L96 95L104 110L102 111Z','#efa17a'));

add('sliding-window','ひきまど','glass',4.2,102,
 [rect(7,15,115,8),rect(7,111,115,9),rect(7,23,8,88),rect(114,23,8,88),rect(59,23,9,88),rect(15,23,44,88),rect(68,23,46,88)],
 box(7,15,115,105,steel)+R(15,23,99,88,'#9bd0d0')+
 P('M17 25H31L58 68V90L17 36Z','#c5e8dc')+P('M71 25H82L112 73V92L71 36Z','#c5e8dc')+
 R(15,23,44,3,white)+R(68,23,46,3,white)+R(59,23,9,88,ink)+R(62,23,3,88,silver)+
 box(51,65,7,17,silver)+box(69,65,7,17,silver)+R(12,114,105,3,white)+R(10,18,108,2,white));

add('sandbox-box','すなば','wood',7,112,
 [poly([5,65],[36,31],[122,45],[122,57],[95,96],[5,78])],
 // A broad sand surface and low timber edging, not tall box walls.
 P('M5 65L36 31L122 45V57L95 96L5 78Z',ink)+
 P('M10 68L94 85V91L10 75Z','#ad764c')+P('M97 83L118 52V56L97 87Z','#865b43')+
 P('M10 64L38 36L116 48L92 80Z','#d5a369')+
 P('M19 62L41 42L105 52L88 72Z','#ad814d')+
 P('M20 63L42 45L105 54L88 75Z','#e3c488')+
 P('M25 62L43 48L101 56L89 62L57 57L39 67Z','#eed39a')+
 P('M43 68L51 60L64 60L73 68L66 71Z','#f5dda4')+
 P('M14 67L90 82L88 85L12 70Z','#efc58a')+P('M39 36L115 48L111 51L38 39Z','#ebc286')+
 R(27,62,3,2,'#c29b60')+R(43,54,4,2,'#f8e5b6')+R(78,62,3,2,'#ba9258')+R(80,70,3,2,'#c39b60')+R(61,70,3,2,'#c39b60')+
 P('M69 47L73 44L84 46L87 50L83 62L72 60Z',ink)+P('M73 50L82 51L80 58L74 57Z',red)+P('M72 47L75 46L82 48L82 50L74 49Z','#eca478')+
 P('M39 60L43 56L46 58L44 62L51 68L49 71L41 64L37 64Z',ink)+P('M40 60L43 59L42 62L49 68L48 69L40 63L39 63Z','#8eae83'));
