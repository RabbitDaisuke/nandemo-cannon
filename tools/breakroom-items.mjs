// Individually authored 16-bit SVG props. Search tags are maintained by hand.
const ink='#151c29',cream='#f2e9cf',light='#d6e1db',silver='#9bafb5',steel='#607988',dark='#344b5d';
const red='#bd5351',orange='#db8d4f',green='#628b72',blue='#598fa9',gold='#e3bc65';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v});
const path=p=>'M'+p.map(v=>v.join(' ')).join('L')+'Z';
const oct=(x,y,rx,ry=rx)=>[[x-rx/2,y-ry],[x+rx/2,y-ry],[x+rx,y-ry/2],[x+rx,y+ry/2],[x+rx/2,y+ry],[x-rx/2,y+ry],[x-rx,y+ry/2],[x-rx,y-ry/2]];
const O=(x,y,rx,ry,c)=>P(path(oct(x,y,rx,ry)),c);
const box=(x,y,w,h,c)=>R(x,y,w,h,ink)+R(x+3,y+3,w-6,h-6,c);
const ring=(outer,inner,c)=>`<path d="${path(outer)} ${path(inner)}" fill="${c}" fill-rule="evenodd"/>`;
const rim=(outer,inner)=>outer.map((p,i)=>poly(p,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i]));
const wheel=(x,y,r)=>O(x,y,r,r,ink)+O(x,y,r-4,r-4,dark)+O(x,y,5,5,silver)+R(x-2,y-3,3,3,cream);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art,behavior='solid',extra={})=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior,extra});

add('bench-seat','ながいす','wood',6,112,
 [poly([8,41],[104,32],[116,39],[116,69],[8,77]),poly([4,76],[104,66],[124,79],[124,92],[22,104],[4,91]),rect(16,95,9,23),rect(104,91,9,25)],
 box(16,95,9,23,steel)+box(104,91,9,25,steel)+
 P('M8 41L104 32L116 39V69L8 77Z',ink)+P('M13 45L104 37L111 42V65L13 72Z','#648477')+
 P('M14 45L104 37L109 41L16 49Z','#91b397')+P('M13 64L111 56V65L13 72Z','#44675e')+
 P('M17 50L103 43V46L17 53Z','#aac8a7')+P('M43 44L46 44V68L43 69Z','#38594e')+P('M79 40L82 40V65L79 65Z','#38594e')+
 P('M4 76L104 66L124 79V92L22 104L4 91Z',ink)+P('M11 78L103 71L117 79L22 90Z','#84a48c')+
 P('M23 93L119 83V88L23 99Z','#496e62')+P('M9 82L19 91V97L9 89Z','#698a75')+
 P('M17 78L103 72L110 76L24 85Z','#9dbaa0')+P('M49 76L52 76L65 85L62 86Z','#648777')+
 P('M85 73L88 73L101 81L98 82Z','#648777')+R(19,105,3,9,light)+R(107,100,3,10,silver));

add('vending-machine','じどうはんばいき','appliance',12,82,
 [poly([15,15],[99,7],[118,20],[118,116],[98,124],[15,124])],
 P('M15 15L99 7L118 20V116L98 124H15Z',ink)+P('M21 20H96V118H21Z','#b64f4c')+
 P('M23 16L98 11L111 20H28Z','#e49070')+P('M101 25L113 22V112L101 117Z','#7c3c43')+
 box(26,26,63,64,'#a9c2bd')+R(31,31,53,53,dark)+R(33,31,4,51,'#718d95')+
 [33,50,67].map((y,row)=>[40,55,70].map((x,col)=>R(x,y,9,12,ink)+R(x+2,y+2,5,8,[cream,orange,green][(row+col)%3])+R(x+2,y+3,5,2,light)+R(x+1,y+12,7,3,'#b3cfaf')).join('')).join('')+
 R(31,47,53,3,silver)+R(31,64,53,3,silver)+R(31,81,53,3,light)+
 box(28,96,46,17,dark)+R(32,100,38,5,'#72898b')+R(35,108,32,2,ink)+
 R(79,94,10,8,ink)+R(81,96,6,3,gold)+R(80,107,8,4,ink)+R(28,20,60,3,'#ecc3a0')+
 R(24,120,13,4,ink)+R(80,120,13,4,ink)+R(105,33,4,48,'#994d4c'));

