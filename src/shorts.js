import * as T from 'three';
import {V,clamp,mix,interp,mesh,surface,curve} from './geometry.js';
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const gauss=(x,w)=>Math.exp(-((x/w)**2));
const waistY=3.49,waistRX=.53,waistRZ=.284,waistX=-.012,waistZ=-.008;

// A pants topology consists of two leg openings and a continuous waist.
// The two leg panels meet at a common curved crotch saddle, not overlapping
// cylinders. UV seam duplicates share the same positions and averaged normals.
export function sewnShorts(parent,M){
 const positions=[],uv=[],indices=[],n=96,m=65;
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
  const topY=waistY-.345*inner**1.10,yy=mix(2.930,topY,v);
  const [rw,rd,ri]=interp([[0,.315,.241,.255],[.24,.342,.265,.266],[.55,.348,.284,.275],[.78,.333,.278,.270],[1,.29,.267,.25]],v);
  const foldWindow=Math.sin(Math.PI*v);
  // Drape folds follow the leg direction and a fabric gather near the cuff.
  const c1=s*(.33+.72*v),c2=s*(-.55+.40*v),c3=s*(1.72-.56*v);
  const fold=(.019*gauss(Math.atan2(Math.sin(a-c1),Math.cos(a-c1)),.19)-.025*gauss(Math.atan2(Math.sin(a-c2),Math.cos(a-c2)),.16)+.012*gauss(Math.atan2(Math.sin(a-c3),Math.cos(a-c3)),.24))*foldWindow;
  const x0=cx+s*(rw*outer-ri*inner)+sin*fold,z0=cz+(rd+fold)*cos;
  const topX=waistX+s*waistRX*outer,topZ=waistZ+waistRZ*cos;
  const t=smooth(.48,1,v);
  const x=mix(x0,topX,t),z=mix(z0,topZ,t);
  const y=yy-.018*(.5+.5*Math.cos(a*7))*clamp(1-v*8)**2;
  return [x,y,z];
 }
 for(const s of [-1,1]){
  append(n,m,(u,v)=>{
   const a=(u-.5)*2*Math.PI,p=legPoint(s,a,v);
   return [...p,u,v*.72];
  });
 }
 const keys=[[waistY,waistRX,waistRZ,waistX,waistZ],[3.64,.552,.282,-.018,-.016],[3.78,.52,.274,-.022,-.018],[3.92,.49,.267,-.02,-.02]];
 append(n,34,(u,v)=>{
  const a=(u-.5)*2*Math.PI,y=mix(waistY,3.92,v),[rx,rz,cx,cz]=interp(keys,y);
  return [cx+rx*Math.sin(a),y,cz+rz*Math.cos(a),u,.72+.28*v];
 });
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 // Average normals along all coincident sewn boundaries, retaining UV seams.
 const pa=geo.attributes.position,na=geo.attributes.normal,groups=new Map(),norm=new T.Vector3();
 for(let i=0;i<pa.count;i++){const key=[pa.getX(i),pa.getY(i),pa.getZ(i)].map(v=>Math.round(v*100000)).join(',');let g=groups.get(key);if(!g){g=[];groups.set(key,g);}g.push(i);}
 for(const g of groups.values())if(g.length>1){norm.set(0,0,0);for(const i of g)norm.add(new T.Vector3().fromBufferAttribute(na,i));norm.normalize();for(const i of g)na.setXYZ(i,norm.x,norm.y,norm.z);}
 na.needsUpdate=true;mesh(parent,geo,M.short,'Continuous sewn pajama shorts legs and waist');
 // The lower edge is a real gathered ruffle band with rounded petal lobes.
 for(const s of [-1,1]){
  const cx=legCenter(s),cz=s===1?.026:-.018;
  const lobe=a=>Math.pow(.5+.5*Math.cos(a*7),.57);
  function cuff(a,v,inner=false){
   const sin=Math.sin(a),cos=Math.cos(a),out=Math.max(0,s*sin),ins=Math.max(0,-s*sin);
   const scallop=lobe(a),bulge=(.010+.012*scallop)*Math.sin(Math.PI*v);
   const rw=mix(.320,.309,v)+bulge-(inner?.012:0),ri=mix(.252,.257,v)+bulge*.4-(inner?.009:0),rd=mix(.249,.241,v)+bulge-(inner?.012:0);
   const x=cx+s*(rw*out-ri*ins),z=cz+rd*cos;
   const y=mix(2.826-.081*scallop,2.985,v)+(inner?.004:0);
   return [x,y,z];
  }
  const band=surface(parent,112,32,(u,v)=>cuff((u-.5)*2*Math.PI,v),M.short,'Rounded gathered shorts ruffle');
  const tex=band.geometry.attributes.uv;for(let i=0;i<tex.count;i++)tex.setY(i,tex.getY(i)*.12);tex.needsUpdate=true;
  surface(parent,112,18,(u,v)=>cuff((u-.5)*2*Math.PI,v,true),M.paleBlue,'Ruffle fabric inner side',true);
  const edge=[];for(let k=0;k<=112;k++)edge.push(cuff((k/112-.5)*2*Math.PI,0));
  curve(parent,edge,.0065,M.seam,'Scalloped ruffle stitched hem',112);
  const top=[];for(let k=0;k<=112;k++)top.push(cuff((k/112-.5)*2*Math.PI,1));
  curve(parent,top,.006,M.edge,'Elastic gathered top seam',112);
 }
}
