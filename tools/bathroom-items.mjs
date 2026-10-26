// Direct SVG originals. Closed appliance tops follow the unchanged washing machine.
// Names/tags are editorial choices; search vocabulary lives in its separate JSON.
const ink='#080c12',white='#f3edda',light='#dce2d4',silver='#9eb7bd',steel='#627f8e',dark='#365467';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const E=(d,c)=>`<path d="${d}" fill="${c}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`;
const path=p=>'M'+p.map(v=>v.join(' ')).join('L')+'Z';
const poly=(...polygon)=>({polygon}),rect=(...v)=>({rect:v});
const oct=(x,y,rx,ry)=>[[x-rx/2,y-ry],[x+rx/2,y-ry],[x+rx,y-ry/2],[x+rx,y+ry/2],[x+rx/2,y+ry],[x-rx/2,y+ry],[x-rx,y+ry/2],[x-rx,y-ry/2]];
const O=(x,y,rx,ry,c)=>P(path(oct(x,y,rx,ry)),c);
const ring=(a,b,c)=>`<path d="${path(a)} ${path(b)}" fill="${c}" fill-rule="evenodd"/>`;
const rim=(a,b)=>a.map((p,i)=>poly(p,a[(i+1)%a.length],b[(i+1)%b.length],b[i]));
const box=(x,y,w,h,d,front,top,side)=>
 E(`M${x+d} ${y-d}H${x+w}L${x+w+d} ${y}V${y+h-d}L${x+w} ${y+h}H${x+d}Z`,side)+
 E(`M${x} ${y}H${x+w}V${y+h}H${x}Z`,front)+E(`M${x} ${y}L${x+d} ${y-d}H${x+w}V${y}Z`,top);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art,behavior='solid',extra={})=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior,extra});

// The two washing bowls are open troughs: their mouths are not solid colliders.
add('yellow-washbowl','きいろいおけ','plastic',.8,62,
 [poly([8,42],[21,46],[35,94],[29,110],[19,98]),poly([106,46],[120,42],[109,98],[98,110],[92,94]),poly([29,94],[99,94],[98,110],[29,110])],
 E('M10 43L29 31H101L118 43L107 96L98 108H30L21 97Z','#d99a32')+
 P('M14 44L31 36H99L113 44L103 83L95 93H34L26 83Z','#eec65b')+
 P('M24 51L35 43H94L104 51L98 73L90 83H39L31 74Z','#b67e2c')+
 P('M31 57L40 49H89L98 57L94 71L87 78H43L35 71Z','#e8b850')+
 E('M8 42L27 29H101L120 42L107 51H21Z','#f5d576')+
 P('M23 42L33 35H96L107 42L100 46H30Z','#be8f39')+
 P('M26 52L34 55L44 99H35Z','#f8da7e')+P('M96 55L105 51L97 99H89Z','#b57a29')+
 R(46,99,39,4,'#e5b649'));

add('wooden-washbowl','きのおけ','wood',1.2,61,
 [poly([9,34],[22,38],[29,97],[23,110],[15,100]),poly([105,38],[119,34],[114,100],[105,110],[98,97]),poly([23,96],[106,96],[105,110],[23,110])],
 E('M11 35L28 23H101L117 35L112 99L104 108H24L17 99Z','#bd8c51')+
 P('M17 38L29 29H98L111 39L104 82H27Z','#d8b27a')+
 P('M29 41L38 35H89L99 42L95 74H33Z','#91663e')+
 E('M9 34L27 22H101L119 34L108 43H20Z','#edd19a')+
 P('M23 34L32 28H96L106 34L99 38H29Z','#9c723f')+
 [27,45,64,83,101].map((x,i)=>P(`M${x} 46H${x+3}L${x+2-(i-2)*2} 104H${x-(i-2)*2}Z`,'#795938')).join('')+
 P('M15 58L25 64H106L115 58V66L105 72H25L16 66Z',ink)+P('M18 61L27 67H104L112 62V65L104 69H27L18 64Z','#96a6a0')+
 P('M19 89L28 95H104L112 89V97L104 103H27L20 97Z',ink)+P('M23 93L29 98H103L109 94V97L102 100H29L23 96Z','#96a6a0')+
 R(33,48,3,9,'#f0d3a2')+R(70,75,3,13,'#dfbb83'));

