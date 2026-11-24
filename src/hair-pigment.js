import * as T from 'three';
import {C,clamp} from './geometry.js';
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const gauss=(x,w)=>Math.exp(-((x/w)**2));
export function paintHair(model,M){
 if(!M.hair.isMeshBasicMaterial)return;
 model.updateMatrixWorld(true);
 const nmat=new T.Matrix3(),n=new T.Vector3(),p=new T.Vector3(),base=new T.Color();
 const shade=C('#383562'),mid=C('#514d83'),light=C('#7974af'),rim=C('#9d95c7');
 const key=new T.Vector3(-.32,.72,.62).normalize();
 model.traverse(o=>{
  if(!o.isMesh||o.material!==M.hair)return;
  const geo=o.geometry,colors=geo.attributes.color,normal=geo.attributes.normal,pos=geo.attributes.position,uv=geo.attributes.uv;
  if(!colors)return;nmat.getNormalMatrix(o.matrixWorld);
  for(let i=0;i<pos.count;i++){
   n.fromBufferAttribute(normal,i).applyMatrix3(nmat).normalize();p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
   base.fromBufferAttribute(colors,i);
   const nl=n.dot(key),face=smooth(-.35,.75,n.z),back=smooth(.1,.85,-n.z),a=uv?uv.getX(i)*Math.PI*2:0,v=uv?uv.getY(i):0;
   // Controlled shadow pigment, a broad crown highlight and strand-following gloss.
   // Saturated indigo shadows and irregular, hand-painted cel reflection
   // shapes. UVs follow the actual hair cross-section and strand direction.
   const lit=smooth(-.28,.58,nl),edge=smooth(.56,.99,Math.abs(Math.cos(a)));
   base.lerp(mid,.17).lerp(shade,.19+.34*(1-lit)+.20*edge);
   const wave=.065*Math.sin(a*2.1+.7)+.026*Math.sin(a*5.2);
   const band=smooth(.15+wave,.19+wave,v)*(1-smooth(.43+wave,.48+wave,v));
   const lowerBand=smooth(.47-wave,.53-wave,v)*(1-smooth(.65-wave,.73-wave,v));
   const crown=gauss(p.y-(6.49+.07*Math.sin(p.x*5)),.23)*face;
   const cross=smooth(.06,.72,Math.abs(n.z));
   const gloss=band*cross*(.55+.45*gauss(Math.cos(a)-.06,.55));
   const frontHighlight=face*(.69*gloss+.29*lowerBand*cross)+.37*crown;
   const rearHighlight=back*(.67*band+.30*lowerBand)*cross*(.48+.52*gauss(Math.cos(a)+.15,.55));
   base.lerp(light,clamp(frontHighlight+rearHighlight));
   base.lerp(rim,.12*band*face*gauss(Math.cos(a)-.10,.28)+.10*rearHighlight);
   colors.setXYZ(i,base.r,base.g,base.b);
  }
  colors.needsUpdate=true;o.receiveShadow=false;
 });
}
