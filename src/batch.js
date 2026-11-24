import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Merge only meshes with the same material, skin binding and parent transform.
// Transparent parts remain separate for correct depth sorting.
export function batchCompatible(root,skeleton){
 const map=new Map(),parts=[];root.traverse(o=>{if(o.isMesh)parts.push(o);});
 let removed=0,merged=0;
 const matKey=o=>o.material?.uuid;
 for(const o of parts){
  if(o.morphTargetInfluences?.length||Array.isArray(o.material)||o.material.transparent||!o.geometry.index||!o.geometry.attributes.position||o.geometry.groups.length>1)continue;
  // All rigged meshes use identity local transforms and are baked into the
  // shared coordinate system. Rigid meshes are in their own bone-local space.
  if(o.position.lengthSq()>1e-12||o.quaternion.angleTo(new T.Quaternion())>1e-8||o.scale.distanceTo(new T.Vector3(1,1,1))>1e-8)continue;
  const attrs=Object.keys(o.geometry.attributes).sort().join(','),k=[o.parent.uuid,matKey(o),o.isSkinnedMesh?'S':'R',attrs,o.castShadow,o.receiveShadow,o.renderOrder,o.visible].join('|');
  if(!map.has(k))map.set(k,[]);map.get(k).push(o);
 }
 for(const list of map.values()){
  if(list.length<2)continue;
  const first=list[0],geo=mergeGeometries(list.map(o=>o.geometry),false);
  if(!geo)continue;
  geo.computeBoundingBox();geo.computeBoundingSphere();
  const m=first.isSkinnedMesh?new T.SkinnedMesh(geo,first.material):new T.Mesh(geo,first.material);
  m.name='Batch '+first.name+' + '+(list.length-1)+' parts';m.userData.parts=list.map(o=>o.name);
  m.castShadow=first.castShadow;m.receiveShadow=first.receiveShadow;m.renderOrder=first.renderOrder;m.visible=first.visible;m.frustumCulled=first.frustumCulled;
  first.parent.add(m);
  if(first.isSkinnedMesh)m.bind(skeleton,new T.Matrix4());
  else if(first.userData.rigidBone!==undefined)m.userData.rigidBone=first.userData.rigidBone;
  for(const o of list){o.removeFromParent();o.geometry.dispose();}
  removed+=list.length;merged++;
 }
 return {original:parts.length,combined:merged,after:parts.length-removed+merged,removed:removed-merged};
}
