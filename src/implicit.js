import * as T from 'three';
import {edgeTable,triTable} from 'three/addons/objects/MarchingCubes.js';
import {V,interp,mesh} from './geometry.js';

// Generate a welded implicit surface from multiple tapered elliptical sweeps.
// A narrow-band rasterizer avoids evaluating every capsule at every grid point.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function makeSegments(tube){
 const path=new T.CatmullRomCurve3(tube.points.map(p=>V(...p)),false,'centripetal');
 const count=tube.samples??24,arr=[];
 for(let i=0;i<count;i++){
  const t0=i/count,t1=(i+1)/count,a=path.getPoint(t0),b=path.getPoint(t1),d=b.clone().sub(a),len2=d.lengthSq(),axis=d.clone().normalize();
  const e=new T.Vector3().crossVectors(axis,V(0,0,1)).normalize(),f=new T.Vector3().crossVectors(axis,e).normalize();
  const r0=interp(tube.profile,t0).map(r=>Math.max(.003,r)),r1=interp(tube.profile,t1).map(r=>Math.max(.003,r));
  arr.push({a,b,d,len2,axis,e,f,r0,r1,rad:Math.max(...r0,...r1)});
 }
 return arr;
}
export function implicitSweeps(parent,material,tubes,{step=.011,smooth=.012,name='Unified anatomical surface'}={}){
 const groups=tubes.map(makeSegments),segments=groups.flat();
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const s of segments)for(let k=0;k<3;k++){
  lo[k]=Math.min(lo[k],s.a.getComponent(k)-s.rad-.035,s.b.getComponent(k)-s.rad-.035);
  hi[k]=Math.max(hi[k],s.a.getComponent(k)+s.rad+.035,s.b.getComponent(k)+s.rad+.035);
 }
 const [nx,ny,nz]=hi.map((v,k)=>Math.ceil((v-lo[k])/step)+1),plane=nx*ny,total=plane*nz;
 const grid=new Float32Array(total);grid.fill(.12);
 const scratch=new Float32Array(total);scratch.fill(.12);
 const touched=new Uint32Array(total);let num=0;
 for(let gi=0;gi<groups.length;gi++){
  for(const s of groups[gi]){
   const pad=s.rad+.028,bounds=[];
   for(let k=0;k<3;k++){
    bounds.push(Math.max(0,Math.floor((Math.min(s.a.getComponent(k),s.b.getComponent(k))-pad-lo[k])/step)),Math.min([nx,ny,nz][k]-1,Math.ceil((Math.max(s.a.getComponent(k),s.b.getComponent(k))+pad-lo[k])/step)));
   }
   for(let z=bounds[4];z<=bounds[5];z++)for(let y=bounds[2];y<=bounds[3];y++)for(let x=bounds[0];x<=bounds[1];x++){
    const id=x+y*nx+z*plane,px=lo[0]+x*step-s.a.x,py=lo[1]+y*step-s.a.y,pz=lo[2]+z*step-s.a.z;
    const t=clamp((px*s.d.x+py*s.d.y+pz*s.d.z)/Math.max(1e-10,s.len2));
    const qx=px-s.d.x*t,qy=py-s.d.y*t,qz=pz-s.d.z*t;
    const rw=s.r0[0]+(s.r1[0]-s.r0[0])*t,rd=s.r0[1]+(s.r1[1]-s.r0[1])*t,rr=Math.min(rw,rd);
    const qe=(qx*s.e.x+qy*s.e.y+qz*s.e.z)/rw,qf=(qx*s.f.x+qy*s.f.y+qz*s.f.z)/rd,qa=(qx*s.axis.x+qy*s.axis.y+qz*s.axis.z)/rr;
    const sd=(Math.sqrt(qe*qe+qf*qf+qa*qa)-1)*rr;
    if(sd<scratch[id]){
     if(scratch[id]===.12||scratch[id]>.119999) touched[num++]=id;
     scratch[id]=sd;
    }
   }
  }
  // Blend the palm and finger roots but preserve space between distal fingers.
  const k=tubes[gi].smooth??smooth;
  for(let i=0;i<num;i++){
   const id=touched[i],a=grid[id],b=scratch[id],h=Math.max(k-Math.abs(a-b),0)/k;
   grid[id]=Math.min(a,b)-h*h*k*.25;scratch[id]=.12;
  }num=0;
 }
 const vertices=[],indices=[],normals=[],cache=new Map();
 const xyz=id=>{const z=Math.floor(id/plane),rem=id-z*plane,y=Math.floor(rem/nx),x=rem-y*nx;return [lo[0]+x*step,lo[1]+y*step,lo[2]+z*step];};
 const grad=id=>[grid[Math.min(total-1,id+1)]-grid[Math.max(0,id-1)],grid[Math.min(total-1,id+nx)]-grid[Math.max(0,id-nx)],grid[Math.min(total-1,id+plane)]-grid[Math.max(0,id-plane)]];
 function vertex(a,b){
  const key=Math.min(a,b)*total+Math.max(a,b);
  if(cache.has(key))return cache.get(key);
  const t=clamp(grid[a]/(grid[a]-grid[b])),p=xyz(a),q=xyz(b),ga=grad(a),gb=grad(b),g=new T.Vector3(ga[0]+(gb[0]-ga[0])*t,ga[1]+(gb[1]-ga[1])*t,ga[2]+(gb[2]-ga[2])*t).normalize();
  const i=vertices.length/3;vertices.push(...p.map((v,k)=>v+(q[k]-v)*t));normals.push(g.x,g.y,g.z);cache.set(key,i);return i;
 }
 function triangle(a,b,c){
  if(a===b||b===c||c===a)return;
  const ax=vertices[3*a],ay=vertices[3*a+1],az=vertices[3*a+2],bx=vertices[3*b]-ax,by=vertices[3*b+1]-ay,bz=vertices[3*b+2]-az,cx=vertices[3*c]-ax,cy=vertices[3*c+1]-ay,cz=vertices[3*c+2]-az;
  const dot=(by*cz-bz*cy)*normals[3*a]+(bz*cx-bx*cz)*normals[3*a+1]+(bx*cy-by*cx)*normals[3*a+2];
  if(dot>=0)indices.push(a,b,c);else indices.push(a,c,b);
 }
 // Indexed marching cubes uses far fewer triangles than a tetrahedral split.
 const offsets=[0,1,nx+1,nx,plane,plane+1,plane+nx+1,plane+nx];
 const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],ev=new Int32Array(12);
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const id=x+y*nx+z*plane;let bits=0;for(let j=0;j<8;j++)if(grid[id+offsets[j]]<0)bits|=1<<j;
  const mask=edgeTable[bits];if(!mask)continue;
  for(let e=0;e<12;e++)if(mask&(1<<e)){const [a,b]=edges[e];ev[e]=vertex(id+offsets[a],id+offsets[b]);}
  const table=bits*16;
  for(let k=0;triTable[table+k]!==-1;k+=3)triangle(ev[triTable[table+k]],ev[triTable[table+k+1]],ev[triTable[table+k+2]]);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setIndex(indices);geo.computeBoundingSphere();
 return mesh(parent,geo,material,name);
}
