// Redrawn against the supplied references. Geometry uses the same 128-unit art space.
const ink='#101623',white='#fff3d8',silver='#b5c8ce',steel='#6e8796',dark='#354a59';
const R=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const P=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const E=(x,y,rx,ry,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`;
const S=(d,c,w=3)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const rect=(...v)=>({rect:v}),poly=(...v)=>({polygon:v}),circle=(...v)=>({circle:v});
const oval=(x,y,rx,ry,n=16)=>Array.from({length:n},(_,i)=>[x+Math.cos(i*Math.PI*2/n)*rx,y+Math.sin(i*Math.PI*2/n)*ry]);
const path=points=>'M'+points.map(p=>p.join(' ')).join('L')+'Z';
const ringShapes=(outer,inner)=>outer.map((p,i)=>poly(p,outer[(i+1)%outer.length],inner[(i+1)%inner.length],inner[i]));
const wheel=(x,y,r)=>E(x,y,r,r,ink)+E(x,y,r-3,r-3,'#424d55')+E(x,y,r-6,r-6,silver)+R(x-2,y-2,4,4,dark);
export const items=[];
const add=(id,name,material,mass,width,fixtures,art,behavior='solid',extra={})=>items.push({id,name,kana:name,material,mass,width,fixtures,art,behavior,extra});

// Pixel-for-pixel palette trace of the user's banana drawing, including the bent stem.
// The rows are authored sprite data; no screenshot, checkerboard or editor UI is shipped.
const bananaRows=[
'................KKKK........',
'............KKKKKGGK........',
'............KGKGGKKK........',
'............KGGKKK..........',
'............KGKK............',
'............KGK.............',
'..........KKKGKKK...........',
'........KKYYKKKYYKK.........',
'.......KYYHHYYYYYYYKK.......',
'......KYHHYYYYYYYYDYYK......',
'.....KYYYYYYYYYYYYYDYK......',
'....KYYYYYYYYYYDYYYDYYK.....',
'...KYHYYYYYYYYYYDYYYDYK.....',
'...KHYYYYYYYYYYYDYYYDYYK....',
'..KYHYYYHYYYHYYYYYKYHDYYK...',
'.KYHYYKYHYYYHYYYHYKKYHYYK...',
'.KHYYKKHYYKYHYKYHYYKYYHYYK..',
'KYHYK.KHYYKYHYKYYHYKKYHYYK..',
'KHYYKKYHYKKYHYKKYHYYKKYHYYK.',
'KYYK.KYHYKKYHYKKYYHYKKYDYYK.',
'KKK..KHYYKKYHYK.KYHYK.KYDDK.',
'.....KHYYK.KHDYKKYDYYK.KKK..',
'....KYDYK..KYDYK.KDYYK......',
'....KDYYK..KYDYK.KYDYK......',
'....KDYYK..KYDYK..KDK.......',
'....KYKK...KYDYK..KKK.......',
'.....K......KYK.............',
'.............K..............'];
const bananaPalette={K:ink,G:'#789e42',Y:'#e8b937',H:'#ffe479',D:'#b8822b'};
let bananaArt='';const bananaShapes=[];const activeRuns=new Map();
for(const [y,row] of bananaRows.entries()){
  for(let x=0;x<row.length;){const c=row[x];let end=x+1;while(end<row.length&&row[end]===c)end++;if(c!=='.')bananaArt+=R(8+x*4,8+y*4,(end-x)*4,4,bananaPalette[c]);x=end;}
  const seen=new Set();
  for(let x=0;x<row.length;){if(row[x]==='.'){x++;continue;}let end=x+1;while(end<row.length&&row[end]!=='.')end++;const key=`${x}:${end}`;seen.add(key);
    if(activeRuns.has(key))activeRuns.get(key).rect[3]+=4;else{const f=rect(8+x*4,8+y*4,(end-x)*4,4);bananaShapes.push(f);activeRuns.set(key,f);}x=end;}
  for(const key of activeRuns.keys())if(!seen.has(key))activeRuns.delete(key);
}
add('banana-bunch','ふさバナナ','food',2.5,74,bananaShapes,bananaArt);

// A triangular wedge: three top vertices, layered cut side and vertical thickness.
add('strawberry-shortcake','ショートケーキ','food',2.1,77,
 [poly([10,69],[98,25],[120,60],[120,103],[10,111]),poly([62,34],[65,18],[78,12],[90,20],[89,34],[78,48])],
 P('M10 69L98 25L120 60V103L10 111Z',ink)+
 P('M15 70L115 62V99L15 106Z','#e1b776')+P('M15 74L115 66V76L15 84Z','#fff0cc')+
 P('M15 86L115 78V86L15 94Z','#d66669')+P('M15 93L115 85V97L15 105Z','#f8e0a7')+
 P('M15 98L115 90V96L15 104Z','#fff3d4')+
 P('M10 69L98 25L120 60L112 69L100 66L90 73L80 70L68 77L58 74L46 81L35 78L21 86L10 81Z',ink)+
 P('M15 70L97 31L114 59L18 77Z','#fff8e5')+P('M15 76L113 62L109 65L100 62L90 69L80 66L68 73L58 70L46 77L35 74L21 81L15 78Z','#e3d4b4')+
 S('M24 69L95 36','#fffdf0',3)+
 `<g transform="translate(0 8)">`+P('M62 34Q61 20 71 14Q85 8 91 21Q94 35 78 49Z',ink)+P('M67 33Q66 23 73 19Q82 15 86 23Q88 32 78 43Z','#d84f5f')+
 P('M65 20L62 11L72 15L77 7L81 15L90 12L88 22L78 19L72 23Z','#517a38')+R(69,25,3,4,'#ffdf9b')+R(80,24,3,3,'#ffdf9b')+R(76,34,3,3,'#ffdf9b')+
 `</g>`+P('M36 88L43 83L48 88L43 92Z','#ffd4aa')+P('M72 84L78 80L83 83L80 87Z','#ffe1b5')+R(21,100,3,2,'#c59050')+R(101,91,3,2,'#bb884f'));
items.at(-1).fixtures[1].polygon=items.at(-1).fixtures[1].polygon.map(([x,y])=>[x,y+8]);

// Irregular, touching fruit pieces: orange rind, pineapple, apricot and wrinkled raisins.
add('dried-fruit-mix','ドライフルーツ','food',1.2,74,
 [poly([8,57],[17,35],[37,25],[55,27],[61,44],[49,62],[27,72],[12,69]),poly([42,18],[61,12],[78,18],[82,32],[68,45],[48,39]),poly([70,42],[87,25],[110,29],[122,46],[116,67],[94,76],[74,62]),poly([31,68],[51,56],[73,64],[83,88],[66,109],[43,115],[25,100]),poly([82,81],[101,72],[117,86],[118,107],[104,119],[83,114],[73,100]),poly([7,88],[20,74],[35,80],[39,98],[28,111],[11,106])],
 P('M8 57Q12 28 39 25Q58 24 61 43Q57 62 26 73L12 69Z',ink)+P('M13 55Q19 31 40 30Q53 29 56 42Q50 58 26 67L16 64Z','#bb632d')+
 P('M19 53Q25 37 42 35L49 42L25 60L19 59Z','#f0bc5a')+S('M27 54L31 43M31 56L43 43','#ffe19b',2)+S('M15 59L20 63L39 57','#f7cf7e',2)+
 P('M42 18Q62 5 77 17L83 30L69 46L49 40Z',ink)+P('M47 21L61 16L74 21L77 29L67 39L52 35Z','#e4ad42')+S('M53 23L63 32L70 25','#f8da7d',3)+R(55,29,3,3,'#bb7b2c')+
 P('M70 43Q87 18 109 28Q125 35 121 53L115 67L93 77L74 63Z',ink)+P('M77 44Q89 26 106 33L116 43L111 61L94 70L80 59Z','#bd7839')+
 P('M84 44Q92 34 104 38L109 45L102 57L90 62L84 56Z','#e9a956')+S('M85 49L91 42M89 56L102 48M101 62L107 54','#995c31',2)+
 P('M31 68Q52 49 70 62L83 86L67 109L44 116L26 101Z',ink)+P('M35 71L51 62L66 68L76 86L62 103L45 110L32 98Z','#d5a04a')+
 P('M42 73L54 67L64 73L69 87L58 98L46 102L38 94Z','#f2cb72')+S('M43 79L61 84M43 89L56 91M49 72L50 98','#b98338',2)+
 P('M82 81Q101 66 115 82L119 105L105 120L84 115L73 101Z',ink)+P('M86 85L99 78L111 87L112 104L102 113L87 109L80 99Z','#634152')+
 S('M86 98L92 85L100 83M95 106L99 94L107 90','#96717a',3)+S('M85 104L90 108M105 105L109 100','#382c3e',2)+
 P('M7 88Q20 69 33 79L40 97L29 112L11 107Z',ink)+P('M13 89L21 81L29 85L33 97L25 105L16 102Z','#753c46')+
 S('M17 92L22 86M21 99L27 93','#b67670',2)+R(20,88,3,3,'#d09a82'));

// One cut half, not an intact bun with an inset window. Keep its world width at 69.
add('chunky-red-bean-bun','つぶあんまん','food',1.5,69,
 [poly([12,72],[20,49],[40,29],[65,21],[92,29],[111,48],[119,73],[117,96],[99,113],[70,121],[39,116],[19,102])],
 P('M12 72Q15 40 42 28Q65 14 92 28Q118 41 120 74L117 96Q106 118 70 123Q36 123 18 103Z',ink)+
 P('M17 73Q21 44 44 33Q66 22 89 33Q110 44 115 73L107 84L29 88Z','#dfd2b3')+
 P('M24 65Q31 42 51 35Q70 29 88 39L100 53L96 65L74 72L43 76Z','#fff0d2')+S('M44 39L56 35M31 53L27 61','#fff8e6',4)+
 P('M15 76Q33 56 65 57Q100 56 117 76L115 94Q103 114 70 119Q34 118 21 101Z','#f5e3bd')+
 P('M22 79Q39 64 65 64Q94 63 110 79L108 92Q97 107 69 112Q40 111 27 98Z','#593739')+
 P('M28 80Q44 69 66 70Q91 69 103 81L101 92Q90 103 68 107Q43 106 32 96Z','#805152')+
 S('M24 78Q40 63 65 63Q94 62 111 78','#fff6dc',3)+
 P('M37 82L44 77L49 81L47 87L40 89Z','#af7b67')+P('M60 78L68 75L73 80L70 85L63 86Z','#ae7767')+
 P('M85 80L93 81L96 87L89 91L83 86Z','#ae7767')+P('M51 95L58 91L65 96L61 101L54 102Z','#b4806f')+R(77,96,5,4,'#be8b75')+S('M23 98Q40 116 68 117','#c5b592',3));
// Preserve the previous 111 x 85 source bounds and the same in-game dimensions.
const cutBun=items.at(-1),bunX=111/108,bunY=85/102;
cutBun.art=`<g transform="matrix(${bunX} 0 0 ${bunY} ${9-12*bunX} ${32-21*bunY})">${cutBun.art}</g>`;
cutBun.fixtures=cutBun.fixtures.map(f=>poly(...f.polygon.map(([x,y])=>[9+(x-12)*bunX,32+(y-21)*bunY])));

add('chocolate-bread','ハンバーグ','food',1.5,76,
 [poly([10,64],[18,46],[39,32],[68,27],[96,34],[114,50],[121,70],[115,92],[96,106],[65,113],[34,108],[15,92])],
 P('M10 64Q14 39 41 31Q76 18 103 37Q123 49 122 74Q120 100 92 109Q52 122 23 104Q7 93 10 64Z',ink)+
 P('M15 67Q18 44 43 36Q75 25 99 41Q116 51 117 72Q116 94 91 103Q53 115 27 99Q13 90 15 67Z','#613825')+
 P('M20 61Q27 42 51 37Q79 31 99 47Q113 57 109 73Q100 92 67 98Q36 98 22 80Z','#a5683e')+
 P('M30 55Q43 40 62 40Q86 40 99 54L94 65L74 72L48 72L32 65Z','#ba8350')+
 P('M24 68Q41 63 56 67L69 61L89 65L105 58L111 68L106 85L97 87L93 101L85 104L83 89L65 94L45 87L32 90L22 79Z','#713f2b')+
 S('M30 70L47 73L60 71M77 69L93 72L102 68','#c58d55',3)+S('M31 51L42 46M52 42L64 41','#e7b477',3)+
 R(28,60,3,2,'#d5a06b')+R(50,56,3,3,'#69442d')+R(71,49,3,2,'#e3b379')+R(90,54,3,3,'#78482e')+R(36,91,3,3,'#cc8f55')+R(65,100,4,2,'#9a6039')+R(104,85,3,3,'#b87949'));

// Black plastic calligraphy ink bottle with a ribbed cap and unbranded paper label.
add('inkstone','すみ','plastic',1.2,63,
 [rect(45,9,39,23),rect(49,32,31,8),poly([35,40],[94,40],[103,52],[102,111],[92,121],[36,121],[27,111],[27,53])],
 P('M45 9H84V32H80V40L94 40L103 52L102 111L92 121H36L27 111V53L35 40H49V32H45Z',ink)+
 R(49,13,31,14,'#bf7635')+R(51,13,3,14,'#edb257')+R(58,13,3,14,'#8c512b')+R(65,13,3,14,'#8c512b')+R(73,13,3,14,'#8c512b')+R(53,32,23,8,'#42525b')+
 P('M39 45H90L98 55V108L89 116H40L32 108V55Z','#263640')+P('M37 56L43 50H50L46 110H40L36 105Z','#4c616a')+P('M88 49L95 56V106L88 113H80L85 103Z','#17222e')+
 P('M45 60H87V104H44Z','#eee0b2')+R(49,65,33,3,'#b84a37')+R(49,96,33,3,'#b84a37')+
 P('M61 73L73 70L74 75L69 78L75 80L74 84L67 84L65 91L60 91L62 84L55 86L54 81L64 79L63 76L57 78L56 74Z',ink)+R(50,107,33,3,'#7f8b83'));

// The blade, its central silver neck and the grip share one axis before rotation.
const rotate=([x,y])=>[64+(x-64)*Math.cos(Math.PI/6)-(y-64)*0.5,64+(x-64)*0.5+(y-64)*Math.cos(Math.PI/6)];
const spatulaParts=[[[56,4],[72,4],[74,11],[73,47],[69,54],[59,54],[55,47],[54,11]],[[60,50],[68,50],[68,79],[60,79]],[[42,77],[86,77],[90,116],[38,116]],[[38,116],[90,116],[88,122],[40,122]]];
const spatulaFixtures=[poly(...spatulaParts[0].map(rotate)),poly(...spatulaParts[1].map(rotate)),
 ...[[42,77,44,8],[38,111,52,11],[41,85,8,26],[57,85,8,26],[73,85,13,26]].map(([x,y,w,h])=>poly(...[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(rotate)))];
add('metal-spatula','フライがえし','metal',1.1,67,spatulaFixtures,
 `<g transform="rotate(30 64 64)">`+P('M60 49H68V80H60Z',ink)+R(62,51,4,28,silver)+R(62,52,2,22,white)+
 P('M56 4H72L75 11L74 46L69 55H59L54 46L53 11Z',ink)+P('M59 9H69L71 14V44L67 50H61L58 44V14Z','#35424b')+R(59,14,3,26,'#64727a')+R(62,11,5,3,ink)+
 `<path d="M42 77H86L91 117L88 123H40L37 117Z M49 85H57V111H49Z M65 85H73V111H65Z" fill="${ink}" fill-rule="evenodd"/>`+
 `<path d="M46 82H82L86 115H42Z M49 85H57V111H49Z M65 85H73V111H65Z" fill="#3e4b55" fill-rule="evenodd"/>`+S('M46 82H81','#84959f',2)+
 `</g>`);

add('open-toolbox','レンチボックス','metal',3.2,79,
 [poly([10,61],[99,47],[122,63],[121,109],[34,124],[10,106]),poly([13,18],[91,7],[106,44],[26,58]),rect(48,3,27,6),rect(48,3,6,14),rect(69,3,6,11)],
 P('M13 18L91 7L106 44L26 58Z',ink)+P('M19 22L87 13L99 41L29 51Z','#3b6791')+P('M25 25L83 18L91 36L33 45Z','#223d56')+S('M30 28L81 21','#628eaf',3)+
 P('M48 17V3H75V14H69V9H54V17Z',ink)+S('M52 12V6H71V10',silver,2)+
 P('M10 61L99 47L122 63L34 82Z',ink)+P('M17 61L98 53L112 62L35 75Z','#7e9aa8')+P('M24 62L96 56L104 62L36 70Z','#182a3b')+
 P('M37 54L46 49L78 57L86 50L97 53L93 58L86 57L83 62L88 66L96 64L100 69L87 74L78 66L44 59L36 62L29 57L31 49L38 47L38 52L34 55Z',ink)+
 P('M39 54L45 52L81 61L86 55L92 55L87 58L85 63L91 69L87 70L80 64L44 56L37 59L33 56L34 52L35 55Z',silver)+S('M47 54L76 61',white,2)+
 P('M10 65L34 81L122 63V109L34 124L10 106Z',ink)+P('M16 72L30 82V116L16 103Z','#254a6b')+P('M36 85L116 69V104L36 118Z','#477fa9')+
 P('M40 89L111 75V83L40 96Z','#75aec9')+P('M40 106L111 93V101L40 114Z','#315f87')+
 P('M65 86L81 83V99L65 102Z',ink)+P('M69 88L77 87V96L69 98Z',silver)+R(19,87,3,13,'#4a7898')+
 P('M25 52L32 51L35 58L28 59Z',steel)+P('M85 42L93 41L96 48L88 49Z',steel));

add('flatbed-dolly','ひらだいしゃ','wood',4,86,
 [poly([8,57],[30,39],[119,39],[119,55],[109,77],[8,77]),circle(26,88,10),circle(97,88,10),circle(112,70,7),rect(18,75,16,10),rect(89,75,16,10)],
 wheel(112,70,7)+R(106,57,12,10,steel)+
 R(18,75,16,10,ink)+R(22,77,8,7,silver)+R(89,75,16,10,ink)+R(93,77,8,7,silver)+wheel(26,88,10)+wheel(97,88,10)+
 P('M8 57L30 39H119V55L109 77H8Z',ink)+P('M14 58L32 44H113L103 59Z','#7899ae')+
 P('M14 63H104V71H14Z','#3f6581')+P('M108 61L114 50V55L108 69Z','#2a485f')+
 P('M23 54L35 46H105L99 54Z','#a9bcc4')+S('M39 48L31 55M65 48L59 55M91 48L86 55','#5c7b8c',2)+R(17,64,85,3,'#648ba6'),
 'wheeled',{wheelFixtures:[1,2,3]});

// A shallow solderless breadboard viewed from above, with paired five-row banks.
add('breadboard','ブレッドボード','plastic',1,72,
 [poly([8,32],[112,14],[121,88],[17,106])],
 P('M8 32L112 14L121 88L17 106Z',ink)+P('M13 35L108 19L116 83L21 100Z','#f0ecdb')+
 P('M21 94L116 78V84L21 100Z','#b0bab8')+P('M13 35L19 35L25 92L21 94Z',white)+
 `<g transform="matrix(1 -.17 .1 1 16 34)">`+
 R(2,2,88,2,'#c65b53')+R(2,7,88,2,'#507fa4')+R(2,54,88,2,'#c65b53')+R(2,59,88,2,'#507fa4')+
 R(2,29,88,5,'#8b9a9b')+R(3,30,86,2,'#5e737f')+
 [0,1,2,3,4,5,6,7,8,9,10,11,12].map(i=>[14,17,20,23,26,37,40,43,46,49].map(y=>R(4+i*6.6,y,2,2,'#3d4e58')).join('')).join('')+
 [0,1,2,3,4,5,6,7,8,9,10,11,12].map(i=>R(4+i*6.6,11,2,2,'#53626a')+R(4+i*6.6,52,2,2,'#53626a')).join('')+`</g>`);

const filmOuter=oval(98,61,24,33),filmInner=oval(98,61,9,17);
const filmSide=[[26,40],[86,30],[79,40],[74,61],[79,80],[87,92],[26,104],[12,97],[5,78],[8,56],[16,44]];
add('film-roll','フィルムロール','plastic',1.9,58,
 [poly(...filmSide),...ringShapes(filmOuter,filmInner)],
 P(path(filmSide),ink)+P('M25 45L79 35L74 49L70 62L75 80L80 89L27 98L17 92L11 77L13 58Z','#76adc3')+
 P('M25 46L78 36L74 45L25 55L16 65L15 57Z','#c1e3e6')+P('M18 82L28 94L77 86L80 90L27 99L17 93L12 78Z','#4e829d')+
 S('M27 60L71 51M27 68L70 60M30 82L73 75','#98cad7',2)+
 `<path d="${path(filmOuter)} ${path(filmInner)}" fill="${ink}" fill-rule="evenodd"/>`+
 `<path d="${path(oval(98,61,20,29))} ${path(oval(98,61,12,20))}" fill="#b8dce2" fill-rule="evenodd"/>`+
 S('M97 35Q83 42 82 60Q82 81 98 87','#eff5e6',2)+S('M102 38Q114 47 114 62Q114 77 104 83','#699daf',2));

// Round bellows with an oval tread plate and a continuous flexible blue hose.
const hoseShapes=[poly([85,71],[94,68],[113,75],[123,90],[121,110],[114,112],[116,92],[108,82],[94,77],[87,79]),poly([114,106],[123,106],[124,120],[111,122],[106,117],[108,112])];
add('bellows-air-pump','あしぶみポンプ','plastic',2.1,79,
 [poly(...oval(51,72,42,32)),poly(...oval(51,44,40,17)),...hoseShapes],
 S('M86 74Q104 69 117 87Q124 97 116 114',ink,10)+S('M86 74Q104 69 117 87Q124 97 116 114','#477fab',5)+
 S('M88 73Q103 71 112 82','#a7cce1',2)+P('M111 109L121 110L124 120L112 123L106 117Z',ink)+P('M112 114L117 113L119 118L112 119Z',steel)+
 E(51,88,43,18,ink)+E(51,86,38,13,dark)+
 P('M10 44Q50 27 92 44V85Q51 112 10 85Z',ink)+
 P('M14 49Q51 65 88 49V59Q51 80 14 59Z','#c8942d')+P('M14 63Q51 80 88 63V73Q51 94 14 73Z','#c8942d')+
 P('M14 78Q51 95 88 78V85Q51 106 14 85Z','#dfb33d')+
 S('M16 52Q51 71 86 52M16 67Q51 86 86 67M17 82Q51 100 85 82','#ffe183',4)+
 E(51,44,42,19,ink)+E(51,43,37,14,'#e3b845')+E(48,40,28,9,'#f6d26c')+
 S('M31 36L41 49M45 33L55 48M59 33L68 46M72 36L78 43','#b18b31',2)+S('M19 42Q23 36 32 34','#fff0a2',2));

// A compact blast furnace: tapered steel vessel, bands, exhaust and glowing tap.
add('mini-smelter','ようこうろ','metal',12,83,
 [poly([39,16],[76,16],[84,36],[97,46],[100,80],[88,105],[30,105],[21,80],[23,46],[34,34]),rect(29,102,62,17),rect(10,115,103,10),rect(97,12,13,71),rect(80,11,28,12),poly([88,79],[111,86],[116,97],[96,96])],
 P('M80 11H110V83H97V24H80Z',ink)+R(101,17,5,61,steel)+R(85,15,18,5,silver)+
 P('M39 16H76L84 36L97 46L100 80L88 105H30L21 80L23 46L34 34Z',ink)+
 P('M43 21H72L79 39L92 49L95 78L84 100H34L26 78L28 49L39 37Z','#536974')+
 P('M40 37L45 23H54L48 42L37 53L35 78L43 99H35L28 77L30 51Z','#8aa1a8')+
 P('M72 24L78 39L90 50L92 77L82 98H71L78 75L77 49L66 38Z','#334753')+
 P('M23 46L40 39H79L97 46V53L79 46H40L23 53Z',ink)+P('M27 47L41 42H78L93 47V49L78 45H41L27 50Z',silver)+
 P('M22 73L39 79H81L99 73V81L83 88H38L22 81Z',ink)+P('M27 77L40 82H80L94 77V80L81 85H39L27 80Z',steel)+
 P('M44 92L51 82H67L75 92V104H44Z',ink)+P('M49 94L54 87H64L70 94V100H49Z','#df6a32')+R(54,93,12,7,'#ffd17a')+
 P('M88 79L111 86L116 97L96 96Z',ink)+P('M91 85L107 89L110 93L98 92Z','#e39845')+
 R(29,103,62,16,ink)+R(34,107,52,8,'#697f88')+R(10,115,103,10,ink)+R(15,118,93,4,'#8da1a5')+
 S('M19 56V108M28 58V110',ink,4)+S('M20 63H27M20 75H27M20 87H27M20 99H27',silver,2)+E(60,19,20,6,ink)+E(60,18,15,3,'#8ca2a9'),
 'stove',{burnerSource:[112,94],burnerWidth:18,fireRadius:18});

// Green rear-loader, showing the loading hopper, hydraulic cylinders and compactor.
add('garbage-truck','パッカーしゃ','metal',8.7,106,
 [poly([4,47],[17,35],[38,35],[46,48],[46,92],[4,92]),poly([35,23],[84,17],[108,29],[108,57],[80,63],[80,91],[35,91]),circle(25,103,12),circle(98,103,12),
 poly([80,32],[89,31],[89,91],[80,91]),poly([112,35],[122,42],[122,94],[112,94]),poly([80,85],[122,89],[123,99],[81,96]),poly([84,57],[114,60],[114,66],[84,63])],
 wheel(25,103,12)+wheel(98,103,12)+R(12,88,105,9,ink)+R(17,90,92,3,steel)+
 P('M4 47L17 35H38L46 48V91H4Z',ink)+P('M9 49L19 40H35L41 50V86H9Z','#5a9a47')+
 P('M12 48L22 42H34L37 59H12Z',ink)+P('M16 49L23 46H31L33 55H16Z','#87b9c3')+R(11,63,25,18,'#6aaf51')+R(28,65,6,3,ink)+R(8,76,6,7,'#f1dc9d')+
 P('M35 23L84 17L112 29L122 42V94L80 99L35 90Z',ink)+
 P('M40 28L82 22L107 32L80 38L40 39Z','#9dc777')+P('M40 43L78 42V91L40 84Z','#5b9c48')+
 P('M44 48L73 46V74L44 71Z','#70ad53')+S('M47 50L70 49M45 78L72 81','#a0ca79',2)+
 P('M81 37L109 32L117 43V89L82 94Z','#49873d')+P('M86 42L106 38L112 45V57L86 57Z','#72ae50')+
 P('M84 62L114 65V84L84 81Z',ink)+P('M88 66L110 69V79L88 77Z','#243a32')+
 P('M84 77L112 81L115 88L85 85Z','#477d38')+S('M88 80L110 83','#a0bd7d',2)+
 R(81,45,5,34,ink)+R(82,47,2,27,silver)+R(115,49,5,36,ink)+R(116,51,2,29,silver)+
 P('M84 86L119 90L119 95L84 91Z','#94b16b')+P('M83 33L89 32L89 39L83 40Z',steel)+
 E(112,44,3,3,'#d75b47')+E(112,52,3,3,'#f1bb56')+R(91,44,13,8,ink)+R(94,46,7,4,'#e7e3cb')+
 P('M88 58L108 60V64L88 62Z','#e2c448')+P('M91 58L95 59L91 62L88 61ZM101 60L105 60L101 63L97 63Z','#d65e3f')+
 S('M46 27L46 37M73 24L73 36','#d1e0a7',2),
 'wheeled',{wheelFixtures:[2,3]});

add('thinking-face','かんがえるかお','plastic',1.3,66,
 [circle(62,58,52),poly([56,88],[69,83],[82,72],[91,75],[89,84],[78,96],[101,99],[110,110],[102,123],[78,125],[58,116],[50,102])],
 E(62,58,54,54,ink)+E(62,58,50,50,'#e7b13b')+E(58,51,43,43,'#f4ca54')+
 P('M29 27Q43 10 61 13Q78 13 88 23L81 27Q55 17 34 34Z','#ffe48b')+
 S('M30 43Q39 38 48 42',ink,4)+S('M71 32Q81 26 91 30',ink,4)+
 E(42,54,5,7,ink)+E(81,48,5,7,ink)+R(40,51,2,2,white)+R(79,45,2,2,white)+
 S('M53 78Q66 71 77 76',ink,4)+
 `<g transform="translate(-18 -8)">`+P('M56 88L66 85L79 73Q88 67 92 75Q94 81 86 88L78 96L99 96L110 105L112 114L104 123L79 127L61 119L51 105L51 96Z',ink)+
 P('M58 93L69 90L82 77Q87 73 87 78L73 94L69 100L96 101L104 107L106 113L101 118L80 122L65 115L57 104Z','#f4900c')+
 S('M64 97L68 105L78 109M77 103L97 106M77 110L99 112','#bd6208',3)+S('M61 94L68 93L82 80','#ffbd59',3)+S('M83 118L97 116','#ffac3d',2)+`</g>`);
items.at(-1).fixtures[1].polygon=items.at(-1).fixtures[1].polygon.map(([x,y])=>[x-18,y-8]);
