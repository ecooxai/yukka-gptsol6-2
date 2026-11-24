import * as T from 'three';
import {posePoint} from './character.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
const P=a=>posePoint(V(...a));
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const pair=(a,b,t)=>[[a,1-t],[b,t]];
const ancestors=(o,pattern)=>{for(let p=o;p;p=p.parent)if(pattern.test(p.name))return true;return false;};
function closest(p,a,b){
 const x=b.x-a.x,y=b.y-a.y,z=b.z-a.z,dx=p.x-a.x,dy=p.y-a.y,dz=p.z-a.z;
 const t=T.MathUtils.clamp((dx*x+dy*y+dz*z)/Math.max(1e-9,x*x+y*y+z*z),0,1);
 return [t,(dx-x*t)**2+(dy-y*t)**2+(dz-z*t)**2];
}
// The joints are in the actual reference pose, not an unrelated T-pose.
const limbs={
 R:{shoulder:[-.56,5.39,.006],elbow:[-1.21,5.39,.094],wrist:[-.78,6.02,.191],palm:[-.716,6.19,.225],
 fingers:[
 [[-.773,6.17,.221],[-.807,6.252,.228],[-.808,6.321,.239],[-.780,6.366,.251]],
 [[-.744,6.220,.228],[-.731,6.320,.234],[-.700,6.389,.249],[-.669,6.375,.265]],
 [[-.708,6.215,.231],[-.668,6.306,.246],[-.619,6.331,.265],[-.591,6.301,.279]],
 [[-.679,6.184,.233],[-.632,6.260,.252],[-.581,6.275,.270],[-.553,6.246,.274]],
 [[-.691,6.087,.244],[-.643,6.126,.269],[-.609,6.171,.286],[-.616,6.204,.272]]
 ],hip:[-.298,3.34,-.024],knee:[-.34,2.04,-.08],ankle:[-.125,.67,-.37],toe:[-.125,.54,-.08]},
 L:{shoulder:[.56,5.34,.005],elbow:[.743,4.56,.039],wrist:[.996,3.28,.151],palm:[1.085,3.105,.176],
 fingers:[
 [[1.053,3.045,.192],[1.095,3.017,.232],[1.136,2.967,.235],[1.135,2.905,.212]],
 [[1.078,3.027,.191],[1.132,2.998,.228],[1.17,2.947,.221],[1.159,2.89,.190]],
 [[1.102,3.015,.179],[1.156,2.987,.206],[1.187,2.949,.191],[1.175,2.903,.172]],
 [[1.122,3.009,.159],[1.17,2.988,.177],[1.196,2.953,.159],[1.181,2.927,.145]],
 [[1.028,3.103,.196],[1.10,3.09,.243],[1.16,3.047,.24],[1.167,3.007,.225]]
 ].map(f=>f.map(p=>[p[0],p[1]+.08,p[2]])),hip:[.274,3.34,.05],knee:[.20,2.06,.19],ankle:[.065,.26,.48],toe:[.065,.11,.78]}
};
export function rigCharacter(model){
 model.updateMatrixWorld(true);
 const original=[];model.traverse(o=>{if(o.isMesh)original.push(o);});
 const bones=[],index={},points={},B={};
 function add(name,at,parent=null){
  const b=new T.Bone();b.name=name;const i=bones.length;bones.push(b);index[name]=i;points[name]=at.clone();B[name]=b;
  if(parent){b.position.copy(at).sub(points[parent]);B[parent].add(b);}else{b.position.copy(at);model.add(b);}
  return i;
 }
 add('Root',V(0,0,0));add('Hips',P([-.03,3.52,0]),'Root');add('Spine',P([-.03,4.28,0]),'Hips');add('Chest',P([0,5.02,0]),'Spine');add('Neck',P([-.027,5.64,.027]),'Chest');add('Head',V(.035,5.76,.01),'Neck');
 add('HairUpper',V(.04,5.91,-.34),'Head');add('HairMiddle',V(.13,5.15,-.45),'HairUpper');add('HairLower',V(.22,4.52,-.41),'HairMiddle');
 const fingerNames=['Little','Ring','Middle','Index','Thumb'];
 for(const s of ['R','L']){
  const l=limbs[s];
  add(s+'Clavicle',P([s==='R'?-.19:.19,5.33,.005]),'Chest');
  add(s+'UpperArm',P(l.shoulder),s+'Clavicle');add(s+'Forearm',P(l.elbow),s+'UpperArm');add(s+'Hand',P(l.wrist),s+'Forearm');
  for(let i=0;i<5;i++){const f=l.fingers[i],prefix=s+fingerNames[i];for(let j=0;j<3;j++)add(prefix+(j+1),P(f[j]),j?prefix+j:s+'Hand');}
  add(s+'Thigh',P(l.hip),'Hips');add(s+'Shin',P(l.knee),s+'Thigh');add(s+'Foot',P(l.ankle),s+'Shin');add(s+'Toe',P(l.toe),s+'Foot');
 }
 model.updateMatrixWorld(true);
 const skeleton=new T.Skeleton(bones);
 const idx=n=>index[n],one=n=>[[idx(n),1]];
 const mapped={};for(const s of ['R','L'])mapped[s]={palm:P(limbs[s].palm),fingers:limbs[s].fingers.map(f=>f.map(P))};
 const torso=(p)=>{
  const y=p.y;
  if(y<4.35)return pair(idx('Hips'),idx('Spine'),smooth(3.74,4.35,y));
  if(y<4.98)return pair(idx('Spine'),idx('Chest'),smooth(4.35,4.98,y));
  if(y<5.72)return pair(idx('Chest'),idx('Neck'),smooth(5.32,5.72,y));
  return pair(idx('Neck'),idx('Head'),smooth(5.72,5.91,y));
 };
 function arm(p,s){
  const l=limbs[s],sh=points[s+'UpperArm'],el=points[s+'Forearm'],wr=points[s+'Hand'];
  const [t1,d1]=closest(p,sh,el),[t2,d2]=closest(p,el,wr),[th,dh]=closest(p,wr,mapped[s].palm);
  // A distinct weight gradient at the wrist and elbow avoids detached pieces.
  if(dh<=Math.min(d1,d2)+.0008 || (t2>.98&&d2<d1)){
   let best=null;
   for(let f=0;f<5;f++)for(let j=0;j<3;j++){
    const a=mapped[s].fingers[f][j],b=mapped[s].fingers[f][j+1],[t,d]=closest(p,a,b);
    if(!best||d<best.d)best={f,j,t,d};
   }
   if(best&&best.d<.0032&&best.d<dh*.87){
    const prefix=s+fingerNames[best.f],parent=best.j?prefix+best.j:s+'Hand',cur=prefix+(best.j+1),next=best.j<2?prefix+(best.j+2):cur;
    if(best.t<.22)return pair(idx(parent),idx(cur),smooth(0,.25,best.t));
    return pair(idx(cur),idx(next),smooth(.74,1,best.t));
   }
   return one(s+'Hand');
  }
  if(d1<d2){
   const f=smooth(.79,1,t1);return pair(idx(s+'UpperArm'),idx(s+'Forearm'),f*.5);
  }
  if(t2<.22)return pair(idx(s+'UpperArm'),idx(s+'Forearm'),.5+.5*smooth(0,.22,t2));
  return pair(idx(s+'Forearm'),idx(s+'Hand'),smooth(.84,1,t2)*.5);
 }
 function leg(p,s){
  const a=points[s+'Thigh'],b=points[s+'Shin'],c=points[s+'Foot'],[t1,d1]=closest(p,a,b),[t2,d2]=closest(p,b,c);
  if(d1<d2)return pair(idx(s+'Thigh'),idx(s+'Shin'),.5*smooth(.77,1,t1));
  if(t2<.21)return pair(idx(s+'Thigh'),idx(s+'Shin'),.5+.5*smooth(0,.21,t2));
  return pair(idx(s+'Shin'),idx(s+'Foot'),smooth(.85,1,t2)*.5);
 }
 function classification(o){
  const n=o.name;
  if(ancestors(o,/Floating graphite/))return {rigid:'Head'};
  if(ancestors(o,/Head, eyes/)){
   if(/rear tress|rear strand|directional lock|silhouette strand|loose hair strand|hair curtain/i.test(n))return {fn:p=>{
    const y=p.y;if(y>5.55)return pair(idx('Head'),idx('HairUpper'),1-smooth(5.55,6.11,y));
    if(y>4.83)return pair(idx('HairUpper'),idx('HairMiddle'),1-smooth(4.83,5.55,y));
    return pair(idx('HairMiddle'),idx('HairLower'),1-smooth(4.0,4.83,y));
   }};
   return {rigid:'Head'};
  }
  if(ancestors(o,/Soft white bed pillow/))return {rigid:'LHand'};
  if(ancestors(o,/Plush bedroom slipper/)){
   let p=o;while(p&&!/Plush bedroom slipper/.test(p.name))p=p.parent;
   return {rigid:p.position.x<0?'RFoot':'LFoot'};
  }
  if(/Raised hand nail|Holding hand nail/.test(n))return {rigid:(n.startsWith('Raised')?'R':'L')+fingerNames[Number(n.match(/\d+$/)?.[0]||1)-1]+'3'};
  if(/Raised anatomically/.test(n))return {fn:p=>arm(p,'R')};
  if(/Relaxed pillow-holding/.test(n))return {fn:p=>arm(p,'L')};
  if(/Rear weight-bearing leg/.test(n))return {fn:p=>leg(p,'R')};
  if(/Forward relaxed leg/.test(n))return {fn:p=>leg(p,'L')};
  if(/scalloped sleeve|scalloped cuff|Cuff inner seam/i.test(n)){
   const box=new T.Box3().setFromObject(o),s=box.getCenter(V(0,0,0)).x<0?'R':'L';
   return {fn:p=>pair(idx('Chest'),idx(s+'UpperArm'),smooth(.30,.68,Math.abs(p.x)))};
  }
  if(/pajama shorts|shorts ruffle|Ruffle fabric|ruffle stitched|Elastic gathered/i.test(n))return {fn:p=>{
   const s=p.x<-.14?'R':'L',t=(1-smooth(3.12,3.83,p.y))*(.60+.40*smooth(.02,.22,Math.abs(p.x+.14)));
   return pair(idx('Hips'),idx(s+'Thigh'),t);
  }};
  return {fn:torso};
 }
 // Bake rest geometry once; preserve full authored vertex colors and UVs.
 // Rigid accessories stay normal meshes; deformable anatomy and cloth use LBS.
 let skinned=0,rigid=0,vertices=0,restError=0;const faceMorphs=[];
 const transformGeometry=(g,m)=>{g.applyMatrix4(m);for(const a of g.morphAttributes.position||[]){if(!g.morphTargetsRelative)a.applyMatrix4(m);else a.applyMatrix3(new T.Matrix3().setFromMatrix4(m));}};
 for(const o of original){
  const type=classification(o),g=o.geometry.clone();transformGeometry(g,o.matrixWorld);
  let m;
  if(type.rigid){
   const bone=B[type.rigid];transformGeometry(g,bone.matrixWorld.clone().invert());
   m=new T.Mesh(g,o.material);bone.add(m);m.userData.rigidBone=index[type.rigid];rigid++;
  }else{
   const p=g.attributes.position,ids=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4),v=V(0,0,0);
   for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);const w=type.fn(v).filter(x=>x[1]>1e-7),sum=w.reduce((a,x)=>a+x[1],0);
    for(let j=0;j<w.length;j++){ids[i*4+j]=w[j][0];weights[i*4+j]=w[j][1]/sum;}
   }
   g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
   m=new T.SkinnedMesh(g,o.material);model.add(m);m.bind(skeleton,new T.Matrix4());m.frustumCulled=false;skinned++;vertices+=p.count;
   // At rest, inverse bind transforms must preserve every sampled vertex.
   for(let i=0;i<p.count;i+=Math.max(1,Math.floor(p.count/13))){
    v.fromBufferAttribute(p,i);const q=v.clone();m.applyBoneTransform(i,q);restError=Math.max(restError,v.distanceTo(q));
   }
  }
  m.name=o.name;if(m.morphTargetInfluences?.length){m.morphTargetInfluences.fill(0);faceMorphs.push(m);}m.castShadow=o.castShadow;m.receiveShadow=o.receiveShadow;m.renderOrder=o.renderOrder;m.visible=o.visible;
  o.removeFromParent();o.geometry.dispose();
 }
 // Keep only the actual rig/mesh hierarchy, remove empty sculpt helper groups.
 for(const child of [...model.children])if(!child.isBone&&!child.isMesh)model.remove(child);
 model.updateMatrixWorld(true);
 const e=new T.Euler(),q=new T.Quaternion(),times=[0,1,2,3,4,5,6],tracks=[];
 const motions={Chest:[.008,.009,.009,0],Neck:[.005,.010,.005,.9],Head:[.009,.028,.017,1.4],RHand:[.014,.013,.011,1.1],LHand:[.006,.007,.009,.4],HairUpper:[.008,.013,.009,1.6],HairMiddle:[.010,.017,.014,2.2],HairLower:[.014,.019,.017,2.7],RIndex3:[.008,0,.008,1.7],RMiddle3:[.006,0,.009,2.0]};
 // Sinusoidal loop closes exactly at 6 seconds; all motion is optional.
 for(const [name,[x,y,z,phase]] of Object.entries(motions)){
  const values=[];for(const t of times){const w=2*Math.PI*t/6,s=Math.sin(w+phase)-Math.sin(phase),c=Math.sin(w+phase+.7)-Math.sin(phase+.7);e.set(x*s,y*c,z*s);q.setFromEuler(e);values.push(q.x,q.y,q.z,q.w);}
  tracks.push(new T.QuaternionKeyframeTrack(name+'.quaternion',times,values,T.InterpolateLinear));
 }
 const blinkTimes=[0,1.72,1.84,1.93,2.02,2.14,4.46,4.58,4.67,4.80,6],blinkValues=[0,0,.48,1,.55,0,0,.48,1,0,0];
 for(const m of faceMorphs)tracks.push(new T.NumberKeyframeTrack(m.uuid+'.morphTargetInfluences[Blink]',blinkTimes,blinkValues,T.InterpolateLinear));
 const clip=new T.AnimationClip('Quiet breathing, blinking and hair sway',6,tracks),mixer=new T.AnimationMixer(model);
 const action=mixer.clipAction(clip);action.play();action.paused=true;
 const rig={bones,index,skeleton,clip,mixer,action,faceMorphs,metrics:{joints:bones.length,skinnedMeshes:skinned,rigidMeshes:rigid,skinnedVertices:vertices,restError,facialMorphMeshes:faceMorphs.length},
  pose(time){action.paused=false;mixer.setTime(time);action.paused=true;model.updateMatrixWorld(true);},
  reset(){action.paused=false;mixer.setTime(0);action.paused=true;model.updateMatrixWorld(true);}
 };
 rig.reset();return rig;
}
