import * as T from 'three';
export const V=(x,y,z=0)=>new T.Vector3(x,y,z);
const meshDetail=new URLSearchParams(location.search).get('quality');
export const quality=meshDetail==='ultra'?1:meshDetail==='mobile'?.58:.84;
export const mobileQuality=meshDetail==='mobile';
export const C=x=>new T.Color(x);
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
const toonRamp=new T.DataTexture(new Uint8Array([45,113,190,255]),4,1,T.RedFormat);
toonRamp.minFilter=toonRamp.magFilter=T.NearestFilter;toonRamp.generateMipmaps=false;toonRamp.needsUpdate=true;
const skinRamp=new T.DataTexture(new Uint8Array([108,120,132,145,158,170,184,198,211,224,235,244,250,254,255,255]),16,1,T.RedFormat);
skinRamp.minFilter=skinRamp.magFilter=T.LinearFilter;skinRamp.generateMipmaps=false;skinRamp.needsUpdate=true;
export const mat=(color,opts={})=>{
 if(new URLSearchParams(location.search).get('style')!=='studio'&&!(opts.metalness>0)&&!opts.emissive){
  const {roughness,metalness,...rest}=opts;
  return new T.MeshToonMaterial({color,gradientMap:color==='#fff1e9'||color==='#eac0bf'?skinRamp:toonRamp,...rest});
 }
 return new T.MeshStandardMaterial({color,roughness:.82,metalness:0,...opts});
};
export const flat=(color,opts={})=>new T.MeshBasicMaterial({color,...opts});
export const group=(parent,name)=>{const g=new T.Group();g.name=name;parent?.add(g);return g;};
export function mesh(parent,geo,material,name=''){
 const m=new T.Mesh(geo,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
const sphereGeos=[new T.SphereGeometry(1,16,10),new T.SphereGeometry(1,24,16),new T.SphereGeometry(1,mobileQuality?28:40,mobileQuality?18:24)];
export function ellipsoid(parent,material,p,r,rot=null,name=''){
 const max=Math.max(...r),geo=sphereGeos[max<.05?0:max<.13?1:2];const m=mesh(parent,geo,material,name);m.position.set(...p);m.scale.set(...r);if(rot)m.rotation.set(...rot);return m;
}
export function interp(keys,t){
 if(t<=keys[0][0])return keys[0].slice(1);
 if(t>=keys.at(-1)[0])return keys.at(-1).slice(1);
 let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],p=keys[Math.max(0,i-1)],q=keys[Math.min(keys.length-1,i+2)],f=(t-a[0])/(b[0]-a[0]),f2=f*f,f3=f2*f;
 return a.slice(1).map((v,j)=>{j++;const d=(b[0]-a[0]);const m0=(b[j]-p[j])/Math.max(1e-6,b[0]-p[0])*d,m1=(q[j]-a[j])/Math.max(1e-6,q[0]-a[0])*d;return (2*f3-3*f2+1)*v+(f3-2*f2+f)*m0+(-2*f3+3*f2)*b[j]+(f3-f2)*m1;});
}
export function surface(parent,nu,nv,fn,material,name='',flip=false){
 nu=Math.max(12,Math.round(nu*quality));nv=Math.max(8,Math.round(nv*quality));
 const count=(nu+1)*(nv+1),p=new Float32Array(count*3),uv=new Float32Array(count*2),indices=new (count>65535?Uint32Array:Uint16Array)(nu*nv*6);
 let colors=null,i0=0;
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
  const u=i/nu,v=j/nv,r=fn(u,v);p[i0*3]=r[0];p[i0*3+1]=r[1];p[i0*3+2]=r[2];uv[i0*2]=u;uv[i0*2+1]=v;
  if(r.length>=6){if(!colors)colors=new Float32Array(count*3);colors[i0*3]=r[3];colors[i0*3+1]=r[4];colors[i0*3+2]=r[5];}i0++;
 }
 let ii=0;for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;if(!flip){indices[ii++]=a;indices[ii++]=a+1;indices[ii++]=b;indices[ii++]=a+1;indices[ii++]=b+1;indices[ii++]=b;}else{indices[ii++]=a;indices[ii++]=b;indices[ii++]=a+1;indices[ii++]=a+1;indices[ii++]=b;indices[ii++]=b+1;}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));if(colors)geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(new T.BufferAttribute(indices,1));geo.computeVertexNormals();return mesh(parent,geo,material,name);
}
// Elliptical body, with angular tailoring and continuous texture coordinates.
export function rings(parent,keys,material,{nu=80,nv=64,alter,name=''}={}){
 const a=keys[0][0],b=keys.at(-1)[0];let last=-1,row;
 return surface(parent,nu,nv,(u,v)=>{
  if(v!==last){last=v;row=interp(keys,mix(a,b,v));}const y=mix(a,b,v),[rx,rz,cx=0,cz=0]=row,ang=(u-.5)*2*Math.PI;
  let x=cx+Math.max(.0001,rx)*Math.sin(ang),z=cz+Math.max(.0001,rz)*Math.cos(ang),p=[x,y,z];
  if(alter)p=alter(p,ang,v,rx,rz);return p;
 },material,name);
}
export function curve(parent,pts,r,material,name='',segments=48){
 const c=new T.CatmullRomCurve3(pts.map(p=>Array.isArray(p)?V(...p):p));
 return mesh(parent,new T.TubeGeometry(c,Math.max(12,Math.round(segments*(mobileQuality?.70:1))),r,r<.006?5:r<.012?6:8,false),material,name);
}
// Sculpted swept ellipse. Stable frame and configurable scallops.
export function sweep(parent,pts,profile,material,{nu=32,nv=48,axis=[0,0,1],alter,color,name=''}={}){
 const path=new T.CatmullRomCurve3(pts.map(p=>V(...p)),false,'centripetal');
 const a=V(...axis);let last=-1,c,t,e,f,w,d;
 return surface(parent,nu,nv,(u,v)=>{
  if(v!==last){
   last=v;c=path.getPoint(v);t=path.getTangent(v).normalize();
   e=new T.Vector3().crossVectors(t,a).normalize();
   if(e.lengthSq()<.1)e=new T.Vector3().crossVectors(t,V(0,1,0)).normalize();
   f=new T.Vector3().crossVectors(t,e).normalize();[w,d]=interp(profile,v);
  }
  const ang=u*2*Math.PI;
  const p=c.clone().addScaledVector(e,Math.max(.0002,w)*Math.cos(ang)).addScaledVector(f,Math.max(.0002,d)*Math.sin(ang));
  if(alter)alter(p,t,e,f,ang,v,w,d);
  const out=[p.x,p.y,p.z];if(color)out.push(...color(ang,v,p,t,e,f));return out;
 },material,name);
}
export function xyShape(parent,points,zFn,material,name='',uvFn=null){
 const sh=new T.Shape();sh.moveTo(...points[0]);for(const p of points.slice(1))sh.lineTo(...p);sh.closePath();
 const src=new T.ShapeGeometry(sh,24),p=src.attributes.position,idx=src.index,verts=[],uv=[],indices=[],cache=new Map();
 const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
 function vertex(q){const key=q[0].toFixed(6)+','+q[1].toFixed(6);if(cache.has(key))return cache.get(key);const i=verts.length/3;verts.push(q[0],q[1],zFn(q[0],q[1]));uv.push(...(uvFn?uvFn(q[0],q[1]):[(q[0]-minX)/Math.max(.001,maxX-minX),(q[1]-minY)/Math.max(.001,maxY-minY)]));cache.set(key,i);return i;}
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 function split(a,b,c,n){if(n===0){indices.push(vertex(a),vertex(b),vertex(c));return;}const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);split(a,ab,ca,n-1);split(ab,b,bc,n-1);split(ca,bc,c,n-1);split(ab,bc,ca,n-1);}
 for(let i=0;i<(idx?.count??p.count);i+=3){const q=[];for(let j=0;j<3;j++){const k=idx?idx.getX(i+j):i+j;q.push([p.getX(k),p.getY(k)]);}split(...q,mobileQuality?2:3);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();src.dispose();return mesh(parent,geo,material,name);
}
export function patch(parent,x0,y0,rx,ry,zFn,material,name='',shape=(a)=>[Math.cos(a),Math.sin(a)]){
 return surface(parent,48,16,(u,v)=>{
  const a=u*2*Math.PI,[x,y]=shape(a),xx=x0+x*rx*v,yy=y0+y*ry*v;
  return [xx,yy,zFn(xx,yy)];
 },material,name,true);
}
export function ringXZ(parent,major,width,height,material,name='',zoffset=0){
 return surface(parent,128,24,(u,v)=>{
  const a=u*2*Math.PI,b=v*2*Math.PI,r=major+width*Math.cos(b);
  return [r*Math.sin(a),height*Math.sin(b),r*Math.cos(a)+zoffset];
 },material,name);
}
let sharedCatTexture;
export function makeCatTexture(repeatX=4,repeatY=3){
 if(sharedCatTexture){const t=sharedCatTexture.clone();t.repeat.set(repeatX,repeatY);t.needsUpdate=true;return t;}
 const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.scale(2,2);
 g.fillStyle='#d2f3fc';g.fillRect(0,0,512,512);
 function cat(x,y,s,angle){g.save();g.translate(x,y);g.rotate(angle);g.scale(s,s);g.lineCap='round';g.lineJoin='round';
  g.strokeStyle='#f7feff';g.lineWidth=5.5;g.beginPath();g.moveTo(-58,-15);g.bezierCurveTo(-63,-33,-64,-64,-49,-65);g.lineTo(-25,-46);g.quadraticCurveTo(0,-54,25,-46);g.lineTo(49,-65);g.bezierCurveTo(63,-64,63,-34,58,-15);g.bezierCurveTo(78,16,68,46,34,51);g.bezierCurveTo(6,60,-27,60,-48,46);g.bezierCurveTo(-70,30,-77,5,-58,-15);g.closePath();g.stroke();
  g.fillStyle='#ecc4e7';for(const sign of [-1,1]){g.beginPath();g.moveTo(sign*48,-51);g.lineTo(sign*37,-40);g.lineTo(sign*49,-29);g.quadraticCurveTo(sign*56,-43,sign*48,-51);g.fill();}
  g.fillStyle='#f8fdff';for(const sign of [-1,1]){g.beginPath();g.ellipse(sign*23,9,5.6,8,0,0,2*Math.PI);g.fill();}g.restore();
 }
 for(let j=-1;j<4;j++)for(let i=-1;i<4;i++)cat(i*256+(j%2?128:0)+68,j*256+74,1.03,((i+j)%3-1)*.13);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(repeatX,repeatY);tx.anisotropy=8;sharedCatTexture=tx;return tx;
}
export function makeBlush(){
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,4,64,64,62);
 gr.addColorStop(0,'rgba(246,126,148,0.26)');gr.addColorStop(.45,'rgba(246,145,163,0.16)');gr.addColorStop(1,'rgba(246,145,163,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
}

// Machined ring with planar annular faces and small rounded bevels.
export function beveledAnnulus(parent,inner,outer,height,material,name='Halo annulus'){
 const b=.008,y=height*.5;
 const profile=[[inner+b,-y],[outer-b,-y],[outer,-y+b],[outer,y-b],[outer-b,y],[inner+b,y],[inner,y-b],[inner,-y+b],[inner+b,-y]];
 const m=surface(parent,160,64,(u,v)=>{
  const a=u*2*Math.PI,t=v*(profile.length-1),i=Math.min(profile.length-2,Math.floor(t)),q=t-i,r=mix(profile[i][0],profile[i+1][0],q),h=mix(profile[i][1],profile[i+1][1],q);
  const out=[r*Math.sin(a),h,r*Math.cos(a)];
  if(material.vertexColors){
   const light=.5+.5*Math.sin(a+.70),side=clamp((r-inner)/(outer-inner)),upper=clamp((h+y)/(2*y));
   const c=C('#202129').lerp(C('#53545b'),.58*side+.17*upper+.22*light).lerp(C('#77787d'),.22*light*upper);
   out.push(c.r,c.g,c.b);
  }
  return out;
 },material,name);
 return m;
}
