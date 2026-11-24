import * as T from 'three';
import {V,clamp,mix,interp,mesh,surface,curve,mobileQuality} from './geometry.js';
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const gauss=(x,w)=>Math.exp(-((x/w)**2));
const waistY=3.49,waistRX=.53,waistRZ=.284,waistX=-.012,waistZ=-.008;

// A pants topology consists of two leg openings and a continuous waist.
// The two leg panels meet at a common curved crotch saddle, not overlapping
// cylinders. UV seam duplicates share the same positions and averaged normals.
export function sewnShorts(parent,M){
 const positions=[],uv=[],indices=[],n=mobileQuality?64:96,m=mobileQuality?42:65;
 function append(nu,nv,fn){
  const offset=positions.length/3;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const u=i/nu,v=j/nv,p=fn(u,v);positions.push(...p.slice(0,3));uv.push(...p.slice(3,5));
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=offset+j*(nu+1)+i,b=a+nu+1;indices.push(a,a+1,b,a+1,b+1,b);}
 }
 const legCenter=s=>s*.283;
 function legPoint(s,a,v){
  const sin=Math.sin(a),cos=Math.cos(a),outer=Math.max(0,s*sin),inner=Math.max(0,-s*sin),cx=legCenter(s),cz=s===1?.026:-.018;
  const topY=waistY-.345*inner**1.10,yy=mix(2.980,topY,v);
  const [rw,rd,ri]=interp([[0,.307,.246,.253],[.24,.354,.281,.270],[.55,.367,.297,.275],[.78,.344,.286,.270],[1,.29,.267,.25]],v);
  const foldWindow=Math.sin(Math.PI*v);
  // Drape folds follow the leg direction and a fabric gather near the cuff.
  const c1=s*(.33+.72*v),c2=s*(-.55+.40*v),c3=s*(1.72-.56*v);
  const ang=(x)=>Math.atan2(Math.sin(x),Math.cos(x));
  const gather=gauss(v-.19,.14),diag=s*(.57-1.18*v),innerCrease=s*(-.30-.60*(1-v));
  const fold=(.029*gauss(ang(a-c1),.19)-.036*gauss(ang(a-c2),.14)+.017*gauss(ang(a-c3),.23))*foldWindow
    +(.026*gauss(ang(a-diag),.15)-.029*gauss(ang(a-innerCrease),.13)+.014*Math.cos(a*7))*gather*clamp(v*9);

  const x0=cx+s*(rw*outer-ri*inner)+sin*fold,z0=cz+(rd+fold)*cos;
  const topX=waistX+s*waistRX*outer,topZ=waistZ+waistRZ*cos;
  const t=smooth(.48,1,v);
  let x=mix(x0,topX,t),z=mix(z0,topZ,t);
  const y=yy-.018*(.5+.5*Math.cos(a*7))*clamp(1-v*8)**2;
  // Maintain positive fabric allowance around the top of the actual thigh.
  // The correction fades out before the shared crotch and waist boundary.
  const lx=s===1?.274:-.298,lz=s===1?.05:-.024,rx=.241,rz=.218;
  const d=Math.hypot((x-lx)/rx,(z-lz)/rz),fade=1-smooth(3.10,3.19,y);
  if(d<1&&d>1e-5){const k=1+(1/d-1)*fade;x=lx+(x-lx)*k;z=lz+(z-lz)*k;}
  return [x,y,z];
 }
 for(const s of [-1,1]){
  append(n,m,(u,v)=>{
   const a=(u-.5)*2*Math.PI,p=legPoint(s,a,v);
   return [...p,u+(s===1?-.185:.05),v*.72+.07];
  });
 }
 const keys=[[waistY,waistRX,waistRZ,waistX,waistZ],[3.64,.552,.282,-.018,-.016],[3.78,.52,.274,-.022,-.018],[3.92,.49,.267,-.02,-.02]];
 append(n,mobileQuality?22:34,(u,v)=>{
  const a=(u-.5)*2*Math.PI,y=mix(waistY,3.92,v),[rx,rz,cx,cz]=interp(keys,y);
  return [cx+rx*Math.sin(a),y,cz+rz*Math.cos(a),u,.72+.28*v];
 });
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 // Average normals along all coincident sewn boundaries, retaining UV seams.
 const pa=geo.attributes.position,na=geo.attributes.normal,groups=new Map(),norm=new T.Vector3();
 for(let i=0;i<pa.count;i++){const key=[pa.getX(i),pa.getY(i),pa.getZ(i)].map(v=>Math.round(v*100000)).join(',');let g=groups.get(key);if(!g){g=[];groups.set(key,g);}g.push(i);}
 for(const g of groups.values())if(g.length>1){norm.set(0,0,0);for(const i of g)norm.add(new T.Vector3().fromBufferAttribute(na,i));norm.normalize();for(const i of g)na.setXYZ(i,norm.x,norm.y,norm.z);}
 na.needsUpdate=true;mesh(parent,geo,M.short,'Continuous sewn pajama shorts legs and waist');
 // Every gathered cuff is sewn directly into the leg boundary. Matching
 // positions remove the old overlapping cloth strips and their z-fighting.
 for(const s of [-1,1]){
  const cx=legCenter(s),cz=s===1?.026:-.018;
  const lobe=a=>Math.pow(.5+.5*Math.cos(a*7),.66);
  function cuff(a,v,inner=false){
   const sin=Math.sin(a),cos=Math.cos(a),out=Math.max(0,s*sin),ins=Math.max(0,-s*sin),scallop=lobe(a);
   const top=legPoint(s,a,0),r=.011+.023*scallop,bulge=r*Math.sin(Math.PI*v)**.85;
   const rx=.309+bulge,ri=.254+bulge*.42,rd=.252+bulge;
   let x=cx+s*(rx*out-ri*ins),z=cz+rd*cos;
   const join=smooth(.42,1,v);x=mix(x,top[0],join);z=mix(z,top[2],join);
   if(inner){x=mix(x,cx,.048);z=mix(z,cz,.052);}
   const y=mix(2.823-.091*scallop,top[1],v)+(inner?.003:0);
   return [x,y,z];
  }
  const band=surface(parent,112,32,(u,v)=>cuff((u-.5)*2*Math.PI,v),M.short,'Rounded gathered shorts ruffle');
  const tex=band.geometry.attributes.uv;for(let i=0;i<tex.count;i++){tex.setX(i,tex.getX(i)+(s===1?-.185:.05));tex.setY(i,tex.getY(i)*.15-.08);}tex.needsUpdate=true;
  surface(parent,112,18,(u,v)=>cuff((u-.5)*2*Math.PI,v,true),M.paleBlue,'Ruffle fabric inner side',true);
  surface(parent,112,5,(u,v)=>{const a=(u-.5)*2*Math.PI,p=cuff(a,0),q=cuff(a,0,true);return p.map((x,k)=>mix(x,q[k],v));},M.paleBlue,'Turned ruffle hem');
  const edge=[];for(let k=0;k<=112;k++)edge.push(cuff((k/112-.5)*2*Math.PI,0));
  curve(parent,edge,.0055,M.seam,'Scalloped ruffle stitched hem',112);
  const top=[];for(let k=0;k<=112;k++){const a=(k/112-.5)*2*Math.PI,p=cuff(a,1);p[0]+=.003*Math.sin(a);p[2]+=.003*Math.cos(a);top.push(p);}
  curve(parent,top,.0052,M.seam,'Elastic gathered top seam',112);
 }
}
