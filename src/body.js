import * as T from 'three';
import {implicitSweeps} from './implicit.js';
import {sewnShorts} from './shorts.js';
import {V,C,clamp,mix,interp,group,mesh,ellipsoid,surface,rings,sweep,curve,patch,xyShape} from './geometry.js';

const shirtKeys=[
 [3.69,.615,.310,-.064,.024],[3.78,.602,.322,-.057,.013],[4.00,.535,.302,-.049,.003],[4.29,.477,.272,-.022,-.012],[4.56,.486,.289,-.011,-.002],[4.85,.526,.324,0,.017],[5.12,.544,.330,.005,.010],[5.37,.596,.273,0,-.011],[5.51,.542,.239,0,-.018],[5.62,.302,.184,0,-.019]
];
function shirtFold(a,y){
 const gauss=(x,w)=>Math.exp(-((x/w)**2));
 const window=Math.sin(Math.PI*clamp((y-3.69)/(5.62-3.69)))**.7;
 const base=(Math.sin(a*5+(y-3.69)*2)*.007+Math.sin(a*11-(y-3.69)*5)*.004)*window;
 const underarm=-.027*gauss(a-(-.91+.49*(5.05-y)),.13)*gauss(y-4.74,.38)
                -.025*gauss(a-(1.04-.64*(5.05-y)),.15)*gauss(y-4.68,.39);
 const side=.024*gauss(a-(-.54-.42*(4.32-y)),.13)*gauss(y-4.03,.31)
            -.019*gauss(a-(.53+.29*(4.5-y)),.14)*gauss(y-4.12,.34);
 const placket=.011*gauss(a+.14,.09)*gauss(y-4.18,.53);
 return (base+underarm+side+placket)*window;
}
function shirtZ(x,y){
 const [rx,rz,cx,cz]=interp(shirtKeys,clamp(y,3.69,5.62));
 let a=Math.asin(clamp((x-cx)/Math.max(.1,rx),-.995,.995));
 for(let i=0;i<3;i++)a=Math.asin(clamp((x-cx)/Math.max(.1,rx+shirtFold(a,y)),-.995,.995));
 return cz+(rz+shirtFold(a,y))*Math.cos(a);
}
function shirtUV(x,y){
 const [rx,rz,cx]=interp(shirtKeys,clamp(y,3.69,5.62));
 return [.5+Math.asin(clamp((x-cx)/Math.max(.1,rx),-.995,.995))/(2*Math.PI)+.065,(y-3.69)/(5.62-3.69)+.08];
}
function roundedContour(points,r=.18){
 const result=[];
 for(let i=0;i<points.length;i++){
  const p=points[i],a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
  const q=[mix(p[0],a[0],r),mix(p[1],a[1],r)],t=[mix(p[0],b[0],r),mix(p[1],b[1],r)];
  for(let k=0;k<=5;k++){const u=k/5,v=1-u;result.push([v*v*q[0]+2*u*v*p[0]+u*u*t[0],v*v*q[1]+2*u*v*p[1]+u*u*t[1]]);}
 }
 return result;
}
function shirt(parent,M){
 // Continuous torso, covered by loose tailored pajama shirt.
 rings(parent,[[3.70,.33,.16,-.02,0],[4.30,.35,.20,0,0],[4.76,.36,.21,0,0],[5.22,.43,.215,0,0],[5.45,.44,.205,0,0],[5.61,.21,.154,0,0],[5.75,.145,.141,-.025,.012]],M.skin,{name:'Covered upper body'});
 sweep(parent,[[-.026,5.46,.025],[-.027,5.65,.027],[-.027,5.87,.023]],[[0,.205,.17],[.32,.144,.145],[.74,.142,.142],[1,.169,.145]],M.skin,{name:'Neck'});
 // Front neckline is cut directly into the garment surface, not painted over.
 const frontY=(ang)=>{const front=Math.max(0,Math.cos(ang));return .77*front**12+.15*front**5;};
 rings(parent,shirtKeys,M.fabric,{nu:112,nv:100,name:'Cat print tailored shirt',alter:(p,a,v,rx,rz)=>{
  const front=Math.max(0,Math.cos(a)),fold=shirtFold(a,p[1]);
  p[0]+=Math.sin(a)*fold;p[2]+=Math.cos(a)*fold;
  const neck=frontY(a);p[1]-=neck*clamp((v-.70)/.30)**2.2;
  p[1]+= (.025*Math.sin(a*3+.6)+.014*Math.sin(a*7)+.065*Math.exp(-(((a+.065)/.083)**2)))*Math.max(0,1-v*7);
  return p;
 }});
 // Shirt hem is a subtle rolled seam, follows the natural asymmetric drape.
 const hem=[];for(let i=0;i<=96;i++){const a=-Math.PI+2*Math.PI*i/96;hem.push([-.064+.615*Math.sin(a),3.697+.025*Math.sin(a*3+.6)+.014*Math.sin(a*7)+.065*Math.exp(-(((a+.065)/.083)**2)),.024+.310*Math.cos(a)]);}
 curve(parent,hem,.012,M.seam,'Rolled bottom hem',96);
 const left=[[-.27,5.58],[-.405,5.55],[-.55,5.44],[-.49,5.30],[-.365,5.24],[-.433,5.12],[-.284,4.99],[-.119,4.85],[-.023,4.96],[-.140,5.22],[-.211,5.44]];
 const right=[[.263,5.58],[.407,5.53],[.55,5.42],[.476,5.30],[.336,5.25],[.453,5.12],[.403,5.04],[.215,4.99],[-.023,4.96],[.14,5.23],[.205,5.43]];
 // Sculpted broad contrasting lapels with piping.
 function collarZ(x,y){const front=shirtZ(x,y);return front+.032+.055*Math.exp(-(((y-5.25)/.24)**2))*Math.max(0,1-Math.abs(x)*1.2);}
 for(const [raw,name] of [[left,'Left pajama lapel'],[right,'Right pajama lapel']]){
  const pts=roundedContour(raw,.19);
  xyShape(parent,pts,collarZ,M.white,name);
  const path=pts.concat([pts[0]]).map(([x,y])=>[x,y,collarZ(x,y)+.008]);
  curve(parent,path,.0075,M.seam,'Contrasting lapel piping',64);
 }
 // A wrap-around collar band continues behind the neck and joins the
 // notched front lapels. Hair naturally occludes most of the rear portion.
 const collarBand=(u,v)=>{
  const a=mix(.67,2*Math.PI-.67,u),rx=mix(.202,.445,v),rz=mix(.167,.249,v);
  return [rx*Math.sin(a),mix(5.654,5.502+.018*Math.cos(a),v)+.025*Math.sin(Math.PI*v),-.01+rz*Math.cos(a)];
 };
 surface(parent,88,26,collarBand,M.white,'Back pajama collar band');
 const backPipe=[];for(let i=0;i<=88;i++)backPipe.push(collarBand(i/88,1));
 curve(parent,backPipe,.007,M.seam,'Wraparound collar piping',88);
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
 const pocket=roundedContour([[.163,4.93],[.345,4.965],[.516,4.917],[.523,4.857],[.478,4.54],[.410,4.505],[.215,4.525],[.155,4.57]],.19);
 const pocketZ=(x,y)=>shirtZ(x,y)+.027+.009*Math.sin((y-4.5)*7);
 xyShape(parent,pocket,pocketZ,M.fabric,'Chest patch pocket',shirtUV);
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
 [[.43,5.40,-.005],[.60,5.24,.012],[.686,4.98,.022],[.748,4.70,.024]]
 ];
 for(let i=0;i<2;i++){
  const p=paths[i],prof=[[0,.205,.19],[.20,.268,.225],[.48,.252,.217],[.78,.245,.210],[1,.249,.216]];
  const scallop=(q,t,e,f,a,v)=>q.addScaledVector(t,.090*(.5+.5*Math.cos(a*5))**.62*clamp((v-.65)/.35)**3);
  sweep(parent,p,prof,M.sleeve,{nu:80,nv:56,alter:scallop,name:i?'Hanging scalloped sleeve':'Raised scalloped sleeve'});
  const path=new T.CatmullRomCurve3(p.map(v=>V(...v)),false,'centripetal');
  const c=path.getPoint(1),t=path.getTangent(1).normalize(),e=new T.Vector3().crossVectors(t,V(0,0,1)).normalize(),f=new T.Vector3().crossVectors(t,e).normalize();
  const edge=[];for(let k=0;k<=96;k++){const a=2*Math.PI*k/96;const q=c.clone().addScaledVector(e,.249*Math.cos(a)).addScaledVector(f,.216*Math.sin(a)).addScaledVector(t,.090*(.5+.5*Math.cos(a*5))**.62);edge.push(q);}
  curve(parent,edge,.013,M.edge,'White scalloped cuff piping',96);
  // A darker inside rim makes the cuff look like actual cloth.
  const inner=edge.map(q=>q.clone().lerp(c,.09).addScaledVector(t,-.012));curve(parent,inner,.011,M.paleBlue,'Cuff inner seam',96);
 }
}
function arms(parent,M){
 // Arm and palm are generated as a single surface. Each finger is smoothly
 // joined at its root, while distal phalanges remain individually articulated.
 const raisedArm=[[-.56,5.39,.006],[-.89,5.33,.044],[-1.21,5.34,.094],[-1.24,5.47,.115],[-.99,5.70,.153],[-.78,6.02,.191],[-.718,6.09,.218],[-.716,6.206,.225],[-.734,6.245,.218]];
 const raisedProfile=[[0,.144,.147],[.16,.148,.142],[.33,.129,.121],[.47,.119,.108],[.60,.095,.083],[.75,.062,.052],[.84,.079,.043],[.94,.077,.039],[1,.041,.030]];
 const fingers=[
 [[-.773,6.17,.221],[-.807,6.252,.228],[-.808,6.321,.239],[-.780,6.366,.251]],
 [[-.744,6.220,.228],[-.731,6.320,.234],[-.700,6.389,.249],[-.669,6.375,.265]],
 [[-.708,6.215,.231],[-.668,6.306,.246],[-.619,6.331,.265],[-.591,6.301,.279]],
 [[-.679,6.184,.233],[-.632,6.260,.252],[-.581,6.275,.270],[-.553,6.246,.274]],
 [[-.691,6.087,.244],[-.643,6.126,.269],[-.609,6.171,.286],[-.616,6.204,.272]]
 ];
 const fingerProfile=[[0,.025,.023],[.25,.024,.021],[.65,.019,.017],[.89,.015,.014],[1,.006,.006]];
 implicitSweeps(parent,M.skin,[{points:raisedArm,profile:raisedProfile,samples:44},...fingers.map((points,i)=>({points,profile:fingerProfile,samples:13,smooth:i===4?.015:.008}))],{step:.011,smooth:.012,name:'Raised anatomically tapered arm and unified hand'});
 // Nail beds follow the tips and turn naturally with the knuckles.
 for(const [i,p] of fingers.entries()){
  const tip=p.at(-1),prev=p.at(-2),angle=-Math.atan2(tip[0]-prev[0],tip[1]-prev[1]);
  ellipsoid(parent,M.nail,[tip[0],tip[1],tip[2]+.010],[.0095,.014,.0035],[0,0,angle],'Raised hand nail '+(i+1));
 }
 const holdingArm=[[.56,5.34,.005],[.686,4.91,.025],[.743,4.56,.039],[.806,4.22,.046],[.914,3.65,.092],[.996,3.28,.151],[1.04,3.19,.17],[1.085,3.105,.176],[1.11,3.07,.165]];
 const holdingProfile=[[0,.145,.137],[.17,.150,.139],[.33,.136,.128],[.46,.112,.105],[.59,.108,.098],[.74,.078,.068],[.85,.055,.046],[.92,.076,.040],[1,.037,.026]];
 const grip=[
 [[1.053,3.045,.192],[1.095,3.017,.232],[1.136,2.967,.235],[1.135,2.905,.212]],
 [[1.078,3.027,.191],[1.132,2.998,.228],[1.17,2.947,.221],[1.159,2.89,.190]],
 [[1.102,3.015,.179],[1.156,2.987,.206],[1.187,2.949,.191],[1.175,2.903,.172]],
 [[1.122,3.009,.159],[1.17,2.988,.177],[1.196,2.953,.159],[1.181,2.927,.145]],
 [[1.028,3.103,.196],[1.10,3.09,.243],[1.16,3.047,.24],[1.167,3.007,.225]]
 ];
 implicitSweeps(parent,M.skin,[{points:holdingArm,profile:holdingProfile,samples:48},...grip.map((points,i)=>({points:points.map(p=>[p[0],p[1]+.080,p[2]]),profile:fingerProfile,samples:11,smooth:i===4?.012:.008}))],{step:.012,smooth:.012,name:'Relaxed pillow-holding arm and unified grip'});
}
function shorts(parent,M){sewnShorts(parent,M);}
function legs(parent,M){
 sweep(parent,[[-.298,3.06,-.024],[-.31,2.66,-.055],[-.33,2.30,-.08],[-.34,2.04,-.08],[-.29,1.55,-.16],[-.18,1.04,-.34],[-.125,.67,-.37]],
 [[0,.214,.187],[.16,.205,.179],[.34,.159,.151],[.45,.138,.131],[.58,.156,.139],[.75,.116,.103],[.92,.075,.072],[1,.071,.066]],M.skin,{nu:48,nv:96,name:'Rear weight-bearing leg'});
 sweep(parent,[[.274,3.06,.05],[.258,2.66,.09],[.22,2.30,.135],[.20,2.06,.19],[.185,1.47,.25],[.105,.77,.39],[.065,.26,.48]],
 [[0,.222,.194],[.16,.211,.185],[.34,.167,.153],[.45,.142,.133],[.59,.164,.145],[.75,.112,.101],[.92,.075,.073],[1,.071,.066]],M.skin,{nu:48,nv:96,name:'Forward relaxed leg'});
}
function slipper(parent,M,center,rot){
 const g=group(parent,'Plush bedroom slipper');g.position.set(...center);g.rotation.y=rot;
 const outline=(a)=>{const c=Math.cos(a);return [.242*(.90+.10*c)*Math.sin(a),.125+.355*c];};
 // Beveled sole with rounded toe and narrower heel.
 surface(g,112,18,(u,v)=>{const a=u*2*Math.PI,[x,z]=outline(a),r=.96+.04*Math.sin(Math.PI*v);return [x*r,.025+.073*v,.125+(z-.125)*r];},M.sole,'Soft blue-gray outsole');
 surface(g,96,16,(u,v)=>{const a=u*2*Math.PI,[x,z]=outline(a);return [x*v,.026,.125+(z-.125)*v];},M.sole,'Closed slipper sole');
 // Ankle and foot inside the padded opening.
 ellipsoid(g,M.skin,[0,.145,.055],[.102,.070,.214],null,'Foot inside slipper');
 ellipsoid(g,M.skin,[0,.205,-.082],[.078,.055,.091],null,'Ankle at slipper opening');
 const opening=(a)=>[.092*Math.sin(a),-.082+.113*Math.cos(a)];
 surface(g,112,50,(u,v)=>{
  const a=u*2*Math.PI,[ox,oz]=outline(a),[ix,iz]=opening(a),c=Math.cos(a),front=.5+.5*c;
  const puff=Math.sin(Math.PI*v)**.66*(.086+.109*front);
  const fluff=.0045*Math.sin(a*17+v*13)*Math.sin(Math.PI*v)**2+.003*Math.cos(a*29-v*11);
  return [mix(ox,ix,v)*(1+.075*Math.sin(Math.PI*v)*front+.022*Math.sin(a*12)*Math.sin(Math.PI*v)),mix(.098,.185,v)+puff+fluff,mix(oz,iz,v)];
 },M.white,'Plush slipper padded upper');
 surface(g,96,16,(u,v)=>{const a=u*2*Math.PI,[x,z]=opening(a);return [x*(1-.06*v),mix(.185,.105,v),-.082+(z+.082)*(1-.06*v)];},M.whiteShadow,'Slipper inner lining');
 const rim=[];for(let i=0;i<=96;i++){const [x,z]=opening(i/96*2*Math.PI);rim.push([x,.185,z]);}curve(g,rim,.009,M.whiteShadow,'Soft opening rim',96);
 const bow=group(g,'Rose ribbon');bow.position.set(0,.337,.280);bow.rotation.x=-.34;
 for(const s of [-1,1]){
  ellipsoid(bow,M.pink,[s*.064,0,0],[.068,.037,.022],[0,0,s*.15],'Ribbon loop');
  ellipsoid(bow,M.pinkDark,[s*.030,-.008,.014],[.026,.016,.007],[0,0,s*.08],'Ribbon crease');
 }
 ellipsoid(bow,M.pink,[0,.002,.011],[.025,.029,.024],null,'Ribbon knot');
}
function pillow(parent,M){
 const g=group(parent,'Soft white bed pillow');g.position.set(1.18,1.98,-.18);g.rotation.set(.33,.03,-.55);
 const hw=.76,hh=.94;
 function coord(u,v,sign){
  const drape=Math.max(0,-u)*Math.max(0,-v);const x=u*hw*(1-.095*(1-v*v))+.022*Math.sin(v*4.2)*(u+1)/2-.18*drape,y=v*hh*(1-.064*(1-u*u))+.024*Math.sin(u*3.3)*(v+1)/2;
  const edge=Math.max(0,(1-u*u)*(1-v*v)),puff=.30*Math.pow(edge,.43);
  const fold1=.061*Math.exp(-(((u+.72+(v-.75)*.19)/.095)**2))*Math.exp(-(((v-.62)/.38)**2));
  const fold2=.044*Math.exp(-(((u-.75-(v+.45)*.23)/.12)**2))*Math.exp(-(((v+.52)/.46)**2));
  const pinch=.068*Math.exp(-((u+1)**2+(v-1)**2)/.11);const gripFold=.067*Math.exp(-(((u+.80+(1-v)*.47)/.095)**2))*Math.exp(-(((v-.62)/.48)**2));
  return [x,y,sign*(puff-(fold1+fold2+gripFold)*Math.sqrt(edge))+.015*Math.sin(u*3+v*3)*edge-pinch-.13*drape];
 }
 surface(g,96,112,(u,v)=>coord(u*2-1,v*2-1,1),M.pillow,'Inflated pillow front');
 surface(g,96,112,(u,v)=>coord(u*2-1,v*2-1,-1),M.whiteShadow,'Inflated pillow back',true);
 const seam=[];for(let i=0;i<32;i++)seam.push(coord(-1+2*i/32,-1,1));for(let i=0;i<32;i++)seam.push(coord(1,-1+2*i/32,1));for(let i=0;i<32;i++)seam.push(coord(1-2*i/32,1,1));for(let i=0;i<=32;i++)seam.push(coord(-1,1-2*i/32,1));
 curve(g,seam,.015,M.whiteShadow,'Stitched pillow perimeter',128);
}
export function createBody(parent,M){
 const b=group(parent,'Tailored pajamas, posed anatomy and pillow');
 pillow(b,M);legs(b,M);slipper(b,M,[-.125,.43,-.368],-.14);slipper(b,M,[.065,.005,.48],-.035);shorts(b,M);arms(b,M);shirt(b,M);sleeves(b,M);
 return b;
}