const jacket=[[41,14],[54,10],[74,10],[88,15],[105,28],[120,77],[103,86],[92,57],[96,116],[67,121],[62,116],[36,120],[37,58],[26,85],[8,77],[24,28]];
add('suit-jacket','スーツ','cloth',1.7,75,[poly(...jacket)],
 P(path(jacket),ink)+P('M42 19L53 15H74L86 20L100 31L114 74L106 79L87 40L90 111L69 115L63 109L41 114L43 39L23 79L14 74L29 31Z','#455a70')+
 P('M53 15H74L76 34L64 68L51 34Z',cream)+P('M55 16L64 26L72 16L69 34H59Z',light)+
 P('M62 28H66L69 49L64 57L60 49Z','#a45554')+P('M44 19L53 15L61 54L53 45L46 46L50 34L42 29Z','#80929d')+
 P('M75 15L86 20L86 30L79 36L82 46L74 45L64 65Z','#708493')+
 P('M42 54L48 52L47 107L41 111Z','#33445c')+P('M84 57L87 61L90 110L69 114L65 108L69 81Z','#33445c')+
 R(49,81,14,4,ink)+R(73,79,12,4,ink)+R(65,72,3,3,gold)+R(65,85,3,3,gold)+
 P('M23 68L28 71L24 79L17 76Z','#718797')+P('M104 68L111 70L114 75L106 78Z','#718797')+
 R(79,48,9,3,light));

add('necktie','ネクタイ','cloth',.3,32,
 [poly([48,7],[75,12],[80,25],[68,37],[79,106],[61,123],[44,104],[55,35],[44,23])],
 P('M48 7L75 12L80 25L68 37L79 106L61 123L44 104L55 35L44 23Z',ink)+
 P('M52 12L72 16L75 24L64 33L58 32L49 22Z','#b76062')+P('M59 37H64L74 104L61 117L49 102Z','#934c58')+
 P('M53 67L68 58L70 69L51 80Z','#d9b979')+P('M49 95L72 80L74 90L51 107L48 103Z','#d9b979')+
 P('M60 38H63L66 56L57 62Z','#c07779')+P('M52 15L56 15L62 27L58 29L51 21Z','#e0a394')+
 P('M69 75L71 74L75 103L62 116L62 109L70 102Z','#653e50'));

add('onion','たまねぎ','food',.6,49,
 [poly([52,9],[64,6],[72,16],[72,27],[93,38],[106,58],[107,83],[96,103],[76,116],[52,116],[30,105],[19,86],[19,62],[30,43],[49,28])],
 P('M52 9L64 6L72 16V27L93 38L106 58L107 83L96 103L76 116H52L30 105L19 86V62L30 43L49 28Z',ink)+
 P('M55 12L62 11L66 18L65 30L87 43L100 61V82L91 99L74 110H53L35 100L25 84V64L35 47L54 32Z','#c58e4b')+
 P('M54 36L60 31L57 48L46 65L43 87L51 103L41 99L32 84V66L41 48Z','#f0ca81')+
 P('M64 35L69 38L75 59L79 84L74 105L67 110L70 88L68 62Z','#e2ad60')+
 P('M79 42L88 49L96 65L95 84L85 101L78 106L87 84L86 65Z','#a66e3b')+
 P('M49 48L51 45L45 72L48 93L44 90L41 72Z','#b37d43')+
 P('M58 13L61 13L62 29L56 32Z','#e8c785')+P('M56 112H76L72 118L80 122L78 124L68 119L64 124L61 119L53 123L50 121L58 117Z','#a77a4d'));

