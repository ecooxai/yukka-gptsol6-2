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
 const bodyLight=C('#fff0e9'),bodyShade=C('#e6b6b5'),bodyDeep=C('#ca959c');
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
    const transition=smooth(-.08,.43,light);
    c=blend(bodyShade,bodyLight,transition);
    c.lerp(bodyDeep,.34*smooth(.02,.8,-light));
    if(/Neck|Covered upper body/.test(o.name)){
     const collarShadow=smooth(5.22,5.69,point.y);
     c.lerp(C('#d8a7a6'),.70*collarShadow);
    }
    if(/Rear weight-bearing leg/.test(o.name))c.lerp(bodyShade,.46);
    if(/leg/i.test(o.name)){
     const knee=Math.exp(-(((point.y-2.22)/.23)**2))*smooth(.15,.9,normal.z);
     c.lerp(C('#e9bdb8'),.10*knee);
    }
   }
   colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  o.geometry.setAttribute('color',new T.BufferAttribute(colors,3));o.receiveShadow=false;
 });
}
