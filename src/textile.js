import * as T from 'three';
import {C,clamp} from './geometry.js';
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const g=(x,w)=>Math.exp(-((x/w)**2));
export function paintTextiles(model,M){
 const fabrics=new Set([M.fabric,M.sleeve,M.short,M.paleBlue,M.white,M.whiteShadow,M.pillow]);
 if(!M.fabric.isMeshBasicMaterial)return;
 model.updateMatrixWorld(true);
 const nmat=new T.Matrix3(),n=new T.Vector3(),p=new T.Vector3();
 const direction=new T.Vector3(-.34,.72,.61).normalize(),white=C('#ffffff'),blue=C('#82a6c3'),blueMid=C('#d0e2f1'),whiteShade=C('#bccbe1'),whiteMid=C('#e3e9f2');
 model.traverse(o=>{
  if(!o.isMesh||!fabrics.has(o.material))return;
  o.geometry=o.geometry.clone();const pos=o.geometry.attributes.position,normal=o.geometry.attributes.normal,uv=o.geometry.attributes.uv,colors=new Float32Array(pos.count*3);
  const softWhite=o.material===M.white||o.material===M.whiteShadow||o.material===M.pillow;
  const isPlush=/Plush slipper padded upper/.test(o.name),isPillow=/pillow/i.test(o.name),isBow=/fabric bow|headband|Bow knot/.test(o.name),isLap=/lapel/i.test(o.name),isShort=/shorts|ruffle/i.test(o.name),isShirt=/tailored shirt/.test(o.name);
  nmat.getNormalMatrix(o.matrixWorld);
  for(let i=0;i<pos.count;i++){
   n.fromBufferAttribute(normal,i).applyMatrix3(nmat).normalize();p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
   let nl=n.dot(direction),front=smooth(-.25,.85,n.z),s1=smooth(-.29,-.18,nl),s2=smooth(.03,.13,nl);
   let c=(softWhite?whiteShade:blue).clone().lerp(softWhite?whiteMid:blueMid,s1).lerp(white,s2);
   if(isShirt){
    // Shadows under the collar, pocket and around the rolling lower hem.
    const underPocket=g(p.x-.18,.21)*g(p.y-4.52,.10)*front;
    const hem=g(p.y-3.88,.12)*.19;
    const armCrease=g(Math.abs(p.x+.1)-.44,.12)*g(p.y-4.9,.38);
    const frontDrape=g(p.x-(-.17+.17*(p.y-3.9)),.055)*g(p.y-4.20,.37)*front;
    c.lerp(blue,.34*underPocket+.30*hem+.32*armCrease+.46*smooth(.26,.53,frontDrape));
   }
   if(isShort){
    const inner=g(p.x+.11,.13)*g(p.y-3.26,.32)*front;
    const leftShade=smooth(.10,.27,-(p.x+.12))*front,crease=g(p.x-(.03+.14*(p.y-3.25)),.07)*g(p.y-3.30,.25)*front;
    c.lerp(blue,.44*smooth(.21,.56,inner)+.48*leftShade+.32*smooth(.21,.64,crease));
   }
   if(isLap)c.lerp(white,.40*front);
   if(isPlush&&uv){
    const a=uv.getX(i)*Math.PI*2,v=uv.getY(i);
    const scallop=.11+.025*Math.sin(a*15+.4)+.019*Math.sin(a*9-1.1);
    const lower=1-smooth(scallop,scallop+.075,v);
    const flank=smooth(.28,.83,Math.abs(Math.sin(a)))*smooth(.04,.33,v)*(1-smooth(.55,.92,v));
    c.lerp(C('#c3cee4'),.66*lower+.35*flank);
    c.lerp(white,.28*smooth(.22,.65,v)*front);
   }
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
     const boundary=x+.40*y-.13+.07*Math.sin(y*9)+.035*Math.sin(y*21);
     const cornerFold=smooth(.012,.056,boundary)*smooth(-.13,.18,-y);
     c.lerp(whiteShade,.48*gripCrease+.38*lowerFold+.24*hangingSide+.73*cornerFold);
    }
   }
   colors[3*i]=c.r;colors[3*i+1]=c.g;colors[3*i+2]=c.b;
  }
  o.geometry.setAttribute('color',new T.BufferAttribute(colors,3));o.receiveShadow=false;
 });
}
