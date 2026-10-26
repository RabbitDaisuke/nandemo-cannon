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
 P('M12 44L103 38L114 45L22 51Z',white)+P('M12 49L22 56H109V70H15L12 66Z','#dae2d8')+
 P('M112 52L118 47V74L112 80Z','#879eaa')+R(17,59,87,3,white)+R(88,65,8,3,'#80b695')+
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
 {springSurface:{fixture:0,minImpactSpeed:130,restitution:1.15,maxSpeed:650,normalMinDot:.75},restitution:0,friction:.8});

add('horizontal-bar','てつぼう','metal',5,105,
 [rect(9,18,111,9),rect(17,27,9,86),rect(104,27,9,86),rect(4,111,35,9),rect(91,111,33,9)],
 box(17,27,9,86,red)+box(104,27,9,86,red)+box(4,111,35,9,dark)+box(91,111,33,9,dark)+
 R(9,18,111,9,ink)+R(12,21,105,3,silver)+R(20,32,3,70,'#e78c68')+R(107,32,3,70,'#e78c68')+
 R(8,114,27,2,steel)+R(95,114,25,2,steel)+R(14,19,100,2,white));

// A rope loop with a real hollow center, plus two separate solid handles.
const ropeOuter=[[25,26],[58,15],[93,30],[110,58],[107,84],[86,100],[63,97],[47,83],[42,60],[53,41],[75,41],[89,55],[92,75],[84,90]];
const ropeInner=[[29,31],[58,21],[89,34],[104,60],[102,80],[85,94],[66,92],[52,80],[48,61],[56,47],[72,47],[84,58],[86,73],[79,86]];
const ropeFixtures=ropeOuter.slice(0,-1).map((p,i)=>poly(p,ropeOuter[i+1],ropeInner[i+1],ropeInner[i]));
add('jump-rope','なわとび','rubber',.7,70,
 [...ropeFixtures,poly([16,27],[28,23],[44,63],[30,68]),poly([75,86],[87,82],[104,114],[90,121])],
 ropeFixtures.map(f=>P(path(f.polygon),ink)).join('')+
 `<path d="M27 29L58 18L91 32L107 59L105 82L85 97L65 95L50 81L45 61L55 44H74L87 56L89 74L82 88" fill="none" stroke="#d2c38b" stroke-width="2"/>`+
 P('M16 27L28 23L44 63L30 68Z',ink)+P('M21 30L26 28L38 60L32 62Z',red)+
 P('M75 86L87 82L104 114L90 121Z',ink)+P('M81 89L85 87L98 112L92 115Z',red)+P('M23 32L25 31L35 57L33 58Z','#f29a70'));

add('sliding-window','ひきまど','glass',4.2,102,
 [rect(7,15,115,8),rect(7,111,115,9),rect(7,23,8,88),rect(114,23,8,88),rect(59,23,9,88),rect(15,23,44,88),rect(68,23,46,88)],
 box(7,15,115,105,steel)+R(15,23,99,88,'#9bd0d0')+
 P('M17 25H31L58 68V90L17 36Z','#c5e8dc')+P('M71 25H82L112 73V92L71 36Z','#c5e8dc')+
 R(15,23,44,3,white)+R(68,23,46,3,white)+R(59,23,9,88,ink)+R(62,23,3,88,silver)+
 box(51,65,7,17,silver)+box(69,65,7,17,silver)+R(12,114,105,3,white)+R(10,18,108,2,white));

add('sandbox-box','すなば','wood',7,112,
 [poly([8,68],[30,49],[106,49],[122,65],[119,105],[24,116],[8,99])],
 P('M8 68L30 49H106L122 65L119 105L24 116L8 99Z',ink)+
 P('M14 69L32 54H103L115 65L25 78Z',wood)+P('M27 65L39 57H98L104 63L33 73Z','#e0bd7e')+
 P('M14 75L22 83V108L14 96Z','#946043')+P('M28 84L116 71L113 100L28 110Z',wood)+
 P('M32 88L110 77V83L32 95Z','#e0ad70')+P('M32 102L110 91V96L32 107Z','#a26e48')+
 R(34,62,5,3,'#f5d99e')+R(62,60,4,3,'#bd955a')+R(82,63,6,3,'#f5d99e')+
 R(35,90,3,3,ink)+R(103,80,3,3,ink)+R(35,102,3,3,ink)+R(103,93,3,3,ink));
