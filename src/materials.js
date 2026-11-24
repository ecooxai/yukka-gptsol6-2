import * as T from 'three';
import {mat,flat,makeCatTexture,makeBlush} from './geometry.js';
export function materials(){
 const cel=new URLSearchParams(location.search).get('style')!=='studio';
 const textile=(color,opts={})=>cel?flat(color,{map:opts.map,side:opts.side??T.FrontSide,vertexColors:true,toneMapped:false}):mat(color,opts);
 return {
 skin:new URLSearchParams(location.search).get('style')==='studio'?mat('#fff1e9',{roughness:.87}):flat('#ffffff',{vertexColors:true,toneMapped:false}),skinShadow:mat('#eac0bf'),nail:flat('#f5cece',{toneMapped:false}),
 fabric:textile('#ffffff',{map:makeCatTexture(2.1,1.4),roughness:.96,side:T.DoubleSide}),
 sleeve:textile('#ffffff',{map:makeCatTexture(1.1,.65),roughness:.96,side:T.DoubleSide}),
 short:textile('#ffffff',{map:makeCatTexture(1.2,.75),roughness:.96,side:T.DoubleSide}),
 paleBlue:textile('#c5e7f4',{roughness:.92,side:T.DoubleSide}),edge:mat('#e9faff',{roughness:.9}),
 seam:mat('#89abc0',{roughness:.95}),darkSeam:mat('#769aaf',{roughness:.9}),
 white:textile('#fbfcff',{roughness:.91,side:T.DoubleSide}),whiteShadow:textile('#d7e3f3',{roughness:.93}),pillow:textile('#f8fbff',{roughness:1,side:T.DoubleSide}),
 hair:cel?flat('#ffffff',{vertexColors:true,toneMapped:false}):mat('#ffffff',{vertexColors:true,roughness:.72}),hairBase:mat('#4c477c',{roughness:.78}),hairLine:mat('#535084',{roughness:.7}),
 eyeWhite:flat('#ffffff',{vertexColors:true,side:T.DoubleSide}),eyeInk:flat('#332c4b',{side:T.DoubleSide}),iris:flat('#ffffff',{vertexColors:true,side:T.DoubleSide}),
 irisSpark:flat('#a9ccff',{side:T.DoubleSide}),eyeLight:flat('#ffffff',{side:T.DoubleSide}),eyebrow:mat('#524570'),lip:mat('#b98288'),
 blushStroke:flat('#e4a4b0',{transparent:true,opacity:.55,depthWrite:false}),blush:flat('#ffffff',{map:makeBlush(),transparent:true,depthWrite:false,side:T.DoubleSide}),
 button:mat('#f7fbff',{roughness:.48,metalness:.12}),buttonRim:mat('#83a4bb',{roughness:.56}),
 sole:mat('#a6b1ce',{roughness:.94}),pink:mat('#d786ae',{roughness:.72}),pinkDark:mat('#ad507e',{roughness:.75}),
 halo:cel?flat('#ffffff',{vertexColors:true,toneMapped:false}):mat('#2c2c32',{roughness:.42,metalness:.48}),haloEdge:cel?flat('#62636a',{toneMapped:false}):mat('#55565c',{roughness:.38,metalness:.43}),
 cyan:mat('#3dbde9',{emissive:'#149dde',emissiveIntensity:1.25,roughness:.3})
 };
}