// A finite handheld shower uses the same mobile-source reservoir as the fountain.
add('shower-head','シャワー','metal',1.1,67,
 [poly([25,122],[13,117],[39,47],[55,30],[78,24],[90,31],[55,45],[48,56]),poly([70,24],[91,12],[112,18],[122,29],[115,43],[88,48],[70,38])],
 E('M25 120L15 116L41 49L56 32L79 25L88 31L57 43L49 55Z',silver)+
 P('M22 111L43 53L48 48L27 114Z',white)+P('M29 95L32 96L24 119L19 117Z',steel)+
 E('M72 25L91 14L110 19L120 29L114 41L88 46L72 37Z',light)+
 P('M78 25L92 19L107 23L110 27L87 33L77 30Z',white)+
 P('M76 34L88 39L115 32L112 39L88 44L75 37Z',dark)+
 [[87,39],[94,37],[101,35],[109,34]].map(([x,y])=>R(x,y,3,3,ink)).join('')+
 E('M15 111L28 116L26 123L12 118Z',steel),
 'solid',{waterSource:{position:[99,48],rateUnitsPerSecond:1.5,maxUnits:12,speed:-90}});

add('mini-bathtub','ちいさいゆぶね','ceramic',5.4,91,
 [poly([6,43],[20,43],[32,86],[24,101],[15,88]),poly([105,43],[122,43],[113,89],[104,101],[97,87]),poly([24,85],[104,85],[104,101],[24,101]),rect(26,100,12,15),rect(92,100,12,15)],
 E('M27 99H38V114H27Z',steel)+E('M92 99H103V114H92Z',steel)+
 E('M8 44L27 27H103L120 44L112 86L102 99H25L16 87Z',silver)+
 P('M17 51H111L105 81L98 91H32L24 81Z',light)+P('M24 55L31 58L39 87H32L27 80Z',white)+
 E('M6 43L26 25H103L122 43L109 53H18Z',white)+
 P('M22 42L34 32H97L108 42L100 47H30Z',steel)+
 P('M33 40L40 36H91L98 41L94 44H37Z','#b9d3ce')+
 R(98,65,4,15,'#758f9c')+R(39,92,51,3,'#c9d6c9'));

add('shampoo-bottle','シャンプー','plastic',1.2,47,
 [poly([28,46],[40,36],[40,27],[79,27],[79,36],[94,46],[98,111],[88,120],[31,120],[22,111]),rect(47,16,24,20),rect(47,7,56,12),rect(95,11,9,14)],
 E('M28 47L42 37V29H77V37L92 47L96 110L87 118H32L24 110Z','#b56f70')+
 P('M33 50L43 43H75L87 51L90 108L84 112H36L30 106Z','#d6978a')+
 P('M33 52H39L36 105H31Z','#f2c9a3')+P('M84 53L88 56L91 109L86 113H75L79 105Z','#965262')+
 E('M43 28H75V38H43Z',steel)+E('M49 15H69V28H49Z',silver)+
 E('M49 8H96L103 14V24H96V19H49Z',light)+R(54,11,38,3,white)+
 E('M38 65H81V98H38Z',white)+P('M42 70H77V76H42Z','#9aad8b')+
 P('M57 81L66 77L72 81L64 88H59L55 93H51L56 85Z','#6d986f')+R(46,102,30,3,'#b76f71'));

const hatOuter=oct(64,69,59,33),hatInner=oct(64,60,27,15);
add('shampoo-hat','シャンプーハット','rubber',.4,66,rim(hatOuter,hatInner),
 ring(hatOuter,hatInner,ink)+ring(oct(64,69,54,28),oct(64,60,31,18),'#d88c77')+
 ring(oct(64,67,50,25),oct(64,60,32,19),'#f0b18b')+
 [18,31,45,62,79,95,110].map((x,i)=>P(`M${x} ${78+Math.abs(i-3)*-3}L${x+2} ${82+Math.abs(i-3)*-3}L${x+1} ${91-Math.abs(i-3)*4}H${x-2}Z`,'#ba6c64')).join('')+
 ring(oct(64,60,32,19),hatInner,ink)+ring(oct(64,59,30,17),oct(64,59,28,15),'#f8c79a'));

add('water-heater-panel','おふろパネル','appliance',1.1,62,
 [poly([9,36],[21,24],[110,24],[121,35],[121,93],[110,105],[9,105])],
 box(11,36,97,67,11,light,white,'#829da4')+
 E('M21 45H98V78H21Z',steel)+R(26,50,67,23,'#a8bf97')+
 P('M40 54H44V62H51V54H55V70H51V65H40Z',dark)+P('M61 54H73V70H61Z M65 58V66H69V58Z',dark)+
 R(80,54,5,4,dark)+R(80,62,5,6,dark)+
 E('M25 86H41V95H25Z','#7caa98')+E('M49 86H65V95H49Z',white)+E('M73 86H89V95H73Z','#ce9580')+
 R(17,42,3,54,white));

