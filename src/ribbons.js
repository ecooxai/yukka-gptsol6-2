import * as T from 'three';
import {V,C,clamp,surface,interp} from './geometry.js';

// Two individually sculpted edge curves define a closed, tapered lens section.
// The mesh is volumetric, not a camera-facing card; back and profile are modeled.
export function lensRibbon(parent,material,left,right,{depth=.035,seed=0,name='Ribbon',pigment=false,nu=40,nv=72}={}){
 if(pigment){nu=Math.max(nu,60);nv=Math.max(nv,108);}
 const L=new T.CatmullRomCurve3(left.map(p=>V(...p)),false,'centripetal');
 const R=new T.CatmullRomCurve3(right.map(p=>V(...p)),false,'centripetal');
 const dark=C('#393561'),base=C('#625b99'),lit=C('#9c95c6');
 let last=-1,l,r;const ribbon=surface(parent,nu,nv,(u,v)=>{
  if(last!==v){last=v;l=L.getPoint(v);r=R.getPoint(v);}const a=u*2*Math.PI,side=Math.cos(a),front=Math.sin(a);
  const p=l.clone().lerp(r,(side+1)/2);
  const thick=depth*Math.sin(Math.PI*v)**.65;
  // Hair ridge is strongest near the roots and softens towards the tip.
  const ridge=Math.sign(front)*Math.abs(front)**.78;
  p.z+=thick*ridge*(1+.085*Math.sin(v*16+side*5+seed));
  const result=[p.x,p.y,p.z];
  if(pigment){
   const gloss=Math.exp(-(((v-.35)/.25)**2))*Math.exp(-(((side+.15+.09*Math.sin(v*9+seed))/.65)**2));
   const c=dark.clone().lerp(base,.46+.27*Math.max(0,front)+.19*Math.sin(Math.PI*v));
   const edgeMask=clamp((.76-Math.abs(side))/.18),wave=.055*Math.sin(side*4.7+seed*.6)+.028*Math.sin(side*9+seed);
   const step=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
   const stripe=step(.20+wave,.25+wave,v)*(1-step(.50+wave,.56+wave,v));
   c.lerp(lit,(.28*gloss+.25*stripe*edgeMask)*Math.max(0,front));
   c.lerp(dark,.32*Math.abs(side)**4);
   result.push(c.r,c.g,c.b);
  }
  return result;
 },material,name);
 // Edge curves run in different directions for left/right bows; guarantee
 // outward normals on the +Z surface rather than accidentally painting its back.
 const geo=ribbon.geometry,uv=geo.attributes.uv,n=geo.attributes.normal;
 let closest=0,dist=Infinity;
 for(let i=0;i<uv.count;i++){const d=(uv.getX(i)-.25)**2+(uv.getY(i)-.5)**2;if(d<dist){dist=d;closest=i;}}
 if(n.getZ(closest)<0){const ix=geo.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,a);}ix.needsUpdate=true;geo.computeVertexNormals();}
 return ribbon;
}
