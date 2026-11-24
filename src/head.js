import * as T from 'three';
import {V,C,clamp,mix,interp,group,mesh,ellipsoid,surface,rings,sweep,curve,patch,ringXZ} from './geometry.js';

const headKeys=[
 [-.60,.016,.023,0,.135],[-.56,.119,.147,0,.115],[-.47,.251,.252,0,.078],[-.35,.377,.337,0,.042],[-.21,.478,.411,0,.014],[-.06,.514,.447,0,-.009],[.12,.520,.458,0,-.018],[.30,.507,.443,0,-.038],[.46,.447,.382,0,-.051],[.59,.307,.282,0,-.048],[.68,.135,.14,0,-.044],[.706,.001,.001,0,-.044]
];
function faceZ(x,y){
 const [rx,rz,cx,cz]=interp(headKeys,y);
 return cz+rz*Math.sqrt(Math.max(.001,1-((x-cx)/Math.max(.01,rx))**2))+.017*Math.exp(-((x/.115)**2+((y+.185)/.11)**2));
}
function eye(parent,M,sign){
 const x0=sign*.210,y0=-.088,rx=.163;
 const eyeLimits=(xx)=>{const u=clamp((xx-x0)/rx,-1,1),f=Math.max(0,1-u*u)**.49,tilt=sign*u*.013;return [y0-.082*f+tilt,y0+.097*f+tilt];};
 const z=(x,y,offset=0)=>faceZ(x,y)+.013+offset;
 surface(parent,48,20,(u,v)=>{const x=x0+rx*(2*u-1),[lo,hi]=eyeLimits(x),y=mix(lo,hi,v),c=C('#fffaff').lerp(C('#d7d2e7'),.60*v**4);return [x,y,z(x,y),c.r,c.g,c.b];},M.eyeWhite,'Almond eye white');
 // Violet irises, radial pigment, limbic ring and hand-drawn fibers.
 const ix=x0-sign*.012,iy=y0+.008,iw=.096,ih=.107;
 const dark=C('#38345d'),mid=C('#7f72c7'),bright=C('#b8aafa'),deep=C('#4f428b');
 surface(parent,96,32,(u,v)=>{
  const a=u*2*Math.PI,x=ix+Math.cos(a)*iw*v,yy=iy+Math.sin(a)*ih*v,[lo,hi]=eyeLimits(x),y=clamp(yy,lo+.001,hi-.001);
  const top=(Math.sin(a)+1)/2,ray=.5+.5*Math.sin(a*29+Math.sin(a*7)*2),c=deep.clone().lerp(mid,clamp((v-.26)*1.8)).lerp(bright,(1-top)*.65*clamp(v*1.8));
  c.lerp(dark,clamp((v-.85)*7));c.lerp(bright,ray*.13*Math.sin(v*Math.PI));c.lerp(dark,top*.31);
  return [x,y,z(x,y,.006),c.r,c.g,c.b];
 },M.iris,'Layered violet iris',true);
 patch(parent,ix,iy+.018,.037,.054,(x,y)=>z(x,y,.010),M.eyeInk,'Pupil');
 patch(parent,ix-.032,iy+.045,.025,.020,(x,y)=>z(x,y,.016),M.eyeLight,'Large catchlight');
 patch(parent,ix+.033,iy-.043,.013,.017,(x,y)=>z(x,y,.017),M.eyeLight,'Secondary catchlight');
 // Variable-thickness upper lash ribbon, rather than floating eyeliner.
 surface(parent,64,8,(u,v)=>{
  const x=x0+rx*(2*u-1),[,hi]=eyeLimits(x),outer=sign===1?u:1-u;
  const y=hi+v*(.008+.018*Math.sin(Math.PI*u)**.7+.020*outer**3);
  return [x,y,z(x,y,.012)];
 },M.eyeInk,'Upper eyelashes');
 const outer=x0+sign*rx;
 curve(parent,[[outer-sign*.052,y0+.065,z(outer-sign*.052,y0+.065,.015)],[outer,y0+.028,z(outer,y0+.028,.015)],[outer+sign*.037,y0+.048,faceZ(outer,y0+.04)+.01]],.008,M.eyeInk,'Outer eyelash',24);
 surface(parent,48,4,(u,v)=>{const x=x0+rx*(2*u-1),[lo]=eyeLimits(x);const y=lo-v*.0038*Math.sin(u*Math.PI);return [x,y,z(x,y,.011)];},M.eyebrow,'Lower lash line',true);
 const browY=.143;
 curve(parent,[[x0-sign*.138,browY-.01,faceZ(x0-sign*.138,browY-.01)+.012],[x0,browY+.042,faceZ(x0,browY+.042)+.012],[x0+sign*.125,browY+.018,faceZ(x0+sign*.125,browY+.018)+.01]],.010,M.eyebrow,'Delicate eyebrow',24);
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
 hairLock(parent,M,[[-.26,.63,.12],[-.45,.44,.25],[-.55,.02,.24],[-.53,-.29,.19],[-.42,-.47,.13],[-.29,-.51,.08]],.135,.057,3,'Left face framing');
 hairLock(parent,M,[[-.39,.48,.09],[-.55,.16,.12],[-.57,-.29,.11],[-.49,-.56,.11],[-.31,-.64,.03]],.113,.057,1,'Left lower lock');
 hairLock(parent,M,[[.25,.64,.13],[.46,.42,.26],[.56,.10,.24],[.54,-.28,.21],[.40,-.48,.17],[.26,-.51,.14]],.132,.057,2,'Right face framing');
 hairLock(parent,M,[[.43,.45,.08],[.57,.06,.09],[.57,-.38,.10],[.47,-.62,.04],[.33,-.64,.03]],.093,.049,6,'Right lower lock');
 // Layered fringe, sweeping across the forehead.
 const fringe=[
 {p:[[-.18,.68,.11],[-.34,.57,.35],[-.44,.32,.43],[-.43,.09,.43],[-.47,-.19,.35],[-.37,-.38,.29]],w:.114,d:.049},
 {p:[[-.12,.70,.18],[-.22,.56,.42],[-.25,.30,.49],[-.30,.14,.48],[-.33,.025,.43]],w:.126,d:.050},
 {p:[[.04,.71,.17],[-.08,.62,.43],[-.12,.39,.49],[-.077,.22,.50],[.027,.085,.49],[.191,-.030,.44]],w:.157,d:.052},
 {p:[[.08,.71,.15],[.02,.57,.43],[-.025,.39,.48],[.035,.22,.49],[.155,.082,.45]],w:.086,d:.039},
 {p:[[.14,.70,.14],[.33,.57,.32],[.408,.38,.38],[.437,.16,.40],[.425,-.08,.36],[.365,-.24,.30]],w:.107,d:.053},
 {p:[[.25,.64,.07],[.42,.48,.27],[.49,.28,.34],[.47,.02,.32],[.51,-.11,.24]],w:.102,d:.052}
 ];
 fringe.forEach((o,i)=>hairLock(parent,M,o.p,o.w,o.d,i*1.9,'Fringe lock '+(i+1)));
 hairLock(parent,M,[[-.22,.65,.04],[-.41,.60,.07],[-.64,.66,.03],[-.69,.79,.02],[-.60,.88,.01]],.061,.034,9,'Signature ahoge');
 // Fine directional locks soften the broad sculpted hair masses.
 const fine=[
  [[-.19,.66,.27],[-.32,.48,.415],[-.36,.20,.466],[-.36,-.02,.428],[-.42,-.22,.32]],
  [[.15,.68,.23],[.30,.53,.36],[.323,.30,.44],[.35,.06,.424],[.30,-.18,.33]],
  [[-.48,.19,.12],[-.58,-.12,.19],[-.54,-.38,.22],[-.43,-.55,.15],[-.35,-.57,.09]],
  [[.49,.19,.14],[.58,-.14,.18],[.56,-.37,.22],[.43,-.55,.17],[.32,-.57,.09]],
  [[.44,.19,-.25],[.69,-.47,-.37],[.81,-1.11,-.34],[1.16,-1.75,-.23],[1.26,-2.22,-.18]],
  [[-.47,.17,-.24],[-.65,-.55,-.35],[-.77,-1.12,-.30],[-1.05,-1.57,-.19],[-1.30,-1.86,-.12]]
 ];fine.forEach((p,i)=>{if(i!==2&&i!==3)hairLock(parent,M,p,[.039,.033,.038,.04,.065,.06][i],.025,11+i,'Fine directional lock '+i);});
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
  const z=-.082+.139*Math.sin(b)*taper+.005*Math.sin(u*42);
  return [x,y,z];
 },M.white,'Padded sleep headband',true);
 for(const side of [-1,1]){
  const pts=[];for(let i=0;i<=64;i++){const u=i/64,a=mix(-.22,Math.PI+.22,u),taper=.70+.30*Math.sin(Math.PI*u)**.4;pts.push([Math.cos(a)*(.603+.004*Math.sin(u*36)),.025+Math.sin(a)*(.745+.004*Math.sin(u*36)),-.082+side*.133*taper+.005*Math.sin(u*42)]);}
  curve(parent,pts,.006,M.whiteShadow,'Fine headband stitch',64);
 }
 ellipsoid(parent,M.white,[.005,.742,.045],[.13,.095,.114],[0,0,.12],'Bow knot');
 sweep(parent,[[-.055,.753,.035],[-.20,.80,.055],[-.35,.93,.055],[-.50,.985,.005],[-.58,.96,-.014]],[[0,.035,.035],[.25,.13,.065],[.58,.15,.063],[.83,.07,.03],[1,.002,.002]],M.white,{nu:40,nv:48,name:'Left pointed fabric bow',alter:(p,t,e,f,a,v,w,d)=>{p.addScaledVector(f,Math.sin(a*3)*d*.13*Math.sin(v*Math.PI));}});
 sweep(parent,[[.061,.753,.035],[.20,.80,.05],[.36,.98,.035],[.51,1.075,.002],[.58,1.11,-.02]],[[0,.037,.04],[.27,.12,.065],[.57,.142,.065],[.83,.067,.036],[1,.001,.001]],M.white,{nu:40,nv:48,name:'Right pointed fabric bow',alter:(p,t,e,f,a,v,w,d)=>{p.addScaledVector(f,Math.sin(a*3)*d*.18*Math.sin(v*Math.PI));}});
 curve(parent,[[-.07,.756,.14],[-.15,.82,.108],[-.27,.86,.098]],.010,M.whiteShadow,'Left fabric fold');
 curve(parent,[[.07,.76,.14],[.18,.81,.11],[.29,.91,.09]],.010,M.whiteShadow,'Right fabric fold');
}
export function createHead(parent,M){
 const h=group(parent,'Head, eyes, hair & accessories');h.position.set(-.025,6.02,.01);h.rotation.set(0,-.035,.045);h.scale.set(.92,.91,.96);
 rings(h,headKeys,M.skin,{nu:104,nv:88,name:'Sculpted face',alter:(p,a)=>{if(Math.cos(a)>0)p[2]+=.023*Math.exp(-((p[0]/.073)**2+((p[1]+.186)/.072)**2));return p;}});
 // Ear shells with inner cartilage and skin shading.
 for(const s of [-1,1]){
  ellipsoid(h,M.skin,[s*.482,-.17,-.035],[.084,.134,.067],[0,0,s*.19],'Ear');
  ellipsoid(h,M.skinShadow,[s*.513,-.17,.019],[.036,.082,.021],[0,0,s*.22],'Ear inner fold');
  eye(h,M,s);
  surface(h,24,24,(u,v)=>{const x=s*.295+(u-.5)*.29,y=-.246+(v-.5)*.18;return [x,y,faceZ(x,y)+.007];},M.blush,'Soft cheek blush');
  for(let i=0;i<6;i++){const x=s*.29+(i-2.5)*.017,y=-.251;curve(h,[[x-.009,y-.017,faceZ(x-.009,y-.017)+.008],[x+.006,y+.022,faceZ(x+.006,y+.022)+.008]],.0014,M.blushStroke,'Cheek blush stroke',8);}
 }
 // Subtle sculpted nose, mouth and chin detail.
 
 patch(h,-.012,-.200,.008,.004,(x,y)=>faceZ(x,y)+.012,M.skinShadow,'Nose shadow');
 curve(h,[[-.030,-.377,faceZ(-.030,-.377)+.006],[-.010,-.369,faceZ(-.010,-.369)+.009],[.010,-.371,faceZ(.010,-.371)+.009],[.031,-.379,faceZ(.031,-.379)+.006]],.0032,M.lip,'Small neutral mouth',24);
 hair(h,M);bow(h,M);
 const halo=group(parent,'Floating graphite and cyan halo');halo.position.set(-.015,7.20,-.015);halo.rotation.set(.075,0,-.08);
 ringXZ(halo,.68,.071,.038,M.halo,'Graphite halo body');
 const edge=ringXZ(halo,.735,.010,.025,M.haloEdge,'Machined rim');edge.position.y=.006;
 const glow=ringXZ(halo,.629,.012,.009,M.cyan,'Continuous blue inner light');glow.position.y=-.024;
 return h;
}
