import * as T from 'three';
import {mat,flat,makeCatTexture,makeBlush} from './geometry.js';
export function materials(){
 return {
 skin:mat('#fff1e9',{roughness:.87}),skinShadow:mat('#eac0bf'),
 fabric:mat('#ffffff',{map:makeCatTexture(2.1,1.4),roughness:.96,side:T.DoubleSide}),
 sleeve:mat('#ffffff',{map:makeCatTexture(1.1,.65),roughness:.96,side:T.DoubleSide}),
 short:mat('#ffffff',{map:makeCatTexture(1.2,.75),roughness:.96,side:T.DoubleSide}),
 paleBlue:mat('#c5e7f4',{roughness:.92,side:T.DoubleSide}),edge:mat('#e9faff',{roughness:.9}),
 seam:mat('#89abc0',{roughness:.95}),darkSeam:mat('#769aaf',{roughness:.9}),
 white:mat('#fbfcff',{roughness:.91,side:T.DoubleSide}),whiteShadow:mat('#d7e3f3',{roughness:.93}),pillow:mat('#f8fbff',{roughness:1,side:T.DoubleSide}),
 hair:mat('#ffffff',{vertexColors:true,roughness:.72}),hairBase:mat('#4c477c',{roughness:.78}),hairLine:mat('#535084',{roughness:.7}),
 eyeWhite:flat('#ffffff',{vertexColors:true,side:T.DoubleSide}),eyeInk:flat('#332c4b',{side:T.DoubleSide}),iris:flat('#ffffff',{vertexColors:true,side:T.DoubleSide}),
 eyeLight:flat('#ffffff',{side:T.DoubleSide}),eyebrow:mat('#524570'),lip:mat('#b98288'),
 blushStroke:flat('#e4a4b0',{transparent:true,opacity:.55,depthWrite:false}),blush:flat('#ffffff',{map:makeBlush(),transparent:true,depthWrite:false,side:T.DoubleSide}),
 button:mat('#f7fbff',{roughness:.48,metalness:.12}),buttonRim:mat('#83a4bb',{roughness:.56}),
 sole:mat('#a6b1ce',{roughness:.94}),pink:mat('#d786ae',{roughness:.72}),pinkDark:mat('#ad507e',{roughness:.75}),
 halo:mat('#252833',{roughness:.27,metalness:.72}),haloEdge:mat('#555b69',{roughness:.28,metalness:.58}),
 cyan:mat('#3dbde9',{emissive:'#149dde',emissiveIntensity:1.25,roughness:.3})
 };
}