// The supplied sketch's open grid and long handle are real collision geometry.
const project=(u,v)=>[28+84*u-12*v,10+10*u+56*v];
const panel=(u,v,w,h)=>[project(u,v),project(u+w,v),project(u+w,v+h),project(u,v+h)];
const swatterGrid=[panel(0,0,1,.07),panel(0,.93,1,.07),panel(0,0,.065,1),panel(.935,0,.065,1),
 ...[.25,.5,.75].map(u=>panel(u-.022,.065,.044,.87)),...[.25,.5,.75].map(v=>panel(.065,v-.026,.87,.052))];
add('fly-swatter','むしたたき','plastic',.35,59,
 [...swatterGrid.map(p=>poly(...p)),poly([55,69],[65,70],[46,123],[33,119],[33,112],[40,113])],
 P('M55 69L65 70L46 123L33 119V112L40 113Z',ink)+P('M57 73L60 74L43 118L38 116L42 116Z','#9d9db4')+
 swatterGrid.map((p,i)=>P(path(p),i<4?ink:'#f0e9d8')).join('')+
 P(path(panel(.016,.018,.965,.025)),'#b4bec5')+P(path(panel(.955,.08,.025,.82)),'#718da0')+
 P(path(panel(.08,.955,.81,.025)),'#9cb5be')+
 P('M55 76L58 77L46 109L43 108Z','#d1d2d0'));

const makerHandleOuter=oct(101,78,19,24),makerHandleInner=oct(101,78,10,14);
add('coffee-maker','コーヒーメーカー','appliance',4.2,76,
 [rect(18,13,69,25),rect(18,38,16,69),rect(13,107,95,13),poly([38,37],[87,37],[82,54],[43,54]),
  poly([43,63],[83,63],[91,94],[83,104],[40,104],[34,95]),...rim(makerHandleOuter,makerHandleInner)],
 ring(makerHandleOuter,makerHandleInner,ink)+ring(oct(101,78,16,21),oct(101,78,12,16),dark)+
 box(18,13,69,25,dark)+P('M23 17H81V22H23Z',silver)+R(21,39,12,68,ink)+R(24,41,7,63,steel)+
 P('M38 37H87L82 54H43Z',ink)+P('M43 40H82L78 49H47Z',silver)+R(58,53,11,9,ink)+
 P('M43 63H83L91 94L83 104H40L34 95Z',ink)+P('M47 67H79L85 94L80 99H43L40 94Z','#9bb6b7')+
 P('M43 81H82L85 94L80 99H43L40 94Z','#68483c')+R(43,80,39,3,'#977258')+
 P('M47 69H52L48 92H44Z','#e0e5d2')+R(41,59,44,7,ink)+R(45,61,36,2,steel)+
 box(13,107,95,13,dark)+R(18,110,65,3,silver)+R(89,111,9,4,'#86b590')+R(76,27,6,5,'#abceaa'));

add('chicken-lemon','からあげレモン','food',1.6,83,[poly(...oct(64,88,59,28)),poly([14,68],[23,45],[49,40],[69,34],[93,42],[108,65],[107,87],[24,97])],
 O(64,88,59,28,ink)+O(64,86,54,23,'#b8c4c1')+O(64,82,50,19,cream)+O(64,84,41,13,'#d3d2b9')+
 [[35,66,21,22],[65,54,22,20],[83,76,24,22],[43,83,20,17]].map(([x,y,rx,ry],i)=>
 P(`M${x-rx} ${y-8}L${x-14} ${y-ry}L${x-3} ${y-ry+3}L${x+8} ${y-ry-2}L${x+rx} ${y-6}V${y+7}L${x+rx-9} ${y+ry}L${x-6} ${y+ry-1}L${x-rx} ${y+7}Z`,ink)+
 O(x,y,rx-4,ry-4,'#b57a3c')+P(`M${x-14} ${y-7}L${x-7} ${y-ry+6}H${x+7}L${x+12} ${y-5}L${x+4} ${y-2}L${x-4} ${y+4}L${x-13} ${y}Z`,'#e2b366')+
 R(x+5,y+7,5,4,'#85562e')+R(x-8,y-8,4,4,'#f4d08b')+R(x-5,y+9,5,3,'#d89a4e')+R(x+10,y-4,3,4,'#9d632f')).join('')+
 P('M92 47L116 62L111 77L98 83L84 79L79 69Z',ink)+P('M94 52L111 64L107 73L98 78L88 75L84 69Z','#e9c34d')+
 P('M94 55L107 64L104 70L98 74L89 72L88 68Z','#f8e7a1')+
 P('M94 55L97 73H95L92 56Z','#fff4ca')+P('M94 55L105 68L103 70L92 57Z','#fff4ca'));

