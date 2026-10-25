// Individually authored 128-unit props; no I/O and no search-index generation.
const ink='#101623',cream='#f3e9ca',light='#d6e1da',steel='#9aafb9',shade='#506775';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v});
const oct=(x,y,rx,ry)=>[[x-rx/2,y-ry],[x+rx/2,y-ry],[x+rx,y-ry/2],[x+rx,y+ry/2],[x+rx/2,y+ry],[x-rx/2,y+ry],[x-rx,y+ry/2],[x-rx,y-ry/2]];
const pathOf=points=>'M'+points.map(point=>point.join(' ')).join('L')+'Z';
const O=(x,y,rx,ry,c)=>P(pathOf(oct(x,y,rx,ry)),c);
const ring=(outer,inner,c)=>`<path d="${pathOf(outer)} ${pathOf(inner)}" fill="${c}" fill-rule="evenodd"/>`;
const ringFixtures=(outer,inner)=>outer.map((point,i)=>poly(point,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i]));
export const items=[];
const add=(id,name,material,mass,width,fixtures,art)=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior:'solid',extra:{}});

// A packed straw cylinder, closed at both ends and tied with two rope bands.
const bale=[[25,30],[102,30],[118,44],[124,66],[118,89],[103,103],[25,103],[9,89],[4,67],[9,45]];
add('rice-bale','こめだわら','plant',5.5,85,
 [poly(...bale)],
 P(pathOf(bale),ink)+P('M28 35H100L113 48L118 66L113 86L100 97H27L14 85L10 67L15 48Z','#b9974d')+
 P('M32 37H98L108 46H34Z','#e2c47b')+P('M33 47H111L115 61H35Z','#cfad62')+
 P('M33 72H116L110 87L100 96H31Z','#91743c')+
 [43,54,66,78,89].map((y,i)=>R(35,y,18+(i%2)*9,2,i<3?'#f0d793':'#c7a965')+R(70,y+2,18,2,'#745d36')+R(91,y,15,2,'#dfc584')).join('')+
 P('M49 32H57L61 47V86L56 102H48L53 86V48Z',ink)+P('M51 36H54L57 49V86L53 98H51L55 85V49Z','#d8c58d')+
 P('M86 31H94L99 47V86L94 102H86L91 86V48Z',ink)+P('M89 35H92L95 49V85L91 98H89L93 85V49Z','#d8c58d')+
 O(26,66,21,35,ink)+O(26,66,16,29,'#c9a965')+O(26,66,12,23,'#e0c382')+O(26,66,7,14,'#ac874d')+
 P('M16 46L20 43L33 83L31 88Z','#8c713d')+P('M35 45L38 51L17 86L14 80Z','#a08346')+
 R(22,58,9,16,'#d6b878')+R(25,61,3,10,'#8d7341')+R(43,58,5,10,'#dfc484')+R(80,62,5,10,'#d4b875'));

// One rigid bent straw. Corrugated folds and alternating stripes follow its
// real elbow; there is no loose joint or liquid-emitting behavior.
const strawOutline=[[31,120],[50,39],[100,9],[107,20],[62,48],[43,123]];
add('straw','ストロー','plastic',0.12,31,
 [poly(...strawOutline)],
 P(pathOf(strawOutline),ink)+P('M36 117L54 42L99 15L101 18L58 45L40 119Z',cream)+
 P('M38 105L44 107L42 115L36 113Z','#c95056')+P('M42 88L48 90L46 98L40 96Z','#c95056')+
 P('M46 71L52 73L50 81L44 79Z','#c95056')+P('M50 54L56 56L54 64L48 62Z','#c95056')+
 P('M72 31L76 28L80 34L76 36Z','#c95056')+P('M87 22L91 19L95 25L91 27Z','#c95056')+
 P('M52 42L54 39L60 46L58 48Z','#9b5b61')+P('M57 38L59 36L65 42L63 44Z','#b36b6b')+
 P('M62 35L64 33L70 39L68 41Z','#b36b6b')+P('M35 118L40 120L39 122L34 120Z','#9c9f96'));

