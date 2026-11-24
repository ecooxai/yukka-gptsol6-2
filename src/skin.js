import * as T from 'three';
import {C,clamp} from './geometry.js';
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const blend=(a,b,t)=>a.clone().lerp(b,clamp(t));
// Anime skin uses artist-directed, warm pigment gradients on actual 3D surfaces.
// Avoids gray shadow-map artifacts and preserves subtle volumes at every view.
export function paintSkin(model,M){
 if(!M.skin.isMeshBasicMaterial)return;
 model.updateMatrixWorld(true);
 const normal=new T.Vector3(),point=new T.Vector3(),normalMat=new T.Matrix3();
 const faceLight=C('#fff6f1'),faceShadow=C('#e4b9b7'),faceDeep=C('#c7909a');
 const bodyLight=C('#fff4ed'),bodyShade=C('#e4b3b2'),bodyDeep=C('#d39c9f');
 const direction=new T.Vector3(-.38,.73,.61).normalize();
 model.traverse(o=>{
  if(!o.isMesh||o.material!==M.skin)return;
  o.geometry=o.geometry.clone();
  const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,colors=new Float32Array(p.count*3);
  normalMat.getNormalMatrix(o.matrixWorld);
  const isFace=o.name==='Sculpted face';
  for(let i=0;i<p.count;i++){
   normal.fromBufferAttribute(n,i);point.fromBufferAttribute(p,i);
   let c;
   if(isFace){
    const side=smooth(.24,.96,1-normal.z),under=smooth(.03,.91,-normal.y);
    const temple=smooth(.25,.49,Math.abs(point.x))*.24;
    c=blend(faceLight,faceShadow,side*.54+under*.37+temple);
    c.lerp(faceDeep,.23*under*side);
    const nose=Math.exp(-(((point.x+.017)/.054)**2+((point.y+.205)/.052)**2));
    c.lerp(C('#e9b8b2'),.14*nose);
    // slight reflected color below the fringe and beside the temples
    c.lerp(C('#ead0d5'),.11*smooth(.04,.36,point.y)*smooth(.0,.6,normal.z));
   }else{
    normal.applyMatrix3(normalMat).normalize();point.applyMatrix4(o.matrixWorld);
    const light=normal.dot(direction);
    const transition=smooth(.035,.195,light);
    c=blend(bodyShade,bodyLight,transition);
    c.lerp(bodyDeep,.28*smooth(.02,.8,-light));
    if(/Neck|Covered upper body/.test(o.name)){
     const collarShadow=smooth(5.22,5.69,point.y);
     c.lerp(C('#d8a7a6'),.70*collarShadow);
    }
    if(/Raised anatomically tapered arm/.test(o.name)){
     const elbowShadow=(1-smooth(5.46,5.53,point.y+.13*(point.x+1.08)))*smooth(-.22,.70,normal.z);
     c.lerp(bodyShade,.55*elbowShadow);
    }
    if(/Relaxed pillow-holding arm/.test(o.name)){
     const cuff=smooth(4.30,4.44,point.y+.055*Math.sin(point.x*26)+.06*normal.x)*smooth(-.25,.60,normal.z);
     c.lerp(bodyShade,.83*cuff);
     const wrist=(1-smooth(3.28,3.43,point.y))*smooth(-.1,.75,normal.z);
     c.lerp(bodyShade,.72*wrist);
    }
    if(/leg/i.test(o.name)){
     const f=smooth(.10,.80,normal.z);
     const cuff=smooth(2.78,2.91,point.y+.058*Math.cos(point.x*19))*f;
     c.lerp(bodyShade,.78*cuff);
     if(/Rear weight-bearing/.test(o.name)){
      const calfShade=(1-smooth(2.03,2.17,point.y+.10*Math.cos(point.x*18)))*f;
      c.lerp(bodyShade,.80*calfShade+.10);
     }else{
      const knee=Math.exp(-(((point.y-2.15)/.12)**2))*Math.exp(-(((normal.x+.30)/.23)**2))*f;
      c.lerp(bodyShade,.38*knee);
     }
    }
   }
   colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  o.geometry.setAttribute('color',new T.BufferAttribute(colors,3));o.receiveShadow=false;
 });
}
