import * as T from 'three';
import {V,C,clamp,mix,interp,group,mesh,ellipsoid,surface,rings,sweep,curve,patch,xyShape} from './geometry.js';

const shirtKeys=[
 [3.69,.575,.295,-.044,.024],[3.78,.586,.316,-.037,.013],[4.00,.525,.302,-.029,.003],[4.29,.477,.272,-.022,-.012],[4.56,.486,.289,-.011,-.002],[4.85,.526,.324,0,.017],[5.12,.544,.330,.005,.010],[5.37,.596,.273,0,-.011],[5.51,.542,.239,0,-.018],[5.62,.302,.184,0,-.019]
];
function shirtZ(x,y){
 const [rx,rz,cx,cz]=interp(shirtKeys,clamp(y,3.69,5.62));
 return cz+rz*Math.sqrt(Math.max(.028,1-((x-cx)/Math.max(.1,rx))**2));
}
function shirt(parent,M){
 // Continuous torso, covered by loose tailored pajama shirt.
 rings(parent,[[3.70,.36,.18,-.02,0],[4.30,.40,.24,0,0],[4.76,.42,.25,0,0],[5.22,.48,.24,0,0],[5.45,.44,.205,0,0],[5.61,.21,.154,0,0],[5.75,.145,.141,-.025,.012]],M.skin,{name:'Covered upper body'});
 sweep(parent,[[-.026,5.46,.025],[-.027,5.65,.027],[-.027,5.87,.023]],[[0,.205,.17],[.32,.144,.145],[.74,.142,.142],[1,.169,.145]],M.skin,{name:'Neck'});
 // Front neckline is cut directly into the garment surface, not painted over.
 const frontY=(ang)=>{const front=Math.max(0,Math.cos(ang));return .70*front**12+.15*front**5;};
 rings(parent,shirtKeys,M.fabric,{nu:112,nv:100,name:'Cat print tailored shirt',alter:(p,a,v,rx,rz)=>{
  const front=Math.max(0,Math.cos(a)),fold=(Math.sin(a*5+v*4)*.011+Math.sin(a*11-v*10)*.007)*Math.sin(Math.PI*v)**.7;
  p[0]+=Math.sin(a)*fold;p[2]+=Math.cos(a)*fold;
  const neck=frontY(a);p[1]-=neck*clamp((v-.70)/.30)**2.2;
  p[1]+= (.025*Math.sin(a*3+.6)+.014*Math.sin(a*7)+.065*Math.exp(-(((a+.065)/.083)**2)))*Math.max(0,1-v*7);
  return p;
 }});
 // Shirt hem is a subtle rolled seam, follows the natural asymmetric drape.
 const hem=[];for(let i=0;i<=96;i++){const a=-Math.PI+2*Math.PI*i/96;hem.push([-.044+.575*Math.sin(a),3.697+.025*Math.sin(a*3+.6)+.014*Math.sin(a*7)+.065*Math.exp(-(((a+.065)/.083)**2)),.024+.295*Math.cos(a)]);}
 curve(parent,hem,.012,M.seam,'Rolled bottom hem',96);
 const left=[[-.27,5.58],[-.405,5.55],[-.55,5.44],[-.49,5.30],[-.365,5.24],[-.433,5.12],[-.284,4.99],[-.119,4.85],[-.023,4.96],[-.140,5.22],[-.211,5.44]];
 const right=[[.263,5.58],[.407,5.53],[.55,5.42],[.476,5.30],[.336,5.25],[.453,5.12],[.403,5.04],[.215,4.99],[-.023,4.96],[.14,5.23],[.205,5.43]];
 // Sculpted broad contrasting lapels with piping.
 function collarZ(x,y){const front=shirtZ(x,y);return front+.032+.055*Math.exp(-(((y-5.25)/.24)**2))*Math.max(0,1-Math.abs(x)*1.2);}
 for(const [pts,name] of [[left,'Left pajama lapel'],[right,'Right pajama lapel']]){
  xyShape(parent,pts,collarZ,M.white,name);
  const path=pts.concat([pts[0]]).map(([x,y])=>[x,y,collarZ(x,y)+.008]);
  curve(parent,path,.0075,M.seam,'Contrasting lapel piping',64);
 }
 // Button placket follows the fabric, with a seam and pearly buttons.
 const placket=[[-.016,4.94],[-.043,4.74],[-.042,4.50],[-.053,4.26],[-.066,4.03],[-.071,3.80],[-.046,3.70]];
 curve(parent,placket.map(([x,y])=>[x,y,shirtZ(x,y)+.017]),.013,M.seam,'Center button placket',64);
 curve(parent,placket.map(([x,y])=>[x+.037,y,shirtZ(x+.037,y)+.009]),.0055,M.edge,'Placket topstitch',64);
 for(const [x,y] of [[-.045,4.79],[-.05,4.48],[-.058,4.15],[-.066,3.83]]){
  const z=shirtZ(x,y)+.027;
  ellipsoid(parent,M.buttonRim,[x,y,z],[.037,.041,.015],null,'Button rim');
  ellipsoid(parent,M.button,[x,y,z+.013],[.029,.033,.013],null,'Pearlescent button');
  for(const dx of [-.009,.009])ellipsoid(parent,M.darkSeam,[x+dx,y,z+.026],[.0039,.0054,.0022],null,'Button thread hole');
 }
 const pocket=[[.163,4.93],[.345,4.965],[.516,4.917],[.523,4.857],[.478,4.54],[.410,4.505],[.215,4.525],[.155,4.57]];
 const pocketZ=(x,y)=>shirtZ(x,y)+.027+.009*Math.sin((y-4.5)*7);
 xyShape(parent,pocket,pocketZ,M.sleeve,'Chest patch pocket');
 curve(parent,pocket.concat([pocket[0]]).map(([x,y])=>[x,y,pocketZ(x,y)+.007]),.009,M.seam,'Pocket outline',48);
 curve(parent,[[.163,4.88,pocketZ(.163,4.88)+.009],[.33,4.89,pocketZ(.33,4.89)+.009],[.515,4.85,pocketZ(.515,4.85)+.009]],.012,M.edge,'Pocket opening');
 // Fine fabric folds, small and low-contrast.
 for(const p of [
 [[-.47,4.89],[-.42,4.55],[-.46,4.25]],[[-.21,4.12],[-.29,3.90],[-.33,3.76]],
 [[.43,4.46],[.40,4.17],[.49,3.91]],[[.12,4.81],[.10,4.53],[.14,4.36]]
 ])curve(parent,p.map(([x,y])=>[x,y,shirtZ(x,y)+.004]),.005,M.paleBlue,'Subtle tailoring fold',32);
}
function sleeves(parent,M){
 const paths=[
 [[-.42,5.40,-.004],[-.59,5.405,.006],[-.76,5.36,.025],[-.89,5.30,.048]],
 [[.43,5.40,-.005],[.60,5.24,.012],[.686,5.04,.022],[.729,4.86,.024]]
 ];
 for(let i=0;i<2;i++){
  const p=paths[i],prof=[[0,.205,.19],[.20,.268,.225],[.48,.252,.217],[.78,.236,.205],[1,.235,.204]];
  const scallop=(q,t,e,f,a,v)=>q.addScaledVector(t,.072*(.5+.5*Math.cos(a*6))*clamp((v-.68)/.32)**3);
  sweep(parent,p,prof,M.sleeve,{nu:80,nv:56,alter:scallop,name:i?'Hanging scalloped sleeve':'Raised scalloped sleeve'});
  const path=new T.CatmullRomCurve3(p.map(v=>V(...v)),false,'centripetal');
  const c=path.getPoint(1),t=path.getTangent(1).normalize(),e=new T.Vector3().crossVectors(t,V(0,0,1)).normalize(),f=new T.Vector3().crossVectors(t,e).normalize();
  const edge=[];for(let k=0;k<=96;k++){const a=2*Math.PI*k/96;const q=c.clone().addScaledVector(e,.235*Math.cos(a)).addScaledVector(f,.204*Math.sin(a)).addScaledVector(t,.072*(.5+.5*Math.cos(a*6)));edge.push(q);}
  curve(parent,edge,.013,M.edge,'White scalloped cuff piping',96);
  // A darker inside rim makes the cuff look like actual cloth.
  const inner=edge.map(q=>q.clone().lerp(c,.09).addScaledVector(t,-.012));curve(parent,inner,.011,M.paleBlue,'Cuff inner seam',96);
 }
}
function arms(parent,M){
 sweep(parent,[[-.56,5.39,.006],[-.89,5.33,.044],[-1.21,5.34,.094],[-1.24,5.47,.115],[-.99,5.70,.153],[-.78,6.02,.191]],[[0,.144,.147],[.19,.148,.142],[.40,.129,.121],[.60,.119,.108],[.80,.095,.083],[1,.065,.06]],M.skin,{nu:44,nv:80,name:'Raised anatomically tapered arm'});
 sweep(parent,[[.56,5.34,.005],[.686,4.91,.025],[.743,4.56,.039],[.806,4.22,.046],[.914,3.62,.092],[.996,3.20,.151]],[[0,.145,.137],[.18,.15,.139],[.36,.136,.128],[.50,.112,.105],[.63,.108,.098],[.83,.078,.068],[1,.059,.052]],M.skin,{nu:44,nv:80,name:'Relaxed pillow-holding arm'});
 // Each palm and finger has an individually curved tapered mesh.
 const left=group(parent,'Raised hand with five fingers');
 sweep(left,[[-.78,6.00,.192],[-.718,6.09,.218],[-.716,6.206,.225],[-.734,6.245,.218]],[[0,.064,.055],[.30,.084,.046],[.72,.082,.041],[1,.047,.035]],M.skin,{name:'Raised palm'});
 const fingers=[
 [[-.777,6.17,.221],[-.824,6.26,.23],[-.821,6.35,.228],[-.782,6.415,.219]],
 [[-.744,6.224,.227],[-.729,6.35,.231],[-.697,6.424,.232],[-.662,6.402,.239]],
 [[-.708,6.218,.23],[-.662,6.33,.242],[-.61,6.352,.252],[-.579,6.317,.255]],
 [[-.679,6.186,.232],[-.619,6.277,.256],[-.568,6.284,.269],[-.551,6.251,.262]],
 [[-.691,6.085,.245],[-.638,6.126,.275],[-.605,6.18,.283],[-.61,6.223,.264]]
 ];
 fingers.forEach((p,i)=>sweep(left,p,[[0,.023,.022],[.25,.023,.021],[.64,.019,.018],[.88,.014,.014],[1,.003,.003]],M.skin,{nu:16,nv:24,name:'Raised finger '+(i+1)}));
 const right=group(parent,'Pillow grip with five fingers');
 sweep(right,[[.996,3.20,.15],[1.04,3.11,.17],[1.085,3.025,.176],[1.11,2.99,.165]],[[0,.058,.049],[.36,.087,.048],[.72,.077,.044],[1,.041,.028]],M.skin,{name:'Holding palm'});
 const grip=[
 [[1.053,3.045,.192],[1.095,3.017,.232],[1.136,2.967,.235],[1.135,2.905,.212]],
 [[1.078,3.027,.191],[1.132,2.998,.228],[1.17,2.947,.221],[1.159,2.89,.190]],
 [[1.102,3.015,.179],[1.156,2.987,.206],[1.187,2.949,.191],[1.175,2.903,.172]],
 [[1.122,3.009,.159],[1.17,2.988,.177],[1.196,2.953,.159],[1.181,2.927,.145]],
 [[1.028,3.103,.196],[1.10,3.09,.243],[1.16,3.047,.24],[1.167,3.007,.225]]
 ];
 grip.forEach((p,i)=>sweep(right,p,[[0,.027,.025],[.3,.026,.023],[.7,.021,.019],[1,.003,.003]],M.skin,{nu:16,nv:24,name:'Grip finger '+(i+1)}));
}
function shorts(parent,M){
 // Upper waist sits beneath shirt; separate roomy leg panels form a natural crotch.
 rings(parent,[[3.53,.36,.21,0,.01],[3.61,.50,.263,0,0],[3.68,.53,.27,-.014,-.016],[3.92,.49,.27,-.02,-.02]],M.short,{nu:88,nv:45,name:'Pajama shorts waist'});
 for(const s of [-1,1]){
  const cx=s*.283,cz=s===1?.026:-.018;
  const keys=[[2.79,.312,.239,cx,cz],[2.92,.337,.264,cx,cz],[3.15,.348,.286,cx*.98,cz],[3.39,.333,.282,cx*.94,cz],[3.63,.292,.267,cx*.81,cz],[3.76,.22,.22,cx*.75,cz]];
  rings(parent,keys,M.short,{nu:96,nv:64,name:s===1?'Right loose shorts leg':'Left loose shorts leg',alter:(p,a,v)=>{
   const scallop=.034*(.5+.5*Math.cos(a*8));p[1]-=scallop*clamp(1-v*6)**2;
   const fold=.012*Math.sin(a*6+v*3)+.010*Math.sin(a*11-v*7);p[0]+=Math.sin(a)*fold*Math.sin(v*Math.PI);p[2]+=Math.cos(a)*fold*Math.sin(v*Math.PI);return p;
  }});
  const cuffKeys=[[2.704,.297,.225,cx,cz],[2.76,.324,.248,cx,cz],[2.82,.319,.244,cx,cz],[2.86,.312,.241,cx,cz]];
  rings(parent,cuffKeys,M.paleBlue,{nu:96,nv:28,name:'Soft gathered shorts ruffle',alter:(p,a,v)=>{p[1]-=.056*(.5+.5*Math.cos(a*8))*clamp(1-v*2)**1.2;return p;}});
  const edge=[];for(let k=0;k<=96;k++){const a=(k/96-.5)*2*Math.PI;edge.push([cx+.297*Math.sin(a),2.704-.056*(.5+.5*Math.cos(a*8)),cz+.225*Math.cos(a)]);}
  curve(parent,edge,.007,M.seam,'Scalloped ruffle stitched hem',96);
  const outerX=cx+s*.322;curve(parent,[[outerX,3.51,cz+.02],[outerX+s*.011,3.25,cz+.016],[outerX,2.96,cz+.01]],.006,M.seam,'Outer shorts seam',32);
 }
}
function legs(parent,M){
 sweep(parent,[[-.298,2.91,-.024],[-.31,2.54,-.055],[-.33,2.12,-.08],[-.34,1.83,-.08],[-.32,1.46,-.16],[-.26,.94,-.34],[-.244,.55,-.37]],[[0,.19,.177],[.17,.182,.166],[.37,.14,.142],[.45,.126,.123],[.58,.142,.125],[.73,.103,.095],[.92,.072,.068],[1,.077,.073]],M.skin,{nu:48,nv:96,name:'Rear weight-bearing leg'});
 sweep(parent,[[.274,2.91,.05],[.258,2.50,.09],[.22,2.03,.135],[.20,1.77,.19],[.185,1.36,.25],[.105,.72,.39],[.065,.26,.48]],[[0,.202,.181],[.16,.193,.176],[.35,.153,.143],[.46,.132,.127],[.59,.149,.13],[.75,.106,.092],[.92,.073,.071],[1,.075,.069]],M.skin,{nu:48,nv:96,name:'Forward relaxed leg'});
}
function slipper(parent,M,center,rot){
 const g=group(parent,'Plush bedroom slipper');g.position.set(...center);g.rotation.y=rot;
 ellipsoid(g,M.sole,[0,.058,.11],[.205,.061,.331],null,'Soft blue-gray outsole');
 ellipsoid(g,M.whiteShadow,[0,.108,.10],[.202,.061,.323],null,'Slipper welt');
 // Fuzzy fabric shell with modeled scalloped plush silhouette.
 surface(g,96,56,(u,v)=>{
  const a=2*Math.PI*u,b=Math.PI*v,s=Math.sin(b),bump=1+.018*Math.sin(a*13+b*9)*Math.sin(b)**2+.009*Math.sin(a*21-b*13);
  const x=.217*s*Math.sin(a)*bump,z=.108+.329*s*Math.cos(a)*bump,y=.125+.131*Math.cos(b)*bump;
  return [x,y,z];
 },M.white,'Cloud plush slipper upper',true);
 ellipsoid(g,M.skin,[0,.20,-.082],[.081,.048,.099],null,'Ankle at slipper opening');
 const bow=group(g,'Rose ribbon');bow.position.set(0,.235,.265);
 for(const s of [-1,1]){
  ellipsoid(bow,M.pink,[s*.064,0,0],[.063,.036,.024],[0,0,s*.16],'Ribbon loop');
  ellipsoid(bow,M.pinkDark,[s*.031,-.008,.015],[.026,.016,.008],[0,0,s*.08],'Ribbon crease');
 }
 ellipsoid(bow,M.pink,[0,.002,.011],[.024,.028,.025],null,'Ribbon knot');
}
function pillow(parent,M){
 const g=group(parent,'Soft white bed pillow');g.position.set(1.18,1.90,.22);g.rotation.set(-.08,.03,-.59);
 const hw=.70,hh=.90;
 function coord(u,v,sign){
  const x=u*hw*(1-.095*(1-v*v))+.022*Math.sin(v*4.2)*(u+1)/2,y=v*hh*(1-.064*(1-u*u))+.024*Math.sin(u*3.3)*(v+1)/2;
  const edge=Math.max(0,(1-u*u)*(1-v*v)),puff=.30*Math.pow(edge,.43);
  const fold1=.040*Math.exp(-(((u+.72+(v-.75)*.19)/.095)**2))*Math.exp(-(((v-.62)/.38)**2));
  const fold2=.025*Math.exp(-(((u-.75-(v+.45)*.23)/.12)**2))*Math.exp(-(((v+.52)/.46)**2));
  const pinch=.068*Math.exp(-((u+1)**2+(v-1)**2)/.11);const gripFold=.050*Math.exp(-(((u+.80+(1-v)*.47)/.095)**2))*Math.exp(-(((v-.62)/.48)**2));
  return [x,y,sign*(puff-(fold1+fold2+gripFold)*Math.sqrt(edge))+.015*Math.sin(u*3+v*3)*edge-pinch];
 }
 surface(g,96,112,(u,v)=>coord(u*2-1,v*2-1,1),M.pillow,'Inflated pillow front');
 surface(g,96,112,(u,v)=>coord(u*2-1,v*2-1,-1),M.whiteShadow,'Inflated pillow back',true);
 const seam=[];for(let i=0;i<32;i++)seam.push(coord(-1+2*i/32,-1,1));for(let i=0;i<32;i++)seam.push(coord(1,-1+2*i/32,1));for(let i=0;i<32;i++)seam.push(coord(1-2*i/32,1,1));for(let i=0;i<=32;i++)seam.push(coord(-1,1-2*i/32,1));
 curve(g,seam,.015,M.whiteShadow,'Stitched pillow perimeter',128);
}
export function createBody(parent,M){
 const b=group(parent,'Tailored pajamas, posed anatomy and pillow');
 pillow(b,M);legs(b,M);slipper(b,M,[-.246,.31,-.368],-.14);slipper(b,M,[.065,.005,.48],-.035);shorts(b,M);arms(b,M);shirt(b,M);sleeves(b,M);
 return b;
}