// A small, unbranded broadcasting building. The roof antenna is real geometry.
const stationFront=[[9,52],[98,52],[98,119],[9,119]];
const stationSide=[[98,52],[120,42],[120,108],[98,119]];
const stationRoof=[[9,52],[31,42],[120,42],[98,52]];
add('tv-station','てれびきょく','stone',8.5,101,
 [poly(...stationFront),poly(...stationSide),poly(...stationRoof),rect(77,5,7,37),rect(60,13,42,6),rect(65,26,34,6),rect(60,8,5,16),rect(97,8,5,16)],
 R(77,5,7,37,ink)+R(60,13,42,6,ink)+R(65,26,34,6,ink)+R(60,8,5,16,ink)+R(97,8,5,16,ink)+
 R(79,8,3,34,steel)+R(63,15,36,2,light)+R(68,28,28,2,steel)+R(62,10,2,11,steel)+R(99,10,2,11,steel)+
 P(pathOf(stationSide),ink)+P('M103 55L115 49V105L103 111Z','#668294')+
 P('M106 61L112 58V70L106 73Z','#a6c7cc')+P('M106 81L112 78V90L106 93Z','#a6c7cc')+
 P(pathOf(stationFront),ink)+R(14,57,79,57,'#adbcb9')+R(14,57,79,5,'#dae0cc')+
 [20,46,72].map(x=>R(x,69,16,18,ink)+R(x+3,72,10,12,'#83b5c6')+R(x+3,72,3,12,'#d0e1d6')).join('')+
 R(20,94,16,14,ink)+R(23,97,10,8,'#84b3c3')+R(72,94,16,14,ink)+R(75,97,10,8,'#84b3c3')+
 R(45,92,18,22,ink)+R(49,96,10,18,'#7096aa')+R(53,96,2,18,'#bfd2cc')+
 P(pathOf(stationRoof),ink)+P('M30 46H108L97 49H21Z','#e1dec4')+
 R(37,36,27,17,ink)+R(41,40,19,9,'#579795')+P('M48 41L55 44L48 47Z','#e7e5c7'));

// A thick dashboard navigator, shown from above and to one side. Its display
// is a static, brand-free road diagram rather than a simulated map service.
const navigationFront=[[8,35],[14,28],[102,28],[109,35],[109,90],[102,98],[15,98],[8,90]];
const navigationBack=[[14,28],[27,17],[115,17],[124,27],[124,82],[109,95],[109,35],[102,28]];
add('car-navigation','カーナビ','appliance',2.2,65,
 [poly(...navigationFront),poly(...navigationBack)],
 P(pathOf(navigationBack),ink)+P('M29 21H113L118 27L109 33L104 24H25Z','#738791')+
 P('M114 35L120 30V80L114 86Z','#314654')+R(117,42,2,20,steel)+
 P(pathOf(navigationFront),ink)+P('M17 33H99L104 38V87L99 93H18L13 87V39Z','#3f5260')+
 R(19,38,78,46,ink)+R(23,42,70,38,'#d6d6ad')+
 P('M24 44H42L45 54L39 61L41 79H24Z','#a6c7c1')+P('M27 43H34L39 54L34 62L36 79H29L27 64L32 54Z','#5e9dae')+
 R(49,43,6,36,'#f3edcf')+R(24,55,68,6,'#f3edcf')+R(72,43,6,36,'#f3edcf')+
 P('M55 79V65H81V61H59V43H55V61H51V79Z','#b97b45')+
 P('M62 70L69 61L76 70L69 67Z','#c64b4d')+R(43,46,4,5,'#8caa75')+R(81,66,7,8,'#a3b984')+
 R(44,88,28,2,steel)+R(85,87,7,4,'#adc6bd')+R(21,87,6,4,'#80aca1'));

// A green Y peeler: open fork below the blade, plus a true hanging hole at the
// handle end. The blade and arms remain a single ordinary kitchen tool.
const peelerLeft=[[20,15],[31,15],[34,44],[59,66],[59,76],[49,76],[24,52]];
const peelerRight=[[97,15],[108,15],[104,52],[79,76],[69,76],[69,66],[94,44]];
const peelerHandle=oct(64,96,14,27),peelerHole=oct(64,108,5,7);
add('green-peeler','ピーラー','plastic',0.65,47,
 [poly(...peelerLeft),poly(...peelerRight),rect(31,21,66,11),...ringFixtures(peelerHandle,peelerHole)],
 P(pathOf(peelerLeft),ink)+P(pathOf(peelerRight),ink)+
 P('M24 20H28L31 46L55 68V71H52L28 49Z','#5d9d64')+
 P('M100 20H104L100 49L76 71H73V68L97 46Z','#4b8253')+
 P('M24 21H26L29 47L52 68L50 68L27 49Z','#a1ce86')+
 R(31,21,66,11,ink)+R(35,24,58,5,steel)+R(37,24,54,2,light)+R(40,28,48,2,shade)+
 ring(peelerHandle,peelerHole,ink)+ring(oct(64,96,10,23),oct(64,108,7,9),'#4e925b')+
 P('M60 75H64V94L60 98L57 97V84Z','#94c77b')+P('M69 77L71 84V96L68 98L67 94V77Z','#347348')+
 P('M55 111L59 117H69L72 111L74 113L70 120H58L53 113Z','#79b169'));