const blowerHandle=[[21,22],[37,12],[64,18],[72,33],[65,45],[53,40],[58,32],[56,28],[39,23],[29,31]];
add('leaf-blower','ブロワー','appliance',3.8,96,
 [poly(...blowerHandle),poly([11,47],[27,32],[56,38],[75,61],[74,84],[50,101],[22,94],[7,72]),poly([68,63],[85,67],[124,102],[118,116],[75,88])],
 P(path(blowerHandle),ink)+P('M26 24L38 17L61 22L67 33L63 39L59 36L62 31L58 24L39 20L28 28Z',steel)+
 P('M68 63L85 67L124 102L118 116L75 88Z',ink)+P('M78 70L83 72L119 104L116 110L79 84Z',dark)+P('M82 72L118 103L116 105L80 76Z',steel)+
 P('M11 47L27 32L56 38L75 61L74 84L50 101L22 94L7 72Z',ink)+P('M16 50L29 38L53 43L69 63V81L48 95L26 89L13 70Z',orange)+
 P('M20 49L30 41L49 44L56 52L45 55Z','#efb775')+P('M16 72L26 85L47 91L64 80L65 85L49 96L25 90Z','#ad6440')+
 O(40,68,23,23,ink)+O(40,68,18,18,dark)+O(40,68,12,12,steel)+O(40,68,6,6,ink)+
 [27,34,41,48].map(x=>R(x,54,3,28,ink)).join('')+R(25,62,31,3,ink)+R(25,72,31,3,ink)+
 R(61,55,6,4,cream)+R(57,83,6,3,gold));

// Wheels alone have low rolling friction. The handle and deck stay solid.
add('push-mower','しばかりき','metal',8.5,103,
 [poly([31,77],[91,66],[118,80],[115,99],[33,107],[22,95]),poly([7,9],[20,9],[59,78],[51,84],[15,19],[7,19]),
  poly([58,70],[58,40],[89,36],[104,47],[103,74]),{circle:[39,104,16]},{circle:[105,95,13]}],
 P('M7 9H20L59 78L51 84L15 19H7Z',ink)+P('M11 13H18L55 78L53 79L16 16H11Z',silver)+
 P('M31 77L91 66L118 80L115 99L33 107L22 95Z',ink)+P('M35 80L90 71L111 81L110 94L36 101L28 93Z',red)+
 P('M37 80L90 73L105 80L45 89L30 88Z','#e29073')+P('M45 93L109 84V94L44 102Z','#943f49')+
 P('M58 70V40L89 36L104 47L103 74Z',ink)+P('M63 43L88 41L98 49L75 53Z',silver)+
 P('M63 47L73 57V72L63 70Z',steel)+P('M77 57L99 52V70L77 74Z',dark)+
 [59,65].map(y=>R(81,y,14,3,ink)).join('')+box(72,33,14,9,dark)+
 wheel(39,104,16)+wheel(105,95,13)+R(31,91,6,3,cream)+R(94,82,5,3,cream),
 'wheeled',{wheelFixtures:[3,4]});

