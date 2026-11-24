import * as T from 'three';
import {lensRibbon} from './ribbons.js';
import {V,C,clamp,mix,interp,group,mesh,ellipsoid,surface,rings,sweep,curve,patch,ringXZ} from './geometry.js';

const headKeys=[
 [-.60,.016,.023,0,.135],[-.56,.113,.147,0,.112],[-.47,.232,.252,0,.078],[-.35,.352,.337,0,.042],[-.21,.456,.411,0,.014],[-.06,.514,.447,0,-.009],[.12,.520,.458,0,-.018],[.30,.507,.443,0,-.038],[.46,.447,.382,0,-.051],[.59,.307,.282,0,-.048],[.68,.135,.14,0,-.044],[.706,.001,.001,0,-.044]
];
function faceZ(x,y){
 const [rx,rz,cx,cz]=interp(headKeys,y);
 return cz+rz*Math.sqrt(Math.max(.001,1-((x-cx)/Math.max(.01,rx))**2))+.017*Math.exp(-((x/.115)**2+((y+.185)/.11)**2));
}
function eye(parent,M,sign){
 const x0=sign*.212,y0=-.077,rx=.171;
 const eyeLimits=(xx)=>{const u=clamp((xx-x0)/rx,-1,1),f=Math.max(0,1-u*u)**.62,tilt=sign*u*.017;return [y0-.070*f+tilt,y0+.088*f+tilt+.008*Math.sin(Math.PI*(u+1)/2)];};
 const z=(x,y,offset=0)=>faceZ(x,y)+.013+offset;
 surface(parent,48,20,(u,v)=>{const x=x0+rx*(2*u-1),[lo,hi]=eyeLimits(x),y=mix(lo,hi,v),c=C('#fffaff').lerp(C('#d7d2e7'),.60*v**4);return [x,y,z(x,y),c.r,c.g,c.b];},M.eyeWhite,'Almond eye white');
 // Violet irises, radial pigment, limbic ring and hand-drawn fibers.
 const ix=x0-sign*.013,iy=y0+.019,iw=.093,ih=.102;
 const dark=C('#333059'),mid=C('#6251ac'),bright=C('#a9a0f2'),deep=C('#443780'),blue=C('#6b9de4');
 surface(parent,96,32,(u,v)=>{
  const a=u*2*Math.PI,x=ix+Math.cos(a)*iw*v,yy=iy+Math.sin(a)*ih*v,[lo,hi]=eyeLimits(x),y=clamp(yy,lo+.001,hi-.001);
  const top=(Math.sin(a)+1)/2,ray=.5+.5*Math.sin(a*29+Math.sin(a*7)*2),c=deep.clone().lerp(mid,clamp((v-.26)*1.8)).lerp(bright,(1-top)*.65*clamp(v*1.8));
  c.lerp(blue,.24*(1-top)*Math.exp(-(((v-.75)/.18)**2)));c.lerp(dark,clamp((v-.87)*8));c.lerp(bright,ray*.22*Math.sin(v*Math.PI));c.lerp(dark,top*.37);
  return [x,y,z(x,y,.006),c.r,c.g,c.b];
 },M.iris,'Layered violet iris',true);
 patch(parent,ix,iy+.019,.029,.045,(x,y)=>z(x,y,.010),M.eyeInk,'Pupil');
 patch(parent,ix-.034,iy+.041,.019,.016,(x,y)=>z(x,y,.016),M.eyeLight,'Large catchlight');
 patch(parent,ix+.034,iy-.045,.011,.014,(x,y)=>z(x,y,.017),M.eyeLight,'Secondary catchlight');
 // Variable-thickness upper lash ribbon, rather than floating eyeliner.
 surface(parent,64,8,(u,v)=>{
  const x=x0+rx*(2*u-1),[,hi]=eyeLimits(x),outer=sign===1?u:1-u;
  const y=hi+v*(.004+.022*Math.sin(Math.PI*u)**.75+.024*outer**4);
  return [x,y,z(x,y,.012)];
 },M.eyeInk,'Upper eyelashes');
 const outer=x0+sign*rx;
 curve(parent,[[outer-sign*.052,y0+.065,z(outer-sign*.052,y0+.065,.015)],[outer,y0+.028,z(outer,y0+.028,.015)],[outer+sign*.037,y0+.048,faceZ(outer,y0+.04)+.01]],.008,M.eyeInk,'Outer eyelash',24);
 surface(parent,48,4,(u,v)=>{const x=x0+rx*(2*u-1),[lo]=eyeLimits(x);const y=lo-v*.0038*Math.sin(u*Math.PI);return [x,y,z(x,y,.011)];},M.eyebrow,'Lower lash line',true);
 const browY=.151;
 curve(parent,[[x0-sign*.138,browY-.01,faceZ(x0-sign*.138,browY-.01)+.012],[x0,browY+.042,faceZ(x0,browY+.042)+.012],[x0+sign*.125,browY+.018,faceZ(x0+sign*.125,browY+.018)+.01]],.0065,M.eyebrow,'Delicate eyebrow',24);
}
function hairLock(parent,M,pts,w,d,seed=0,name='Hair lock'){
 const colors=[C('#3d3965'),C('#504b81'),C('#6d67a2'),C('#a39bd1')];
 return sweep(parent,pts,[[0,w*.12,d*.34],[.13,w*.72,d*.77],[.36,w,d*.83],[.57,w*.91,d*.60],[.75,w*.55,d*.36],[.90,w*.18,d*.13],[1,.0007,.0007]],M.hair,{
  nu:36,nv:64,name,
  alter:(p,t,e,f,a,v,wr,dr)=>{const ridge=.024*Math.sin(a*5+seed+v*.9)*Math.sin(Math.PI*v);p.addScaledVector(f,dr*ridge);},
  color:(a,v,p,t,e,f)=>{
   const facing=clamp(e.z*Math.cos(a)+f.z*Math.sin(a),-1,1),stripe=Math.exp(-((Math.sin(a+seed*.035)+.35)**2)*19),shine=Math.exp(-((v-.29)**2)*12);
   const c=colors[0].clone().lerp(colors[1],clamp(.68+facing*.26)).lerp(colors[2],.37+Math.max(0,facing)*.36);
   c.lerp(colors[3],stripe*.24*Math.sin(Math.PI*clamp(v*1.3))**2+.19*Math.exp(-((facing-.85)**2)*12)*Math.exp(-((v-.38)**2)*10)+.06*shine*Math.max(0,facing));c.lerp(colors[0],.15*v*v);return [c.r,c.g,c.b];
  }
 });
}
function hair(parent,M){
 // Closed scalp shell with high frontal hairline and deep rear nape.
 surface(parent,112,56,(u,v)=>{
  const a=(u-.5)*Math.PI*2,front=Math.max(0,Math.cos(a)),end=1.95-1.02*front**5;
  const p=v*end,rx=.567,ry=.70,rz=.505;
  const x=rx*Math.sin(p)*Math.sin(a),y=.053+ry*Math.cos(p),z=-.037+rz*Math.sin(p)*Math.cos(a);
  const color=C('#625b91').lerp(C('#8880b5'),.20*Math.sin(p)*Math.max(0,Math.cos(a))).lerp(C('#453f76'),.12*v);
  return [x,y,z,color.r,color.g,color.b];
 },M.hair,'Continuous scalp cap',true);
 // Rear sections are genuinely volumetric and continue below the waist.
 const rear=[
 [[-.25,.54,-.20],[-.45,.14,-.36],[-.51,-.54,-.39],[-.61,-1.18,-.40],[-.99,-1.85,-.37],[-1.22,-2.12,-.32]],
 [[-.12,.57,-.34],[-.37,.00,-.49],[-.39,-.79,-.52],[-.56,-1.50,-.49],[-.80,-2.20,-.36],[-.95,-2.32,-.27]],
 [[.04,.53,-.42],[-.18,-.12,-.57],[-.14,-.79,-.60],[-.12,-1.55,-.58],[-.28,-2.22,-.44],[-.48,-2.38,-.28]],
 [[.16,.55,-.38],[.11,-.15,-.57],[.23,-.84,-.61],[.37,-1.62,-.56],[.52,-2.32,-.40],[.37,-2.46,-.27]],
 [[.30,.42,-.26],[.44,-.12,-.46],[.58,-.86,-.54],[.84,-1.49,-.50],[1.06,-2.06,-.35],[.91,-2.35,-.23]],
 [[.38,.35,-.19],[.54,-.15,-.31],[.71,-.83,-.36],[1.03,-1.36,-.31],[1.34,-1.92,-.19],[1.22,-2.24,-.16]],
 [[.45,.26,-.11],[.61,-.26,-.22],[.76,-.83,-.20],[1.04,-1.16,-.16],[1.42,-1.35,-.15],[1.48,-1.44,-.10]],
 [[-.37,.37,-.18],[-.56,-.22,-.24],[-.66,-.87,-.20],[-.86,-1.31,-.18],[-1.25,-1.60,-.10],[-1.43,-1.74,-.05]],
 [[.28,.55,-.32],[.50,-.06,-.46],[.69,-.70,-.47],[.96,-1.28,-.39],[1.39,-1.78,-.26],[1.48,-2.06,-.20]]
 ];
 rear.forEach((p,i)=>hairLock(parent,M,p,[.19,.23,.25,.26,.27,.24,.12,.14,.13][i],.079,i*.8,'Long rear tress '+(i+1)));
 // Side strands, cheeks and asymmetric face framing.
 hairLock(parent,M,[[-.26,.63,.12],[-.43,.44,.25],[-.52,.02,.24],[-.51,-.29,.19],[-.39,-.47,.16],[-.24,-.51,.17]],.117,.052,3,'Left face framing');
 hairLock(parent,M,[[-.39,.48,.09],[-.55,.16,.12],[-.57,-.29,.11],[-.49,-.56,.11],[-.31,-.64,.03]],.113,.057,1,'Left lower lock');
 hairLock(parent,M,[[.25,.64,.13],[.44,.42,.26],[.52,.10,.24],[.51,-.28,.21],[.37,-.48,.18],[.22,-.51,.18]],.112,.052,2,'Right face framing');
 hairLock(parent,M,[[.43,.45,.08],[.57,.06,.09],[.57,-.38,.10],[.47,-.62,.04],[.33,-.64,.03]],.093,.049,6,'Right lower lock');
 // Asymmetric closed-ribbon fringe. Each edge is sculpted independently,
 // so the pointed silhouette and the curved forehead opening stay precise.
 const fringes=[
 {l:[[-.17,.69,.13],[-.36,.60,.32],[-.48,.36,.36],[-.49,.10,.35],[-.47,-.11,.31],[-.37,-.31,.27]],r:[[-.17,.69,.13],[-.22,.57,.39],[-.34,.35,.43],[-.36,.12,.43],[-.38,-.06,.39],[-.37,-.31,.27]],d:.037},
 {l:[[-.09,.72,.14],[-.28,.57,.37],[-.37,.37,.43],[-.35,.15,.44],[-.32,.02,.43],[-.25,-.08,.39]],r:[[-.09,.72,.14],[-.16,.59,.43],[-.20,.39,.49],[-.22,.20,.49],[-.22,.07,.46],[-.25,-.08,.39]],d:.043},
 {l:[[.035,.73,.13],[-.15,.62,.37],[-.26,.44,.45],[-.25,.23,.48],[-.16,.06,.48],[-.01,-.020,.46],[.164,-.022,.40]],r:[[.035,.73,.13],[.085,.62,.37],[.067,.44,.47],[.055,.26,.49],[.106,.115,.47],[.155,.025,.44],[.164,-.022,.40]],d:.053},
 {l:[[.087,.71,.13],[.125,.62,.36],[.160,.47,.42],[.186,.31,.43],[.223,.15,.42],[.31,-.07,.34]],r:[[.087,.71,.13],[.255,.61,.34],[.345,.48,.38],[.367,.29,.37],[.351,.09,.36],[.31,-.07,.34]],d:.039},
 {l:[[.24,.66,.08],[.33,.53,.25],[.40,.37,.32],[.43,.14,.31],[.43,-.10,.27],[.36,-.28,.22]],r:[[.24,.66,.08],[.45,.49,.21],[.52,.33,.24],[.51,.09,.22],[.46,-.14,.22],[.36,-.28,.22]],d:.039},
 ];
 fringes.forEach((o,i)=>lensRibbon(parent,M.hair,o.l,o.r,{depth:o.d,seed:i*2,name:'Sculpted fringe lock '+(i+1),pigment:true}));
 hairLock(parent,M,[[-.22,.65,.04],[-.41,.60,.07],[-.61,.64,.03],[-.65,.75,.02],[-.59,.83,.01]],.047,.023,9,'Signature ahoge');
 // Fine directional locks soften the broad sculpted hair masses.
 const fine=[
  [[-.19,.66,.27],[-.32,.48,.415],[-.36,.20,.466],[-.36,-.02,.428],[-.42,-.22,.32]],
  [[.15,.68,.23],[.30,.53,.36],[.323,.30,.44],[.35,.06,.424],[.30,-.18,.33]],
  [[-.48,.19,.12],[-.58,-.12,.19],[-.54,-.38,.22],[-.43,-.55,.15],[-.35,-.57,.09]],
  [[.49,.19,.14],[.58,-.14,.18],[.56,-.37,.22],[.43,-.55,.17],[.32,-.57,.09]],
  [[.44,.19,-.25],[.69,-.47,-.37],[.81,-1.11,-.34],[1.16,-1.75,-.23],[1.26,-2.22,-.18]],
  [[-.47,.17,-.24],[-.65,-.55,-.35],[-.77,-1.12,-.30],[-1.05,-1.57,-.19],[-1.30,-1.86,-.12]]
 ];fine.forEach((p,i)=>{if(i>=4)hairLock(parent,M,p,[.039,.033,.038,.04,.065,.06][i],.025,11+i,'Fine directional lock '+i);});
 // Wispy perimeter strands visible from side and rear.
 const wisps=[
 [[-.43,.31,-.12],[-.61,-.43,-.13],[-.56,-.74,-.08],[-.67,-.96,-.01]],
 [[.49,.25,-.05],[.64,-.35,-.10],[.69,-.84,-.06],[.64,-1.07,.02]],
 [[1.01,-1.44,-.25],[1.34,-1.86,-.18],[1.42,-2.13,-.14],[1.28,-2.40,-.11]],
 [[-.74,-1.19,-.23],[-1.12,-1.46,-.19],[-1.40,-1.49,-.15],[-1.50,-1.47,-.12]]
 ];wisps.forEach((p,i)=>hairLock(parent,M,p,.026,.015,i,'Fine silhouette strand'));
}
function bow(parent,M){
 // Padded fabric headband: rounded closed cross-section rather than a flat strip.
 surface(parent,112,28,(u,v)=>{
  const a=mix(-.22,Math.PI+.22,u),b=v*2*Math.PI,taper=.70+.30*Math.sin(Math.PI*u)**.4;
  const radial=.030*Math.cos(b)*taper+.004*Math.sin(u*36);
  const x=Math.cos(a)*(.602+radial),y=.025+Math.sin(a)*(.745+radial);
  const z=-.027+.139*Math.sin(b)*taper+.005*Math.sin(u*42);
  return [x,y,z];
 },M.white,'Padded sleep headband',true);
 for(const side of [-1,1]){
  const pts=[];for(let i=0;i<=64;i++){const u=i/64,a=mix(-.22,Math.PI+.22,u),taper=.70+.30*Math.sin(Math.PI*u)**.4;pts.push([Math.cos(a)*(.603+.004*Math.sin(u*36)),.025+Math.sin(a)*(.745+.004*Math.sin(u*36)),-.027+side*.133*taper+.005*Math.sin(u*42)]);}
  curve(parent,pts,.006,M.whiteShadow,'Fine headband stitch',64);
 }
 ellipsoid(parent,M.white,[.005,.742,.045],[.13,.095,.114],[0,0,.12],'Bow knot');
 lensRibbon(parent,M.white,
  [[-.055,.75,.10],[-.18,.86,.077],[-.31,.96,.055],[-.46,.95,.027],[-.61,.89,.006]],
  [[-.055,.75,.10],[-.19,.73,.095],[-.35,.75,.063],[-.50,.81,.037],[-.61,.89,.006]],
  {depth:.034,name:'Left pointed fabric bow',nu:44,nv:64});
 lensRibbon(parent,M.white,
  [[.062,.76,.10],[.11,.85,.078],[.25,.98,.059],[.43,1.075,.025],[.59,1.11,.001]],
  [[.062,.76,.10],[.20,.76,.103],[.36,.80,.069],[.51,.94,.04],[.59,1.11,.001]],
  {depth:.036,name:'Right pointed fabric bow',nu:44,nv:64});
 curve(parent,[[-.07,.756,.14],[-.15,.82,.108],[-.27,.86,.098]],.010,M.whiteShadow,'Left fabric fold');
 curve(parent,[[.07,.76,.14],[.18,.81,.11],[.29,.91,.09]],.010,M.whiteShadow,'Right fabric fold');
}
export function createHead(parent,M){
 const h=group(parent,'Head, eyes, hair & accessories');h.position.set(.035,6.15,.01);h.rotation.set(.018,-.055,.065);h.scale.set(.85,.86,.93);
 rings(h,headKeys,M.skin,{nu:104,nv:88,name:'Sculpted face',alter:(p,a)=>{if(Math.cos(a)>0)p[2]+=.023*Math.exp(-((p[0]/.073)**2+((p[1]+.186)/.072)**2));return p;}});
 // Ear shells with inner cartilage and skin shading.
 for(const s of [-1,1]){
  ellipsoid(h,M.skin,[s*.482,-.17,-.035],[.084,.134,.067],[0,0,s*.19],'Ear');
  ellipsoid(h,M.skinShadow,[s*.513,-.17,.019],[.036,.082,.021],[0,0,s*.22],'Ear inner fold');
  eye(h,M,s);
  surface(h,24,24,(u,v)=>{const x=s*.29+(u-.5)*.27,y=-.241+(v-.5)*.155;return [x,y,faceZ(x,y)+.007];},M.blush,'Soft cheek blush');
  for(let i=0;i<6;i++){const x=s*.29+(i-2.5)*.017,y=-.251;curve(h,[[x-.009,y-.017,faceZ(x-.009,y-.017)+.008],[x+.006,y+.022,faceZ(x+.006,y+.022)+.008]],.0014,M.blushStroke,'Cheek blush stroke',8);}
 }
 // Subtle sculpted nose, mouth and chin detail.
 
 patch(h,-.012,-.200,.008,.004,(x,y)=>faceZ(x,y)+.012,M.skinShadow,'Nose shadow');
 curve(h,[[-.030,-.377,faceZ(-.030,-.377)+.006],[-.010,-.369,faceZ(-.010,-.369)+.009],[.010,-.371,faceZ(.010,-.371)+.009],[.031,-.379,faceZ(.031,-.379)+.006]],.0032,M.lip,'Small neutral mouth',24);
 hair(h,M);bow(h,M);
 const halo=group(parent,'Floating graphite and cyan halo');halo.position.set(.015,7.27,-.015);halo.rotation.set(.075,0,-.08);
 ringXZ(halo,.68,.071,.038,M.halo,'Graphite halo body');
 const edge=ringXZ(halo,.735,.010,.025,M.haloEdge,'Machined rim');edge.position.y=.006;
 const glow=ringXZ(halo,.629,.012,.009,M.cyan,'Continuous blue inner light');glow.position.y=-.024;
 return h;
}
