import * as T from 'three';
import {V,C,clamp,surface,interp} from './geometry.js';

// Two individually sculpted edge curves define a closed, tapered lens section.
// The mesh is volumetric, not a camera-facing card; back and profile are modeled.
export function lensRibbon(parent,material,left,right,{depth=.035,seed=0,name='Ribbon',pigment=false,nu=40,nv=72}={}){
 const L=new T.CatmullRomCurve3(left.map(p=>V(...p)),false,'centripetal');
 const R=new T.CatmullRomCurve3(right.map(p=>V(...p)),false,'centripetal');
 const dark=C('#403a70'),base=C('#625b98'),lit=C('#9a93c2');
 return surface(parent,nu,nv,(u,v)=>{
  const l=L.getPoint(v),r=R.getPoint(v),a=u*2*Math.PI,side=Math.cos(a),front=Math.sin(a);
  const p=l.clone().lerp(r,(side+1)/2);
  const thick=depth*Math.sin(Math.PI*v)**.65;
  // Hair ridge is strongest near the roots and softens towards the tip.
  const ridge=Math.sign(front)*Math.abs(front)**.78;
  p.z+=thick*ridge*(1+.085*Math.sin(v*16+side*5+seed));
  const result=[p.x,p.y,p.z];
  if(pigment){
   const gloss=Math.exp(-(((v-.35)/.25)**2))*Math.exp(-(((side+.15+.09*Math.sin(v*9+seed))/.65)**2));
   const c=dark.clone().lerp(base,.46+.27*Math.max(0,front)+.19*Math.sin(Math.PI*v));
   c.lerp(lit,.32*gloss*Math.max(0,front));
   c.lerp(dark,.18*Math.abs(side)**4);
   result.push(c.r,c.g,c.b);
  }
  return result;
 },material,name);
}