// Static fictional timer display and decorative coloured wires; the countdown
// is a data-driven game fuse, not a simulated electrical circuit.
const segments={0:[0,1,2,3,4,5],5:[0,5,6,2,3]};
const digit=(x,y,n)=>[[0,0,7,2],[5,2,2,5],[5,8,2,5],[0,13,7,2],[0,8,2,5],[0,2,2,5],[0,6,7,2]].map((v,i)=>segments[n].includes(i)?R(x+v[0],y+v[1],v[2],v[3],'#e58b70'):'').join('');
add('timed-bomb','じげんばくだん','metal',3.4,65,
 [poly([15,34],[97,26],[116,41],[116,106],[95,118],[15,118]),poly([33,34],[31,20],[39,12],[78,12],[88,21],[88,30],[81,30],[81,23],[76,19],[42,19],[38,23],[40,34])],
 P('M33 34L31 20L39 12H78L88 21V30H81V23L76 19H42L38 23L40 34Z',ink)+
 P('M35 32V21L40 16H77L84 23V29H82V24L76 18H41L37 23V32Z',red)+
 P('M15 34L97 26L116 41V106L95 118H15Z',ink)+P('M21 39H94V112H21Z','#a18e55')+
 P('M24 35L96 31L108 40H29Z','#d7c48b')+P('M99 46L111 43V103L99 110Z','#736948')+
 box(28,45,59,27,dark)+digit(34,51,0)+digit(44,51,0)+R(55,55,2,2,'#e58b70')+R(55,61,2,2,'#e58b70')+digit(61,51,0)+digit(71,51,5)+
 P('M30 76H38V87L48 96H55V103H46L32 90V80H30Z',ink)+P('M33 77H35V88L48 99H53V101H47L33 89Z',red)+
 P('M50 76H57V86H70V103H63V91H50Z',ink)+P('M53 77H55V88H67V101H65V90H53Z','#7eb17c')+
 P('M74 76H81V82H89V99H82V87H74Z',ink)+P('M77 77H79V84H86V97H84V86H77Z','#6da6c8')+
 R(24,108,17,4,ink)+R(68,108,20,4,ink)+R(25,41,3,3,cream)+R(88,104,3,3,cream),
 'explosion',{fuseRangeSeconds:[4,6],detonateOnImpact:false});

add('wood-stamp','ハンコ','wood',.6,43,
 [poly([46,8],[77,8],[86,17],[86,32],[75,43],[74,72],[85,84],[44,84],[55,72],[54,43],[39,32],[39,17]),poly([26,83],[87,77],[107,91],[107,108],[45,120],[26,107])],
 P('M46 8H77L86 17V32L75 43L74 72L85 84H44L55 72L54 43L39 32V17Z',ink)+
 P('M49 13H75L81 20V29L70 40L69 73L75 81H53L60 73L59 40L44 29V20Z','#ad7449')+
 P('M50 14H73L77 19H49Z','#ecc68d')+P('M48 22H53V29L64 40V71L60 76L62 39L48 29Z','#d8a56b')+
 P('M26 83L87 77L107 91V108L45 120L26 107Z',ink)+P('M32 86L86 82L99 91L46 101Z','#bd9264')+
 P('M33 94L43 102V113L32 104Z',dark)+P('M48 105L102 96V105L48 114Z','#4c535c')+P('M48 111L100 103V106L48 115Z','#8c5756'));

add('ventilation-fan','かんきせん','appliance',4,77,
 [poly([12,22],[105,14],[119,26],[119,109],[103,121],[12,121])],
 P('M12 22L105 14L119 26V109L103 121H12Z',ink)+P('M18 27H101V115H18Z','#d9ded0')+
 P('M24 22L104 19L112 25H29Z',cream)+P('M106 31L114 29V106L106 113Z','#8ea4a8')+
 O(59,70,37,39,ink)+O(59,70,32,34,'#788d92')+O(59,70,28,30,dark)+
 P('M57 64L46 59L40 44L45 39L57 42L64 54L63 63Z','#d4ddcf')+
 P('M65 64L70 53L84 47L89 53L86 66L74 73L65 72Z','#a6bdbb')+
 P('M65 76L76 81L81 96L75 101L63 98L56 86L57 77Z','#c9d5c9')+
 P('M53 76L48 87L34 91L29 85L33 73L45 66L54 68Z','#95afae')+
 O(59,70,10,10,ink)+O(59,70,6,6,silver)+R(57,66,4,3,cream)+
 R(23,31,5,4,steel)+R(91,31,5,4,steel)+R(23,105,5,4,steel)+R(91,105,5,4,steel)+
 R(20,29,76,2,cream)+R(19,112,80,2,'#b3c1b5'));
