import * as T from 'three';
import {group,interp} from './geometry.js';
import {paintSkin} from './skin.js';
import {paintTextiles} from './textile.js';
import {paintHair} from './hair-pigment.js';
import {materials} from './materials.js';
import {createBody} from './body.js';
import {createHead} from './head.js';

// Continuous pose deformation keeps the tailored garment and attached details aligned.
function tailorPose(body){
 const heightKeys=[[0,0,0],[.45,0,.025],[1.2,0,.03],[2.0,.04,-.005],[2.72,.17,-.08],[3.2,.16,-.15],[3.75,.19,-.185],[4.3,.17,-.16],[4.85,.13,-.105],[5.4,.095,-.035],[5.75,.07,.035],[6.5,.045,.035]];
 body.updateMatrixWorld(true);
 const p=new T.Vector3(),m=new T.Matrix4(),inv=new T.Matrix4();
 body.traverse(o=>{
  if(!o.isMesh)return;
  m.copy(o.matrixWorld);inv.copy(m).invert();
  o.geometry=o.geometry.clone();const a=o.geometry.attributes.position;
  for(let i=0;i<a.count;i++){
   p.fromBufferAttribute(a,i).applyMatrix4(m);
   const [dy,dx]=interp(heightKeys,p.y),shoulder=Math.exp(-(((p.y-5.15)/.95)**2));
   const originalX=p.x;
   p.x+=dx;
   p.y+=dy-.105*originalX*shoulder;
   p.z+=.085*originalX*Math.exp(-(((p.y-4.4)/1.4)**2));
   p.applyMatrix4(inv);a.setXYZ(i,p.x,p.y,p.z);
  }
  a.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
 });
}
export function createCharacter(scene){
 const model=group(scene,'YUUKA • GPT-6.2 • original procedural sculpture');
 const M=materials();const body=createBody(model,M);tailorPose(body);createHead(model,M);paintSkin(model,M);paintTextiles(model,M);paintHair(model,M);return model;
}