add('water-heater','きゅうとうき','appliance',6.6,65,
 [poly([18,20],[30,8],[96,8],[108,18],[108,104],[96,116],[18,116]),rect(36,114,12,12),rect(72,114,12,12)],
 E('M37 110H47V125H37Z',silver)+E('M73 110H83V125H73Z',silver)+
 box(20,20,74,94,12,'#deded0',white,'#829ba2')+
 E('M31 31H83V57H31Z',dark)+[34,40,46,52].map(y=>R(35,y,44,3,silver)).join('')+
 R(26,25,3,82,white)+R(35,67,44,3,'#b4c3b8')+
 E('M42 78H74V96H42Z',silver)+R(47,82,15,6,'#91b38d')+R(66,82,4,6,'#bd7465')+
 R(47,91,22,2,white)+R(98,35,3,48,'#a2b6b6')+R(39,117,3,6,white));

const hoseRing=(rx,ry)=>Array.from({length:16},(_,i)=>[Math.round(62+rx*Math.cos(i*Math.PI/8)),Math.round(66+ry*Math.sin(i*Math.PI/8))]);
const hoseOuter=hoseRing(49,50),hoseInner=hoseRing(34,35);
add('bath-hose','おふろホース','rubber',1.2,73,
 [...rim(hoseOuter,hoseInner),poly([92,89],[103,86],[113,102],[116,115],[104,119],[100,105]),rect(101,111,21,13)],
 ring(hoseOuter,hoseInner,ink)+ring(hoseRing(45,46),hoseRing(38,39),'#9cbfb7')+
 ring(hoseRing(43,44),hoseRing(41,42),'#e0ead9')+
 E('M94 89L101 89L110 103L114 115L106 118L103 106Z','#b6cfbd')+
 E('M102 111H120V123H102Z',silver)+R(106,114,10,3,white));

add('bath-mat','あしふきマット','cloth',.8,83,
 [poly([5,52],[25,30],[121,30],[121,81],[100,104],[5,104])],
 E('M6 53L26 31H120V81L99 103H6Z','#5e9b9b')+
 P('M12 55L29 37H113V78L96 96H12Z','#a9c9b3')+
 P('M18 57L32 42H106V75L93 88H18Z','#7eb1a4')+
 [49,59,69,79].map((y,i)=>P(`M${26-i*2} ${y}H${104-i*2}V${y+3}H${26-i*2}Z`,'#b9d7bf')).join('')+
 [32,48,64,80,96].map(x=>P(`M${x} 44H${x+3}L${x-6} 87H${x-9}Z`,'#609989')).join('')+
 P('M8 94H95L114 75V81L97 99H8Z','#467b80'),
 'absorb',{capacity:16,wetMassMultiplier:2,releasesWhenSqueezed:false});

add('bath-stool','おふろイス','plastic',1.5,65,
 [poly([12,45],[28,29],[104,29],[118,45],[118,62],[12,62]),poly([15,60],[33,60],[29,112],[12,112]),poly([96,60],[114,60],[119,112],[102,112])],
 E('M19 58H37L30 110H14Z','#70a5af')+E('M94 58H111L117 110H102Z','#4d788e')+
 P('M20 67H27L22 103H18Z','#bbd7cd')+P('M102 68H108L112 103H106Z','#8bb8b8')+
 box(14,46,90,16,12,'#7db1b5','#d0e2cc','#47758b')+
 P('M30 36H96V39H27Z',white)+E('M52 38H75V43H52Z','#527f8d')+
 R(19,51,79,3,'#b9d6c7'));

// A long tapered yam, cut once across the upper end. Fine roots stay decorative.
add('long-yam','ながいも','food',1.1,45,
 [poly([78,5],[99,10],[108,25],[97,42],[73,78],[49,112],[38,123],[25,116],[24,103],[47,66],[65,29])],
 E('M78 7L98 12L106 25L94 43L72 78L48 111L38 121L27 115L26 104L48 67L67 29Z','#bc9563')+
 P('M78 22L91 29L78 52L58 83L38 112L31 111L33 102L53 67Z','#e0c28a')+
 P('M96 28L101 27L90 45L67 82L44 115L38 119L39 110L63 76Z','#916b4b')+
 E('M78 7L98 12L106 25L98 32L81 28L69 19Z','#e7d9b1')+
 P('M80 12L95 16L100 24L96 27L83 24L75 18Z','#fff0cb')+
 [[74,36],[80,44],[67,49],[64,62],[54,68],[53,83],[42,89],[36,104],[62,75],[84,35]].map(([x,y],i)=>R(x,y,2+i%2,3,'#896543')).join('')+
 P('M54 58L45 56L40 60L41 62L46 59L53 62Z','#9c7954')+P('M70 84L78 87L80 92L77 92L75 89L68 88Z','#9c7954')+
 P('M34 96L25 94L20 99L22 101L26 97L33 100Z','#9c7954'));
