import * as T from 'three';
import {C,clamp} from './geometry.js';
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const g=(x,w)=>Math.exp(-((x/w)**2));
export function paintTextiles(model,M){
 const fabrics=new Set([M.fabric,M.sleeve,M.short,M.paleBlue,M.white,M.whiteShadow,M.pillow]);
 if(!M.fabric.isMeshBasicMaterial)return;
 model.updateMatrixWorld(true);
 const nmat=new T.Matrix3(),n=new T.Vector3(),p=new T.Vector3();
 const direction=new T.Vector3(-.34,.72,.61).normalize(),white=C('#ffffff'),blue=C('#83aac8'),blueMid=C('#c0d8e8'),whiteShade=C('#b7c5db'),whiteMid=C('#e3e9f2');
 model.traverse(o=>{
  if(!o.isMesh||!fabrics.has(o.material))return;
  o.geometry=o.geometry.clone();const pos=o.geometry.attributes.position,normal=o.geometry.attributes.normal,uv=o.geometry.attributes.uv,colors=new Float32Array(pos.count*3);
  const softWhite=o.material===M.white||o.material===M.whiteShadow||o.material===M.pillow;
  const isPillow=/pillow/i.test(o.name),isBow=/fabric bow|headband|Bow knot/.test(o.name),isLap=/lapel/i.test(o.name),isShort=/shorts|ruffle/i.test(o.name),isShirt=/tailored shirt/.test(o.name);
  nmat.getNormalMatrix(o.matrixWorld);
  for(let i=0;i<pos.count;i++){
   n.fromBufferAttribute(normal,i).applyMatrix3(nmat).normalize();p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
   let nl=n.dot(direction),front=smooth(-.25,.85,n.z),s1=smooth(-.30,.03,nl),s2=smooth(.13,.34,nl);
   let c=(softWhite?whiteShade:blue).clone().lerp(softWhite?whiteMid:blueMid,s1).lerp(white,s2);
   if(isShirt){
    // Shadows under the collar, pocket and around the rolling lower hem.
    const underPocket=g(p.x-.18,.21)*g(p.y-4.52,.10)*front;
    const hem=g(p.y-3.88,.12)*.19;
    const armCrease=g(Math.abs(p.x+.1)-.44,.12)*g(p.y-4.9,.38);
    c.lerp(blue,.18*underPocket+.34*hem+.19*armCrease);
   }
   if(isShort){
    const inner=g(p.x+.11,.13)*g(p.y-3.26,.32)*front;
    c.lerp(blue,.28*inner+.33*smooth(.05,.54,-(p.x+.10))*front);
   }
   if(isLap)c.lerp(white,.20*front);
   if(isBow){
    // Soft white cloth, restrained blue-gray troughs inside the folded ribbon.
    c.lerp(white,.38*front+.10);
    if(uv&&/fabric bow/.test(o.name)){const a=uv.getX(i)*2*Math.PI,v=uv.getY(i);c.lerp(whiteShade,.33*g(v-.38,.22)*g(Math.cos(a)-.45,.28));}
   }
   if(isPillow){
    c.lerp(white,.27*front);
    if(uv&&/pillow front|pillow back/.test(o.name)){
     const u=uv.getX(i),v=uv.getY(i),edge=Math.min(u,1-u,v,1-v),x=u*2-1,y=v*2-1;
     c.lerp(whiteShade,.19*(1-smooth(0,.12,edge)));
     const gripCrease=g(x+.78-.48*(1-y),.085)*g(y-.47,.45);
     const lowerFold=smooth(.18,.40,x-.40*y)*smooth(.36,.76,-y)*.55;
     const hangingSide=smooth(.45,.93,-x)*smooth(.05,.84,-y);
     const cornerFold=smooth(.05,.16,x+.44*y-.10)*smooth(.16,.38,-y);
     c.lerp(whiteShade,.52*gripCrease+.47*lowerFold+.36*hangingSide+.42*cornerFold);
    }
   }
   colors[3*i]=c.r;colors[3*i+1]=c.g;colors[3*i+2]=c.b;
  }
  o.geometry.setAttribute('color',new T.BufferAttribute(colors,3));o.receiveShadow=false;
 });
}
